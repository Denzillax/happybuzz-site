# Admin-Tools Welle 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Erste Ausbaustufe Admin-Tools: eindeutige FEE-Rechnungsnummern, BEE-Nr je Position auf der Monatsrechnung, CSV-Export, E-Mail-Log-Viewer und Mini-Analytik auf der Übersicht.

**Architecture:** Eine DB-Migration für die Rechnungsnummer-Generierung (RPC `create_monthly_fee_invoice`); der Rest ist Frontend an `src/app/(public)/admin/page.jsx` und der Rechnungsseite, plus ein kleiner CSV-Helfer. Daten kommen direkt per Supabase-Client (wie im restlichen Admin); E-Mail-Log und Mini-Analytik sind read-only.

**Tech Stack:** Next.js 14 (Client Components), Supabase (Postgres RPC + Tabellen), Lucide Icons, Inline-Styles + `src/lib/theme.js`. Spec: `docs/superpowers/specs/2026-06-15-admin-tools-welle1-design.md`.

---

## Umgebungs-/Verifizierungsregeln (wie Welle 0)

- **Kein** `npm run build` / `npm run dev` neben dem laufenden Dev-Server (korrumpiert dessen `.next`). Verifiziert wird per **Live-Preview** (Dev-Server läuft, Admin `/admin` ist als `yam` eingeloggt) über `preview_eval`/`preview_screenshot` und Code-Review.
- Die **DB-Migration** wird per Supabase-MCP `apply_migration` (Projekt `ekfsehsmwzougrgqukgf`) angewendet — das macht der **Controller** (Hauptsession), nicht der Implementer-Subagent. Der Implementer legt nur die `.sql`-Datei an und committet sie.
- Implementer-Subagenten machen NUR Datei-Edits + Commit, keine Build-/Server-Befehle.
- Kein Unit-Test-Framework im Projekt → „Verify"-Schritte sind Live-DOM-Checks / SQL-Checks.

## File Structure

- **Create** `supabase/migrations/20260615_fee_invoice_ref_seller.sql` — neue Definition von `create_monthly_fee_invoice` (nur `invoice_ref`-Format geändert).
- **Create** `src/lib/csv.js` — `downloadCSV(filename, headers, rows)`, reiner Client-Export.
- **Modify** `src/app/(public)/fees/invoice/[id]/page.jsx` — BEE-Nr je Position.
- **Modify** `src/app/(public)/admin/page.jsx` — BEE-Nr im FEE-Detail, CSV-Export-Buttons, E-Mails-Tab, Mini-Analytik.
- **Modify** `src/app/(public)/beta/page.jsx` — Checkliste.

---

## Task 1: DB-Migration — eindeutige FEE-Rechnungsnummer

**Files:**
- Create: `supabase/migrations/20260615_fee_invoice_ref_seller.sql`

- [ ] **Step 1: Migrationsdatei anlegen**

Erstelle `supabase/migrations/20260615_fee_invoice_ref_seller.sql` mit exakt diesem Inhalt (identisch zur aktuellen Funktion, NUR die `invoice_ref`-Zeile erweitert um das Verkäufer-Kürzel):

