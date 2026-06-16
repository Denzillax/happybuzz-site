# Admin-Politur: QR weg · ART-Nr (Anzeige + Suche) · deutsche Status

**Datum:** 2026-06-16
**Status:** Design freigegeben („passt go spec und führe frei"), Spec zur Umsetzung

## Ziel

Vier unabhängige Verbesserungen rund um Bestellungen/Rechnungen/Inserate:
1. **QR-Code aus den Admin-Tabs** (Bestellungen + Rechnungen) entfernen — nur „Volle Rechnung öffnen" bleibt.
2. **Artikel-Nummer (ART-Nr)** überall sichtbar machen (Inserat, beide Rechnungen).
3. **Status im Admin** durchgehend deutsch.
4. **ART-Nr-Suche** (Admin + öffentlich), findet auch beendete Inserate.

## Wichtiger Ist-Zustand (verifiziert)

- **`makeArtRef(listingId)` existiert bereits** in `src/lib/fees.js:32` = `` `ART-${listingId.substring(0,8).toUpperCase()}` `` — exakt das gewünschte Format. **Wiederverwenden, nicht duplizieren.**
  - Schon verdrahtet: Bestell-Detail `order/[id]/page.jsx:225` (berechnet), Bestell-Rechnung `order/[id]/invoice/page.jsx:56` + Kautionszeile `:126` (`{title} · {artRef}`).
  - Noch NICHT: FEE-Rechnung, Admin-Inserate-Tab, Admin-FEE-Ledger, Inserat-Detail, Suche.
- `makeBeeRef(purchaseId)` (fees.js:28) = pro Bestellung; `beeRefIncludes(id,q)` (useAdminData.jsx:264) ist das Such-Vorbild.
- Admin-Inserate werden mit `limit(100)` geladen (alle Status) und rein client-seitig gefiltert (Titel + Verkäufer), useAdminData.jsx:101 / :444.
- `fee_ledger` hat **kein `listing_id`** (nur `purchase_id`, `listing_title`). ART-Nr je FEE-Position braucht `purchase_id → listing_id`-Auflösung.
- Zentrale deutsche Status-Map `PURCHASE_STATUS` existiert in `src/lib/orderStatus.js` (deckt confirmed/payment_marked/paid/shipped/delivered/picked_up/completed/cancelled/disputed/return_pending/returned/damage_reported/pending_payment ab).
- Öffentliche `searchListings` (lib/listings.js:295) filtert `.eq("status","active")` + `title/description ilike`; keine Nummern-Suche.

---

## Teil 1 — QR aus den Admin-Tabs entfernen

Datei: `src/components/admin/AdminShell.jsx`. Drei Detail-Panels haben eine umrandete 200px-„QR-Rechnung"-Box mit `<img qrUrl>` + „Volle Rechnung öffnen":

1. **Bestellungen** (Z. ~496–508): Box raus. Der `qrUrl` (Z. 473) entfällt. **„Volle Rechnung öffnen"** wandert in die Aktionszeile (Z. ~491–494, neben „Bestellung ansehen"/„Stornieren"), als Teal-Button. Bei Miete (`canDeposit`, Z. 472) wandert der **Rechnung/Kaution-Umschalter** (Z. 500–506) mit dorthin; er steuert weiter `invoiceHref` (`?type=deposit`, Z. 474). `deposit`/`canDeposit`/`invoiceHref` bleiben.
2. **Rechnungen → BEE** (Z. ~554–558): Box raus, `qrUrl` (Z. 547) entfällt. „Volle Rechnung öffnen" rutscht unter die Betragszeile in die linke Spalte.
3. **Rechnungen → FEE** (Z. ~585–589): Box raus, `qrUrl` (Z. 567) entfällt. „Volle Rechnung öffnen" rutscht in die linke Spalte unter die Mahn-Buttons.

Danach sind die Imports `orderQrPayload, feeQrPayload, qrImageUrl` (Z. 13) in AdminShell ungenutzt → entfernen. `orderDetail`-Fetch + `feeSeller` bleiben (andere Felder). **Die echten Rechnungsseiten behalten ihren QR** — nur die Admin-Vorschau verliert ihn.

## Teil 2 — ART-Nr überall anzeigen (`makeArtRef` wiederverwenden)

1. **Inserat-Detail (öffentlich)** `src/app/(public)/listing/[id]/page.jsx`: ART-Nr dezent bei den Meta-Infos anzeigen (`import { makeArtRef }`, `ART-XXXXXXXX` in gedämpfter Schrift, z.B. nahe Titel/Standort).
2. **Admin Inserate-Tab** `AdminShell.jsx:705–721`: in der „Titel"-Zelle unter dem Titel eine kleine Monospace-Zeile `makeArtRef(l.id)` (Muster wie die Ref-Spalte bei Bestellungen). `import { makeArtRef }` ergänzen.
3. **Bestell-Rechnung** `order/[id]/invoice/page.jsx`: ART-Nr auch in der **Hauptartikelzeile** (nicht nur Kaution) zeigen — `{title}` + `· {artRef}` analog Z. 126.
4. **FEE-Gebührenrechnung** `fees/invoice/[id]/page.jsx:109–115`: ART-Nr neben der BEE-Nr je Position. Da `fee_ledger` kein `listing_id` hat: nach dem Laden der `items` (Z. 32) die zugehörigen `purchases` per `purchase_id` laden (`select id, listing_id`), Map `{purchase_id: listing_id}` bauen, dann `makeArtRef(map[fee.purchase_id])` unter dem Titel zeigen (zusätzlich zur BEE-Nr).
5. **Admin-FEE-Ledger** `AdminShell.jsx:571–573`: gleiche ART-Nr je Zeile. Dafür die `feeLedger`-Rows in `useAdminData.jsx` (beim Laden des FEE-Detail-Ledgers) um `listing_id` anreichern (Lookup `purchases` per `purchase_id`), dann `makeArtRef(f.listing_id)` neben `makeBeeRef(f.purchase_id)` rendern.

## Teil 3 — Status im Admin durchgehend deutsch (nur Admin)

Datei: `src/components/admin/useAdminData.jsx` (+ ggf. `orderStatus.js`).

1. `orderStatusPill` (Z. 435–440) auf die zentrale Map umstellen — `import { PURCHASE_STATUS } from "@/lib/orderStatus"`:
   ```js
   const orderStatusPill = (s) => {
     if (s === "cancelled") return pill("#FFEBEE", "#c62828", "Storniert");
     if (orderStatusGroup(s) === "done") return pill("#E8F5E9", "#2E7D32", "Abgeschlossen");
     return pill("#E3F2FD", "#1565C0", PURCHASE_STATUS[s]?.label || "Offen");
   };
   ```
   Deckt `disputed`/`returned`/`return_pending`/`pending_payment`/`damage_reported` ab; nie mehr roher englischer Key. (Bewusste Wording-Angleichung: `confirmed` → „Warten auf Zahlung", `payment_marked` → „Zahlung markiert" gemäß zentraler Quelle.)
2. Rechnungs-Status-Fallback `AdminShell.jsx:534`: die letzte Fallback-`label: r.status` durch ein deutsches Wort ersetzen (`label: "Offen"`); `sc` (Z. 429) deckt open/pending_payment/paid/overdue + cancelled bereits ab.
3. Inserate-`statusPill` (Z. 430–434): um `deleted` („Gelöscht") und `expired` („Abgelaufen") ergänzen; deutscher Fallback („Entwurf") bleibt.

## Teil 4 — ART-Nr-Suche (Admin + öffentlich, findet auch beendete)

Neue Helfer in `src/lib/fees.js` (keine Migration):
```js
// "ART-1A2B3C4D" / "1a2b3c4d" (4–8 Hex) → Hex-Präfix in Kleinbuchstaben, sonst null
export function parseArtRef(q) {
  const m = (q || "").trim().toLowerCase().match(/^art-?([0-9a-f]{4,8})$|^([0-9a-f]{8})$/);
  return m ? (m[1] || m[2]) : null;
}
// Hex-Präfix → UUID-Bereich, der genau alle IDs mit diesem Präfix umfasst
export function artIdRange(prefix) {
  if (!prefix) return null;
  const lo = prefix.padEnd(8, "0");
  const hi = prefix.padEnd(8, "f");
  return { lo: `${lo}-0000-0000-0000-000000000000`, hi: `${hi}-ffff-ffff-ffff-ffffffffffff` };
}
// Treffer im bereits geladenen Bestand
export function artRefMatches(id, q) {
  const qq = (q || "").toLowerCase().trim();
  return !!qq && makeArtRef(id).toLowerCase().includes(qq);
}
```

**Admin Inserate-Tab** (`useAdminData.jsx`):
- `filteredListings` (Z. 444) um `|| artRefMatches(l.id, search)` erweitern.
- Neuer Effekt: wenn `tab === "listings"` und `parseArtRef(search)` ≠ null, gezielte Server-Abfrage `supabase.from("listings").select("*").gte("id", lo).lte("id", hi)` (jeder Status, kein Limit). Treffer mit Verkäufernamen anreichern (Profil-Lookup) und in einen State `refListings` legen.
- Gerenderte Liste = `filteredListings` plus `refListings`, die noch nicht enthalten sind (dedupe per `id`). Als abgeleitete `visibleListings` aus dem Hook zurückgeben; AdminShell-Inserate-Tab rendert `visibleListings` statt `filteredListings`.

**Öffentliche Suche** (`lib/listings.js` `searchListings`, Z. 295):
- Zu Beginn: `const pref = parseArtRef(query); const range = artIdRange(pref);` Wenn `range`: statt Titel/Aktiv-Filter `supabase.from("listings").select("*, listing_images(*)").gte("id", range.lo).lte("id", range.hi).neq("status","deleted")` ausführen und in derselben Ergebnisform zurückgeben (Kategorie-/Sonstige-Filter überspringen). So findet die öffentliche Suche ein Inserat per ART-Nr inkl. beendeter/verkaufter, aber ohne soft-gelöschte.
- Die Suchseite `search/page.jsx` braucht keine Sonderbehandlung (übergibt `q` an `searchListings`); ggf. Ergebnisliste zeigt auch nicht-aktive Treffer.

## Dateien

- **Modify:** `src/lib/fees.js` (parseArtRef/artIdRange/artRefMatches), `src/lib/listings.js` (ART-Branch in searchListings), `src/lib/orderStatus.js` (nur falls Label fehlt — voraussichtlich keine Änderung), `src/components/admin/useAdminData.jsx` (Status, ART-Suche, FEE-Ledger listing_id), `src/components/admin/AdminShell.jsx` (QR weg, ART-Nr Inserate + FEE-Ledger, visibleListings, Status-Fallback), `src/app/(public)/listing/[id]/page.jsx` (ART-Nr Meta), `src/app/(public)/order/[id]/invoice/page.jsx` (ART-Nr Hauptzeile), `src/app/(public)/fees/invoice/[id]/page.jsx` (ART-Nr je Position + purchases-Lookup), `src/app/(public)/beta/page.jsx` (Checkliste).
- **Keine DB-Migration.**

## Verifizierung (live, KEIN `npm run build`)

- Admin Bestellungen/Rechnungen: QR-Box weg, „Volle Rechnung öffnen" funktioniert; bei Miet-Bestellung Rechnung/Kaution-Umschalter wechselt den Link-Ziel-Typ. Keine Konsolenfehler.
- ART-Nr sichtbar: Inserat-Detail, Admin-Inserate-Zeile, Bestell-Rechnung (Haupt + Kaution), FEE-Rechnung je Position, Admin-FEE-Ledger — alle zeigen `ART-XXXXXXXX` passend zur Inserat-ID.
- Status: in Bestellungen/Rechnungen kein englischer Roh-Status mehr (Stichprobe inkl. eines `cancelled`/`completed`; falls vorhanden `disputed`).
- ART-Nr-Suche: im Admin eine ART-Nr eines **beendeten** Inserats (Status ≠ active, evtl. außerhalb der letzten 100) eingeben → Treffer erscheint. Öffentliche Suche mit derselben ART-Nr → Inserat wird gefunden (auch wenn nicht aktiv). Normale Stichwortsuche bleibt unverändert (kein Hijack durch parseArtRef).

## Beta-Checkliste (Sektion „Admin-Bereich" + ggf. „Inserate/Suche")

- `adm_no_qr`: Bestellungen/Rechnungen-Detail zeigt keinen QR mehr, nur „Volle Rechnung öffnen" (+ bei Miete Rechnung/Kaution-Umschalter).
- `art_ref_visible`: ART-Nr (`ART-XXXXXXXX`) erscheint auf Inserat-Detail, Admin-Inserate, Bestell-Rechnung und FEE-Rechnung je Position.
- `adm_status_de`: Alle Bestell-/Rechnungs-Status im Admin sind deutsch (kein `payment_marked`/`disputed` o.ä.).
- `art_ref_search_admin`: Admin-Inserate-Suche findet ein Inserat per ART-Nr, auch wenn beendet/alt.
- `art_ref_search_public`: Öffentliche Suche findet ein Inserat per ART-Nr (auch nicht-aktiv, außer gelöscht).

## Out of Scope

- Fortlaufende „schöne" Artikelnummern (ART-00001) — bewusst deterministisch aus der UUID.
- Deutsche Status außerhalb des Admin (Order-Seite/Timeline bleiben unverändert — Nutzerwahl „Nur Admin").
- QR-Entfernung auf den echten Rechnungsseiten (nur Admin-Vorschau).
