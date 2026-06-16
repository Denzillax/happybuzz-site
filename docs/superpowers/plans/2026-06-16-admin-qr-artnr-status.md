# Admin-Politur (QR · ART-Nr · deutsche Status) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** QR-Code aus den Admin-Tabs entfernen, die Artikel-Nummer (ART-Nr) überall anzeigen + im Admin suchbar machen, und alle Status im Admin auf Deutsch bringen.

**Architecture:** Reine Frontend-Änderungen an der modularen Admin-Struktur (`useAdminData.jsx` = Logik/State, `AdminShell.jsx` = JSX) plus drei öffentliche Seiten (Inserat-Detail, FEE-Rechnung) und der zentralen `fees.js`. Keine DB-Migration. Wiederverwendung des bestehenden `makeArtRef`.

**Tech Stack:** Next.js 14 (App Router, Client Components), Supabase JS, Lucide Icons.

**Verifizierung:** Dieses Projekt hat keinen Unit-Test-Runner. Gate ist die **Live-Preview** (preview_eval/screenshot) als eingeloggter Admin + `git`. **NIE `npm run build`/`npm run dev`** neben dem laufenden Dev-Server.

**Bereits vorhanden (NICHT neu bauen — nur verifizieren):**
- `makeArtRef(listingId)` in `src/lib/fees.js:32` (= `ART-` + erste 8 Zeichen, uppercase).
- Bestell-Rechnung `src/app/(public)/order/[id]/invoice/page.jsx` zeigt `artRef` bereits (Hauptzeile :155, Kautionszeile :126).
- Öffentliche `searchListings` (`src/lib/listings.js:302-352`) hat die ART-/BEE-/Hex-Nummern-Suche schon vollständig (UUID-Range, jeder Status). Nur kleine Anpassung in Task 7.

---

## Task 1: Such-Helfer in fees.js

**Files:**
- Modify: `src/lib/fees.js` (nach `makeArtRef`, Z. 34)

- [ ] **Step 1: Helfer einfügen**

Direkt nach der `makeArtRef`-Funktion (Z. 32-34) einfügen:

```js
// "ART-1A2B3C4D" oder nackte "1a2b3c4d" (4–8 Hex) → Hex-Präfix (lowercase), sonst null.
// Verhindert Hijack normaler Suchen: verlangt "ART-"-Präfix ODER exakt 8 Hex.
export function parseArtRef(q) {
  const m = (q || "").trim().toLowerCase().match(/^art-?([0-9a-f]{4,8})$|^([0-9a-f]{8})$/);
  return m ? (m[1] || m[2]) : null;
}

// Hex-Präfix (4–8) → UUID-Bereich, der exakt alle IDs mit diesem Präfix umfasst.
export function artIdRange(prefix) {
  if (!prefix) return null;
  return {
    lo: `${prefix.padEnd(8, "0")}-0000-0000-0000-000000000000`,
    hi: `${prefix.padEnd(8, "f")}-ffff-ffff-ffff-ffffffffffff`,
  };
}

// Treffer im bereits geladenen Bestand (Teilstring der ART-Nr).
export function artRefMatches(id, q) {
  const qq = (q || "").toLowerCase().trim();
  return !!qq && makeArtRef(id).toLowerCase().includes(qq);
}
```

- [ ] **Step 2: Logik-Check (manuell)**

