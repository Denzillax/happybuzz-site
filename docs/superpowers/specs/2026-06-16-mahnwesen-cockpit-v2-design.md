# Mahnwesen-Cockpit v2 — interaktiver Stepper, Fälligkeit, Bündelung

**Datum:** 2026-06-16
**Status:** Design freigegeben, Spec zur Umsetzung

## Ziel

Das Admin-Mahnungen-Cockpit „ausgeklügelter" machen: der Eskalations-Stepper wird die **interaktive Steuerung** (erledigte Stufe anklicken → gesendete Mail ansehen; fällige Stufe anklicken → senden), die Liste wird **nach Fälligkeit gruppiert/priorisiert**, und fällige Mahnungen lassen sich **gebündelt senden** („Alle fälligen senden"). Alles manuell ausgelöst (kein Cron/Backend), keine DB-Migration.

## Festgelegte Entscheidungen (Brainstorming)

1. **Automatik-Tiefe:** Manuelle Bündelung — Cockpit zeigt, was fällig ist; ein Button verschickt alle fälligen gebündelt. Keine Auto-Eskalation/Cron.
2. **Intervall:** 7 Tage zwischen den Stufen.
3. **Farben:** bestehende Admin-/Brand-Palette — Grün = erledigt/gesendet, Orange (`#E65100`) = fällig, Rot (`#c0392b`) = überfällig/pausiert, Grau = offen, Teal (`#0E9493`) = Aktions-Button. Konsistent mit dem jetzigen Cockpit.
4. **Ansatz:** evolutionär (bestehendes Cockpit aufbohren), nicht Zwei-Pane/Kanban.

## Ist-Zustand (verifiziert)

- `src/lib/dunning.js`: `buildDunningEmail({ level, sellerName, ref, amount, dueDate, daysOverdue })` → {subject, body, template}. 3 Stufen-Texte. Keine Intervall-Konstante.
- `src/components/admin/useAdminData.jsx`:
  - `STAGE_LABELS = {1:"Erinnerung",2:"Mahnung",3:"Letzte Mahnung"}`, `isOverdue`, `daysOverdue`, `nextStage` (rl+1, ≤3), `stageDate(invId, level)` (sucht `email_log` mit `context.invoice_id`+`context.level` → Datum).
  - `openMahn(inv)` (baut Mail, `setMahnModal({inv,level,subject,body})`), `confirmMahn` (→ sendReminder), `sendReminder(inv,level,subject,body)` (updated `fee_invoices.reminder_level/reminder_sent_at/status='overdue'`, bei ≥3 `pause_seller_listings`-RPC, loggt in `email_log` mit `context={invoice_id,level,body,seller_name,invoice_ref,amount}`).
  - `overdueInvoices = feeInvoices.filter(isOverdue).sort(...)`, `overdueSum`.
  - Render-Helfer `dunningTimeline(inv)` (kleiner 3-Stufen-Stepper, 8.5px), `mahnButton(inv)`.
