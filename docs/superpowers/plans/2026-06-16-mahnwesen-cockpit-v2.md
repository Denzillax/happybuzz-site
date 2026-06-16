# Mahnwesen-Cockpit v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Admin-Mahnungen-Cockpit aufbohren: klickbarer Eskalations-Stepper (erledigt→gesendete Mail ansehen, fällig→senden), nach Fälligkeit gruppierte Liste, und „Alle fälligen senden".

**Architecture:** Reine Frontend-Änderungen an der modularen Admin-Struktur (`useAdminData.jsx` = Logik/State/Render-Helfer, `AdminShell.jsx` = JSX) + eine Konstante in `dunning.js`. Keine DB-Migration; alle Daten vorhanden (`fee_invoices.reminder_level/reminder_sent_at/due_date`, `email_log.context`).

**Tech Stack:** Next.js 14 (Client Components), Supabase JS, Lucide Icons.

**Verifizierung:** Kein Unit-Test-Runner — Gate ist die Live-Preview als Admin + `git`. **NIE `npm run build`/`npm run dev`** neben dem laufenden Dev-Server.

**Farben (bestehende Admin-Palette):** Grün `#2E7D32` = erledigt, Orange `#E65100` = fällig, Rot `#c0392b` = überfällig/pausiert, Grau = offen, Teal (`colors.teal`) = Aktions-Button.

---

## Task 1: Dunning-Logik + interaktiver Stepper (Hook)

**Files:**
- Modify: `src/lib/dunning.js`
- Modify: `src/components/admin/useAdminData.jsx` (Helfer ~Z.297-318, `dunningTimeline` ~Z.514-538, `openMahn` ~Z.305-313, abgeleitete Listen ~Z.499, return-Objekt ~Z.609)

- [ ] **Step 1: Intervall-Konstante in dunning.js**

Am Ende von `src/lib/dunning.js` (nach `buildDunningEmail`) ergänzen:

```js
export const DUNNING_GAP_DAYS = 7; // Tage zwischen den Mahnstufen
```

- [ ] **Step 2: DUNNING_GAP_DAYS importieren**

In `useAdminData.jsx` den bestehenden dunning-Import erweitern:

```js
import { buildDunningEmail, DUNNING_GAP_DAYS } from "@/lib/dunning";
```

- [ ] **Step 3: stageSentAt + nextStageInfo + openSentMail einfügen**

Direkt nach `stageDate` (Z.301-304) einfügen:

```js
  const stageSentAt = (invId, level) => {
    const e = emailLog.find(x => x.context && x.context.invoice_id === invId && x.context.level === level);
    return e?.created_at ? new Date(e.created_at) : null;
  };
  const nextStageInfo = (inv) => {
    if (inv.status === "paid") return null;
    const level = nextStage(inv);
    if (!level) return null;
    let dueDate;
    if (level === 1) {
      dueDate = inv.due_date ? new Date(inv.due_date) : null;
    } else {
      const prevAt = stageSentAt(inv.id, level - 1) || (inv.reminder_sent_at ? new Date(inv.reminder_sent_at) : null);
      dueDate = prevAt ? new Date(prevAt.getTime() + DUNNING_GAP_DAYS * 86400000) : null;
    }
    const isDue = !!dueDate && dueDate.getTime() <= Date.now();
    const daysUntil = dueDate ? Math.max(0, Math.ceil((dueDate.getTime() - Date.now()) / 86400000)) : 0;
    return { level, dueDate, isDue, daysUntil };
  };
  const openSentMail = (inv, level) => {
    const e = emailLog.find(x => x.context && x.context.invoice_id === inv.id && x.context.level === level);
    if (!e) { flash("Keine gesendete Mail gefunden"); return; }
    setMahnModal({ inv, level, subject: e.subject, body: e.context?.body || "", mode: "view", sentAt: e.created_at });
  };
```

- [ ] **Step 4: openMahn um `mode: "send"` ergänzen**

In `openMahn` (Z.312) das `setMahnModal(...)` ersetzen durch:

```js
    setMahnModal({ inv, level, subject: mail.subject, body: mail.body, mode: "send" });
```