Prüfen: `parseArtRef("ART-1a2b3c4d")` → `"1a2b3c4d"`; `parseArtRef("D6A6D640")` → `"d6a6d640"`; `parseArtRef("sofa")` → `null` (kein ART-Präfix, nicht 8 Hex); `parseArtRef("cafe")` → `null`. `artIdRange("1a2b")` → `{lo:"1a2b0000-0000-...", hi:"1a2bffff-ffff-..."}`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/fees.js
git commit -m "feat(fees): ART-Nr Such-Helfer parseArtRef/artIdRange/artRefMatches"
```

---

## Task 2: QR aus den 3 Admin-Detail-Panels entfernen

**Files:**
- Modify: `src/components/admin/AdminShell.jsx` (Z. 13 Import; Bestellungen ~484-510; Rechnungen-BEE ~545-561; Rechnungen-FEE ~562-592)

- [ ] **Step 1: Bestellungen-Panel — QR-Box raus, Buttons inline**

Die `qrUrl`-Zeile (Z. 473 `const qrUrl = det ? qrImageUrl(...) : null;`) **löschen**. `deposit`, `canDeposit`, `invoiceHref` (Z. 470-474) bleiben.

Den geöffneten Detail-Block (Z. 484-510, der mit `{isOpen && (` beginnt) ersetzen durch:

```jsx
                    {isOpen && (
                      <div style={{ padding: 16, borderTop: `1px solid ${colors.borderLt}` }}>
                        <div style={{ fontSize: 12, lineHeight: 1.9 }}>
                          {[["Artikel", o.listingTitle], ["Käufer", o.buyerName], ["Verkäufer", o.sellerName], ["Betrag + Versand", `CHF ${fmtCHF(parseFloat(o.price || 0))} + ${fmtCHF(parseFloat(o.shipping_cost || 0))}`], ["Bee-Rate", det?.listing?.fee_percentage != null ? `${det.listing.fee_percentage}%` : "…"]].map(([k, v], i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Status</span><span>{orderStatusPill(o.status)}</span></div>
                          <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <a href={`/order/${o.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: colors.muted, background: colors.cream, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Bestellung ansehen</a>
                            {canDeposit && (
                              <div style={{ display: "inline-flex", background: colors.cream, borderRadius: 999, padding: 2 }}>
                                {[["Rechnung", false], ["Kaution", true]].map(([lbl, val]) => (
                                  <button key={lbl} onClick={() => setOrderDeposit(prev => ({ ...prev, [o.id]: val }))} style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: deposit === val ? "#fff" : "transparent", color: deposit === val ? colors.dark : colors.muted }}>{lbl}</button>
                                ))}
                              </div>
                            )}
                            <a href={invoiceHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                            {o.status !== "cancelled" && <button onClick={() => { if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fff", border: "1px solid #e6a6a6", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>Stornieren</button>}
                          </div>
                        </div>
                      </div>
                    )}
```

- [ ] **Step 2: Rechnungen-BEE-Panel — QR-Box raus**

Im `isOpen && r.kind === "bee"`-Block (Z. 545-561) die `qrUrl`-Zeile (Z. 547) **löschen**. Den `return (...)` ersetzen durch (linke Spalte behalten, rechte QR-Box weg, Button inline):

```jsx
                      return (
                        <div style={{ padding: 16, borderTop: `1px solid ${colors.borderLt}`, fontSize: 12, lineHeight: 1.9 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>Käufer → Verkäufer</span><span style={{ fontWeight: 500 }}>{r.payer} → {r.payee}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Betrag</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(r.amount)}</span></div>
                          <a href={`/order/${r.id}/invoice`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 16px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                        </div>
                      );
```

- [ ] **Step 3: Rechnungen-FEE-Panel — QR-Box raus**

Im `isOpen && r.kind === "fee"`-Block (Z. 562-592) die `qrUrl`-Zeile (Z. 567) **löschen**. Die rechte QR-Box (Z. 585-589, das `<div style={{ width: 200, ...}}>...</div>`) **entfernen** und stattdessen am Ende der linken Spalte (nach dem `inv.status !== "paid"`-Block, vor dessen schliessendem `</div>`) den Button einfügen:

```jsx
                            <a href={`/fees/invoice/${inv.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 12, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 16px", textDecoration: "none" }}>Volle Rechnung öffnen</a>
```

Den äusseren `<div style={{ display: "flex", gap: 18, ... }}>` (Z. 569) auf einen einspaltigen Container reduzieren: `<div style={{ padding: 16, borderTop: `1px solid ${colors.borderLt}` }}>` und die innere linke `<div style={{ flex: 1, ... }}>` behalten.

- [ ] **Step 4: Ungenutzten Import entfernen**

Zeile 13 `import { orderQrPayload, feeQrPayload, qrImageUrl } from "@/lib/swissQR";` **komplett löschen** (nach Steps 1-3 nicht mehr verwendet).

- [ ] **Step 5: Live verifizieren**

Als Admin (`/admin`): Bestellungen-Tab → eine Bestellung aufklappen. Erwartet: **kein QR-Bild**, „Volle Rechnung öffnen" vorhanden; bei einer Miet-Bestellung der Rechnung/Kaution-Umschalter. Rechnungen-Tab → je eine BEE- und FEE-Rechnung aufklappen: kein QR, „Volle Rechnung öffnen" vorhanden. preview_eval: `document.querySelectorAll('.admin-main img[alt="QR"]').length === 0` und kein `nextjs-portal` (Fehler-Overlay).

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminShell.jsx
git commit -m "feat(admin): QR aus Bestellungen/Rechnungen-Detail entfernt, Buttons inline"
```

---

## Task 3: Status im Admin durchgehend deutsch

**Files:**
- Modify: `src/components/admin/useAdminData.jsx` (Import oben; `statusPill` Z. 430-434; `orderStatusPill` Z. 435-440)
- Modify: `src/components/admin/AdminShell.jsx` (Invoice-Fallback Z. 534)

- [ ] **Step 1: PURCHASE_STATUS importieren**

In `useAdminData.jsx` oben bei den Imports ergänzen:

```js
import { PURCHASE_STATUS } from "@/lib/orderStatus";
```

- [ ] **Step 2: orderStatusPill auf zentrale Map umstellen**

`orderStatusPill` (Z. 435-440) ersetzen durch:

```js
  const orderStatusPill = (s) => {
    if (s === "cancelled") return pill("#FFEBEE", "#c62828", "Storniert");
    if (orderStatusGroup(s) === "done") return pill("#E8F5E9", "#2E7D32", "Abgeschlossen");
    return pill("#E3F2FD", "#1565C0", PURCHASE_STATUS[s]?.label || "Offen");
  };
```

- [ ] **Step 3: Inserate-statusPill um deleted/expired ergänzen**

In `statusPill` (Z. 431) die `map`-Konstante ergänzen um:

```js
    const map = { active: ["#E8F5E9", "#2E7D32", "Aktiv"], draft: ["#f5f5f5", "#666", "Entwurf"], paused: ["#FFF3E0", "#E65100", "Pausiert"], sold: ["#E3F2FD", "#1565C0", "Verkauft"], rented: ["#E3F2FD", "#1565C0", "Vermietet"], inactive: ["#f5f5f5", "#666", "Inaktiv"], pending_pause: ["#FFEBEE", "#c62828", "Wird pausiert"], deleted: ["#FFEBEE", "#c62828", "Gelöscht"], expired: ["#f5f5f5", "#666", "Abgelaufen"] };
```

- [ ] **Step 4: Invoice-Status-Fallback deutsch (AdminShell)**

In `AdminShell.jsx:534` den Fallback so ändern, dass nie der rohe Key erscheint:

```jsx
                    const sc2 = sc[r.status] || (r.status === "cancelled" ? { bg: "#FFEBEE", color: "#c62828", label: "Storniert" } : { bg: "#E3F2FD", color: "#1565C0", label: "Offen" });
```

- [ ] **Step 5: Live verifizieren**

Als Admin: Bestellungen-Tab — alle Status-Pills deutsch. preview_eval auf `.admin-main`: der Text enthält **nicht** `payment_marked`, `disputed`, `confirmed`, `pending_payment` (roh). Rechnungen-Tab — Status deutsch. Kein Fehler-Overlay.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/useAdminData.jsx src/components/admin/AdminShell.jsx
git commit -m "feat(admin): Status durchgehend deutsch (zentrale PURCHASE_STATUS-Map)"
```

---

## Task 4: ART-Nr anzeigen — Admin-Inserate-Tab + Inserat-Detail

**Files:**
- Modify: `src/components/admin/AdminShell.jsx` (Import + Inserate-Titel-Zelle Z. 707-709)
- Modify: `src/app/(public)/listing/[id]/ListingClient.jsx` (Import + nach `<h1>` Z. 636)

- [ ] **Step 1: AdminShell — makeArtRef importieren**

In `AdminShell.jsx:12` den Import erweitern:

```js
import { makeBeeRef, makeArtRef } from "@/lib/fees";
```

- [ ] **Step 2: AdminShell — ART-Nr unter dem Inserat-Titel**

Die Titel-Zelle (Z. 707-709) ersetzen durch:

```jsx
                      <td style={{ ...td, fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Link href={`/listing/${l.id}`} style={{ color: colors.dark, textDecoration: "none" }}>{l.title}</Link>
                        <span style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: colors.muted, fontWeight: 500 }}>{makeArtRef(l.id)}</span>
                      </td>
```

- [ ] **Step 3: ListingClient — makeArtRef importieren**

In `ListingClient.jsx` bei den Imports ergänzen (eine eigene Zeile genügt):

```js
import { makeArtRef } from "@/lib/fees";
```

- [ ] **Step 4: ListingClient — ART-Nr unter dem Titel**

Direkt nach dem `<h1 ...>{l.title}</h1>` (Z. 636) einfügen:

```jsx
              <div style={{ fontFamily: "monospace", fontSize: 11, color: colors.muted, marginBottom: 8 }}>{makeArtRef(l.id)}</div>
```

- [ ] **Step 5: Live verifizieren**

Admin Inserate-Tab: jede Zeile zeigt `ART-XXXXXXXX` unter dem Titel. Ein Inserat öffnen (`/listing/<id>`): `ART-XXXXXXXX` unter dem Titel sichtbar, passt zu den ersten 8 Zeichen der ID. Kein Fehler.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminShell.jsx "src/app/(public)/listing/[id]/ListingClient.jsx"
git commit -m "feat(listings): ART-Nr im Admin-Inserate-Tab + auf dem Inserat-Detail"
```

---

## Task 5: ART-Nr je Position — FEE-Rechnung + Admin-FEE-Ledger

**Files:**
- Modify: `src/app/(public)/fees/invoice/[id]/page.jsx` (Import; Laden Z. 32-33; Render Z. 112-115)
- Modify: `src/components/admin/useAdminData.jsx` (`loadFeeDetail` Z. 246-250)
- Modify: `src/components/admin/AdminShell.jsx` (FEE-Ledger-Render Z. 571-573)

- [ ] **Step 1: FEE-Rechnungsseite — makeArtRef importieren**

In `fees/invoice/[id]/page.jsx:11` erweitern:

```js
import { makeBeeRef, makeArtRef } from "@/lib/fees";
```

- [ ] **Step 2: FEE-Rechnungsseite — listing_id je Position auflösen**

Den Block, der `items` lädt (Z. 32-33), ersetzen durch:

```js
        const { data: items } = await supabase.from("fee_ledger").select("*").eq("fee_invoice_id", inv.id).order("created_at", { ascending: true });
        const pids = [...new Set((items || []).map(i => i.purchase_id).filter(Boolean))];
        let lidMap = {};
        if (pids.length) {
          const { data: purs } = await supabase.from("purchases").select("id, listing_id").in("id", pids);
          lidMap = Object.fromEntries((purs || []).map(p => [p.id, p.listing_id]));
        }
        setFees((items || []).map(i => ({ ...i, listing_id: lidMap[i.purchase_id] || null })));
```

- [ ] **Step 3: FEE-Rechnungsseite — ART-Nr neben BEE-Nr rendern**

Die Artikel-Zelle (Z. 112-115) ersetzen durch:

```jsx
                <td style={{ ...cp, fontSize: 11, fontWeight: 600 }}>
                  {fee.listing_title}
                  {fee.purchase_id && <span style={{ display: "block", fontSize: 9, color: g, fontWeight: 400 }}>{makeBeeRef(fee.purchase_id)}{fee.listing_id ? ` · ${makeArtRef(fee.listing_id)}` : ""}</span>}
                </td>
```

- [ ] **Step 4: Admin — feeLedger mit listing_id anreichern**

In `useAdminData.jsx` den `loadFeeDetail`-Anfang (Z. 247-250) ersetzen durch:

```js
    if (!feeLedger[inv.id]) {
      const { data: items } = await supabase.from("fee_ledger").select("*").eq("fee_invoice_id", inv.id).order("created_at", { ascending: true });
      const pids = [...new Set((items || []).map(i => i.purchase_id).filter(Boolean))];
      let lidMap = {};
      if (pids.length) {
        const { data: purs } = await supabase.from("purchases").select("id, listing_id").in("id", pids);
        lidMap = Object.fromEntries((purs || []).map(p => [p.id, p.listing_id]));
      }
      setFeeLedger(prev => ({ ...prev, [inv.id]: (items || []).map(i => ({ ...i, listing_id: lidMap[i.purchase_id] || null })) }));
    }
```

- [ ] **Step 5: Admin — ART-Nr in der FEE-Ledger-Zeile (AdminShell)**

`makeArtRef` ist nach Task 4 bereits importiert. Die Ledger-Zeile (Z. 572-574, im `ledger.map`) ersetzen durch:

```jsx
                              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                                <span>{fmtDate(f.created_at)} · {f.purchase_id ? makeBeeRef(f.purchase_id) + " · " : ""}{f.listing_id ? makeArtRef(f.listing_id) + " · " : ""}{f.listing_title}</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
                              </div>
```

- [ ] **Step 6: Live verifizieren**

Eine FEE-Rechnung im Admin aufklappen: jede Ledger-Position zeigt `BEE-… · ART-… · Titel`. Die echte FEE-Seite (`/fees/invoice/<id>`) öffnen: je Position unter dem Titel `BEE-… · ART-…`. (Test-FEE-Rechnung z.B. die für „radioactive" angelegte.) Kein Fehler.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(public)/fees/invoice/[id]/page.jsx" src/components/admin/useAdminData.jsx src/components/admin/AdminShell.jsx
git commit -m "feat(fees): ART-Nr je Position auf FEE-Rechnung + Admin-FEE-Ledger"
```

---

## Task 6: ART-Nr-Suche im Admin-Inserate-Tab (findet auch beendete)

**Files:**
- Modify: `src/components/admin/useAdminData.jsx` (Import; State; Effekt; `filteredListings` Z. 444; `visibleListings`; return-Objekt)
- Modify: `src/components/admin/AdminShell.jsx` (Destrukturierung; Inserate-Render `filteredListings` → `visibleListings`)

- [ ] **Step 1: Helfer importieren**

In `useAdminData.jsx` den fees-Import erweitern (zu dem, was schon da ist — `makeBeeRef` etc.):

```js
import { makeBeeRef, makeArtRef, parseArtRef, artIdRange, artRefMatches } from "@/lib/fees";
```

(Falls `makeBeeRef` separat importiert ist, alle in einen Import zusammenführen.)

- [ ] **Step 2: State für Server-Treffer**

Bei den `useState`-Deklarationen (z.B. nach `feeSeller`, Z. 41) einfügen:

```js
  const [refListings, setRefListings] = useState([]);
```

- [ ] **Step 3: filteredListings um ART-Nr erweitern**

`filteredListings` (Z. 444) ersetzen durch:

```js
  const filteredListings = listings.filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.sellerName?.toLowerCase().includes(search.toLowerCase()) || artRefMatches(l.id, search));
```

- [ ] **Step 4: Server-Lookup-Effekt**

Nach den bestehenden `useEffect`-Blöcken (z.B. nach dem Audit-Lazy-Load) einfügen:

```js
  useEffect(() => {
    if (tab !== "listings") { setRefListings([]); return; }
    const range = artIdRange(parseArtRef(search));
    if (!range) { setRefListings([]); return; }
    let active = true;
    (async () => {
      const { data } = await supabase.from("listings").select("*").gte("id", range.lo).lte("id", range.hi);
      if (!active) return;
      const rows = data || [];
      const ids = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
      let nameMap = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
        nameMap = Object.fromEntries((profs || []).map(p => [p.id, p.display_name]));
      }
      setRefListings(rows.map(r => ({ ...r, sellerName: nameMap[r.user_id] || "—" })));
    })();
    return () => { active = false; };
  }, [tab, search]);
```

- [ ] **Step 5: visibleListings ableiten**

Nach `filteredListings` (Z. 444) einfügen:

```js
  const visibleListings = (() => {
    const ids = new Set(filteredListings.map(l => l.id));
    return [...filteredListings, ...refListings.filter(r => !ids.has(r.id))];
  })();
```

- [ ] **Step 6: visibleListings exportieren**

Im return-Objekt dort, wo `filteredListings` steht (Z. 602), `visibleListings` ergänzen:

```js
    filteredUsers, visibleUsers, filteredListings, visibleListings, filteredOrders, filteredEmails, invoiceRows, beeInvoiceRows, feeInvoiceRows,
```

- [ ] **Step 7: AdminShell — Inserate-Tab rendert visibleListings**

In `AdminShell.jsx` die Destrukturierung (Z. 45) um `visibleListings` ergänzen und im Inserate-Tab (Z. 705) `filteredListings.map` → `visibleListings.map` ändern.

- [ ] **Step 8: Live verifizieren**

Per SQL ein **nicht-aktives** Inserat finden (`select id, status from listings where status <> 'active' limit 1`), ART-Nr = `ART-` + erste 8 Zeichen (uppercase). Im Admin Inserate-Tab diese ART-Nr ins Suchfeld → das Inserat erscheint (auch wenn es nicht unter den neuesten 100 geladen war). Normale Titelsuche funktioniert weiter. Kein Fehler.

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/useAdminData.jsx src/components/admin/AdminShell.jsx
git commit -m "feat(admin): ART-Nr-Suche im Inserate-Tab inkl. Server-Lookup fuer beendete"
```

---

## Task 7: Öffentliche ART-Suche — gelöschte ausschliessen

**Files:**
- Modify: `src/lib/listings.js` (ART-Branch Z. 318-320; Hex-Branch Z. 340-341)

Die Nummern-Suche existiert bereits. Nur soft-gelöschte Inserate sollen öffentlich nicht über die Nummer auftauchen.

- [ ] **Step 1: ART-Branch — deleted ausschliessen**

In `searchListings`, ART-Branch (Z. 318-320), die Query um `.neq("status", "deleted")` ergänzen:

```js
    const { data, count } = await supabase.from("listings")
      .select(selectRef, { count: "exact" })
      .gte("id", range.gte).lte("id", range.lte)
      .neq("status", "deleted");
```

- [ ] **Step 2: Hex-Branch (Listing-Variante) — deleted ausschliessen**

Im nackten-Hex-Branch die Listing-Abfrage (Z. 340-341) ebenso ergänzen:

```js
    const { data: listingData, count: listingCount } = await supabase.from("listings")
      .select(selectRef, { count: "exact" }).gte("id", range.gte).lte("id", range.lte).neq("status", "deleted");
```

- [ ] **Step 3: Live verifizieren**

Auf `/search?q=ART-XXXXXXXX` mit der ART-Nr eines verkauften/beendeten (nicht gelöschten) Inserats → Treffer erscheint. Mit der ART-Nr eines `deleted`-Inserats → kein Treffer. Normale Stichwortsuche unverändert.

- [ ] **Step 4: Commit**

```bash
git add src/lib/listings.js
git commit -m "feat(search): oeffentliche ART-Nr-Suche schliesst geloeschte Inserate aus"
```

---

## Task 8: Beta-Checkliste

**Files:**
- Modify: `src/app/(public)/beta/page.jsx` (Sektion „Admin-Bereich", nach den `adm_audit_*`-Items)

- [ ] **Step 1: Items ergänzen**

Nach dem letzten `adm_audit_*`-Item einfügen:

```jsx
      { id: "adm_no_qr", label: "Bestellungen/Rechnungen-Detail zeigt keinen QR mehr, nur 'Volle Rechnung öffnen' (+ bei Miete Rechnung/Kaution-Umschalter)" },
      { id: "art_ref_visible", label: "ART-Nr (ART-XXXXXXXX) erscheint auf Inserat-Detail, Admin-Inserate, Bestell-Rechnung und FEE-Rechnung je Position" },
      { id: "adm_status_de", label: "Alle Bestell-/Rechnungs-Status im Admin sind deutsch (kein payment_marked/disputed o.ä.)" },
      { id: "art_ref_search_admin", label: "Admin-Inserate-Suche findet ein Inserat per ART-Nr, auch wenn beendet/alt" },
      { id: "art_ref_search_public", label: "Öffentliche Suche findet ein Inserat per ART-Nr (auch nicht-aktiv, ausser gelöscht)" },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um QR/ART-Nr/Status erweitert"
```

---

## Task 9: Abschluss-Verifizierung + Code-Review

- [ ] **Step 1: Voller Durchklick (live, Admin)**

Bestellungen + Rechnungen (kein QR, Buttons + Kaution-Umschalter, Status deutsch), Inserate (ART-Nr + ART-Suche eines beendeten Inserats), FEE-Rechnung (ART-Nr je Position). Öffentlich: Inserat-Detail (ART-Nr), `/search` mit ART-Nr. Keine Konsolen-/Overlay-Fehler.

- [ ] **Step 2: Code-Review-Subagent**

Read-only Review der geänderten Dateien gegen die Spec: korrekte Wiederverwendung von `makeArtRef`, keine toten QR-Imports/-Variablen, `orderStatusPill` deckt alle Status deutsch ab, `parseArtRef` kein Hijack normaler Suchen, `visibleListings`-Dedupe korrekt, keine veränderte Handler-Semantik.

- [ ] **Step 3: Baseline prüfen**

`git status` sauber bis auf erwartete Commits; Zeggy/yam unverändert (kein Ban); keine Test-Daten zurückgelassen.

---

## Self-Review (Plan gegen Spec)

- **Teil 1 (QR weg):** Task 2. ✓
- **Teil 2 (ART-Nr Anzeige):** Inserat-Detail + Admin-Inserate (Task 4), FEE-Rechnung + Admin-Ledger (Task 5); Bestell-Rechnung bereits vorhanden (in Task 9 verifiziert). ✓
- **Teil 3 (deutsche Status):** Task 3. ✓
- **Teil 4 (ART-Suche):** Admin (Task 6); öffentlich bereits vorhanden, nur deleted-Ausschluss (Task 7). ✓
- **Beta-Checkliste:** Task 8. ✓
- **Keine Migration:** eingehalten. ✓
- **Typkonsistenz:** `parseArtRef`/`artIdRange`/`artRefMatches`/`makeArtRef` einheitlich aus `fees.js`; `visibleListings` in Hook definiert (Task 6) und in AdminShell genutzt (Task 6 Step 7); `PURCHASE_STATUS` aus `orderStatus.js`. ✓