```sql
-- FEE-Rechnungsnummer eindeutig machen: + 6-stelliges Verkaeufer-Kuerzel.
-- Bestehende Rechnungen bleiben unveraendert (nur neue erhalten das Format).
CREATE OR REPLACE FUNCTION public.create_monthly_fee_invoice(p_seller_id uuid, p_month integer, p_year integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_invoice_id UUID;
  v_total NUMERIC;
  v_impact NUMERIC;
  v_count INT;
BEGIN
  SELECT id INTO v_invoice_id FROM fee_invoices
  WHERE seller_id = p_seller_id AND period_month = p_month AND period_year = p_year;
  IF v_invoice_id IS NOT NULL THEN RETURN v_invoice_id; END IF;

  SELECT COALESCE(SUM(fee_amount), 0), COALESCE(SUM(bee_impact), 0), COUNT(*)
  INTO v_total, v_impact, v_count
  FROM fee_ledger
  WHERE seller_id = p_seller_id AND status = 'pending'
    AND EXTRACT(MONTH FROM created_at) = p_month
    AND EXTRACT(YEAR FROM created_at) = p_year;

  IF v_count = 0 THEN RETURN NULL; END IF;

  INSERT INTO fee_invoices (seller_id, invoice_ref, period_month, period_year, total_fees, total_bee_impact, item_count, due_date)
  VALUES (
    p_seller_id,
    'FEE-' || p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-' || UPPER(LEFT(p_seller_id::TEXT, 6)),
    p_month, p_year, v_total, v_impact, v_count,
    (make_date(p_year, p_month, 1) + INTERVAL '1 month' + INTERVAL '29 days')::DATE
  )
  RETURNING id INTO v_invoice_id;

  UPDATE fee_ledger SET fee_invoice_id = v_invoice_id, status = 'invoiced'
  WHERE seller_id = p_seller_id AND status = 'pending'
    AND EXTRACT(MONTH FROM created_at) = p_month
    AND EXTRACT(YEAR FROM created_at) = p_year;

  RETURN v_invoice_id;
END;
$function$;
```

- [ ] **Step 2: Commit (Implementer)**

```bash
git add supabase/migrations/20260615_fee_invoice_ref_seller.sql
git commit -m "feat(fees): FEE-Rechnungsnummer um Verkaeufer-Kuerzel eindeutig machen (Migration)"
```

- [ ] **Step 3: Migration anwenden (Controller, via Supabase-MCP)**

Controller führt `apply_migration` (Projekt `ekfsehsmwzougrgqukgf`, name `fee_invoice_ref_seller`) mit obigem SQL aus.

- [ ] **Step 4: Verify (Controller, via Supabase-MCP `execute_sql`)**

```sql
select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='create_monthly_fee_invoice';
```
Erwartet: die `invoice_ref`-Zeile enthält jetzt `|| '-' || UPPER(LEFT(p_seller_id::TEXT, 6))`.
Zusätzlich prüfen, dass bestehende Rechnungen unverändert sind:
```sql
select invoice_ref from fee_invoices order by invoice_ref;
```
Erwartet: weiterhin `FEE-2026-02 … FEE-2026-05` (unverändert; Format greift erst bei neuen Rechnungen).

---

## Task 2: BEE-Nr je Position (Rechnungsseite + Admin-FEE-Detail)

**Files:**
- Modify: `src/app/(public)/fees/invoice/[id]/page.jsx`
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Rechnungsseite — `makeBeeRef` importieren**

In `src/app/(public)/fees/invoice/[id]/page.jsx` nach der Zeile
`import { feeQrPayload, qrImageUrl } from "@/lib/swissQR";` ergänzen:
```js
import { makeBeeRef } from "@/lib/fees";
```

- [ ] **Step 2: Rechnungsseite — Artikel-Zelle um BEE-Nr ergänzen**

Im Positionen-`<tbody>` die Artikel-Zelle (aktuell `<td style={{ ...cp, fontSize: 11, fontWeight: 600 }}>{fee.listing_title}</td>`) ersetzen durch:
```jsx
                <td style={{ ...cp, fontSize: 11, fontWeight: 600 }}>
                  {fee.listing_title}
                  {fee.purchase_id && <span style={{ display: "block", fontSize: 9, color: g, fontWeight: 400 }}>{makeBeeRef(fee.purchase_id)}</span>}
                </td>
```
(`g` = Graufarbe, ist in der Datei definiert. `fees` lädt `fee_ledger.select("*")`, enthält `purchase_id`.)

- [ ] **Step 3: Admin-FEE-Detail — BEE-Nr vor den Titel**

In `src/app/(public)/admin/page.jsx`, Rechnungen-Tab, im `ledger.map(f => ( … ))` die Position-Zeile
```jsx
                                <span>{fmtDate(f.created_at)} · {f.listing_title}</span>
```
ersetzen durch:
```jsx
                                <span>{fmtDate(f.created_at)} · {f.purchase_id ? makeBeeRef(f.purchase_id) + " · " : ""}{f.listing_title}</span>
```
(`makeBeeRef` ist in `admin/page.jsx` bereits importiert.)

