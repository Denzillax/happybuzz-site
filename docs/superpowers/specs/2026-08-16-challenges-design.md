# Challenges: Verwaltung, Rotation und Auszahlung

Datum: 16.08.2026 · Status: vom Nutzer freigegeben (Ansatz A)

## Ausgangslage

Challenges existieren halb: Tabellen `challenges` + `user_challenges`, Fortschrittslogik
`getChallengesWithProgress` (drei Ziel-Aktionen: `listing_created`, `sale_completed`,
`five_star`) und eine Hive-Sektion mit Fortschrittsbalken. Es fehlen:

1. **Verwaltung**: Challenges lassen sich nur per SQL anlegen. Die drei angelegten
   Wochen-Challenges liefen am 15.06.2026 aus, seither zeigt der Hive "Keine aktiven
   Challenges".
2. **Auszahlung**: `xp_reward` wird angezeigt, aber nie gutgeschrieben. `user_challenges`
   wird nirgends beschrieben.

## Entscheidungen (Nutzer)

- **Betriebsmodus**: Automatische Wochen-Rotation aus Vorlagen PLUS manuelle
  Sonder-Challenges im Admin.
- **Belohnung**: Pollen (XP), automatisch bei Abschluss, einmalig, mit Benachrichtigung.
  Kein Nektar (keine Gratis-Boosts aus der Hand geben).
- **Mechanik**: Ansatz A "Lazy per RPC", kein Cron, keine Trigger auf heissen Tabellen.

## Datenmodell (Migration)

`challenges` erhält zwei Spalten:

- `is_template boolean not null default false`: Wochen-Vorlage. Vorlagen erscheinen nie
  selbst im Hive (Filter `is_template = false` in `getActiveChallenges`).
- `template_id uuid references challenges(id)`: bei Instanzen die erzeugende Vorlage.
- Unique-Index `(template_id, starts_at)` where template_id is not null: verhindert
  Doppel-Instanzierung derselben Vorlage für dieselbe Woche.

`user_challenges` (existiert): erhält Unique `(user_id, challenge_id)` als
Doppel-Auszahlungs-Sperre, plus Spalte `claimed_at timestamptz` falls nicht vorhanden.

Seed: die drei bestehenden Challenges ("Fleissige Biene" 3x listing_created/50,
"Deal-Maker" 1x sale_completed/75, "Glanzleistung" 1x five_star/40) werden als Vorlagen
dupliziert (`is_template = true`, Zeitraum egal).

## RPCs (beide SECURITY DEFINER, search_path = public)

### ensure_weekly_challenges()

Idempotent, wird beim Hive-Laden aufgerufen (jeder eingeloggte Nutzer darf):

1. Montag 00:00 der aktuellen Woche berechnen (Europe/Zurich).
2. Für jede Vorlage (`is_template = true`, `active = true`): existiert schon eine Instanz
   mit `template_id = Vorlage` und `starts_at = Wochenmontag`? Wenn nein: Instanz anlegen
   (Kopie von Titel/Beschreibung/Aktion/Zielwert/Pollen, `starts_at` = Montag,
   `ends_at` = Sonntag 23:59:59, `active = true`, `is_template = false`).
3. Konflikt durch parallelen Aufruf: `on conflict do nothing` über den Unique-Index.

### claim_challenge(p_challenge_id uuid)

Zahlt genau einmal aus, serverseitig verifiziert (Client kann nichts erschwindeln):

1. Challenge laden; muss aktiv, keine Vorlage, und `now()` innerhalb des Zeitraums ODER
   Zeitraum abgelaufen sein (Nachträglich-Einlösen bis 7 Tage nach `ends_at` erlaubt).
2. Fortschritt für `auth.uid()` serverseitig nachrechnen (dieselben drei Zählungen wie
   `getChallengesWithProgress`, ab `starts_at`). Unter Zielwert: Rückgabe
   `{ok: false, reason: 'incomplete'}`.
3. `insert into user_challenges (user_id, challenge_id, claimed_at)` mit
   `on conflict do nothing`; wenn 0 Zeilen: `{ok: false, reason: 'already_claimed'}`.
4. Pollen gutschreiben: Insert in `xp_log` (`amount = xp_reward`,
   `reason = 'challenge'`) und `profiles.xp_total` erhöhen (gleicher Pfad wie bestehende
   XP-Vergaben; exakten Bestandsmechanismus in der Implementierung nachschlagen und
   wiederverwenden, nicht duplizieren).
