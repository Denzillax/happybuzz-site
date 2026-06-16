# Admin Mahnwesen-Cockpit + lesbare E-Mails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mahnwesen als eigenes Cockpit mit Eskalations-Timeline + E-Mail-Vorschau, plus überall lesbare, nutzerbezogene E-Mails (kein JSON).

**Architecture:** Neues reines Text-Modul `src/lib/dunning.js`; der Rest ist Frontend an `src/app/(public)/admin/page.jsx` — geteilte Helfer (Überfällig-Logik, Timeline, Mahn-Button, E-Mail-Karte), ein Vorschau-Modal, ein refaktorierter `sendReminder`, ein neuer „Mahnungen"-Tab, lesbare E-Mail-Darstellung. Keine DB-Migration.

**Tech Stack:** Next.js 14 (Client Component), Supabase JS, Lucide, Inline-Styles + `src/lib/theme.js`. Spec: `docs/superpowers/specs/2026-06-16-admin-mahnwesen-design.md`.

---

## Umgebungs-/Verifizierungsregeln (wie bisher)

- **Kein** `npm run build` / `npm run dev` neben dem laufenden Dev-Server. Verifizieren per **Live-Preview** (`/admin`, eingeloggt als `yam`) + Supabase-MCP.
- Implementer-Subagenten: nur Datei-Edits + Commit, keine Build-/Server-Befehle.
- Kein Unit-Test-Framework → „Verify" = Live-DOM-Checks / SQL.

## File Structure

- **Create** `src/lib/dunning.js` — `buildDunningEmail(...)`, reine Texterzeugung.
- **Modify** `src/app/(public)/admin/page.jsx` — Engine (Helfer, Modal, `sendReminder`-Refactor), Mahnungen-Tab, lesbare E-Mails, FEE-Detail-Timeline.
- **Modify** `src/app/(public)/beta/page.jsx` — Checkliste.

---

## Task 1: Mahntext-Modul `src/lib/dunning.js`

**Files:**
- Create: `src/lib/dunning.js`

- [ ] **Step 1: Datei anlegen**

```js
// Reine Mahntext-Erzeugung (keine UI, kein Supabase). amount/dueDate/daysOverdue kommen vorformatiert rein.
const TEXTS = {
  1: {
    subject: (ref) => `Erinnerung: offene Gebührenrechnung ${ref}`,
    body: ({ sellerName, ref, amount, dueDate }) =>
`Hallo ${sellerName},

deine Gebührenrechnung ${ref} über CHF ${amount} war am ${dueDate} fällig.

Bitte begleiche den Betrag in den nächsten Tagen über die QR-Rechnung in deinem Konto. Falls du bereits bezahlt hast, ignoriere diese Nachricht.

Besten Dank.
Dein BEEDARO-Team`,
  },
  2: {
    subject: () => `2. Mahnung: Inserate werden bald pausiert`,
    body: ({ sellerName, ref, amount, dueDate, daysOverdue }) =>
`Hallo ${sellerName},

deine Gebührenrechnung ${ref} über CHF ${amount} ist seit ${daysOverdue} Tagen offen (fällig am ${dueDate}).

Bitte begleiche den Betrag innerhalb von 7 Tagen. Andernfalls pausieren wir deine aktiven Inserate, bis die Zahlung eingegangen ist.

Zahlung per QR-Rechnung in deinem Konto.
Dein BEEDARO-Team`,
  },
  3: {
    subject: () => `Letzte Mahnung: Inserate pausiert`,
    body: ({ sellerName, ref, amount, daysOverdue }) =>
`Hallo ${sellerName},

deine Gebührenrechnung ${ref} über CHF ${amount} ist seit ${daysOverdue} Tagen offen. Wir haben deine aktiven Inserate jetzt pausiert.

Sobald deine Zahlung eingegangen ist, schalten wir die Inserate wieder frei. Bitte begleiche den Betrag per QR-Rechnung in deinem Konto.

Bei Fragen: support@happybuzz.ch
Dein BEEDARO-Team`,
  },
};

export function buildDunningEmail({ level, sellerName, ref, amount, dueDate, daysOverdue }) {
  const t = TEXTS[level] || TEXTS[1];
  return {
    subject: t.subject(ref),
    body: t.body({ sellerName, ref, amount, dueDate, daysOverdue }),
    template: `reminder_${level}`,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/dunning.js
git commit -m "feat(dunning): Mahntext-Modul mit 3 Eskalationsstufen"
```

