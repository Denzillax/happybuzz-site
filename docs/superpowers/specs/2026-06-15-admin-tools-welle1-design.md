# Admin-Tools Welle 1: Rechnungs-Feinschliff, CSV-Export, E-Mail-Log, Mini-Analytik

**Datum:** 2026-06-15
**Status:** Design freigegeben (3 Entscheidungen getroffen), Spec zur Review

## Ziel

Erste Ausbaustufe nützlicher Admin-Tools, aufbauend auf dem fertigen Bestellungen-/Rechnungen-Tab:
eindeutige FEE-Rechnungsnummern, BEE-Zuordnung pro Position auf der Monatsrechnung, CSV-Export,
ein E-Mail-Log-Viewer und eine kompakte Umsatz-/Top-Verkäufer-Vorschau auf der Übersicht.
Charts (volle Analytik) und Moderations-/Support-Tools sind bewusst Welle 2 bzw. 3.

## Festgelegte Entscheidungen (aus Brainstorming)

1. **FEE-Nr eindeutig** via Verkäufer-Kürzel: neue Rechnungen `FEE-JJJJ-MM-XXXXXX`; bestehende bleiben unverändert.
2. **GMV** = Summe aller **nicht-stornierten** Käufe.
3. **E-Mail-Log** als **eigener Nav-Tab** „E-Mails".

## Kontext / DB-Fakten (verifiziert)

- `fee_invoices`: `seller_id, invoice_ref(text), period_month, period_year, total_fees, total_bee_impact, item_count, status, due_date, created_at, paid_at, reminder_level, …`
- `fee_ledger`: `seller_id, purchase_id, listing_title, sale_price, shipping_cost, fee_percent, fee_amount, bee_impact, fee_invoice_id, status, created_at` — **enthält `purchase_id` und `listing_title`** (BEE-pro-Position machbar).
- `email_log`: `id, recipient_id, recipient_email, subject, template, context(jsonb), status, created_at`.
- Generierung der Monatsrechnung: RPC `public.create_monthly_fee_invoice(p_seller_id, p_month, p_year)` (SECURITY DEFINER, plpgsql). Setzt aktuell
  `invoice_ref := 'FEE-' || p_year || '-' || LPAD(p_month::text,2,'0')` — **ohne Verkäufer** → nicht eindeutig über mehrere Verkäufer.
- Referenz-Helfer in `src/lib/fees.js`: `makeBeeRef(purchaseId)` → `BEE-XXXXXXXX` (8 Hex, upper). `makeFeeRef` hat zwei Signaturen
  (zweiarg `FEE-JJJJ-MM`, einarg `FEE-<8 hex>` für Order-Fee-Ref). **`makeFeeRef` bleibt unverändert** — die Monats-Rechnungsnummer
  kommt aus der RPC, nicht aus `makeFeeRef`.
- Admin (`src/app/(public)/admin/page.jsx`): lädt `orders` (purchases, limit 1000, mit buyerName/sellerName/listingTitle),
  `feeInvoices` (mit sellerName), `users`, `listings`, `reports`. Tabs: overview/users/orders/invoices/listings/reports.
  FEE-Detail im Rechnungen-Tab lädt `fee_ledger` lazy (`feeLedger[invId]`).

## Feature 1 — Eindeutige FEE-Rechnungsnummer

**DB-Migration** (neue Datei `supabase/migrations/<ts>_fee_invoice_ref_seller.sql`): `create_monthly_fee_invoice`
per `CREATE OR REPLACE FUNCTION` neu definieren, identisch zur jetzigen Version, nur die `invoice_ref`-Zeile ändern zu:

```sql
'FEE-' || p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-' || UPPER(LEFT(p_seller_id::TEXT, 6))
```

→ z.B. `FEE-2026-02-48FBDB`. Deterministisch, kein Zähler, kein zusätzlicher State. Kollisionsraum 16^6.

**Bestehende Rechnungen:** NICHT rückwirkend umbenennen (QR-Zahlungszweck wurde teils schon ausgegeben). Nur neue erhalten das Format.
Die Nummernsuche im Admin nutzt Teilstring-Match (`invoice_ref.includes(...)`) und findet altes wie neues Format.

**Anwenden:** via Supabase MCP `apply_migration` (Projekt `ekfsehsmwzougrgqukgf`) + Migration-Datei im Repo ablegen.

## Feature 2 — BEE-Nummer je Position (FEE-Monatsrechnung)

`fee_ledger.purchase_id` ist vorhanden. An zwei Stellen die Position von „Datum · Titel" auf
„`BEE-XXXX` · Titel" (Datum bleibt) erweitern, via `makeBeeRef(f.purchase_id)`:

1. **Rechnungsseite** `src/app/(public)/fees/invoice/[id]/page.jsx`: lädt bereits `fee_ledger.select("*")` → `purchase_id` da.
   In der Positions-Liste je Zeile `makeBeeRef(item.purchase_id)` voranstellen. `makeBeeRef` aus `@/lib/fees` importieren.
2. **Admin FEE-Detail** `src/app/(public)/admin/page.jsx` (Rechnungen-Tab, `ledger.map`): Zeile von
   `{fmtDate(f.created_at)} · {f.listing_title}` zu `{fmtDate(f.created_at)} · {makeBeeRef(f.purchase_id)} · {f.listing_title}`
   (Datum bleibt, BEE-Nr vor den Titel). `makeBeeRef` ist dort bereits importiert.

   Analog auf der Rechnungsseite (Punkt 1): Datum bzw. Position bleibt, `BEE-XXXX` wird vor den Artikeltitel gesetzt.