- [ ] **Step 4: Verify (Controller, live)**

- Rechnungsseite einer FEE-Rechnung öffnen (`/fees/invoice/<feeId>`); `preview_eval` prüft, dass eine Position eine `BEE-`-Zeile zeigt:
  `[...document.querySelectorAll('td')].some(t=>/BEE-/.test(t.textContent))` → `true`.
- Admin → Rechnungen → FEE-Filter → eine FEE-Rechnung mit Positionen aufklappen; prüfen, dass die Positionszeile `BEE-` enthält.
- Falls eine FEE-Rechnung keine `fee_ledger`-Positionen hat (alle gebündelt), eine mit Positionen wählen; ist keine vorhanden, gilt der Rechnungsseiten-Check als ausreichend.

- [ ] **Step 5: Commit (Implementer)**

```bash
git add "src/app/(public)/fees/invoice/[id]/page.jsx" "src/app/(public)/admin/page.jsx"
git commit -m "feat(fees): BEE-Nr je Position auf FEE-Rechnung + Admin-Detail"
```

---

## Task 3: CSV-Export

**Files:**
- Create: `src/lib/csv.js`
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: CSV-Helfer anlegen**

Erstelle `src/lib/csv.js`:
```js
// Reiner Client-CSV-Export (kein Dependency). BOM voran, damit Excel UTF-8/Umlaute erkennt.
export function downloadCSV(filename, headers, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Admin — Import + Export-Funktion**

In `src/app/(public)/admin/page.jsx` bei den Top-Imports ergänzen:
```js
import { downloadCSV } from "@/lib/csv";
import { Download } from "lucide-react";
```
(`Download` zur bestehenden Lucide-Importliste hinzufügen statt separater Zeile, falls bevorzugt — beides funktioniert.)

Bei den anderen Helfern (vor `return`) eine Export-Funktion ergänzen. Sie nutzt die abgeleiteten, gefilterten Listen `filteredOrders`, `invoiceRows`, `visibleUsers` und `makeBeeRef`/`fmtCHF`/`fmtDate`:
```js
  const today = () => new Date().toISOString().slice(0, 10);
  const exportCurrent = () => {
    if (tab === "orders") {
      downloadCSV(`beedaro-bestellungen-${today()}.csv`,
        ["BEE-Nr", "Datum", "Artikel", "Käufer", "Verkäufer", "Preis", "Versand", "Status"],
        filteredOrders.map(o => [makeBeeRef(o.id), fmtDate(o.created_at), o.listingTitle, o.buyerName, o.sellerName, fmtCHF(o.price), fmtCHF(o.shipping_cost), o.status]));
    } else if (tab === "invoices") {
      downloadCSV(`beedaro-rechnungen-${today()}.csv`,
        ["Typ", "Nr", "Zahler", "Empfänger", "Betrag", "Status", "Datum"],
        invoiceRows.map(r => [r.kind.toUpperCase(), r.ref, r.payer, r.payee, fmtCHF(r.amount), r.status, fmtDate(r.date)]));
    } else if (tab === "users") {
      downloadCSV(`beedaro-benutzer-${today()}.csv`,
        ["Name", "Username", "Stadt", "Level", "Blüten", "Kontaktverstöße", "Gesperrt", "Erstellt"],
        visibleUsers.map(u => [u.display_name, u.username, u.city, u.bee_level || "starter", u.blueten || 0, u.contact_violations || 0, u.is_banned ? "ja" : "nein", u.created_at ? fmtDate(u.created_at) : ""]));
    }
  };
```

- [ ] **Step 3: Admin — Export-Button in der Top-Leiste**

In der `<header>`-Top-Leiste, unmittelbar nach dem schließenden `)}` des Such-Blocks (also nach der Such-`<div>`-Bedingung, noch innerhalb von `<header>`), den Button einfügen:
```jsx
          {(tab === "orders" || tab === "invoices" || tab === "users") && (
            <button onClick={exportCurrent} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: colors.cream, color: colors.dark, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
              <Download size={14} /> CSV
            </button>
          )}