- [ ] **Step 5: bulkSendDue einfügen**

Direkt nach `confirmMahn` (Z.318) einfügen:

```js
  const bulkSendDue = async () => {
    if (dunningDue.length === 0) return;
    if (!confirm(`${dunningDue.length} fällige Mahnung(en) senden?`)) return;
    let n = 0;
    for (const inv of dunningDue) {
      const info = nextStageInfo(inv);
      if (!info) continue;
      const mail = buildDunningEmail({
        level: info.level, sellerName: inv.sellerName || "Verkäufer", ref: inv.invoice_ref,
        amount: fmtCHF(inv.total_fees), dueDate: inv.due_date ? fmtDate(inv.due_date) : "—", daysOverdue: daysOverdue(inv),
      });
      await sendReminder(inv, info.level, mail.subject, mail.body);
      n++;
    }
    flash(`${n} Mahnung(en) gesendet`);
  };
```

(Funktioniert, weil `dunningDue`, `nextStageInfo`, `daysOverdue`, `sendReminder` im selben Hook-Scope liegen; JS-Closures sehen die später deklarierten `const` zur Aufrufzeit.)

- [ ] **Step 6: Abgeleitete Gruppen-Listen**

Direkt nach `overdueSum` (Z.500) einfügen:

```js
  const dunningDue    = overdueInvoices.filter(i => nextStageInfo(i)?.isDue).sort((a, b) => daysOverdue(b) - daysOverdue(a));
  const dunningSoon   = overdueInvoices.filter(i => { const n = nextStageInfo(i); return n && !n.isDue; }).sort((a, b) => nextStageInfo(a).daysUntil - nextStageInfo(b).daysUntil);
  const dunningPaused = overdueInvoices.filter(i => !nextStageInfo(i)).sort((a, b) => daysOverdue(b) - daysOverdue(a));
```

- [ ] **Step 7: dunningTimeline neu (größer + klickbar)**

`dunningTimeline` (Z.514-539) komplett ersetzen durch:

