# Admin: Bestellungen + Rechnungen (mit QR) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Im Admin alle Bestellungen und Rechnungen (mit Swiss-QR) voll einsehbar und per Nummer durchsuchbar machen; Gebühren-Tab in einen Rechnungen-Tab überführen; Sidebar-Schwarz an den Footer angleichen.

**Architecture:** Reiner Frontend-Ausbau der Client-Komponente `src/app/(public)/admin/page.jsx` (Supabase-Queries direkt im Client, wie im restlichen Admin). Die dreifach benötigte Swiss-QR-Logik wird in ein gemeinsames Modul `src/lib/swissQR.js` extrahiert und von den zwei bestehenden Rechnungsseiten + dem Admin genutzt. Detail-Daten (volle Profile/Listing für QR) werden lazy beim Aufklappen einer Zeile geladen — analog zum bestehenden `toggleUser`.

**Tech Stack:** Next.js 14 (App Router, Client Component), Supabase JS, Lucide Icons, Inline-Styles + `src/lib/theme.js`. Spec: `docs/superpowers/specs/2026-06-15-admin-orders-invoices-design.md`.

---

## Wichtig: Verifizierung in diesem Projekt

Das Projekt hat **kein** Unit-Test-Framework (siehe `package.json` — nur `dev`/`build`/`lint`). Verifiziert wird daher nach dem etablierten Muster dieser Codebase:

- **Live-Preview** (Dev-Server läuft, eingeloggt als Admin-Konto `yam`): über das Preview-Tool `preview_eval` DOM-Assertions ausführen und `preview_screenshot` für Sichtprüfung.
- **`npm run build`** als Compile-/Typsicherheits-Gate.
- Nach Tests: **Testkonto Zeggy auf Baseline** zurücksetzen (keine Sperre/keine Testdaten hinterlassen).

Jeder „Verify"-Schritt nennt die konkrete Assertion und das erwartete Ergebnis. Wo `preview_eval` steht, ist die laufende Admin-Preview gemeint (Pfad `/admin`).

---

## File Structure

- **Create** `src/lib/swissQR.js` — einzige Quelle für: `buildSwissQR`, `qrImageUrl`, `orderQrPayload`, `feeQrPayload`. Verantwortung: Swiss-QR-Payload + Bild-URL. Keine UI.
- **Modify** `src/app/(public)/order/[id]/invoice/page.jsx` — lokale `buildSwissQR` entfernen, QR aus `swissQR.js` beziehen.
- **Modify** `src/app/(public)/fees/invoice/[id]/page.jsx` — dito.
- **Modify** `src/app/(public)/admin/page.jsx` — Sidebar-Farbe, Nav (6 Tabs), neuer Bestellungen-Tab, neuer Rechnungen-Tab (FEE-Mahnwesen integriert), Übersicht-Karte.
- **Modify** `src/app/(public)/beta/page.jsx` — Checkliste „Admin-Bereich" erweitern.

Keine DB-Migration nötig (alle Spalten existieren).

---

## Task 1: Gemeinsames Swiss-QR-Modul

**Files:**
- Create: `src/lib/swissQR.js`

- [ ] **Step 1: Modul anlegen**

Erstelle `src/lib/swissQR.js` mit exakt diesem Inhalt (die `buildSwissQR`-Zeile ist 1:1 aus den bestehenden Rechnungsseiten übernommen, damit der QR-Inhalt unverändert bleibt):

```js
// Einzige Quelle für die Swiss-QR-Rechnung (vorher dupliziert in
// order/[id]/invoice und fees/invoice/[id]). Reiner Payload-/URL-Builder, keine UI.
import { fullName } from "@/lib/formatters";
import { makeBeeRef } from "@/lib/fees";

export function buildSwissQR({ iban, name, street, plzCity, amount, currency, dName, dStreet, dPlzCity, message }) {
  return ["SPC","0200","1",iban,"K",name,street||"",plzCity||"","","","CH","","","","","","","",amount,currency,"K",dName||"",dStreet||"",dPlzCity||"","","","CH","NON","",message||"","EPD"].join("\r\n");
}

export function qrImageUrl(payload, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=M&data=${encodeURIComponent(payload)}`;
}

// Bestell-Rechnung (Kauf): Käufer -> Verkäufer. deposit=true -> Kautionsrückgabe (Verkäufer -> Käufer).
// `order` muss .buyer, .seller (volle profiles) und .listing (joined) enthalten.
export function orderQrPayload(order, { deposit = false } = {}) {
  const price = parseFloat(order.listing?.price || order.price || 0);
  const shipping = parseFloat(order.listing?.shipping_cost || order.shipping_cost || 0);
  const depositAmount = parseFloat(order.listing?.deposit_amount || 0);
  const damageAmount = parseFloat(order.damage_amount || 0);
  const refundAmount = Math.max(0, depositAmount - damageAmount);
  const total = deposit ? refundAmount : price + shipping;
  const ref = makeBeeRef(order.id);
  const payee = deposit ? order.buyer : order.seller;
  const payer = deposit ? order.seller : order.buyer;
  const payeeIsBusiness = payee?.account_type === "business" && !!payee?.company_name;
  const payeeName = payeeIsBusiness ? payee.company_name : fullName(payee);
  const payeeIban = (payee?.iban || "").replace(/\s/g, "");
  const payeeStreet = payee?.street || "";
  const payeePlz = `${payee?.postal_code || ""} ${payee?.city || ""}`.trim();
  const payerStreet = payer?.street || "";
  const payerPlz = `${payer?.postal_code || ""} ${payer?.city || ""}`.trim();
  const message = deposit ? `Kaution ${ref}` : `Rechnung ${ref}`;
  return buildSwissQR({ iban: payeeIban, name: payeeName, street: payeeStreet, plzCity: payeePlz, amount: total.toFixed(2), currency: "CHF", dName: fullName(payer), dStreet: payerStreet, dPlzCity: payerPlz, message });
}