```

- [ ] **Step 4: Verify (Controller, live)**

- Admin → Bestellungen: `preview_eval` prüft Button vorhanden:
  `[...document.querySelectorAll('.admin-main header button, .admin-main button')].some(b=>b.textContent.trim()==='CSV')` bzw. im Header. Button klicken → kein Konsolenfehler (`preview_console_logs` level error leer).
- Funktions-Smoke: `preview_eval`
  ```js
  (()=>{const a=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='CSV'); if(!a) return 'no-btn'; let ok=false; const orig=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ok=true;}; a.click(); HTMLAnchorElement.prototype.click=orig; return ok?'export-fired':'no-fire';})()
  ```
  Erwartet: `"export-fired"` (CSV-Anchor-Klick wurde ausgelöst, kein Fehler).

- [ ] **Step 5: Commit (Implementer)**

```bash
git add src/lib/csv.js "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): CSV-Export fuer Bestellungen/Rechnungen/Benutzer (gefilterte Ansicht)"
```

---

## Task 4: E-Mail-Log-Viewer (eigener Tab)

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Icon-Import + State**

Lucide-Import um `Mail` ergänzen. Bei den `useState`-Zeilen ergänzen:
```js
  const [emailLog, setEmailLog] = useState([]);
  const [openEmail, setOpenEmail] = useState(null);
```

- [ ] **Step 2: email_log laden**

Im `useEffect`-`load()` direkt nach `setOrders(ordsWithNames);` ergänzen:
```js
      // E-Mail-Log
      const { data: mails } = await supabase.from("email_log").select("*").order("created_at", { ascending: false }).limit(500);
      setEmailLog(mails || []);
```

- [ ] **Step 3: NAV-Eintrag + Such-/Titel-Unterstützung**

NAV-Array (vor `return`) um einen Eintrag VOR `reports` ergänzen:
```js
    { key: "emails", label: "E-Mails", Icon: Mail },