(Korrektheit wird live in Task 2/3 über die Vorschau geprüft — reines Modul ohne Abhängigkeiten.)

---

## Task 2: Dunning-Engine + Timeline + Vorschau-Modal (Rechnungen-Tab)

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Import + State**

Import ergänzen (nach den bestehenden Imports):
```js
import { buildDunningEmail } from "@/lib/dunning";
```
Bei den `useState`-Zeilen ergänzen:
```js
  const [mahnModal, setMahnModal] = useState(null); // { inv, level, subject, body } | null
```

- [ ] **Step 2: Überfällig-/Stufen-Helfer + Mahn-Aktionen**

Bei den Helfern vor `return` (z.B. nach `beeRefIncludes`) ergänzen:
```js
  const STAGE_LABELS = { 1: "Erinnerung", 2: "Mahnung", 3: "Letzte Mahnung" };
  const isOverdue = (inv) => inv.status !== "paid" && !!inv.due_date && new Date(inv.due_date).getTime() < Date.now();
  const daysOverdue = (inv) => inv.due_date ? Math.max(0, Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000)) : 0;
  const nextStage = (inv) => { const n = (inv.reminder_level || 0) + 1; return n <= 3 ? n : null; };
  const stageDate = (invId, level) => {
    const e = emailLog.find(x => x.context && x.context.invoice_id === invId && x.context.level === level);
    return e && e.created_at ? fmtDate(e.created_at) : null;
  };
  const openMahn = (inv) => {
    const level = nextStage(inv);
    if (!level) return;
    const mail = buildDunningEmail({
      level, sellerName: inv.sellerName || "Verkäufer", ref: inv.invoice_ref,
      amount: fmtCHF(inv.total_fees), dueDate: inv.due_date ? fmtDate(inv.due_date) : "—", daysOverdue: daysOverdue(inv),
    });
    setMahnModal({ inv, level, subject: mail.subject, body: mail.body });
  };
  const confirmMahn = async () => {
    if (!mahnModal) return;
    await sendReminder(mahnModal.inv, mahnModal.level, mahnModal.subject, mahnModal.body);
    setMahnModal(null);
  };
```

- [ ] **Step 3: `sendReminder` refaktorieren (neue Signatur + lesbarer Text ins Log)**

Ersetze die komplette bestehende Funktion `const sendReminder = async (invId, sellerId, level) => { … }` (inkl. ihres `templates`-Objekts und des bisherigen `email_log`-Inserts) durch:
```js
  // Mahnung senden — speichert die gerenderte Mail (subject + body) lesbar im email_log.
  const sendReminder = async (inv, level, subject, body) => {
    await supabase.from("fee_invoices").update({
      reminder_level: level, reminder_sent_at: new Date().toISOString(), status: "overdue",
      ...(level >= 3 ? { listings_paused: true } : {}),
    }).eq("id", inv.id);

    if (level >= 3) {
      const { data: result } = await supabase.rpc("pause_seller_listings", { p_seller_id: inv.seller_id });
      const paused = result?.paused || 0, prot = result?.protected || 0;
      flash(prot > 0 ? `Stufe 3: ${paused} pausiert, ${prot} geschützt` : `Stufe 3: ${paused} Inserate pausiert`);
    } else {
      flash(`${STAGE_LABELS[level]} gesendet`);
    }

    const ctx = { invoice_id: inv.id, level, body, seller_name: inv.sellerName, invoice_ref: inv.invoice_ref, amount: inv.total_fees };
    const { data: logged } = await supabase.from("email_log")
      .insert({ recipient_id: inv.seller_id, recipient_email: "noreply@beedaro.ch", subject, template: `reminder_${level}`, status: "sent", context: ctx })
      .select().maybeSingle();

    const patch = { reminder_level: level, status: "overdue", listings_paused: level >= 3, reminder_sent_at: new Date().toISOString() };
    setFeeInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, ...patch } : i));
    setUserInvoices(prev => { const u = { ...prev }; Object.keys(u).forEach(k => { u[k] = (u[k] || []).map(i => i.id === inv.id ? { ...i, ...patch } : i); }); return u; });
    const row = logged || { id: `tmp-${inv.id}-${level}-${Date.now()}`, recipient_id: inv.seller_id, recipient_email: "noreply@beedaro.ch", subject, template: `reminder_${level}`, status: "sent", context: ctx, created_at: new Date().toISOString() };
    setEmailLog(prev => [row, ...prev]);
  };
```
Hinweis: `confirmAndReactivate` bleibt unverändert.