- `src/components/admin/AdminShell.jsx`: Tab `dunning` (Header-Chip + Karten je `overdueInvoices`, je Karte `mahnButton` + „Bezahlt" + `dunningTimeline`); `mahnModal` (Vorschau Betreff+Text, Abbrechen/Senden).
- Daten vorhanden: `fee_invoices.reminder_level/reminder_sent_at/due_date/status/total_fees/seller_id`; `email_log` mit `subject` + `context.{invoice_id,level,body}`. **Kein neues Feld nötig.**

## Feature 1 — Fälligkeits-Logik

`src/lib/dunning.js`: Konstante ergänzen:
```js
export const DUNNING_GAP_DAYS = 7; // Tage zwischen den Mahnstufen
```

`useAdminData.jsx`: Helfer `nextStageInfo(inv)` (nutzt `emailLog`, `reminder_sent_at`, `due_date`). Gibt `null` zurück, wenn bezahlt oder Stufe 3 bereits erreicht; sonst `{ level, dueDate, isDue, daysUntil }`:
```js
  const stageSentAt = (invId, level) => {
    const e = emailLog.find(x => x.context && x.context.invoice_id === invId && x.context.level === level);
    return e?.created_at ? new Date(e.created_at) : null;
  };
  const nextStageInfo = (inv) => {
    if (inv.status === "paid") return null;
    const level = nextStage(inv); // rl+1, max 3, sonst null
    if (!level) return null;
    let dueDate;
    if (level === 1) {
      dueDate = inv.due_date ? new Date(inv.due_date) : null;
    } else {
      const prevAt = stageSentAt(inv.id, level - 1) || (inv.reminder_sent_at ? new Date(inv.reminder_sent_at) : null);
      dueDate = prevAt ? new Date(prevAt.getTime() + DUNNING_GAP_DAYS * 86400000) : null;
    }
    const isDue = !!dueDate && dueDate.getTime() <= Date.now();
    const daysUntil = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86400000) : 0;
    return { level, dueDate, isDue, daysUntil };
  };
```

## Feature 2 — Gruppierte/priorisierte Liste

`useAdminData.jsx`: aus `overdueInvoices` drei abgeleitete Listen + die fällige Menge:
```js
  const dunningDue    = overdueInvoices.filter(i => nextStageInfo(i)?.isDue).sort((a,b)=>daysOverdue(b)-daysOverdue(a));
  const dunningSoon   = overdueInvoices.filter(i => { const n = nextStageInfo(i); return n && !n.isDue; }).sort((a,b)=>(nextStageInfo(a).daysUntil)-(nextStageInfo(b).daysUntil));
  const dunningPaused = overdueInvoices.filter(i => !nextStageInfo(i)).sort((a,b)=>daysOverdue(b)-daysOverdue(a));
```
Ins return-Objekt: `nextStageInfo, dunningDue, dunningSoon, dunningPaused, bulkSendDue` (F5).

`AdminShell.jsx` Tab `dunning`:
- Header: bestehender Chip „N überfällig · CHF X offen" + neuer Chip „`{dunningDue.length}` fällig" (orange/rot, wenn >0) + Button **„Alle fälligen senden (`{dunningDue.length}`)"** (Teal; `disabled` wenn 0; `onClick={bulkSendDue}`).
- Drei Gruppen, Header nur rendern wenn nicht leer: **„Jetzt fällig"** (rot, `dunningDue`) → **„Bald fällig"** (grau, `dunningSoon`) → **„Pausiert"** (grau, `dunningPaused`). Leerzustand (alle leer) wie bisher („Keine überfälligen Rechnungen").
- Karte (Due/Soon): Avatar-Initiale, Verkäufer (klickbar → `setTab("users"); setSearch(...)`), `invoice_ref`, „CHF X · fällig seit N Tagen", rechts ein Pill **„Nächste: `{STAGE_LABELS[level]}` · `{isDue ? "heute fällig" : `in ${daysUntil} Tagen`}`"** (orange wenn fällig, sonst grau), „Bezahlt"-Button, darunter der interaktive Stepper (F3).
- Karte (Paused): „alle 3 Stufen gesendet · Inserate pausiert" (rot) + „Bezahlt + reaktivieren" (`confirmAndReactivate`); Stepper zeigt 3× erledigt.

## Feature 3 — Interaktiver Stepper (`dunningTimeline` neu)

Größer + klickbar. Pro Stufe `s` (1..3), `rl = reminder_level`:
- **erledigt** (`rl >= s`): grüner Kreis (≈24px) mit Check; Label `STAGE_LABELS[s]` + Zeile „Mail · `{stageDate}`" mit Augen-Icon; **Klick → `openSentMail(inv, s)`** (F4). Cursor pointer.
- **nächste/fällig** (`rl+1 === s && inv.status !== "paid"`): Kreis mit oranger Umrandung (`#E65100`) + Punkt; Label + Pill „senden"; **Klick → `openMahn(inv)`**. Cursor pointer.
- **künftig** (`s > rl+1`): grauer Kreis, inaktiv (kein Klick, gedämpft).
- Verbindungslinien zwischen den Stufen (grün wenn beide erreicht, sonst grau). Schrift ≥ 11px. Farben wie bisher (`#2E7D32` erledigt, `#E65100` fällig, Grau offen).

## Feature 4 — Gesendete Mail ansehen (Modal-Modus)

