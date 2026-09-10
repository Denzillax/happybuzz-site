# Auth-Mails im Klar-Design (Send-Email-Hook) — Design-Spec

Datum: 10.09.2026
Status: von Denis freigegeben (Richtung "Klar Minimal", Umsetzung via Send-Email-Hook)

## Ziel

Alle Supabase-Auth-Mails (Registrierung, Passwort-Reset, Magic Link, E-Mail-Änderung,
Einladung, Re-Authentifizierung) erscheinen im selben Klar-Minimal-Design wie die
bestehenden Benachrichtigungs-Mails des notify-worker: weisse Karte auf #F4F4F2,
Beedaro-Logo, Kicker, Honey-Button (#F4C03F, radius 999), Hairline #E4E0D8,
Fusszeile "Kaufen. Verkaufen. Gutes tun. · beedaro.ch". Deutsche Betreffzeilen.

Ausdrücklich NICHT im Scope: Die Benachrichtigungs-Mails (notify-worker) bleiben
unverändert — sie sind bereits das gewählte Design A.

## Architektur

Neue Edge Function `auth-mailer` (Deno, `verify_jwt: false` wie notify-worker):

1. Supabase Auth ruft sie über den **Send-Email-Hook** (HTTPS) bei jedem
   Mail-Ereignis auf. Payload: `{ user, email_data: { token, token_hash,
   redirect_to, email_action_type, site_url, token_new, token_hash_new } }`.
2. Die Funktion prüft die **Webhook-Signatur** (Standard-Webhooks-Verfahren,
   Secret `v1,whsec_...`). Ungültige Signatur → 401, keine Mail.
3. Sie rendert die Mail im Klar-Minimal-Layout (eigene Kopie des Renderers,
   angepasst: Kicker "Konto", pro Ereignistyp Betreff/Titel/Text/Button).
4. Versand über **Resend** als `Beedaro Info <noreply@beedaro.ch>` — API-Key wie
   beim notify-worker via `worker_secret('resend_api_key')` (Service-Role-Client).
5. Antwort an Auth: `200 {}` NUR nach erfolgreichem Resend-Versand. Schlägt
   Resend fehl → 500 mit Fehlertext, damit Auth den Fehler meldet statt still
   nichts zu senden.

Der Hook-Secret liegt als Function-Secret `AUTH_HOOK_SECRET` (Supabase Secrets),
nicht im Code und nicht im Repo.

## Mail-Typen (email_action_type)

| Typ | Betreff | Titel | Button | Besonderheit |
|---|---|---|---|---|
| `signup` | Bestätige deine E-Mail-Adresse | Willkommen bei Beedaro | E-Mail bestätigen | |
| `recovery` | Neues Passwort festlegen | Passwort zurücksetzen | Passwort zurücksetzen | |
| `magiclink` | Dein Anmelde-Link | Anmelden ohne Passwort | Jetzt anmelden | |
| `email_change` | Neue E-Mail-Adresse bestätigen | E-Mail-Adresse ändern | Adresse bestätigen | nutzt `token_hash_new`/`token_hash` je nach Empfänger; Typ im Verify-Link ist `email_change` |
| `invite` | Du bist eingeladen | Deine Einladung zu Beedaro | Konto erstellen | |
| `reauthentication` | Dein Bestätigungscode | Bestätigungscode | kein Link | 6-stelliger `token` gross und zentriert im Text |
| unbekannter Typ | Bestätigung nötig | Bestätige die Aktion | Weiter | Fallback, damit nie eine Mail leer ausgeht |

Bestätigungslink (ausser reauthentication):
`{SUPABASE_URL}/auth/v1/verify?token={token_hash}&type={email_action_type}&redirect_to={redirect_to || SITE}`.

Jede Mail (ausser invite) endet mit dem Sicherheitssatz:
"Falls du das nicht warst, kannst du diese Mail ignorieren." Bei recovery
zusätzlich: "Dein Passwort bleibt unverändert, bis du den Link nutzt."
Zeit-Hinweis bewusst unspezifisch, weil die Ablaufzeit eine Auth-Einstellung ist:
"Der Link ist nur begrenzte Zeit gültig." (bzw. "Der Code ist nur kurze Zeit gültig.").

Textregeln wie überall: ss statt ß, keine Emojis, keine Em-Dashes, kurze Sätze.

## Konfiguration (manueller Schritt, macht Denis)

Dashboard → Authentication → Hooks → "Send Email" → Enable:
- Typ HTTPS, URL: `https://ekfsehsmwzougrgqukgf.supabase.co/functions/v1/auth-mailer`
- Secret: wird beim Einrichten generiert oder eingefügt; derselbe Wert kommt als
  `AUTH_HOOK_SECRET` in die Function-Secrets (Reihenfolge: erst Secret setzen und
  Funktion deployen, DANN Hook aktivieren).

**Rollback:** Hook im Dashboard deaktivieren → Auth sendet sofort wieder über den
bisherigen SMTP-Weg mit den alten Templates. Kein Deploy nötig.

## Fehlerbehandlung

- Signatur ungültig → 401, geloggt.
- Resend-Fehler → 500 mit Meldung; der Nutzer sieht im Frontend den Auth-Fehler
  und kann es erneut versuchen.
- Unbekannter `email_action_type` → Fallback-Mail (siehe Tabelle), nie 500 wegen
  fehlender Vorlage.

## Test (nach Aktivierung, live)

1. Passwort-Reset an denis.mihaljevic@gmx.ch auslösen → Klar-Design, Umlaute,
   Link funktioniert.
2. Wegwerf-Registrierung `authmail-intern@beedaro.ch` → Bestätigungs-Mail im
   neuen Design, Link bestätigt das Konto; danach Testkonto löschen.
3. Auth-Logs prüfen: keine Hook-Fehler.
4. Negative Probe: Aufruf der Funktion ohne gültige Signatur → 401.