// Gebühren-Rechnung: Verkäufer -> BEEDARO.
export function feeQrPayload(invoice, seller) {
  const total = parseFloat(invoice.total_fees || 0);
  const ref = invoice.invoice_ref;
  return buildSwissQR({
    iban: "CH1234567890123456789", name: "BEEDARO", street: "Gemeindehausstrasse 11B", plzCity: "6010 Kriens",
    amount: total.toFixed(2), currency: "CHF",
    dName: fullName(seller), dStreet: seller?.street || "", dPlzCity: `${seller?.postal_code || ""} ${seller?.city || ""}`.trim(),
    message: `Gebuehren ${ref}`,
  });
}
```

- [ ] **Step 2: Build-Gate**

Run: `npm run build`
Expected: Build erfolgreich (keine Modul-/Import-Fehler). Das Modul wird noch nicht importiert, daher reicht, dass es kompiliert.

- [ ] **Step 3: Commit**

```bash
git add src/lib/swissQR.js
git commit -m "refactor(invoice): Swiss-QR-Logik in src/lib/swissQR.js extrahieren"
```

---

## Task 2: Bestehende Rechnungsseiten auf das Modul umstellen

**Files:**
- Modify: `src/app/(public)/order/[id]/invoice/page.jsx`
- Modify: `src/app/(public)/fees/invoice/[id]/page.jsx`

- [ ] **Step 1: Order-Invoice — Import ergänzen**

In `src/app/(public)/order/[id]/invoice/page.jsx` die Zeile (9)
```js
import { calcFeeFromPrice, makeBeeRef, makeArtRef, makeFeeRef, calcDueDate } from "@/lib/fees";
```
unverändert lassen und direkt danach ergänzen:
```js
import { orderQrPayload, qrImageUrl } from "@/lib/swissQR";
```

- [ ] **Step 2: Order-Invoice — lokale buildSwissQR entfernen**

Lösche die lokale Funktion (Zeilen 12–14):
```js
function buildSwissQR({ iban, name, street, plzCity, amount, currency, dName, dStreet, dPlzCity, message }) {
  return ["SPC","0200","1",iban,"K",name,street||"",plzCity||"","","","CH","","","","","","","",amount,currency,"K",dName||"",dStreet||"",dPlzCity||"","","","CH","NON","",message||"","EPD"].join("\r\n");
}
```

- [ ] **Step 3: Order-Invoice — QR über Helper bauen**

Ersetze den QR-Block (aktuell die Zeilen mit `const qrMessage = …`, `const qrPayload = buildSwissQR({ … })`, `const qrUrl = \`https://api.qrserver.com…\`;`) durch:
```js
  const qrPayload = orderQrPayload(order, { deposit: isDeposit });
  const qrUrl = qrImageUrl(qrPayload);
```
Hinweis: Die übrigen Anzeige-Variablen (`payee`, `payer`, `total`, `ref`, Adressen) bleiben unverändert — sie werden im Rechnungs-Body weiterverwendet. Nur `qrMessage`/`qrPayload`/`qrUrl` werden ersetzt. Stelle sicher, dass `order` zu diesem Zeitpunkt `buyer`, `seller` und `listing` enthält (tut es: `setOrder({ ...p, buyer, seller })` mit gejointem `listing`).

- [ ] **Step 4: Fee-Invoice — Import ergänzen**

In `src/app/(public)/fees/invoice/[id]/page.jsx` nach Zeile 9 (`import { colors } from "@/lib/theme";`) ergänzen:
```js
import { feeQrPayload, qrImageUrl } from "@/lib/swissQR";
```

- [ ] **Step 5: Fee-Invoice — lokale buildSwissQR entfernen**

Lösche die lokale Funktion (Zeilen 11–13, identisch zu Task 2 Step 2).

- [ ] **Step 6: Fee-Invoice — QR über Helper bauen**

Ersetze den Block
```js
  const qrPayload = buildSwissQR({
    iban: beedaroIban, name: "BEEDARO", street: "Gemeindehausstrasse 11B", plzCity: "6010 Kriens",
    amount: total.toFixed(2), currency: "CHF",
    dName: fullName(seller), dStreet: seller?.street || "", dPlzCity: `${seller?.postal_code || ""} ${seller?.city || ""}`.trim(),
    message: `Gebuehren ${ref}`,
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${encodeURIComponent(qrPayload)}`;
```
durch:
```js
  const qrPayload = feeQrPayload(invoice, seller);
  const qrUrl = qrImageUrl(qrPayload);