- [ ] **Step 4: Geteilte Render-Helfer (Timeline + Mahn-Button)**

Vor `return` ergänzen (nutzbar in Rechnungen-Tab UND Mahnungen-Cockpit):
```js
  const dunningTimeline = (inv) => {
    const rl = inv.reminder_level || 0;
    return (
      <div style={{ display: "flex", alignItems: "center", margin: "10px 0 2px" }}>
        {[1, 2, 3].map((s) => {
          const reached = rl >= s;
          const isNext = (rl + 1 === s) && inv.status !== "paid";
          const d = stageDate(inv.id, s);
          const ring = reached ? "#2E7D32" : isNext ? "#E65100" : "#ccc";
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: s === 1 ? "0 0 auto" : "1 1 auto" }}>
              {s > 1 && <div style={{ flex: 1, height: 2, background: rl >= s ? "#2E7D32" : "#E2E2E2", margin: "0 4px", marginBottom: 18 }} />}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: (!reached && !isNext) ? 0.5 : 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: reached ? "#2E7D32" : "#fff", border: reached ? "none" : `2px solid ${ring}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {reached ? <CheckCircle size={11} color="#fff" /> : isNext ? <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E65100" }} /> : null}
                </div>
                <span style={{ fontSize: 8.5, lineHeight: 1.2, textAlign: "center", color: isNext ? "#E65100" : "#757575", fontWeight: isNext ? 700 : 400 }}>
                  {STAGE_LABELS[s]}<br />{reached ? (d || "gesendet") : isNext ? "fällig" : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const mahnButton = (inv) => {
    if (inv.status === "paid") return null;
    const level = nextStage(inv);
    if (!level) return <span style={{ fontSize: 11, color: "#c62828", fontWeight: 600 }}>Inserate pausiert</span>;
    const bg = level === 1 ? colors.yellow : level === 2 ? "#E65100" : "#c62828";
    const fg = level === 1 ? "#191615" : "#fff";
    return <button onClick={() => openMahn(inv)} style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: fg, background: bg, border: "none", borderRadius: 999, padding: "7px 14px", cursor: "pointer", fontFamily: fonts.body }}>{STAGE_LABELS[level]} senden →</button>;
  };
```

- [ ] **Step 5: FEE-Detail im Rechnungen-Tab auf Timeline umstellen**

Im Rechnungen-Tab, FEE-Zweig, gibt es einen Block mit den drei bedingten Buttons (`rl < 1` … `rl === 1` … `rl === 2` „Inserate pausieren") und dem „Bezahlt"-Button. Ersetze den GESAMTEN Aktions-Block
```jsx
                            {inv.status !== "paid" ? (
                              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                {rl < 1 && <button onClick={() => sendReminder(inv.id, inv.seller_id, 1)} ...>Erinnerung</button>}
                                {rl === 1 && <button onClick={() => sendReminder(inv.id, inv.seller_id, 2)} ...>Mahnung</button>}
                                {rl === 2 && <button onClick={() => sendReminder(inv.id, inv.seller_id, 3)} ...>Inserate pausieren</button>}
                                <button onClick={() => confirmAndReactivate(inv.id, inv.seller_id)} ...>Bezahlt</button>
                              </div>
                            ) : <p ...>Bezahlt am {fmtDate(inv.paid_at)}</p>}