Fällt `purchase_id` mal null aus (Alt-Daten), Fallback auf nur Titel (`f.purchase_id ? makeBeeRef(f.purchase_id) + " · " : ""`).

## Feature 3 — CSV-Export

Reiner Client-Export, keine Library. Neuer Helfer (z.B. in `src/lib/csv.js`):

```js
export function downloadCSV(filename, headers, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

(`﻿` BOM → Excel erkennt UTF-8/Umlaute.)

**Export-Button** (klein, in der Top-Bar neben der Suche, nur in den jeweiligen Tabs) exportiert die **aktuell gefilterte,
sichtbare** Menge:

- **Bestellungen** (`filteredOrders`): BEE-Nr, Datum, Artikel, Käufer, Verkäufer, Preis, Versand, Status.
- **Rechnungen** (`invoiceRows`): Typ (BEE/FEE), Nr, Zahler, Empfänger, Betrag, Status, Datum.
- **Benutzer** (`visibleUsers`): Anzeigename, Username, Stadt, Level, Blüten, Kontaktverstöße, gesperrt(ja/nein), erstellt.

Dateinamen: `beedaro-bestellungen-JJJJ-MM-TT.csv` etc. (Datum als String an die Funktion übergeben — `new Date()` ist im Client ok).

## Feature 4 — E-Mail-Log-Viewer

Neuer **Nav-Tab „E-Mails"** (Icon z.B. `Mail`), 7. Eintrag. Lädt im `useEffect` zusätzlich
`email_log` (z.B. letzte 500, `order by created_at desc`). State `emailLog`.

- **Liste** (read-only): pro Zeile Empfänger (`recipient_email`), Betreff, Template-Badge, Status-Pill, Datum; aufklappbar zeigt
  `context` (JSON, hübsch via `JSON.stringify(context, null, 2)` in `<pre>`).
- **Suche** (Top-Bar, wie users/listings): Match auf `recipient_email`, `subject`, `template`.
- Kein Schreiben/Löschen.

## Feature 5 — Mini-Analytik auf der Übersicht

Kompakter Block unter den Stat-Karten (keine Charts):

- **Umsatz (GMV)** = Summe `parseFloat(price)+parseFloat(shipping_cost)` über `orders` mit `status !== "cancelled"`.
- **Ø Bestellwert** = GMV / Anzahl nicht-stornierter Käufe (0 → „—").
- **Top-5-Verkäufer**: `orders` (nicht-storniert) nach `seller_id` gruppieren, Anzahl + Summe; Top 5 nach Anzahl;
  Anzeige `sellerName · N Verkäufe · CHF Summe`.

Alles client-seitig aus den bereits geladenen `orders` (Cap 1000). Hinweis im Code, dass es die geladene Menge widerspiegelt.

## Dateien

- **Create**: `supabase/migrations/<ts>_fee_invoice_ref_seller.sql` (Feature 1), `src/lib/csv.js` (Feature 3).
- **Modify**: `src/app/(public)/fees/invoice/[id]/page.jsx` (Feature 2),
  `src/app/(public)/admin/page.jsx` (Features 2,3,4,5 — Nav-Tab, Export-Buttons, E-Mail-Tab, Übersicht-Block),
  `src/lib/fees.js` nur falls eine zweiarg-`makeFeeRef`-Stelle gefunden wird, die zur neuen RPC-Nr passen muss (sonst unverändert),
  `src/app/(public)/beta/page.jsx` (Checkliste).

## Out of Scope (bewusst später)

- Welle 2: echte Charts/Trends (neue Nutzer, Verkäufe über Zeit, Conversion).
- Welle 3: Moderation/Support (Inserat-Freigabe-Queue, Audit-Log, Broadcast, „Als Nutzer ansehen").
- Rückwirkendes Umbenennen bestehender FEE-Rechnungen.
- Server-seitige Pagination/Export großer Datenmengen (Client-Export reicht für Beta-Volumen).

## Verifizierung

- Migration: nach Anwenden eine neue Test-Monatsrechnung erzeugen (oder RPC mit Testdaten) → `invoice_ref` endet auf `-XXXXXX`.
  Bestehende 4 Rechnungen unverändert.
- BEE-Position: FEE-Rechnung (Seite + Admin-Detail) zeigt `BEE-…` vor dem Titel; Klick/Abgleich mit der Bestellung stimmt.
- CSV: Button je Tab lädt Datei; Inhalt entspricht der gefilterten Ansicht; Umlaute korrekt in Excel.
- E-Mails: Tab listet `email_log`; Suche filtert; `context` aufklappbar.
- Übersicht: GMV/Ø/Top-5 plausibel; nicht-stornierte Basis.
- Live als Admin (`/admin`), Dev-Server (kein `npm run build` neben laufendem Server). Testkonto Zeggy auf Baseline.

## Beta-Checkliste (Sektion „Admin-Bereich" erweitern)

- `adm_fee_ref_unique`: Neue FEE-Rechnung erhält eindeutige Nr (`FEE-JJJJ-MM-XXXXXX`); bestehende unverändert.
- `adm_fee_bee_pos`: FEE-Monatsrechnung (Seite + Admin) zeigt BEE-Nr je Position.
- `adm_csv`: CSV-Export für Bestellungen/Rechnungen/Benutzer exportiert die gefilterte Ansicht; Umlaute korrekt.
- `adm_emaillog`: E-Mails-Tab listet `email_log`, Suche + aufklappbarer Context funktionieren.
- `adm_mini_analytics`: Übersicht zeigt GMV, Ø Bestellwert und Top-5-Verkäufer (nicht-storniert).
