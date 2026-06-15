# Admin: Bestellungen + Rechnungen (mit QR) + Dashboard-Feinschliff

**Datum:** 2026-06-15
**Status:** Design freigegeben (Layout A), Spec zur Review

## Ziel

Der Admin (`src/app/(public)/admin/page.jsx`) soll **alle Bestellungen und alle Rechnungen
voll einsehbar** machen — inkl. der Swiss-QR-Rechnung — und **per Nummer durchsuchbar** sein.
Zusätzlich: das „Schwarz" der Admin-Sidebar an das Footer-Schwarz angleichen und die Übersicht
leicht aufwerten.

## Festgelegte Entscheidungen (aus Brainstorming)

1. **Umfang:** eigener globaler **Bestellungen**-Tab UND eigener globaler **Rechnungen**-Tab.
2. **QR-Anzeige:** Inline-Vorschau im Aufklapp-Detail (kompakte Zusammenfassung + QR-Bild)
   plus Button „Volle Rechnung öffnen" (neuer Tab zur bestehenden Druck-/PDF-Seite).
3. **Gebühren-Tab** geht im **Rechnungen-Tab** auf (Typ-Filter); kein separater Gebühren-Tab mehr.
4. **Layout:** Variante A — aufklappbare Zeilen (konsistent mit bestehendem Benutzer-Tab).
5. **Footer-Schwarz:** Sidebar `#191615` → `#1a1a1a`.

## Kontext / Bestehendes (wiederverwenden, nicht neu bauen)

- **Referenzen** (`src/lib/fees.js`): `makeBeeRef(purchaseId)` → `BEE-XXXXXXXX` (erste 8 Zeichen der
  Purchase-ID, upper). `makeFeeRef(...)` → `FEE-...`. `makeArtRef(...)` → `ART-...`.