`useAdminData.jsx`:
```js
  const openSentMail = (inv, level) => {
    const e = emailLog.find(x => x.context && x.context.invoice_id === inv.id && x.context.level === level);
    if (!e) { flash("Keine gesendete Mail gefunden"); return; }
    setMahnModal({ inv, level, subject: e.subject, body: e.context?.body || "", mode: "view", sentAt: e.created_at });
  };
```
`openMahn` setzt zusätzlich `mode: "send"` (Default-Verhalten unverändert). Return-Objekt um `openSentMail` erweitern.

`AdminShell.jsx` `mahnModal`:
- Header: bei `mode === "view"` → „Gesendet am `{fmtDate(mahnModal.sentAt)}` an `{sellerName}`"; sonst „Vorschau · wird gesendet an …" (wie bisher).
- Body: Betreff + Text (read-only) unverändert.
- Footer: bei `mode === "view"` → ein Button „Schliessen" (`setMahnModal(null)`); sonst „Abbrechen" + „Senden" (`confirmMahn`) wie bisher.

## Feature 5 — Bündelung „Alle fälligen senden"

`useAdminData.jsx`:
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
Hinweis: `sendReminder` flasht selbst je Aufruf; das abschliessende `flash` überschreibt mit der Summe — akzeptabel. (Optional könnte ein stiller Modus ergänzt werden; YAGNI.)

## Dateien

- **Modify:** `src/lib/dunning.js` (`DUNNING_GAP_DAYS`).
- **Modify:** `src/components/admin/useAdminData.jsx` (`stageSentAt`, `nextStageInfo`, `dunningDue/Soon/Paused`, `openSentMail`, `bulkSendDue`, `dunningTimeline` neu, `mode` in `openMahn`; return-Objekt erweitern).
- **Modify:** `src/components/admin/AdminShell.jsx` (Dunning-Tab: Header-Button + 3 Gruppen + „Nächste Stufe"-Pill; `mahnModal` zwei Modi).
- **Modify:** `src/app/(public)/beta/page.jsx` (Checkliste).
- **Keine DB-Migration.**

## Verifizierung (live als Admin, KEIN `npm run build`)

- Cockpit zeigt Gruppen „Jetzt fällig / Bald fällig / Pausiert" mit korrekter „Nächste Stufe · heute fällig / in N Tagen"-Angabe; Sortierung nach Dringlichkeit.
- Stepper: Klick auf eine **erledigte** Stufe öffnet die **tatsächlich gesendete Mail** (Betreff + Text aus `email_log`) read-only; Klick auf die **fällige** Stufe öffnet die Senden-Vorschau und sendet.
- „Alle fälligen senden (N)" verschickt die fälligen Mahnungen gebündelt; danach rutschen sie in „Bald fällig"/„Pausiert".
- Test-Daten: zum Prüfen ggf. eine FEE-Rechnung temporär auf `reminder_level` 0–2 setzen (SQL), Flow testen, danach auf Baseline zurücksetzen (die Test-FEE `FEE-2026-06-149B91` war zuletzt level 3 / overdue / paused — Baseline beibehalten). Keine echten Nutzer mahnen, die es nicht sein sollen.
- Keine Konsolen-/Overlay-Fehler.

## Beta-Checkliste (Sektion „Admin-Bereich")

- `adm_mahn_groups`: Mahnungen-Cockpit gruppiert nach Jetzt fällig / Bald fällig / Pausiert; je Fall „nächste Stufe heute/in N Tagen".
- `adm_mahn_stepper_click`: Stepper ist klickbar — erledigte Stufe öffnet die gesendete Mail (Text), fällige Stufe öffnet die Senden-Vorschau.
- `adm_mahn_bulk`: „Alle fälligen senden (N)" verschickt die fälligen Mahnungen gebündelt.

## Out of Scope (bewusst)

- Echte Auto-Eskalation per Cron/Job; echter Mailversand-Dienst (Mails werden weiter nur in `email_log` protokolliert).
- Konfigurierbare Intervalle/Stufen-UI (fester `DUNNING_GAP_DAYS = 7`).
- Mahntext vor dem Senden editieren (Nutzer hat „Texte & Flexibilität" nicht gewählt).
- Zwei-Pane- oder Kanban-Layout.