```
durch:
```jsx
                            {dunningTimeline(inv)}
                            {inv.status !== "paid" ? (
                              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                                {mahnButton(inv)}
                                <button onClick={() => confirmAndReactivate(inv.id, inv.seller_id)} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Bezahlt</button>
                              </div>
                            ) : <p style={{ margin: "8px 0 0", fontSize: 11, color: "#2E7D32" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
```
(`rl` wird in diesem Block nicht mehr gebraucht; die `const rl = inv.reminder_level || 0;`-Zeile im FEE-Zweig kann bleiben — `dunningTimeline` berechnet es selbst — oder entfernt werden, falls Lint meckert.)

- [ ] **Step 6: Per-User-Invoice-Detail (Benutzer-Tab) genauso umstellen**

Im Benutzer-Tab, im aufgeklappten Rechnungen-Sub-Bereich, gibt es denselben Button-Block mit `sendReminder(inv.id, u.id, …)`. Ersetze den dortigen Aktions-Block analog:
```jsx
                                        {dunningTimeline(inv)}
                                        {inv.status !== "paid" ? (
                                          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                                            {mahnButton(inv)}
                                            <button onClick={() => confirmAndReactivate(inv.id, u.id)} style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Bezahlt</button>
                                          </div>
                                        ) : <p style={{ margin: "8px 0 0", fontSize: 11, color: "#2E7D32" }}>Bezahlt am {fmtDate(inv.paid_at)}</p>}
```
Wichtig: `mahnButton`/`openMahn` nutzen `inv.sellerName`. Im per-User-Kontext kann `inv` (aus `userInvoices`) kein `sellerName` haben — `openMahn` fällt dann auf „Verkäufer" zurück. Das ist ok; alternativ kann hier `{...inv, sellerName: u.display_name}` übergeben werden: ersetze in diesem Block `mahnButton(inv)` durch `mahnButton({ ...inv, sellerName: u.display_name })` und `dunningTimeline(inv)` bleibt.

- [ ] **Step 7: Vorschau-Modal rendern**

Direkt vor dem Toast (`{toast && …}`) am Ende der Komponente einfügen:
```jsx
      {mahnModal && (
        <div onClick={() => setMahnModal(null)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#F3FAFA", padding: "13px 18px", borderBottom: "1px solid #E6F0F0", display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={16} color="#0A7170" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A7170" }}>Vorschau · wird gesendet an {mahnModal.inv.sellerName || "Verkäufer"}</span>
            </div>
            <div style={{ padding: "16px 18px", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Betreff</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, margin: "3px 0 12px" }}>{mahnModal.subject}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Text</div>
              <div style={{ fontSize: 13, color: "#3a3a3a", whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 4 }}>{mahnModal.body}</div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderTop: "1px solid #EEEEEE" }}>
              <button onClick={() => setMahnModal(null)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
              <button onClick={confirmMahn} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Senden</button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 8: Verify (Controller, live)**

Admin → Rechnungen → FEE-Filter → `FEE-2026-06-149B91` (Radio Active, status open) aufklappen. `preview_eval`:
```js
(()=>{const sp=[...document.querySelectorAll('.admin-main [style*="monospace"]')].find(x=>x.textContent.includes('149B91')); sp.parentElement.click(); return new Promise(r=>setTimeout(()=>{ const btn=[...document.querySelectorAll('.admin-main button')].find(b=>/senden/.test(b.textContent)); r(JSON.stringify({err:document.body.innerText.includes('Cannot find module'), hasTimeline: document.body.innerText.includes('Erinnerung')&&document.body.innerText.includes('Letzte Mahnung'), sendBtn: btn?btn.textContent.trim():null})); },1200));})()
```
Erwartet: `hasTimeline:true`, `sendBtn` enthält „Erinnerung senden". Dann Button klicken und prüfen, dass das Modal mit Vorschau erscheint:
```js
(()=>{const btn=[...document.querySelectorAll('.admin-main button')].find(b=>/senden →/.test(b.textContent)); btn.click(); return new Promise(r=>setTimeout(()=>r(JSON.stringify({modal: document.body.innerText.includes('Vorschau'), hasBetreff: document.body.innerText.includes('Betreff'), hasGruss: document.body.innerText.includes('Dein BEEDARO-Team')})),400));})()
```
Erwartet: `modal:true, hasBetreff:true, hasGruss:true`. Danach „Abbrechen" klicken (nicht senden), damit keine echte Mahnung rausgeht:
```js
[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Abbrechen')?.click(); 'closed'
```

- [ ] **Step 9: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): Mahn-Timeline + E-Mail-Vorschau-Modal; sendReminder rendert lesbaren Text"
```

---

## Task 3: Mahnungen-Cockpit (neuer Nav-Tab)

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Icon-Import + abgeleitete Liste**

Lucide-Import um `BellRing` ergänzen. Bei den abgeleiteten Mengen (nahe `openFeeInvoices`) ergänzen:
```js
  const overdueInvoices = feeInvoices.filter(isOverdue).sort((a, b) => ((b.reminder_level || 0) - (a.reminder_level || 0)) || (daysOverdue(b) - daysOverdue(a)));
  const overdueSum = overdueInvoices.reduce((s, i) => s + parseFloat(i.total_fees || 0), 0);
```

- [ ] **Step 2: NAV-Eintrag**

Im `NAV`-Array VOR dem `reports`-Eintrag (oder nach `invoices`) ergänzen:
```js
    { key: "dunning", label: "Mahnungen", Icon: BellRing, badge: overdueInvoices.length },
```

- [ ] **Step 3: Cockpit-Render**

Einen neuen Block einfügen (z.B. nach dem Rechnungen-Block, vor INSERATE):
```jsx
          {/* ═══ MAHNUNGEN ═══ */}
          {tab === "dunning" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: overdueInvoices.length ? "#c0392b" : colors.muted, background: overdueInvoices.length ? "#FFEBEB" : colors.cream, padding: "5px 12px", borderRadius: 999 }}>
                  {overdueInvoices.length} überfällig · CHF {fmtCHF(overdueSum)} offen
                </span>
              </div>
              {overdueInvoices.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "20px 22px" }}>
                  <CheckCircle size={22} color={colors.green} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Keine überfälligen Rechnungen</div>
                    <div style={{ fontSize: 12, color: colors.muted }}>Alles bezahlt oder noch nicht fällig.</div>
                  </div>
                </div>
              ) : overdueInvoices.map(inv => (
                <div key={inv.id} style={{ marginBottom: 10, background: colors.surface, borderRadius: radius.lg, border: "1px solid #f0c9c9", overflow: "hidden", padding: "14px 16px", background: "#FFF8F8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.dark }}>{(inv.sellerName || "?")[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}>{inv.sellerName} <span style={{ fontFamily: "monospace", fontSize: 11, color: colors.muted, fontWeight: 400 }}>· {inv.invoice_ref}</span></div>
                      <div style={{ fontSize: 11, color: "#c0392b", fontWeight: 600 }}>CHF {fmtCHF(inv.total_fees)} · fällig seit {daysOverdue(inv)} Tagen</div>
                    </div>
                    {mahnButton(inv)}
                  </div>
                  {dunningTimeline(inv)}
                </div>
              ))}
            </div>
          )}