```
In der Top-Bar-Such-Bedingung `tab === "emails"` zulassen und Placeholder ergänzen. Aus
```jsx
{(tab === "users" || tab === "listings" || tab === "orders" || tab === "invoices") && (
```
wird
```jsx
{(tab === "users" || tab === "listings" || tab === "orders" || tab === "invoices" || tab === "emails") && (
```
und im `placeholder` einen Zweig ergänzen (am Ende der Ternary-Kette vor dem letzten Fallback):
`... : tab === "emails" ? "Empfänger, Betreff oder Template..." : "Nummer (BEE/FEE) oder Name..."`

- [ ] **Step 4: Abgeleitete Liste**

Bei den anderen `filtered…`-Konstanten ergänzen:
```js
  const filteredEmails = emailLog.filter(e => !search || (e.recipient_email || "").toLowerCase().includes(search.toLowerCase()) || (e.subject || "").toLowerCase().includes(search.toLowerCase()) || (e.template || "").toLowerCase().includes(search.toLowerCase()));
```

- [ ] **Step 5: Render-Block**

Unmittelbar VOR dem `{/* ═══ INSERATE ═══ */}`-Block (oder an einer beliebigen Stelle unter den Tab-Blöcken) einfügen:
```jsx
          {/* ═══ E-MAILS ═══ */}
          {tab === "emails" && (
            <div>
              {filteredEmails.length === 0 && (
                <div style={{ padding: 36, textAlign: "center", color: colors.muted, fontSize: 13, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>Keine E-Mails protokolliert.</div>
              )}
              {filteredEmails.map(e => {
                const isOpen = openEmail === e.id;
                const statusColor = e.status === "sent" ? ["#E8F5E9", "#2E7D32"] : e.status === "failed" ? ["#FFEBEE", "#c62828"] : ["#FFF3E0", "#E65100"];
                return (
                  <div key={e.id} style={{ marginBottom: 8, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${isOpen ? colors.teal : colors.border}`, overflow: "hidden" }}>
                    <div onClick={() => setOpenEmail(isOpen ? null : e.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: isOpen ? "#F3FAFA" : "transparent" }}>
                      <Mail size={15} color={colors.muted} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.subject || "(kein Betreff)"}</div>
                        <div style={{ fontSize: 11, color: colors.muted }}>{e.recipient_email || "—"}</div>
                      </div>
                      {e.template && pill(colors.cream, colors.muted, e.template)}
                      {e.status && pill(statusColor[0], statusColor[1], e.status)}
                      <span style={{ fontSize: 11, color: colors.muted, minWidth: 80, textAlign: "right" }}>{e.created_at ? fmtDate(e.created_at) : ""}</span>
                      {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${colors.borderLt}`, padding: 14, background: "#FAFAF8" }}>
                        <pre style={{ margin: 0, fontSize: 11, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: colors.dark }}>{e.context ? JSON.stringify(e.context, null, 2) : "(kein Context)"}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
```

- [ ] **Step 6: Verify (Controller, live)**

Admin neu laden, E-Mails-Tab klicken. `preview_eval`:
```js
(()=>{const b=[...document.querySelectorAll('.admin-nav button')].find(x=>x.textContent.trim().startsWith('E-Mails')); b.click(); return new Promise(r=>setTimeout(()=>{const rows=document.querySelectorAll('.admin-main .ti, .admin-main svg'); r(JSON.stringify({title:document.querySelector('h1')?.textContent, err:document.body.innerText.includes('Cannot find module'), count:[...document.querySelectorAll('.admin-main')] .length})); },600));})()
```
Erwartet: `title` = „E-Mails", kein Fehler. Eine Zeile aufklappen → `<pre>` mit Context sichtbar; Suche nach einer bekannten Template-Bezeichnung filtert.

- [ ] **Step 7: Commit (Implementer)**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): E-Mail-Log-Viewer als eigener Tab"
```

---

## Task 5: Mini-Analytik auf der Übersicht

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Kennzahlen ableiten**

Bei den abgeleiteten Mengen (nahe `openFeeInvoices`) ergänzen:
```js
  const nonCancelledOrders = orders.filter(o => o.status !== "cancelled");
  const gmv = nonCancelledOrders.reduce((s, o) => s + parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0), 0);
  const avgOrder = nonCancelledOrders.length ? gmv / nonCancelledOrders.length : 0;
  const topSellers = Object.values(nonCancelledOrders.reduce((acc, o) => {
    const k = o.seller_id || "?";
    if (!acc[k]) acc[k] = { name: o.sellerName || "—", count: 0, sum: 0 };
    acc[k].count += 1; acc[k].sum += parseFloat(o.price || 0) + parseFloat(o.shipping_cost || 0);
    return acc;
  }, {})).sort((a, b) => b.count - a.count).slice(0, 5);
```

- [ ] **Step 2: Render-Block in der Übersicht**

Im `{tab === "overview" && ( … )}`-Block, direkt NACH dem schließenden `</div>` des Stat-Karten-Grids (das mit `gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))"`) und VOR der `<h2>Zu prüfen</h2>`-Zeile einfügen:
```jsx
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 32 }}>
                <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted }}>Umsatz (GMV)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: fonts.head, marginTop: 8 }}>CHF {fmtCHF(gmv)}</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Ø Bestellwert: {avgOrder ? `CHF ${fmtCHF(avgOrder)}` : "—"} · {nonCancelledOrders.length} Käufe</div>
                </div>
                <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "17px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: colors.muted, marginBottom: 10 }}>Top-Verkäufer</div>
                  {topSellers.length === 0 ? <div style={{ fontSize: 12, color: colors.muted }}>Noch keine Verkäufe.</div> : topSellers.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                      <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {s.name}</span>
                      <span style={{ color: colors.muted, flexShrink: 0, marginLeft: 8 }}>{s.count} · CHF {fmtCHF(s.sum)}</span>
                    </div>
                  ))}
                </div>
              </div>
```

- [ ] **Step 3: Verify (Controller, live)**

Admin → Übersicht. `preview_eval`:
```js
JSON.stringify({ gmv: document.body.innerText.includes('Umsatz (GMV)'), top: document.body.innerText.includes('Top-Verkäufer'), err: document.body.innerText.includes('Cannot find module') })
```
Erwartet: `gmv:true, top:true, err:false`. Screenshot zur Sichtprüfung (Block unter den Stat-Karten).

- [ ] **Step 4: Commit (Implementer)**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): Mini-Analytik (GMV, Ø Bestellwert, Top-5-Verkaeufer) auf der Uebersicht"
```

---

## Task 6: Beta-Checkliste erweitern

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Items ergänzen**

In der Sektion `id: "admin"` nach dem letzten Eintrag (`adm_overview_openinv`) ergänzen:
```js
      { id: "adm_fee_ref_unique", label: "Neue FEE-Rechnung erhält eindeutige Nr (FEE-JJJJ-MM-XXXXXX); bestehende unverändert" },
      { id: "adm_fee_bee_pos", label: "FEE-Monatsrechnung (Seite + Admin) zeigt BEE-Nr je Position" },
      { id: "adm_csv", label: "CSV-Export für Bestellungen/Rechnungen/Benutzer exportiert die gefilterte Ansicht; Umlaute korrekt" },
      { id: "adm_emaillog", label: "E-Mails-Tab listet email_log, Suche + aufklappbarer Context funktionieren" },
      { id: "adm_mini_analytics", label: "Übersicht zeigt GMV, Ø Bestellwert und Top-5-Verkäufer (nicht-storniert)" },
```

- [ ] **Step 2: Commit (Implementer)**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Admin-Tools Welle 1 erweitert"
```

---

## Task 7: Abschluss-Verifizierung (Controller)

**Files:** keine

- [ ] **Step 1: Voller Live-Durchlauf** auf `/admin`: Übersicht (GMV/Top-5), Bestellungen (CSV-Button), Rechnungen (CSV-Button, FEE-Detail mit BEE je Position), Benutzer (CSV-Button), E-Mails-Tab (Liste, Suche, Context). `preview_eval` Konsolen-Check: kein `nextjs-portal`, keine Error-Logs.
- [ ] **Step 2: FEE-Migration** final per SQL bestätigt (Funktionsdefinition neu, Bestandsrechnungen unverändert).
- [ ] **Step 3: Testkonto Zeggy** auf Baseline (keine durch Tests entstandenen Mutationen).
- [ ] **Step 4: Finaler Code-Review-Subagent** über `git diff <letzter-Welle-0-Commit>..HEAD` der geänderten Dateien (Spec-Konformität, tote Symbole, Marken-/Em-Dash-Regel, `.maybeSingle()`).

---

## Self-Review (Autor)

- **Spec-Abdeckung:** FEE-Nr eindeutig → T1. BEE je Position → T2. CSV-Export → T3. E-Mail-Log → T4. Mini-Analytik → T5. Beta-Checkliste → T6. Verifizierung/Zeggy/Review → T7. Alle Spec-Abschnitte abgedeckt.
- **Platzhalter:** keine — alle Code-Schritte enthalten vollständigen Code; Verify-Schritte nennen konkrete Assertions.
- **Typ-/Namens-Konsistenz:** `downloadCSV(filename, headers, rows)` in T3 definiert und genau so in `exportCurrent` aufgerufen. `makeBeeRef` (aus `@/lib/fees`) in T2 in der Rechnungsseite neu importiert, im Admin schon vorhanden. `filteredOrders`/`invoiceRows`/`visibleUsers` existieren aus Welle 0. `emailLog`/`openEmail`/`filteredEmails` in T4 definiert und im Render genutzt. `nonCancelledOrders`/`gmv`/`avgOrder`/`topSellers` in T5 definiert und im Block genutzt. `Mail`/`Download` aus lucide-react ergänzt. `pill`/`fmtCHF`/`fmtDate`/`colors`/`radius`/`fonts` bestehen bereits.