```js
  const dunningTimeline = (inv) => {
    const rl = inv.reminder_level || 0;
    return (
      <div style={{ display: "flex", alignItems: "flex-start", margin: "12px 0 2px" }}>
        {[1, 2, 3].map((s) => {
          const reached = rl >= s;
          const isNext = (rl + 1 === s) && inv.status !== "paid";
          const d = stageDate(inv.id, s);
          const clickable = reached || isNext;
          const onClick = reached ? () => openSentMail(inv, s) : isNext ? () => openMahn(inv) : undefined;
          return (
            <div key={s} style={{ display: "flex", alignItems: "flex-start", flex: s === 1 ? "0 0 auto" : "1 1 auto" }}>
              {s > 1 && <div style={{ flex: 1, height: 2, background: rl >= s ? "#2E7D32" : "#E2E2E2", margin: "0 6px", marginTop: 12 }} />}
              <div onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 96, cursor: clickable ? "pointer" : "default", opacity: (!reached && !isNext) ? 0.5 : 1 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: reached ? "#2E7D32" : "#fff", border: reached ? "none" : `2px solid ${isNext ? "#E65100" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {reached ? <CheckCircle size={15} color="#fff" /> : isNext ? <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#E65100" }} /> : null}
                </div>
                <span style={{ fontSize: 11, lineHeight: 1.25, textAlign: "center", color: isNext ? "#E65100" : reached ? colors.dark : "#9e9e9e", fontWeight: isNext ? 700 : 500 }}>{STAGE_LABELS[s]}</span>
                {reached ? (
                  <span style={{ fontSize: 10.5, color: colors.muted, display: "inline-flex", alignItems: "center", gap: 3 }}><Eye size={12} /> Mail{d ? ` · ${d}` : ""}</span>
                ) : isNext ? (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#E65100", background: "#FFF3E0", padding: "1px 8px", borderRadius: 999 }}>senden</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
```

(`Eye` und `CheckCircle` sind in `useAdminData.jsx` bereits aus lucide-react importiert.)

- [ ] **Step 8: Neue Bezeichner ins return-Objekt**

Im return-Objekt die Mahn-Zeile (Z.609, beginnt mit `mahnModal, setMahnModal, openMahn, confirmMahn, sendReminder, ...`) um die neuen Bezeichner erweitern:

```js
    mahnModal, setMahnModal, openMahn, confirmMahn, sendReminder, confirmAndReactivate, isOverdue, daysOverdue, nextStage, stageDate, STAGE_LABELS, dunningTimeline, mahnButton,
    nextStageInfo, dunningDue, dunningSoon, dunningPaused, openSentMail, bulkSendDue,
```

- [ ] **Step 9: Live verifizieren (Hook)**

Als Admin → Mahnungen-Tab: lädt ohne Fehler; der Stepper ist jetzt größer und die erledigten/fälligen Stufen reagieren auf Klick (erledigt → Mail-Modal, fällig → Senden-Vorschau). (Liste ist noch flach — Gruppen kommen in Task 2.) preview_eval: kein `nextjs-portal`.

- [ ] **Step 10: Commit**

```bash
git add src/lib/dunning.js src/components/admin/useAdminData.jsx
git commit -m "feat(admin): Dunning-Faelligkeitslogik + klickbarer Stepper + Buendelung (Hook)"
```

---

## Task 2: Cockpit-Render (Gruppen + Bündelung + Modal-Modi)

**Files:**
- Modify: `src/components/admin/AdminShell.jsx` (Destrukturierung ~Z.51; Dunning-Tab ~Z.589-618; `mahnModal` ~Z.783-802)

- [ ] **Step 1: Neue Bezeichner destrukturieren**

In der `const { … } = admin;`-Destrukturierung die Mahn-Zeile (die `mahnModal, setMahnModal, openMahn, confirmMahn, …` enthält) um die neuen Felder ergänzen:

```js
    mahnModal, setMahnModal, openMahn, confirmMahn, sendReminder, confirmAndReactivate, isOverdue, daysOverdue, nextStage, stageDate, STAGE_LABELS, dunningTimeline, mahnButton,
    nextStageInfo, dunningDue, dunningSoon, dunningPaused, bulkSendDue,
```

- [ ] **Step 2: Dunning-Tab-Block ersetzen**

Den gesamten Block `{tab === "dunning" && ( … )}` (Z.589-618) ersetzen durch:

```jsx
          {tab === "dunning" && (() => {
            const card = (inv, opts = {}) => (
              <div key={inv.id} style={{ marginBottom: 10, borderRadius: radius.lg, border: `1px solid ${opts.paused ? colors.border : "#f0c9c9"}`, overflow: "hidden", padding: "14px 16px", background: opts.paused ? "#fff" : "#FFF8F8" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors.yellowSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.dark }}>{(inv.sellerName || "?")[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark }}><span onClick={() => { setTab("users"); setSearch(inv.sellerName || ""); }} style={{ cursor: "pointer", textDecoration: "underline", textDecorationColor: "#d8b8b8" }}>{inv.sellerName}</span> <span style={{ fontFamily: "monospace", fontSize: 11, color: colors.muted, fontWeight: 400 }}>· {inv.invoice_ref}</span></div>
                    <div style={{ fontSize: 11, color: "#c0392b", fontWeight: 600 }}>CHF {fmtCHF(inv.total_fees)} · {opts.paused ? "alle Stufen gesendet · Inserate pausiert" : `fällig seit ${daysOverdue(inv)} Tagen`}</div>
                  </div>
                  {opts.info && <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: opts.info.isDue ? "#E65100" : colors.muted, background: opts.info.isDue ? "#FFF3E0" : colors.cream, padding: "4px 10px", borderRadius: 999 }}>Nächste: {STAGE_LABELS[opts.info.level]} · {opts.info.isDue ? "heute fällig" : `in ${opts.info.daysUntil} Tagen`}</span>}
                  <button onClick={() => confirmAndReactivate(inv.id, inv.seller_id)} style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#2E7D32", background: "#E8F5E9", border: "none", borderRadius: 999, padding: "7px 12px", cursor: "pointer", fontFamily: fonts.body }}>{opts.paused ? "Bezahlt + reaktivieren" : "Bezahlt"}</button>
                </div>
                {dunningTimeline(inv)}
              </div>
            );
            const groupHeader = (label, color) => <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color, margin: "16px 0 8px" }}>{label}</div>;
            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: overdueInvoices.length ? "#c0392b" : colors.muted, background: overdueInvoices.length ? "#FFEBEB" : colors.cream, padding: "5px 12px", borderRadius: 999 }}>{overdueInvoices.length} überfällig · CHF {fmtCHF(overdueSum)} offen</span>
                  {dunningDue.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#E65100", background: "#FFF3E0", padding: "5px 12px", borderRadius: 999 }}>{dunningDue.length} fällig</span>}
                  {dunningDue.length > 0 && <button onClick={bulkSendDue} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer", fontFamily: fonts.body }}>Alle fälligen senden ({dunningDue.length})</button>}
                </div>
                {overdueInvoices.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: "20px 22px" }}>
                    <CheckCircle size={22} color={colors.green} />
                    <div><div style={{ fontSize: 14, fontWeight: 700 }}>Keine überfälligen Rechnungen</div><div style={{ fontSize: 12, color: colors.muted }}>Alles bezahlt oder noch nicht fällig.</div></div>
                  </div>
                ) : (
                  <>
                    {dunningDue.length > 0 && groupHeader("Jetzt fällig", "#c0392b")}
                    {dunningDue.map(inv => card(inv, { info: nextStageInfo(inv) }))}
                    {dunningSoon.length > 0 && groupHeader("Bald fällig", colors.muted)}
                    {dunningSoon.map(inv => card(inv, { info: nextStageInfo(inv) }))}
                    {dunningPaused.length > 0 && groupHeader("Pausiert", colors.muted)}
                    {dunningPaused.map(inv => card(inv, { paused: true }))}
                  </>
                )}
              </div>
            );
          })()}