```

- [ ] **Step 4: Verify (Controller, live)**

Da real evtl. nichts überfällig ist, backdated der Controller per Supabase-MCP eine Rechnung temporär:
```sql
update fee_invoices set due_date = current_date - 12 where invoice_ref = 'FEE-2026-06-149B91';
```
Dann Admin neu laden, „Mahnungen"-Tab: `preview_eval` prüft Nav-Badge + eine Zeile mit „fällig seit" + Timeline + „Erinnerung senden". Anschliessend `due_date` zurücksetzen:
```sql
update fee_invoices set due_date = date '2026-07-30' where invoice_ref = 'FEE-2026-06-149B91';
```
Erwartet: Tab zeigt die überfällige Rechnung; nach Reset ist der Tab wieder leer (Empty-State).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): Mahnungen-Cockpit (Tab) mit ueberfaelligen Rechnungen + Timeline"
```

---

## Task 4: Lesbare, nutzerbezogene E-Mails

**Files:**
- Modify: `src/app/(public)/admin/page.jsx`

- [ ] **Step 1: Geteilte E-Mail-Karte**

Vor `return` ergänzen:
```js
  const emailCard = (e) => {
    const isOpen = openEmail === e.id;
    const recName = users.find(x => x.id === e.recipient_id)?.display_name || (e.recipient_email && e.recipient_email !== "noreply@beedaro.ch" ? e.recipient_email : "—");
    const statusColor = e.status === "sent" ? ["#E8F5E9", "#2E7D32"] : e.status === "failed" ? ["#FFEBEE", "#c62828"] : ["#FFF3E0", "#E65100"];
    const body = e.context && e.context.body;
    return (
      <div key={e.id} style={{ marginBottom: 8, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${isOpen ? colors.teal : colors.border}`, overflow: "hidden" }}>
        <div onClick={() => setOpenEmail(isOpen ? null : e.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: isOpen ? "#F3FAFA" : "transparent" }}>
          <Mail size={15} color={colors.muted} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.subject || "(kein Betreff)"}</div>
            <div style={{ fontSize: 11, color: colors.muted }}>An: {recName}</div>
          </div>
          {e.template && pill(colors.cream, colors.muted, e.template)}
          {e.status && pill(statusColor[0], statusColor[1], e.status)}
          <span style={{ fontSize: 11, color: colors.muted, minWidth: 80, textAlign: "right" }}>{e.created_at ? fmtDate(e.created_at) : ""}</span>
          {isOpen ? <ChevronUp size={15} color={colors.muted} /> : <ChevronDown size={15} color={colors.muted} />}
        </div>
        {isOpen && (
          <div style={{ borderTop: `1px solid ${colors.borderLt}`, padding: 16, background: "#FAFAF8" }}>
            <div style={{ fontSize: 11, color: colors.muted, marginBottom: 8 }}>An: <strong style={{ color: colors.dark }}>{recName}</strong> · Betreff: <strong style={{ color: colors.dark }}>{e.subject || "—"}</strong></div>
            {body
              ? <div style={{ fontSize: 13, color: "#3a3a3a", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{body}</div>
              : <div style={{ fontSize: 12, color: colors.muted, fontStyle: "italic" }}>(kein Text gespeichert)</div>}
          </div>
        )}
      </div>
    );
  };
