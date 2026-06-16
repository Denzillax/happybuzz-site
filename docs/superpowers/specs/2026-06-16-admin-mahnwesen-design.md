# Admin Mahnwesen-Cockpit + lesbare, nutzerbezogene E-Mails

**Datum:** 2026-06-16
**Status:** Design freigegeben, Spec zur Review

## Ziel

Das Mahnwesen im Admin verständlich und steuerbar machen: ein eigenes „Mahnungen"-Cockpit,
das alle überfälligen Gebühren-Rechnungen sammelt, je Rechnung eine klare Eskalations-Timeline
zeigt und vor dem Mahnen die **fertige, lesbare E-Mail** als Vorschau anbietet. Dazu: E-Mails
überall lesbar darstellen (statt des rohen `context`-JSON) und pro Nutzer zuordnen.

## Festgelegte Entscheidungen (Brainstorming)

1. **Platzierung:** lesbare E-Mails **beim Nutzer (Benutzer-Detail) UND im globalen E-Mails-Tab**.
2. **Mahn-Mail:** **feste, professionelle deutsche Texte + Vorschau** vor dem Senden (Variablen automatisch gefüllt).
3. **Überblick:** **eigenes Mahn-Cockpit** als neuer Nav-Tab „Mahnungen" mit Überfällig-Zähler-Badge.

## Kontext / Bestehendes (verifiziert)

- `fee_invoices`: u.a. `status`, `due_date(date)`, `reminder_level(int)`, `reminder_sent_at(timestamptz)`,
  `listings_paused(bool)`, `account_suspended(bool)`, `invoice_ref`, `total_fees`, `seller_id`, `paid_at`.
- `email_log`: `id, recipient_id, recipient_email, subject, template, context(jsonb), status, created_at`.
- `sendReminder(invId, sellerId, level)` (in `src/app/(public)/admin/page.jsx`): setzt `reminder_level`,
  `reminder_sent_at`, `status='overdue'`, bei Stufe 3 `listings_paused=true` + RPC `pause_seller_listings`;
  loggt in `email_log` (heute nur `subject` + `template`-Name + minimaler `context`, KEIN echter Text).
- `confirmAndReactivate(invId, sellerId)`: setzt `paid`, reaktiviert Inserate (RPC `reactivate_seller_listings`).
- Heutige Darstellung: ein einzelner Button, der je `reminder_level` seinen Text wechselt (im per-User-Invoice-Detail
  und im globalen Rechnungen-FEE-Detail). Keine Timeline, kein Fälligkeits-/Überfälligkeits-Status, kein echter Mahntext.
- E-Mails-Tab (Welle 1): zeigt `context` als JSON in `<pre>` — vom User als „Code/unübersichtlich" bemängelt.
- **Kein DB-Umbau nötig:** Mahntext wird in `email_log.context` (jsonb) gespeichert; „überfällig" wird client-seitig berechnet;
  die Stufen-Historie (Datum je Stufe) wird aus `email_log` abgeleitet.

## Feature 1 — Mahntext-Modul `src/lib/dunning.js`

Reine Text-Erzeugung (keine UI, kein Supabase). Funktion:

```
buildDunningEmail({ level, sellerName, ref, amount, dueDate, daysOverdue }) -> { subject, body, template }
```

- `amount` als CHF-String (z.B. via `fmtCHF`), `dueDate`/`daysOverdue` vorformatiert vom Aufrufer.
- `template` = `reminder_1|reminder_2|reminder_3` (Kompatibilität zum bestehenden Log-Feld).
- Texte (BEEDARO-Ton, keine Emojis, keine Em-Dashes):

**Stufe 1 — Erinnerung** · subject: `Erinnerung: offene Gebührenrechnung {ref}`
```
Hallo {sellerName},

deine Gebührenrechnung {ref} über CHF {amount} war am {dueDate} fällig.

Bitte begleiche den Betrag in den nächsten Tagen über die QR-Rechnung in deinem Konto. Falls du bereits bezahlt hast, ignoriere diese Nachricht.

Besten Dank.
Dein BEEDARO-Team
```