```

- [ ] **Step 3: mahnModal — zwei Modi (Header + Footer)**

Den `{mahnModal && ( … )}`-Block (Z.783-802) ersetzen durch:

```jsx
      {mahnModal && (
        <div onClick={() => setMahnModal(null)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(25,22,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#F3FAFA", padding: "13px 18px", borderBottom: "1px solid #E6F0F0", display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={16} color="#0A7170" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A7170" }}>{mahnModal.mode === "view" ? `Gesendet${mahnModal.sentAt ? ` am ${fmtDate(mahnModal.sentAt)}` : ""} an ${mahnModal.inv.sellerName || "Verkäufer"}` : `Vorschau · wird gesendet an ${mahnModal.inv.sellerName || "Verkäufer"}`}</span>
            </div>
            <div style={{ padding: "16px 18px", maxHeight: "60vh", overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Betreff</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.dark, margin: "3px 0 12px" }}>{mahnModal.subject}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: ".05em" }}>Text</div>
              <div style={{ fontSize: 13, color: "#3a3a3a", whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 4 }}>{mahnModal.body}</div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderTop: "1px solid #EEEEEE" }}>
              {mahnModal.mode === "view" ? (
                <button onClick={() => setMahnModal(null)} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Schliessen</button>
              ) : (
                <>
                  <button onClick={() => setMahnModal(null)} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.muted, background: colors.cream, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Abbrechen</button>
                  <button onClick={confirmMahn} style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: colors.teal, border: "none", borderRadius: 999, padding: "10px 0", cursor: "pointer", fontFamily: fonts.body }}>Senden</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 4: Live verifizieren (Cockpit)**