5. Benachrichtigung anlegen: Typ `gamification`, Titel "Challenge geschafft",
   Text "<Titel>: +<n> Pollen".
6. Rückgabe `{ok: true, amount: n}`.

## lib/gamification.js

- `getActiveChallenges()`: zusätzlich `eq("is_template", false)`.
- Neu `ensureWeeklyChallenges()` → ruft RPC.
- Neu `claimChallenge(challengeId)` → ruft RPC, gibt `{ok, amount, reason}` zurück.
- `getChallengesWithProgress(userId)`: zusätzlich pro Challenge `claimed` (aus
  `user_challenges`) mitliefern, damit die UI Eingelöst/Offen unterscheidet.

## Hive (src/app/(public)/hive/page.jsx)

Beim Laden: erst `ensureWeeklyChallenges()`, dann Challenges mit Fortschritt laden.
Für jede fertige, nicht eingelöste Challenge automatisch `claimChallenge` aufrufen;
bei `ok` Erfolgszustand rendern (Häkchen + "+50 Pollen gutgeschrieben") und den
Pollen-Stand im Header aktualisieren (bestehendes Event-Muster
`beedaro:nektar` analog, bzw. vorhandenen Refresh nutzen). Eingelöste Challenges der
laufenden Woche bleiben sichtbar (Häkchen), abgelaufene verschwinden mit der Rotation.

## Admin: neuer Tab "Challenges"

Muster wie CategoriesTab/OrdersTab (Tabellen-Look, adminStyles):

- **Liste**: Instanzen und Vorlagen getrennt (Filter-Pills "Aktiv", "Vorlagen",
  "Vergangene"). Spalten: Titel, Aktion, Ziel, Pollen, Zeitraum bzw. "Vorlage
  (wöchentlich)", Teilnehmer (count user_challenges), Status. Aktionen: Deaktivieren/
  Aktivieren, bei Vorlagen zusätzlich Bearbeiten.
- **Anlegen**: Formular mit Titel, Beschreibung, Ziel-Aktion (Dropdown, exakt die drei
  unterstützten Aktionen mit deutschen Labels), Zielwert, Pollen, und entweder
  Zeitraum (Sonder-Challenge) oder Haken "Wöchentliche Vorlage".
- **Audit**: jede Aktion loggt über das bestehende `logAdmin` (AUDIT_META-Einträge
  `challenge_created`, `challenge_toggled`, `challenge_updated`).
- **RLS**: `challenges` braucht Admin-Write-Policies über `is_staff(auth.uid())`
  (Lesen ist öffentlich, bleibt). `user_challenges`: Insert nur über die RPC
  (SECURITY DEFINER), direkte Inserts bleiben durch RLS gesperrt.
- **NAV**: Eintrag "Challenges" in useAdminData; Rollen-Zuordnung wie die anderen
  Gamification-fernen Tabs (Owner + passende Staff-Rolle, in der Implementierung an
  ROLE_TABS orientieren).

## Fehlerfälle

- RPC nicht erreichbar: Hive zeigt die Sektion mit vorhandenen Daten, kein Crash;
  Claim-Fehler still in die Konsole, kein Nutzer-Alarm (nächster Besuch versucht erneut).
- Doppelklick/Parallelaufruf von claim: Unique-Constraint macht die zweite Auszahlung
  zum No-op (`already_claimed`).
- Vorlage deaktiviert: Rotation überspringt sie, bestehende Wochen-Instanz läuft aus.

## Tests

- Vitest: keine reine Logik im Client (alles RPC) ausser Anzeige-Mapping; kein neuer
  Unit-Test-Bedarf über Bestand hinaus.
- Live-Verifikation (transaktional, wie bei Rate-Limits): ensure zweimal aufrufen →
  Instanzen nur einmal; claim zweimal → eine Auszahlung, ein `already_claimed`;
  claim unter Zielwert → `incomplete`; XP-Stand und Benachrichtigung prüfen; Rollback.
- Beta-Checkliste: Punkte für Rotation (Hive nie leer), Auto-Auszahlung mit
  Benachrichtigung, Admin anlegen/deaktivieren, Vorlagen-Verhalten.

## Nicht in diesem Umfang (YAGNI)

- Keine neuen Ziel-Aktionstypen (nur die drei bestehenden).
- Kein Nektar als Belohnung, keine Community-/Team-Challenges, kein Leaderboard-Umbau.
- Kein pg_cron; Rotation bleibt lazy.