**Stufe 2 — Mahnung** · subject: `2. Mahnung: Inserate werden bald pausiert`
```
Hallo {sellerName},

deine Gebührenrechnung {ref} über CHF {amount} ist seit {daysOverdue} Tagen offen (fällig am {dueDate}).

Bitte begleiche den Betrag innerhalb von 7 Tagen. Andernfalls pausieren wir deine aktiven Inserate, bis die Zahlung eingegangen ist.

Zahlung per QR-Rechnung in deinem Konto.
Dein BEEDARO-Team
```

**Stufe 3 — Letzte Mahnung** · subject: `Letzte Mahnung: Inserate pausiert`
```
Hallo {sellerName},

deine Gebührenrechnung {ref} über CHF {amount} ist seit {daysOverdue} Tagen offen. Wir haben deine aktiven Inserate jetzt pausiert.

Sobald deine Zahlung eingegangen ist, schalten wir die Inserate wieder frei. Bitte begleiche den Betrag per QR-Rechnung in deinem Konto.

Bei Fragen: support@happybuzz.ch
Dein BEEDARO-Team
```

## Feature 2 — Überfällig-Logik (client-seitig)

Helfer im Admin:
- `isOverdue(inv)` = `inv.status !== "paid" && inv.due_date && new Date(inv.due_date) < new Date()`.
- `daysOverdue(inv)` = ganze Tage zwischen `due_date` und heute (min 0).
- `nextStage(inv)` = `(inv.reminder_level || 0) + 1`, gekappt auf 3; `null` wenn `reminder_level >= 3`.

## Feature 3 — Mahn-Cockpit (neuer Tab „Mahnungen")

- **Nav:** neuer Eintrag `{ key: "dunning", label: "Mahnungen", Icon: BellRing }` mit `badge` = Anzahl überfälliger FEE-Rechnungen (rot). Damit 8 Tabs.
- **Inhalt:** alle FEE-Rechnungen mit `isOverdue` true, sortiert nach Dringlichkeit (höhere Stufe zuerst, dann meiste Tage überfällig).
- **Kopf:** „N überfällig · CHF X offen".
- **Je Zeile:** Avatar + Verkäufer (Link zum Benutzer), `invoice_ref`, Betrag, „fällig seit X Tagen" (rot), **Eskalations-Timeline** (3 Punkte Erinnerung/Mahnung/Letzte Mahnung: erreichte Stufen grün mit Datum aus `email_log`, nächste Stufe orange „fällig", spätere grau), und rechts der **Aktions-Button für die nächste Stufe** (`Erinnerung senden` / `Mahnung senden` / `Letzte Mahnung senden`). Bei `reminder_level >= 3`: statt Button ein Hinweis „Inserate pausiert" + Button „Bezahlt".
- **Stufen-Daten:** je Stufe das Datum aus `email_log` (Eintrag mit `context.invoice_id === inv.id` und `context.level === stufe`, dessen `created_at`); Fallback `reminder_sent_at` auf der höchsten erreichten Stufe.
- Leerzustand: „Keine überfälligen Rechnungen. Alles bezahlt." (CheckCircle).

## Feature 4 — Vorschau → Senden (Modal)

- Klick auf einen Stufen-Button öffnet ein **Modal** mit der fertigen E-Mail aus `buildDunningEmail(...)`:
  Kopf „Vorschau · wird gesendet an {Verkäufer}", Felder Betreff + Text (Body als `white-space: pre-wrap`),
  Buttons „Abbrechen" / „Senden".
- **Senden** ruft die überarbeitete `sendReminder` (siehe Refactor) → protokolliert die **gerenderte** Mail
  (subject + body) in `email_log`, setzt Stufe/Status, bei Stufe 3 Inserate pausieren. Danach Modal schliessen + Toast.
- Modal-State im Admin: `{ inv, level, subject, body }` oder `null`. Wiederverwendbar aus Cockpit UND Rechnungen-Tab.

## Feature 5 — Lesbare, nutzerbezogene E-Mails

- **Globaler E-Mails-Tab:** statt JSON-`<pre>` die Mail lesbar rendern — Kopf „An: {Empfängername}",
  Betreff fett, darunter `context.body` als `white-space: pre-wrap`. Fällt `context.body` weg (Alt-Einträge), kompakter
  Hinweis „(kein Text gespeichert)"; KEIN rohes JSON mehr als Default.