```

- [ ] **Step 2: E-Mails-Tab auf lesbare Karte umstellen**

Im `{tab === "emails" && ( … )}`-Block die `filteredEmails.map(e => { … <pre>…</pre> … })`-Schleife ersetzen durch:
```jsx
              {filteredEmails.map(e => emailCard(e))}
```
(Die alte Inline-Render-Funktion samt `<pre>{JSON.stringify(e.context …)}</pre>` entfällt komplett. Der `filteredEmails.length === 0`-Leerzustand davor bleibt.)

- [ ] **Step 3: „E-Mails"-Sub-Tab im Benutzer-Detail**

Im Benutzer-Detail das Sub-Tab-Array
```jsx
{[{ key: "inserate", label: `Inserate (${uLst.length})` }, { key: "bestellungen", label: "Bestellungen" }, { key: "rechnungen", label: `Rechnungen (${(userInvoices[u.id] || []).length})` }, { key: "bewertungen", label: "Bewertungen" }].map(t => (
```
erweitern um einen Eintrag (vor `]`):
```jsx
, { key: "emails", label: "E-Mails" }
```
Und einen Render-Zweig für den Sub-Tab ergänzen — direkt nach dem `bewertungen`-Sub-Tab-Block:
```jsx
                      {(userTab[u.id] || "inserate") === "emails" && (
                        <div style={{ padding: "10px 16px" }}>
                          {emailLog.filter(e => e.recipient_id === u.id).length > 0
                            ? emailLog.filter(e => e.recipient_id === u.id).map(e => emailCard(e))
                            : <p style={{ margin: 0, padding: "12px 0", fontSize: 11, color: colors.muted, textAlign: "center" }}>Keine E-Mails an diesen Nutzer</p>}
                        </div>
                      )}
```

- [ ] **Step 4: Verify (Controller, live)**

E-Mails-Tab: `preview_eval` prüft, dass KEIN rohes JSON mehr da ist und Karten lesbar sind:
```js
(()=>{const b=[...document.querySelectorAll('.admin-nav button')].find(x=>x.textContent.trim().startsWith('E-Mails')); b.click(); return new Promise(r=>setTimeout(()=>{ const row=[...document.querySelectorAll('.admin-main [style*="cursor: pointer"]')][0]; if(row) row.click(); setTimeout(()=>r(JSON.stringify({noBraces: !document.body.innerText.includes('"level":'), hasAn: document.body.innerText.includes('An:'), err:document.body.innerText.includes('Cannot find module')})),400); },700));})()
```
Erwartet: `noBraces:true` (kein JSON mit `"level":`), `hasAn:true`, `err:false`. Dann Benutzer-Tab → einen Nutzer (z.B. Radio Active) aufklappen → Sub-Tab „E-Mails" → zeigt dessen Mahn-Mails (falls in Task 2/3 eine gesendet wurde) oder den Leertext.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/admin/page.jsx"
git commit -m "feat(admin): E-Mails lesbar (An/Betreff/Text) + E-Mails-Historie pro Nutzer"
```

---

## Task 5: Beta-Checkliste

**Files:**
- Modify: `src/app/(public)/beta/page.jsx`

- [ ] **Step 1: Items ergänzen**

In der Sektion `id: "admin"` nach dem letzten Eintrag (`adm_mini_analytics`) ergänzen:
```js
      { id: "adm_dunning_tab", label: "Mahnungen-Tab listet überfällige FEE-Rechnungen mit Eskalations-Timeline + Fälligkeit; Nav-Badge stimmt" },
      { id: "adm_dunning_preview", label: "Stufen-Button öffnet E-Mail-Vorschau; 'Senden' erhöht Stufe + protokolliert lesbaren Text" },
      { id: "adm_dunning_escalation", label: "Stufe 3 pausiert Inserate; 'Bezahlt' reaktiviert" },
      { id: "adm_email_readable", label: "E-Mails-Tab zeigt An/Betreff/Text lesbar (kein JSON)" },
      { id: "adm_user_emails", label: "Benutzer-Detail 'E-Mails'-Sub-Tab zeigt die Mails dieses Nutzers" },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Mahnwesen-Cockpit + lesbare E-Mails erweitert"
```

---

## Task 6: Abschluss-Verifizierung (Controller)

**Files:** keine

- [ ] **Step 1:** Voller Live-Durchlauf: Mahnungen-Tab (Empty-State bei keinen Überfälligen), Rechnungen-FEE-Detail (Timeline + Vorschau), E-Mails-Tab lesbar, Benutzer-„E-Mails"-Sub-Tab. Konsole ohne Fehler (`nextjs-portal` weg).
- [ ] **Step 2:** Sicherstellen, dass die in Task 3 temporär backdatete `due_date` zurückgesetzt ist (`FEE-2026-06-149B91` wieder `2026-07-30`); keine ungewollten echten Mahnungen verschickt (falls beim Test gesendet: `reminder_level` der Test-Rechnung ggf. via SQL zurücksetzen).
- [ ] **Step 3:** Testkonto Zeggy unverändert.
- [ ] **Step 4:** Finaler Code-Review-Subagent über `git diff <letzter-Welle-1-Commit>..HEAD` (Spec-Konformität, tote Symbole, Em-Dash/Emoji-Regel in neuem UI-Text, Signatur-Konsistenz `sendReminder(inv, level, subject, body)`).

---

## Self-Review (Autor)

- **Spec-Abdeckung:** dunning.js → T1. Überfällig-Logik + Engine + Timeline + Vorschau→Senden + sendReminder-Refactor → T2. Mahnungen-Cockpit (Tab/Badge) → T3. Lesbare E-Mails (global + pro Nutzer) → T4. FEE-Detail-Timeline → T2 Step 5. Beta → T5. Verifizierung/Zeggy/Review → T6. Alle Spec-Punkte abgedeckt.
- **Platzhalter:** keine — vollständiger Code je Schritt; Verify-Schritte mit konkreten Assertions.
- **Typ-/Namens-Konsistenz:** `sendReminder(inv, level, subject, body)` in T2 definiert; aufgerufen NUR über `confirmMahn` (T2). Die alten Aufrufer (`sendReminder(inv.id, …, level)`) werden in T2 Step 5/6 durch `mahnButton`/`openMahn` ersetzt — keine Altaufrufe bleiben übrig. `buildDunningEmail` (T1) genutzt in `openMahn` (T2). `dunningTimeline`/`mahnButton`/`emailCard` in T2/T4 definiert, in T2/T3/T4 genutzt. `isOverdue`/`daysOverdue`/`nextStage`/`stageDate`/`STAGE_LABELS` in T2 definiert, in T2/T3 genutzt. `overdueInvoices` in T3 definiert, in NAV-Badge + Cockpit genutzt. `BellRing`/`buildDunningEmail`-Imports ergänzt. `confirmAndReactivate` unverändert weiterverwendet.