- **Order-QR-Rechnung:** `src/app/(public)/order/[id]/invoice/page.jsx` — baut Swiss-QR via lokaler
  Funktion `buildSwissQR({iban,name,street,plzCity,amount,currency,dName,dStreet,dPlzCity,message})`
  und rendert `qrUrl` (api.qrserver.com). Käufer→Verkäufer; Miet-Kaution als zweiter Modus
  (`isDeposit`, „Kaution …", Empfänger/Zahler vertauscht).
- **Gebühren-QR-Rechnung:** `src/app/(public)/fees/invoice/[id]/page.jsx` — eigene Kopie von
  `buildSwissQR`, Verkäufer→BEEDARO.
- **BEE-Prefix-Suche-Muster:** `src/lib/listings.js:323` (UUID-Range statt Text-Cast) als Vorlage
  für die Nummernsuche.
- **Admin heute:** lädt `purchases` (limit 50, mit Käufer/Verkäufer/Titel) nur für die per-User
  „Bestellungen"-Subansicht; `fee_invoices` global im Gebühren-Tab inkl. Mahnwesen
  (`sendReminder`, `confirmAndReactivate`, `pause_seller_listings`/`reactivate_seller_listings`).

## Refactor (Teil der Arbeit, kein Fremd-Refactor)

`buildSwissQR` existiert dupliziert in zwei Invoice-Seiten. Für die Admin-Inline-QR brauchen wir
dieselbe Logik ein drittes Mal → **in `src/lib/swissQR.js` extrahieren** und in beiden bestehenden
Invoice-Seiten + im Admin importieren. Zwei Helfer:

- `buildSwissQR(params)` — reiner Payload-Builder (verschoben, unverändert).
- `qrImageUrl(payload)` — `https://api.qrserver.com/.../?data=...` (gekapselt).

Optional, falls schlank machbar: `orderQrPayload(order, { deposit })` und `feeQrPayload(invoice)`,
die aus den geladenen Objekten Zahler/Empfänger/Betrag/Message ableiten (gleiche Felder wie heute
in den Invoice-Seiten). Sonst die Ableitung im Admin inline halten — aber **keine** vierte Kopie
von `buildSwissQR`.

## Navigation (6 Tabs)

`Übersicht · Benutzer · Bestellungen · Rechnungen · Inserate · Meldungen`
(`Gebühren` entfällt als eigener Eintrag.) Icons: `ShoppingBag` (Bestellungen), `FileText`/
`ReceiptText` (Rechnungen). Tab-State-Keys: `overview | users | orders | invoices | listings | reports`.

## Bestellungen-Tab (`tab === "orders"`)

**Daten:** alle `purchases` laden (Limit entfernen bzw. großzügig erhöhen; Beta-Datenmenge klein).
Anreicherung mit Käufer-/Verkäufer-Name + Inserat-Titel wie heute (Cache-Map beibehalten).
Pagination ist Out-of-Scope (siehe unten), bei Bedarf später.

**Suche (Top-Bar):** Eingabe matched auf
- BEE-Nummer: Eingabe (mit/ohne `BEE-`-Präfix, case-insensitiv) → Vergleich mit `makeBeeRef(o.id)`
  bzw. ID-Präfix;
- Artikel-Titel und Käufer-/Verkäufer-Name (Teilstring).

**Status-Filter (Pills):** Alle / Offen / Abgeschlossen / Storniert. Mapping:
- Storniert = `status === "cancelled"`
- Abgeschlossen = `status in (completed, delivered, picked_up)`
- Offen = alles andere (confirmed, payment_marked, paid, shipped, payment_pending, …)

**Zeile (collapsed):** `BEE-Ref` · Artikel · `Käufer → Verkäufer` · `CHF Betrag` · Status-Pill · Chevron.
Storniert = reduzierte Opazität.

**Detail (expanded), Layout A:** zweispaltig (umbricht mobil)
- Links: Fakten — Artikel, Käufer, Verkäufer, Betrag + Versand, Bee-Rate (`fee_percentage`),
  Status; Aktionen „Bestellung ansehen" (→ `/order/[id]`) und „Stornieren" (bestehende
  `cancelOrder`-Logik wiederverwenden, mit Bestätigung).
- Rechts: **QR-Karte** — Titel „QR-Rechnung", QR-Bild (`qrImageUrl(orderQrPayload(o))`),
  `Rechnung BEE-Ref`, Button „Volle Rechnung öffnen" (→ `/order/[id]/invoice`, neuer Tab).
- **Miete:** kleiner Umschalter „Rechnung / Kaution" in der QR-Karte → schaltet `deposit`-Modus
  (zweiter QR + Link `?deposit=…` analog zur Invoice-Seite). Nur sichtbar wenn `listing_type==="rent"`
  und `deposit_amount > 0`.

## Rechnungen-Tab (`tab === "invoices"`)

**Typ-Filter (Pills):** `Alle / Bestell-Rechnungen (BEE) / Gebühren-Rechnungen (FEE)`.

**Daten:**
- BEE-Rechnungen: aus denselben `purchases` abgeleitet (Käufer→Verkäufer), eine pro Kauf
  (Miet-Kaution wird im Detail per Umschalter gezeigt, nicht als eigene Zeile).
- FEE-Rechnungen: aus `fee_invoices` (bereits geladen) — Verkäufer→BEEDARO.

**Suche:** Nummer über beide Typen (`BEE-…` und `FEE-…` / `invoice_ref`) + Name.

**Zeile (collapsed):** Ref · Typ-Badge (BEE/FEE) · `Zahler → Empfänger` · Betrag · Status-Pill · Datum · Chevron.

**Detail (expanded):**
- Beide Typen: Inline-Zusammenfassung + QR-Karte + „Volle Rechnung öffnen"
  (BEE → `/order/[id]/invoice`, FEE → `/fees/invoice/[id]`).
- **FEE behält das volle Mahnwesen** unverändert: Erinnerung/Mahnung/Inserate-pausieren
  (`sendReminder` Stufen 1–3) und „Bezahlt + reaktivieren" (`confirmAndReactivate`),
  Stufen-/Pausiert-Badges. Diese Aktionen werden 1:1 aus dem heutigen Gebühren-Tab übernommen.

## Übersicht-Aufwertung

Neue „Zu prüfen"-Karte **Offene Rechnungen** = Anzahl `fee_invoices` mit `status != "paid"`.
Klick → Rechnungen-Tab mit FEE-Filter. Rest der Übersicht bleibt unverändert.

## Farb-/Stil-Angleich

- Sidebar-Hintergrund `#191615` → `#1a1a1a` (Footer-Schwarz). Bee-Mark-Icon-Farbe entsprechend.
- Sonst keine Stiländerung; bestehende Tokens/Pills/`th`/`td` weiterverwenden.

## Out of Scope (bewusst nicht jetzt)

- Server-seitige Pagination / Volltext-Index (Beta-Datenmenge klein; bei Wachstum nachrüsten).
- Neue Rechnungs-Datentypen oder Änderungen am QR-Inhalt selbst.
- Service-Rechnungen (`invoice_items`) als eigener Typ — nur falls später gewünscht.
- BannedGate-Header-Sliver, Public-Header/FAB auf `/admin` ausblenden (separates Thema).

## Verifizierung

- Live als Admin (Preview ist eingeloggt): beide Tabs rendern fehlerfrei; Nummernsuche findet
  einen bekannten `BEE-`-Kauf; QR-Bild lädt; „Volle Rechnung öffnen" öffnet die korrekte Seite;
  FEE-Mahnwesen funktioniert wie vor dem Merge.
- Sidebar-Farbe == Footer (`#1a1a1a`) per DOM-Check.
- Testkonto Zeggy nach Tests auf Baseline.

## Beta-Checkliste (Sektion „Admin-Bereich" erweitern)

- `adm_orders`: Bestellungen-Tab: alle Käufe, Suche per BEE-Nummer/Name, Status-Filter,
  Detail mit QR-Vorschau + „Volle Rechnung öffnen" + Stornieren.
- `adm_orders_rent`: Miet-Bestellung: Umschalter Rechnung/Kaution zeigt korrekten zweiten QR.
- `adm_invoices`: Rechnungen-Tab: Typ-Filter Alle/BEE/FEE, Nummernsuche über beide,
  Inline-QR + Öffnen.
- `adm_invoices_dunning`: FEE-Rechnungen behalten Mahnwesen (Stufen 1–3, Bezahlt+reaktivieren).
- `adm_overview_openinv`: Übersicht-Karte „Offene Rechnungen" springt gefiltert in den Tab.