- **Empfängername:** via `recipient_id` → Profil-Lookup (Name-Cache im Admin vorhanden). `recipient_email` wird NICHT
  angezeigt, solange es der `noreply@beedaro.ch`-Platzhalter ist (sonst irreführend).
- **Benutzer-Detail:** neuer Sub-Tab „E-Mails" (neben Inserate/Bestellungen/Rechnungen/Bewertungen), zeigt `email_log`-Einträge
  dieses Nutzers (`recipient_id === u.id`), lesbar wie oben, neueste zuerst.

## Feature 6 — Timeline im Rechnungen-Tab (FEE-Detail)

Der heutige einzelne Morph-Button im FEE-Detail (global + per-User-Invoice) wird durch dieselbe **3-Stufen-Timeline**
(Feature 3) + denselben **Vorschau→Senden**-Fluss (Feature 4) ersetzt. „Bezahlt" (`confirmAndReactivate`) bleibt.

## Refactor — `sendReminder`

`sendReminder` so anpassen, dass es die gerenderte Mail erhält bzw. erzeugt und speichert:
`sendReminder(inv, level)` (Objekt statt nur ID) →
1. `buildDunningEmail(...)` mit den Werten der Rechnung (Name via Cache, ref, fmtCHF(total_fees), dueDate, daysOverdue),
2. `fee_invoices`-Update wie bisher (reminder_level/-_sent_at/status, Stufe 3: listings_paused + RPC),
3. `email_log`-Insert mit `recipient_id=seller_id`, `subject`, `template`, `status='sent'`,
   `context = { invoice_id, level, body, seller_name, invoice_ref, amount }` (Body lesbar gespeichert),
4. State-Updates (feeInvoices, ggf. userInvoices, emailLog).
Bestehende Aufrufer auf die neue Signatur umstellen.

## Dateien

- **Create:** `src/lib/dunning.js`.
- **Modify:** `src/app/(public)/admin/page.jsx` (Nav-Tab + Cockpit, Vorschau-Modal, `sendReminder`-Refactor,
  E-Mails-Tab lesbar, Benutzer-Detail „E-Mails"-Sub-Tab, FEE-Detail-Timeline), `src/app/(public)/beta/page.jsx` (Checkliste).
- Keine DB-Migration.

## Out of Scope (bewusst)

- Echter E-Mail-Versand (SMTP/Provider) — wir protokollieren weiterhin; UX ist vorbereitet.
- Editierbarer Mahntext (Vorschau ist fest; Bearbeiten könnte später kommen).
- Stapel-Mahnen (mehrere auf einmal).
- Automatisches Mahnen per Zeitplan/Cron.
- Analytics-Cockpit (separate nächste Welle).

## Verifizierung

- Live als Admin (`/admin`, Dev-Server läuft; KEIN `npm run build`).
- Mahnungen-Tab listet die überfällige Radio-Active-Rechnung (`FEE-2026-06-149B91`), Timeline + „Erinnerung senden".
- Vorschau zeigt den fertigen Text; „Senden" erhöht die Stufe, schreibt lesbaren Text ins `email_log`.
- E-Mails-Tab + Benutzer-Detail zeigen die Mail lesbar (kein JSON).
- Stufe 3 pausiert Inserate; „Bezahlt" reaktiviert.
- Testkonto Zeggy unverändert; falls beim Test eine echte Mahnung an Radio Active gesendet wird, ist das ok (echter überfälliger Datensatz) — Stufe danach ggf. zurücksetzen, wenn du es als reinen Test betrachtest.

## Beta-Checkliste (Sektion „Admin-Bereich")

- `adm_dunning_tab`: Mahnungen-Tab listet überfällige FEE-Rechnungen mit Timeline + Fälligkeit; Nav-Badge stimmt.
- `adm_dunning_preview`: Stufen-Button öffnet E-Mail-Vorschau; „Senden" erhöht Stufe + protokolliert lesbaren Text.
- `adm_dunning_escalation`: Stufe 3 pausiert Inserate; „Bezahlt" reaktiviert.
- `adm_email_readable`: E-Mails-Tab zeigt An/Betreff/Text lesbar (kein JSON).
- `adm_user_emails`: Benutzer-Detail „E-Mails"-Sub-Tab zeigt die Mails dieses Nutzers.