```
Die Zeilen `const beedaroIban = …` / `const beedaroIbanDisplay = …` bleiben (Display-Anzeige der IBAN im Body).

- [ ] **Step 7: Build-Gate**

Run: `npm run build`
Expected: Build erfolgreich.

- [ ] **Step 8: Live-Verify (QR rendert weiterhin)**

Im Browser eine bestehende Bestell-Rechnung öffnen (`/order/<purchaseId>/invoice`) und eine Gebühren-Rechnung (`/fees/invoice/<id>`).
`preview_eval` Assertion (Order-Invoice):
```js
!!document.querySelector('img[alt="QR"]') && document.querySelector('img[alt="QR"]').src.startsWith('https://api.qrserver.com')
```
Expected: `true` auf beiden Seiten. Optional `preview_screenshot` zur Sichtprüfung (QR sichtbar, Layout unverändert).

- [ ] **Step 9: Commit**

```bash
git add "src/app/(public)/order/[id]/invoice/page.jsx" "src/app/(public)/fees/invoice/[id]/page.jsx"
git commit -m "refactor(invoice): Rechnungsseiten nutzen src/lib/swissQR.js"
```

---

## Task 3: Sidebar-Farbe + Navigation (6 Tabs)

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Sidebar-Schwarz an Footer angleichen**

In `src/app/(public)/admin/page.jsx` im `<aside className="admin-sidebar" …>` und im Bee-Mark-Icon die Farbe `#191615` durch `#1a1a1a` ersetzen. Konkret:
- `<aside … style={{ background: "#191615", … }}>` → `background: "#1a1a1a"`.
- `<BeeIcon size={18} color="#191615" />` (im Bee-Mark in der Sidebar) → `color="#1a1a1a"`.
- Im `<i class="ti ti-hexagon" …>`-Fallback existiert hier nicht (nur im Mockup) — nur die zwei obigen Stellen.

- [ ] **Step 2: NAV-Array auf 6 Tabs umstellen**

Ersetze das `NAV`-Array (im Render, vor `return`) durch:
```js
  const NAV = [
    { key: "overview", label: "Übersicht", Icon: LayoutDashboard },
    { key: "users", label: "Benutzer", Icon: Users },
    { key: "orders", label: "Bestellungen", Icon: ShoppingBag },
    { key: "invoices", label: "Rechnungen", Icon: ReceiptText },
    { key: "listings", label: "Inserate", Icon: Package },
    { key: "reports", label: "Meldungen", Icon: Flag, badge: openReports.length },
  ];
```

- [ ] **Step 3: Icons importieren**

In der Lucide-Import-Zeile (oben) `ShoppingBag` und `ReceiptText` ergänzen. Aus
```js
import { LayoutDashboard, ShieldCheck, Shield, Users, Package, Receipt, TrendingUp, CheckCircle, XCircle, Eye, AlertTriangle, Clock, Search, ChevronDown, ChevronUp, Ban, Play, Pause, Flag, MessageCircle, Star, ArrowLeft } from "lucide-react";
```
wird
```js
import { LayoutDashboard, ShieldCheck, Shield, Users, Package, Receipt, ReceiptText, ShoppingBag, TrendingUp, CheckCircle, XCircle, Eye, AlertTriangle, Clock, Search, ChevronDown, ChevronUp, Ban, Play, Pause, Flag, MessageCircle, Star, ArrowLeft } from "lucide-react";
```

- [ ] **Step 4: Such-Top-Bar auch für orders/invoices zeigen**

Suche die Bedingung der Top-Bar-Suche:
```js
{(tab === "users" || tab === "listings") && (
```
Ersetze durch:
```js
{(tab === "users" || tab === "listings" || tab === "orders" || tab === "invoices") && (
```
Und passe das `placeholder` an:
```js
placeholder={tab === "users" ? "Benutzer suchen..." : tab === "listings" ? "Inserate suchen..." : tab === "orders" ? "BEE-Nummer, Artikel oder Name..." : "Nummer (BEE/FEE) oder Name..."}
```

- [ ] **Step 5: Alten Gebühren-Tab-Block neutralisieren**

Der bisherige Block `{tab === "fees" && ( … Gebühren-Tabelle … )}` wird in Task 5 durch den Rechnungen-Tab ersetzt. Für jetzt: den `{tab === "fees" && (` Block unverändert lassen (er rendert nie mehr, da kein Nav-Eintrag `fees` mehr existiert) — wird in Task 5 entfernt. Kein Edit in diesem Step.

- [ ] **Step 6: Build + Live-Verify**

Run: `npm run build` → erfolgreich.
`preview_eval` (Admin neu laden):
```js
JSON.stringify({
  nav: [...document.querySelectorAll('.admin-nav button')].map(b=>b.textContent.replace(/\d+$/,'').trim()),
  sidebarBg: getComputedStyle(document.querySelector('.admin-sidebar')).backgroundColor
})
```
Expected: `nav` = `["Übersicht","Benutzer","Bestellungen","Rechnungen","Inserate","Meldungen"]`, `sidebarBg` = `"rgb(26, 26, 26)"` (= `#1a1a1a`, identisch zum Footer).

