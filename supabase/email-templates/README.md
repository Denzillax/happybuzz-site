# Auth-Mails: Absender beedaro.ch + BEEDARO-Look

Supabase verschickt Registrierungs-/Passwort-Mails standardmässig von
`noreply@mail.app.supabase.io` mit Supabase-Branding. Damit sie von
`noreply@beedaro.ch` kommen und nach BEEDARO aussehen, sind drei Schritte
im Dashboard nötig (einmalig, ca. 15 Minuten):

## 1. Resend-Konto + Domain (Absender-Adresse)

1. Konto auf resend.com erstellen (Gratis-Stufe reicht für die Beta).
2. Resend → Domains → `beedaro.ch` hinzufügen.
3. Die angezeigten DNS-Records (SPF + DKIM, 3 Einträge) beim DNS von
   beedaro.ch eintragen (gleicher Ort wie die Vercel-Nameserver-Umstellung;
   wenn die Vercel-Nameserver aktiv sind: Vercel → Domains → beedaro.ch → DNS).
4. In Resend einen API-Key erstellen (nur "Sending"-Rechte nötig).

## 2. Supabase Custom SMTP

Supabase Dashboard → Projekt → Authentication → Emails → SMTP Settings:

- Enable Custom SMTP: an
- Sender email: `noreply@beedaro.ch`
- Sender name: `BEEDARO`
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: der Resend-API-Key (selbst eintragen, nicht teilen)

## 3. Templates + URLs

Authentication → Emails → Templates: den HTML-Inhalt der Dateien in diesem
Ordner in die jeweilige Vorlage kopieren:

| Datei                  | Supabase-Vorlage   | Betreff-Vorschlag                          |
|------------------------|--------------------|--------------------------------------------|
| confirm-signup.html    | Confirm signup     | Willkommen bei Beedaro. Bitte bestätigen.  |
| reset-password.html    | Reset password     | Neues Passwort für Beedaro                 |
| magic-link.html        | Magic Link         | Dein Anmeldelink für Beedaro               |
| email-change.html      | Change email       | Neue E-Mail-Adresse bestätigen             |
| invite-user.html       | Invite user        | Deine Einladung zu Beedaro                 |

Die Templates nutzen das Logo als Bild: `https://beedaro.ch/logo-email.png`
(liegt in `public/logo-email.png`, wird mit dem normalen Deploy ausgeliefert).

Authentication → URL Configuration:

- Site URL: `https://beedaro.ch`
- Zusätzliche Redirect-URLs: `https://happybuzz.ch/**`, `https://www.happybuzz.ch/**`,
  `http://localhost:57636/**` (Dev-Preview)

Ohne Schritt 3 zeigen die Links in den Mails auf die falsche Domain.

## 4. Benachrichtigungs-Mails + Push (Versand-Worker)

Auth-Mails (oben) verschickt Supabase selbst. Alles andere (Gebote, Verkäufe,
Mahnungen, Push) verschickt die Edge Function `notify-worker`
(supabase/functions/notify-worker), angestossen von pg_cron im Minutentakt
(Migration `20260816_notify_push_infra.sql`).

Geheimnisse liegen im Supabase Vault (Dashboard → Project Settings → Vault):

| Name                  | Inhalt                                        | Wer legt es an |
|-----------------------|-----------------------------------------------|----------------|
| `resend_api_key`      | Resend-API-Key (derselbe wie fürs SMTP)       | manuell        |
| `vapid_public_key`    | Web-Push-Schlüssel, public                    | eingerichtet   |
| `vapid_private_key`   | Web-Push-Schlüssel, privat                    | eingerichtet   |
| `notify_worker_token` | Zufallstoken, mit dem der Cron den Worker ruft | eingerichtet  |

Ohne `resend_api_key` bleiben Mails auf `pending` stehen (der Worker meldet es
in seiner Antwort); Push funktioniert unabhängig davon. Der öffentliche
VAPID-Schlüssel steht zusätzlich in `src/lib/push.js` (er ist public). Wird das
Schlüsselpaar je neu erzeugt, verlieren alle Geräte ihr Abo und müssen Push in
den Einstellungen neu aktivieren.