Als Admin → Mahnungen-Tab: Gruppen „Jetzt fällig / Bald fällig / Pausiert" mit „Nächste: …"-Pill; Header zeigt „N fällig" + „Alle fälligen senden (N)". Stepper-Klick: erledigte Stufe → Modal „Gesendet am … " (read-only, „Schliessen"); fällige Stufe → „Vorschau …" (Abbrechen/Senden). preview_eval: kein `nextjs-portal`.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminShell.jsx
git commit -m "feat(admin): Mahn-Cockpit gruppiert + Buendelung + Mail-Ansicht-Modal"
```

---

## Task 3: Beta-Checkliste

**Files:**
- Modify: `src/app/(public)/beta/page.jsx` (Sektion „Admin-Bereich")

- [ ] **Step 1: Items ergänzen**

Nach dem letzten `art_ref_search_public`-Item einfügen:

```jsx
      { id: "adm_mahn_groups", label: "Mahnungen-Cockpit gruppiert nach Jetzt fällig / Bald fällig / Pausiert; je Fall 'nächste Stufe heute/in N Tagen'" },
      { id: "adm_mahn_stepper_click", label: "Mahn-Stepper klickbar: erledigte Stufe öffnet die gesendete Mail (Text), fällige Stufe öffnet die Senden-Vorschau" },
      { id: "adm_mahn_bulk", label: "'Alle fälligen senden (N)' verschickt die fälligen Mahnungen gebündelt" },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Mahn-Cockpit v2 erweitert"
```

---

## Task 4: Abschluss-Verifizierung + Review

- [ ] **Step 1: Flow mit Test-Rechnung prüfen**

Per SQL eine FEE-Rechnung temporär auf einen mahnbaren Stand setzen (z.B. `reminder_level=0`, `status='overdue'`, `due_date` in der Vergangenheit), im Cockpit: erscheint in „Jetzt fällig", Stepper-Klick auf Stufe 1 → Senden → Mahnung geht raus, danach Stufe 1 erledigt (klickbar → zeigt gesendeten Text), nächste Stufe „in 7 Tagen" (Soon). „Alle fälligen senden" testen. **Danach Baseline wiederherstellen** (die Test-FEE `FEE-2026-06-149B91` zuletzt: `reminder_level=3, status='overdue', reminder_level/due_date` wie zuvor; keine echten Test-Mails/Pausierungen zurücklassen — ggf. `email_log`-Testzeilen + `reminder_level` zurücksetzen).

- [ ] **Step 2: Code-Review-Subagent**

Read-only Review von `dunning.js` + `useAdminData.jsx` + `AdminShell.jsx` gegen die Spec: `nextStageInfo`-Logik (Level/Fälligkeit korrekt, null bei paid/Stufe-3), Gruppen-Filter disjunkt + decken alle `overdueInvoices` ab, `dunningTimeline` Klick-Routing (erledigt→openSentMail, fällig→openMahn, künftig inaktiv), Modal-Modi, `bulkSendDue` (confirm, Schleife, kein Handler-Bruch), keine veränderte Semantik von `sendReminder`/`confirmAndReactivate`.

- [ ] **Step 3: Baseline prüfen**

`git status` sauber bis auf erwartete Commits; keine Test-Daten in `fee_invoices`/`email_log` zurückgelassen; Zeggy/yam unverändert.

---

## Self-Review (Plan gegen Spec)

- **F1 Fälligkeits-Logik:** Task 1 Step 1-3 (`DUNNING_GAP_DAYS`, `stageSentAt`, `nextStageInfo`). ✓
- **F2 Gruppen + Header-Button + Pill:** Task 1 Step 6 (Listen) + Task 2 Step 2 (Render). ✓
- **F3 Interaktiver Stepper:** Task 1 Step 7. ✓
- **F4 Mail-Ansicht + Modal-Modi:** Task 1 Step 3 (`openSentMail`) + Step 4 (`openMahn` mode) + Task 2 Step 3 (Modal). ✓
- **F5 Bündelung:** Task 1 Step 5 (`bulkSendDue`) + Task 2 Step 2 (Button). ✓
- **Beta-Checkliste:** Task 3. ✓
- **Keine Migration:** eingehalten. ✓
- **Typkonsistenz:** `nextStageInfo` liefert `{level,dueDate,isDue,daysUntil}` — genau so in dunningDue/Soon/Paused, Pill und bulkSendDue genutzt; `mahnModal.mode` ("send"/"view") konsistent in openMahn/openSentMail/Modal; neue Bezeichner sowohl im Hook-return (Task 1 Step 8) als auch in der AdminShell-Destrukturierung (Task 2 Step 1). ✓
```