- [ ] **Step 7: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): Nav auf 6 Tabs (Bestellungen/Rechnungen) + Sidebar = Footer-Schwarz"
```

---

## Task 4: Bestellungen-Tab (global, Suche, QR-Detail)

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Imports für QR-Helper + Refs**

Stelle sicher, dass diese Imports vorhanden sind (oben in der Datei ergänzen):
```js
import { makeBeeRef } from "@/lib/fees";
import { orderQrPayload, feeQrPayload, qrImageUrl } from "@/lib/swissQR";
```

- [ ] **Step 2: Orders ohne Limit laden**

Im `useEffect`-`load()` die Orders-Query von `.limit(50)` auf alle umstellen. Finde:
```js
      const { data: ords } = await supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(50);
```
Ersetze durch:
```js
      const { data: ords } = await supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(1000);
```
(1000 als Sicherheitskappe; Pagination ist Out-of-Scope laut Spec.)

- [ ] **Step 3: State + Lazy-Loader + Filter-Helfer hinzufügen**

Bei den übrigen `useState`-Deklarationen ergänzen:
```js
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [openOrder, setOpenOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState({});   // orderId -> { ...purchase, listing, buyer, seller }
  const [orderDeposit, setOrderDeposit] = useState({}); // orderId -> bool (Miete: Kautions-QR zeigen)
```
Bei den übrigen Handler-Funktionen (z.B. nach `toggleUser`) ergänzen:
```js
  const ORDER_DETAIL_SELECT = "*, listing:listings(id, title, price, listing_type, rent_price, deposit_amount, fee_percentage, fee_tier, shipping_cost, free_shipping)";
  const loadOrderDetail = async (orderId) => {
    if (orderDetail[orderId]) return;
    const { data: p } = await supabase.from("purchases").select(ORDER_DETAIL_SELECT).eq("id", orderId).maybeSingle();
    if (!p) return;
    const { data: buyer } = await supabase.from("profiles").select("*").eq("id", p.buyer_id).maybeSingle();
    const { data: seller } = await supabase.from("profiles").select("*").eq("id", p.seller_id).maybeSingle();
    setOrderDetail(prev => ({ ...prev, [orderId]: { ...p, buyer, seller } }));
  };
  const toggleOrder = async (orderId) => {
    if (openOrder === orderId) { setOpenOrder(null); return; }
    setOpenOrder(orderId);
    await loadOrderDetail(orderId);
  };
  const orderStatusGroup = (s) => s === "cancelled" ? "cancelled" : (["completed", "delivered", "picked_up"].includes(s) ? "done" : "open");
  const beeRefIncludes = (id, q) => {
    const ref = makeBeeRef(id).toLowerCase();
    const qq = (q || "").toLowerCase().trim();
    return ref.includes(qq) || ref.replace("bee-", "").startsWith(qq.replace("bee-", ""));
  };
```

- [ ] **Step 4: Abgeleitete Liste vor dem `return`**

Bei den anderen `filtered*`-Konstanten ergänzen:
```js
  const filteredOrders = orders.filter(o =>
    (!search || beeRefIncludes(o.id, search) || o.listingTitle?.toLowerCase().includes(search.toLowerCase()) || o.buyerName?.toLowerCase().includes(search.toLowerCase()) || o.sellerName?.toLowerCase().includes(search.toLowerCase()))
    && (orderStatusFilter === "all" || orderStatusGroup(o.status) === orderStatusFilter)
  );
```

- [ ] **Step 5: Status-Pill-Helfer für Bestellungen**

Bei den anderen Pill-Helfern ergänzen:
```js
  const orderStatusPill = (s) => {
    if (s === "cancelled") return pill("#FFEBEE", "#c62828", "Storniert");
    if (orderStatusGroup(s) === "done") return pill("#E8F5E9", "#2E7D32", "Abgeschlossen");
    const map = { confirmed: "Bestätigt", payment_marked: "Zahlung gemeldet", paid: "Bezahlt", shipped: "Versendet", payment_pending: "Rechnung offen" };
    return pill("#E3F2FD", "#1565C0", map[s] || (s || "Offen"));
  };
```

- [ ] **Step 6: Bestellungen-Tab rendern**

Füge im Render-Bereich (z.B. direkt nach dem `{tab === "users" && ( … )}`-Block, vor dem Inserate-Block) ein:
```jsx
          {/* ═══ BESTELLUNGEN ═══ */}
          {tab === "orders" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {[{ k: "all", l: "Alle" }, { k: "open", l: "Offen" }, { k: "done", l: "Abgeschlossen" }, { k: "cancelled", l: "Storniert" }].map(f => (
                  <button key={f.k} onClick={() => setOrderStatusFilter(f.k)} style={modPill(orderStatusFilter === f.k)}>{f.l}</button>
                ))}
              </div>

              {filteredOrders.length === 0 && (
                <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Keine Bestellungen gefunden.</div>
              )}

              {filteredOrders.map(o => {
                const ref = makeBeeRef(o.id);
                const isOpen = openOrder === o.id;
                const det = orderDetail[o.id];
                const deposit = !!orderDeposit[o.id];
                const total = parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
                const canDeposit = det?.listing?.listing_type === "rent" && parseFloat(det?.listing?.deposit_amount || 0) > 0;
                const qrUrl = det ? qrImageUrl(orderQrPayload(det, { deposit }), 220) : null;
                const invoiceHref = `/order/${o.id}/invoice${deposit ? "?type=deposit" : ""}`;
                return (
                  <div key={o.id} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${isOpen ? colors.teal : colors.border}`, overflow: "hidden", opacity: o.status === "cancelled" ? 0.7 : 1 }}>
                    <div onClick={() => toggleOrder(o.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", background: isOpen ? "#F3FAFA" : "transparent" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: isOpen ? "#0A7170" : colors.muted, minWidth: 90 }}>{ref}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.listingTitle} <span style={{ fontWeight: 400, color: colors.muted }}>· {o.buyerName} → {o.sellerName}</span></span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>CHF {fmtCHF(total)}</span>
                      {orderStatusPill(o.status)}
                      {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
                    </div>
                    {isOpen && (
                      <div style={{ display: "flex", gap: 18, padding: 16, borderTop: `1px solid ${colors.borderLt}`, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 220, fontSize: 12, lineHeight: 1.9 }}>
                          {[["Artikel", o.listingTitle], ["Käufer", o.buyerName], ["Verkäufer", o.sellerName], ["Betrag + Versand", `CHF ${fmtCHF(parseFloat(o.price || 0))} + ${fmtCHF(parseFloat(o.shipping_cost || 0))}`]].map(([k, v], i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Status</span><span>{orderStatusPill(o.status)}</span></div>
                          <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                            <a href={`/order/${o.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: colors.muted, background: colors.cream, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>Bestellung ansehen</a>
                            {o.status !== "cancelled" && <button onClick={() => { if (confirm(`${ref} stornieren?`)) cancelOrder(o.id, o.listing_id); }} style={{ fontSize: 11, fontWeight: 600, color: "#c0392b", background: "#fff", border: "1px solid #e6a6a6", borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>Stornieren</button>}
                          </div>
                        </div>
                        <div style={{ width: 200, flexShrink: 0, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 10 }}>QR-Rechnung</div>
                          {qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 110, height: 110, border: "1px solid #eee", borderRadius: 6 }} /> : <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: 11 }}>Lade…</div>}
                          <div style={{ fontSize: 10, color: colors.muted, marginTop: 8 }}>{deposit ? "Kaution " : "Rechnung "}{ref}</div>
                          {canDeposit && (
                            <div style={{ display: "inline-flex", marginTop: 10, background: colors.cream, borderRadius: 999, padding: 2 }}>
                              {[["Rechnung", false], ["Kaution", true]].map(([lbl, val]) => (
                                <button key={lbl} onClick={() => setOrderDeposit(prev => ({ ...prev, [o.id]: val }))} style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer", background: deposit === val ? "#fff" : "transparent", color: deposit === val ? colors.dark : colors.muted }}>{lbl}</button>
                              ))}
                            </div>
                          )}
                          <a href={invoiceHref} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 0", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
```

- [ ] **Step 7: Build + Live-Verify**

Run: `npm run build` → erfolgreich.
Live (Admin, Bestellungen-Tab über Nav anklicken): wähle einen bekannten Kauf, lies dessen Ref. `preview_eval`:
```js
(()=>{const b=[...document.querySelectorAll('.admin-nav button')].find(x=>x.textContent.trim().startsWith('Bestellungen')); b.click(); return new Promise(r=>setTimeout(()=>r(JSON.stringify({rows:document.querySelectorAll('.admin-main [style*="monospace"]').length>0, anyRef:[...document.querySelectorAll('.admin-main [style*="monospace"]')][0]?.textContent})),300));})()
```
Expected: `rows: true`, `anyRef` beginnt mit `"BEE-"`. Dann eine Zeile aufklappen (click) und prüfen, dass `img[alt="QR"]` erscheint und `src` mit `https://api.qrserver.com` beginnt, sowie ein Link mit Text „Volle Rechnung öffnen" auf `/order/…/invoice` zeigt.
Suche testen: in das Suchfeld die bekannte BEE-Nummer schreiben (`preview_fill` auf das Input) → nur passende Zeile bleibt sichtbar.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): globaler Bestellungen-Tab mit Nummernsuche + QR-Detail"
```

---

## Task 5: Rechnungen-Tab (BEE + FEE, Mahnwesen integriert) + alten Gebühren-Block entfernen

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: State + Lazy-Loader für FEE-Detail**

Bei den `useState`-Deklarationen ergänzen:
```js
  const [invoiceType, setInvoiceType] = useState("all");   // all | bee | fee
  const [openInvoiceKey, setOpenInvoiceKey] = useState(null); // "bee:<id>" | "fee:<id>"
  const [feeLedger, setFeeLedger] = useState({});  // feeInvoiceId -> ledger items
  const [feeSeller, setFeeSeller] = useState({});  // feeInvoiceId -> seller profile
```
Bei den Handlern ergänzen:
```js
  const loadFeeDetail = async (inv) => {
    if (!feeLedger[inv.id]) {
      const { data: items } = await supabase.from("fee_ledger").select("*").eq("fee_invoice_id", inv.id).order("created_at", { ascending: true });
      setFeeLedger(prev => ({ ...prev, [inv.id]: items || [] }));
    }
    if (!feeSeller[inv.id]) {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", inv.seller_id).maybeSingle();
      setFeeSeller(prev => ({ ...prev, [inv.id]: prof }));
    }
  };
  const toggleInvoiceRow = async (kind, idOrInv) => {
    const key = `${kind}:${kind === "bee" ? idOrInv : idOrInv.id}`;
    if (openInvoiceKey === key) { setOpenInvoiceKey(null); return; }
    setOpenInvoiceKey(key);
    if (kind === "bee") await loadOrderDetail(idOrInv);     // idOrInv = orderId
    else await loadFeeDetail(idOrInv);                       // idOrInv = fee invoice object
  };
```

- [ ] **Step 2: Abgeleitete Rechnungs-Zeilen vor dem `return`**

Bei den `filtered*`-Konstanten ergänzen:
```js
  const beeInvoiceRows = orders.map(o => ({
    kind: "bee", id: o.id, ref: makeBeeRef(o.id), payer: o.buyerName, payee: o.sellerName,
    amount: parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0), status: o.status, date: o.created_at,
  }));
  const feeInvoiceRows = feeInvoices.map(inv => ({
    kind: "fee", id: inv.id, ref: inv.invoice_ref, payer: inv.sellerName, payee: "BEEDARO",
    amount: parseFloat(inv.total_fees || 0), status: inv.status, date: inv.created_at, inv,
  }));
  const invoiceRows = [
    ...(invoiceType === "fee" ? [] : beeInvoiceRows),
    ...(invoiceType === "bee" ? [] : feeInvoiceRows),
  ].filter(r => !search || (r.ref || "").toLowerCase().includes(search.toLowerCase()) || (r.payer || "").toLowerCase().includes(search.toLowerCase()) || (r.payee || "").toLowerCase().includes(search.toLowerCase()))
   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
```

- [ ] **Step 3: Rechnungen-Tab rendern**

Füge im Render (nach dem Bestellungen-Block) ein:
```jsx
          {/* ═══ RECHNUNGEN ═══ */}
          {tab === "invoices" && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {[{ k: "all", l: "Alle" }, { k: "bee", l: "Bestell-Rechnungen (BEE)" }, { k: "fee", l: "Gebühren-Rechnungen (FEE)" }].map(f => (
                  <button key={f.k} onClick={() => setInvoiceType(f.k)} style={modPill(invoiceType === f.k)}>{f.l}</button>
                ))}
              </div>

              {invoiceRows.length === 0 && (
                <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Keine Rechnungen gefunden.</div>
              )}

              {invoiceRows.map(r => {
                const key = `${r.kind}:${r.id}`;
                const isOpen = openInvoiceKey === key;
                const typeBadge = r.kind === "bee" ? pill("#E6F5F5", "#0A7170", "BEE") : pill("#FFF5D8", "#5c4708", "FEE");
                const sc2 = sc[r.status] || (r.status === "cancelled" ? { bg: "#FFEBEE", color: "#c62828", label: "Storniert" } : { bg: "#E3F2FD", color: "#1565C0", label: r.status || "—" });
                return (
                  <div key={key} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${isOpen ? colors.teal : colors.border}`, overflow: "hidden" }}>
                    <div onClick={() => toggleInvoiceRow(r.kind, r.kind === "bee" ? r.id : r.inv)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", background: isOpen ? "#F3FAFA" : "transparent" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: isOpen ? "#0A7170" : colors.muted, minWidth: 110 }}>{r.ref}</span>
                      {typeBadge}
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: colors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.payer} → {r.payee}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>CHF {fmtCHF(r.amount)}</span>
                      {pill(sc2.bg, sc2.color, sc2.label)}
                      {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
                    </div>
                    {isOpen && r.kind === "bee" && (() => {
                      const det = orderDetail[r.id];
                      const qrUrl = det ? qrImageUrl(orderQrPayload(det, { deposit: false }), 220) : null;
                      return (
                        <div style={{ display: "flex", gap: 18, padding: 16, borderTop: `1px solid ${colors.borderLt}`, flexWrap: "wrap", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 220, fontSize: 12, lineHeight: 1.9 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLt}` }}><span style={{ color: colors.muted }}>Käufer → Verkäufer</span><span style={{ fontWeight: 500 }}>{r.payer} → {r.payee}</span></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.muted }}>Betrag</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(r.amount)}</span></div>
                          </div>
                          <div style={{ width: 200, flexShrink: 0, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 10 }}>QR-Rechnung</div>
                            {qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 110, height: 110, border: "1px solid #eee", borderRadius: 6 }} /> : <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: 11 }}>Lade…</div>}
                            <a href={`/order/${r.id}/invoice`} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 0", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                          </div>
                        </div>
                      );
                    })()}
                    {isOpen && r.kind === "fee" && (() => {
                      const inv = r.inv;
                      const seller = feeSeller[inv.id];
                      const ledger = feeLedger[inv.id] || [];
                      const rl = inv.reminder_level || 0;
                      const qrUrl = seller ? qrImageUrl(feeQrPayload(inv, seller), 220) : null;
                      return (
                        <div style={{ display: "flex", gap: 18, padding: 16, borderTop: `1px solid ${colors.borderLt}`, flexWrap: "wrap", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 220, fontSize: 12 }}>
                            {ledger.map(f => (
                              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${colors.borderLt}` }}>
                                <span>{fmtDate(f.created_at)} — {f.listing_title}</span><span style={{ fontWeight: 600 }}>CHF {fmtCHF(f.fee_amount)}</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#5B8C5A" }}><span>Bee-Impact</span><span>CHF {fmtCHF(inv.total_bee_impact)}</span></div>
                            {inv.status !== "paid" ? (
                              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                {rl < 1 && <button onClick={() => sendReminder(inv.id, inv.seller_id, 1)} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "#FFF3E0", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Erinnerung</button>}
                                {rl === 1 && <button onClick={() => sendReminder(inv.id, inv.seller_id, 2)} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "#FFE0B2", color: "#E65100", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Mahnung</button>}
                                {rl === 2 && <button onClick={() => sendReminder(inv.id, inv.seller_id, 3)} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "#FFCDD2", color: "#c62828", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Inserate pausieren</button>}
                                <button onClick={() => confirmAndReactivate(inv.id, inv.seller_id)} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Bezahlt</button>
                              </div>
                            ) : <p style={{ margin: "6px 0 0", fontSize: 10, color: "#2E7D32" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
                          </div>
                          <div style={{ width: 200, flexShrink: 0, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#999", marginBottom: 10 }}>QR-Rechnung</div>
                            {qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 110, height: 110, border: "1px solid #eee", borderRadius: 6 }} /> : <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: 11 }}>Lade…</div>}
                            <a href={`/fees/invoice/${inv.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 10, fontSize: 11, fontWeight: 600, color: "#fff", background: colors.teal, borderRadius: 999, padding: "7px 0", textDecoration: "none" }}>Volle Rechnung öffnen</a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
```

- [ ] **Step 4: Alten Gebühren-Tab-Block entfernen**

Lösche den kompletten `{tab === "fees" && ( … )}`-Block (die alte Gebühren-Tabelle samt Filter `feeFilter`). Der zugehörige State `feeFilter`/`setFeeFilter` und die Konstante `filteredFees` werden nicht mehr gerendert — entferne sie ebenfalls (Deklaration `const [feeFilter, setFeeFilter] = useState("all");` und `const filteredFees = …`), um toten Code zu vermeiden. `confirmPayment` (ungenutzt) kann bleiben oder entfernt werden; falls Lint `no-unused-vars` meckert, entfernen.

- [ ] **Step 5: Build + Live-Verify**

Run: `npm run build` → erfolgreich.
Live (Rechnungen-Tab anklicken): `preview_eval`
```js
(()=>{const b=[...document.querySelectorAll('.admin-nav button')].find(x=>x.textContent.trim().startsWith('Rechnungen')); b.click(); return new Promise(r=>setTimeout(()=>r(JSON.stringify({
  filters: [...document.querySelectorAll('.admin-main button')].map(x=>x.textContent.trim()).filter(t=>/BEE|FEE|Alle/.test(t)).slice(0,3),
  refs: [...document.querySelectorAll('.admin-main [style*="monospace"]')].slice(0,3).map(x=>x.textContent)
})),300));})()
```
Expected: Filter-Pills enthalten „Alle", „Bestell-Rechnungen (BEE)", „Gebühren-Rechnungen (FEE)"; `refs` enthält Einträge mit `BEE-` und/oder `FEE-`. Eine FEE-Zeile aufklappen → QR-Bild lädt, Mahnwesen-Buttons (z.B. „Erinnerung" oder „Bezahlt") sichtbar, „Volle Rechnung öffnen" → `/fees/invoice/…`. FEE-Filter klicken → nur FEE-Refs.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): Rechnungen-Tab (BEE+FEE) mit QR + integriertem Mahnwesen; Gebuehren-Tab entfernt"
```

---

## Task 6: Übersicht-Karte „Offene Rechnungen"

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Kennzahl ableiten**

Bei den abgeleiteten Mengen (wo `flaggedUsers`, `openReports` definiert sind) ergänzen:
```js
  const openFeeInvoices = feeInvoices.filter(i => i.status !== "paid");
```

- [ ] **Step 2: Attention-Karte ergänzen**

Im `ATTENTION`-Array eine vierte Karte ergänzen:
```js
    { n: openFeeInvoices.length, label: "Offene Rechnungen", desc: "Gebühren-Rechnungen unbezahlt", Icon: ReceiptText, color: "#E65100", onClick: () => { setTab("invoices"); setSearch(""); setInvoiceType("fee"); } },
```

- [ ] **Step 3: Build + Live-Verify**

Run: `npm run build` → erfolgreich.
Live (Übersicht): die Karte „Offene Rechnungen" ist sichtbar; Klick wechselt auf Rechnungen-Tab mit aktivem FEE-Filter. `preview_eval` nach Klick:
```js
JSON.stringify({ title: document.querySelector('h1')?.textContent, feeActive: [...document.querySelectorAll('.admin-main button')].some(b=>b.textContent.includes('FEE') && getComputedStyle(b).backgroundColor==='rgb(25, 22, 21)') })
```
Expected: `title` = `"Rechnungen"`, `feeActive` = `true`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): Uebersicht-Karte 'Offene Rechnungen' verlinkt FEE-Filter"
```

---

## Task 7: Beta-Checkliste erweitern

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Items ergänzen**

In der Sektion `id: "admin"` (Array `items`) nach dem Eintrag `adm_reports` ergänzen:
```js
      { id: "adm_orders", label: "Bestellungen-Tab: alle Käufe, Suche per BEE-Nummer/Name, Status-Filter; Detail mit QR-Vorschau + 'Volle Rechnung öffnen' + Stornieren" },
      { id: "adm_orders_rent", label: "Miet-Bestellung: Umschalter Rechnung/Kaution zeigt den korrekten zweiten QR" },
      { id: "adm_invoices", label: "Rechnungen-Tab: Typ-Filter Alle/BEE/FEE, Nummernsuche über beide, Inline-QR + Öffnen" },
      { id: "adm_invoices_dunning", label: "Gebühren-Rechnungen (FEE) behalten das Mahnwesen (Stufen 1-3, Bezahlt+reaktivieren)" },
      { id: "adm_overview_openinv", label: "Übersicht-Karte 'Offene Rechnungen' springt gefiltert in den Rechnungen-Tab" },
```

- [ ] **Step 2: Build-Gate**

Run: `npm run build` → erfolgreich.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Bestellungen-/Rechnungen-Admin erweitert"
```

---

## Task 8: Abschluss-Verifizierung

**Files:** keine (nur Verifikation)

- [ ] **Step 1: Voller Live-Durchlauf als Admin**

Auf `/admin` (eingeloggt als `yam`) prüfen:
- Sidebar-Schwarz == Footer (`rgb(26, 26, 26)`).
- Übersicht: 4 „Zu prüfen"-Karten inkl. „Offene Rechnungen".
- Bestellungen: Nummernsuche findet einen bekannten `BEE-`-Kauf; Detail zeigt QR + Buttons; bei einer Miet-Bestellung Umschalter Rechnung/Kaution.
- Rechnungen: Alle/BEE/FEE filtern; FEE-Mahnwesen sichtbar; „Volle Rechnung öffnen" öffnet je nach Typ `/order/[id]/invoice` bzw. `/fees/invoice/[id]`.

`preview_eval` Konsolen-Check:
```js
(()=>document.querySelector('nextjs-portal') ? 'ERROR-OVERLAY' : 'clean')()
```
Expected: `"clean"`.

- [ ] **Step 2: Testkonto Zeggy auf Baseline**

Falls beim Testen Zeggy verändert wurde (z.B. Sperre): über den Benutzer-Tab entsperren / zurücksetzen, sodass `is_banned=false` und `contact_violations` wie zuvor. Verify: Benutzer-Filter „Gesperrt (0)".

- [ ] **Step 3: Lint (optional, falls konfiguriert)**

Run: `npm run lint`
Expected: keine neuen Fehler in `admin/page.jsx`, `swissQR.js`, den Invoice-Seiten.

---

## Self-Review (Autor)

- **Spec-Abdeckung:** Footer-Schwarz → T3. Nav 6 Tabs / Gebühren→Rechnungen → T3+T5. Bestellungen-Tab (Suche/Status/QR/Miet-Kaution) → T4. Rechnungen-Tab (BEE+FEE, Nummernsuche, Mahnwesen) → T5. Übersicht-Karte → T6. swissQR-Refactor → T1+T2. Beta-Checkliste → T7. Verifizierung/Zeggy → T8. Alle Abschnitte abgedeckt.
- **Platzhalter:** keine — alle Code-Schritte enthalten vollständigen Code; Verify-Schritte nennen konkrete Assertions/erwartete Werte.
- **Typ-/Namens-Konsistenz:** `loadOrderDetail`/`orderDetail` in T4 definiert, in T5 (BEE-Detail) wiederverwendet. `orderQrPayload`/`feeQrPayload`/`qrImageUrl` in T1 definiert, in T2/T4/T5 genutzt. `makeBeeRef` aus `@/lib/fees`. `sendReminder`/`confirmAndReactivate`/`cancelOrder` sind bestehende Handler. `modPill`/`pill`/`sc`/`fmtCHF`/`fmtDate`/`colors`/`radius` existieren bereits im Admin.
```
