# 360°-Nutzer-Ansicht (Admin) — Design Spec

**Datum:** 2026-06-17
**Welle:** 3, Teil 2 (Teil 1 = Inserat-Freigabe-Queue, abgeschlossen)

## Ziel
Eine read-only Konto-/Support-Ansicht pro Nutzer im Admin: alles über einen Nutzer auf einen Blick (Kennzahlen, Risiko, private Notiz, Aktionshistorie) plus die bestehenden Sub-Daten — als sichere Alternative zu Impersonation.

## Entscheidungen (freigegeben)
- **Form:** In-SPA Fokus-Ansicht. Zeilen-Klick im Benutzer-Tab öffnet die volle Profil-Ansicht im Hauptbereich, mit „← Zurück". Kein neuer Router.
- **Inline-Aufklappen entfällt:** Die bisherige aufklappbare Benutzer-Zeile wird durch die Profil-Ansicht ersetzt (eine reiche Ansicht, keine Redundanz). Die Konto-Aktionen (Sperren/Entsperren, ID bestätigen/ablehnen) wandern in die Profil-Ansicht.
- **Bausteine:** Kennzahlen-Kopf + Risiko-Ampel + Admin-Notiz + Aktions-/Sperrhistorie, dazu die bestehenden Sub-Daten (Inserate/Bestellungen/Rechnungen/Bewertungen/E-Mails).
- **Read-only** ggü. Nutzerinhalten (keine Impersonation, kein Bearbeiten seiner Inserate). Erlaubt: bestehende Konto-Aktionen (Sperre, ID) + die private Admin-Notiz.

## Verankerte Fakten (geprüft)
- `user_notes` existiert: PK `(noter_id, noted_id)`, Spalten `text`, `updated_at`; RLS: Verfasser darf select/insert/update/delete eigene Notizen (`auth.uid() = noter_id`). Passt 1:1 für eine private Admin-Notiz pro Nutzer.
- Admin ist Single-Page-SPA (`AdminShell` + `tabs/*`), keine Per-Record-Route. Daten pro Nutzer werden im Hook geladen (`toggleUser` lädt `userListings`; `userFees`/`userInvoices` ebenfalls im Hook).
- `admin_audit_log`: Spalten `admin_id, action, target_type, target_label, detail, created_at`. Bezug zum Nutzer nur über `target_label` (= Anzeigename) — Filter `target_label === display_name`; bei Namenswechsel/-kollision unscharf (akzeptiert).
- Bestehende Felder pro Nutzer: `is_banned`, `id_verified`, `id_document_url`, `account_type`, `company_name`, `contact_violations`, `bee_level`, `blueten`, `city`, `created_at`, `display_name`, `username`.

## Architektur
- **Hook `useAdminData.jsx`**:
  - State: `openProfile` (userId|null), `userNote` (string), `profileAudit` (array).
  - `openUserProfile(id)`: setzt `openProfile=id`, lädt die Per-Nutzer-Daten wie `toggleUser` (Inserate/Fees/Invoices), lädt die Notiz (`user_notes` where noter_id=admin, noted_id=id) und die Audit-Einträge (`admin_audit_log` where target_label = display_name, limit 50).
  - `closeProfile()`: `openProfile=null`.
  - `saveUserNote(id, text)`: upsert in `user_notes` (`{ noter_id: admin, noted_id: id, text, updated_at: now }`), aktualisiert `userNote`, `flash`.
  - Neue Bezeichner ins return-Objekt.
- **`tabs/UsersTab.jsx`**: wenn `openProfile` gesetzt → `<UserProfile admin={admin} />`; sonst die Liste. Zeilen-Klick ruft `openUserProfile(u.id)` statt `toggleUser`. Das gesamte Inline-Detail (ID-Bar, Moderations-Bar, Sub-Tabs) wird aus UsersTab entfernt und lebt in UserProfile.
- **Neue Datei `tabs/UserProfile.jsx`**: die volle Ansicht (siehe Layout). Bekommt `admin` und liest den per `openProfile` gewählten Nutzer aus `users.find(...)`.

## Layout `UserProfile` (von oben)
1. **Kopf-Leiste:** „← Zurück" (closeProfile), Avatar-Initiale, `display_name` + `@username`, Status-Badges (Aktiv/Gesperrt, ID/ID?, Privat/Unternehmen). Rechts: **Sperren/Entsperren** (`toggleBan`) + bei `id_document_url && !id_verified` **Bestätigen/Ablehnen** (bestehende Logik aus dem Aufklappen, inkl. `logAdmin`).
2. **Kennzahlen-Kopf** (Karten-Reihe): Mitglied seit (`created_at`), Bee-Level + Blüten, Käufe/Verkäufe (Anzahl aus `orders` für diesen Nutzer) + Umsatz (Summe nicht-stornierter), offene Gebühren (Summe unbezahlter `userInvoices`), Kontaktverstösse (`contact_violations`).
3. **Risiko-Ampel:** `rot` wenn `is_banned` ODER `contact_violations >= 3` ODER offene Gebühren > 0; `gelb` wenn `contact_violations` 1–2 ODER unbezahlte Rechnung vorhanden; sonst `grün`. Eine Zeile mit Farbpunkt + Kurzbegründung.
4. **Admin-Notiz:** `<textarea>` vorbefüllt mit `userNote`, „Speichern" → `saveUserNote`. Hinweis „nur für dich sichtbar".
5. **Aktions-/Sperrhistorie:** `profileAudit` als kompakte Timeline (Icon je Aktion via AUDIT_META-Stil, Label, Zeit). Leerzustand „Keine Aktionen protokolliert."
6. **Sub-Daten:** dieselben Sub-Tabs wie bisher (Inserate/Bestellungen/Rechnungen/Bewertungen/E-Mails) — Rendering aus dem bisherigen Aufklappen übernommen, `userTab[u.id]` als aktiver Sub-Tab.

## Edge-Cases & Non-Goals
- Kein Impersonation/Acting-as, kein Bearbeiten der Nutzerinhalte.
- Audit-Bezug per Anzeigename ist unscharf (dokumentiert); kein Schema-Umbau in diesem Schritt.
- Sub-Tab-Rendering wird verschoben, nicht dupliziert (UsersTab-Expand entfällt).
- Profil-Zustand ist nicht in der URL (SPA-State); Reload landet wieder in der Liste — akzeptiert.

## Verifizierung (live als Admin, KEIN `npm run build`)
1. Benutzer-Tab → Nutzer anklicken → Profil öffnet (Kopf, Kennzahlen, Ampel, Notiz, Historie, Sub-Tabs).
2. Notiz schreiben + Speichern → nach Reload + erneutem Öffnen noch da.
3. Ampel: gesperrter Nutzer = rot, sauberer = grün.
4. Sperren/Entsperren + (falls Doku) ID bestätigen funktionieren wie zuvor, erzeugen Protokoll-Einträge.
5. Sub-Tabs zeigen die korrekten Per-Nutzer-Daten.
6. „← Zurück" führt zur Liste; Konsole fehlerfrei (nur HMR-Artefakte).

## Beta-Checkliste (erweitern)
- `adm_profile_open` — Zeilen-Klick öffnet die 360°-Profil-Ansicht; Zurück führt zur Liste.
- `adm_profile_header` — Kennzahlen-Kopf + Status-Badges + Risiko-Ampel stimmen.
- `adm_profile_note` — Admin-Notiz speichern + bleibt nach Reload.
- `adm_profile_history` — Aktions-/Sperrhistorie zeigt Audit-Einträge zu diesem Nutzer.
- `adm_profile_actions` — Sperren/Entsperren + ID-Prüfung funktionieren in der Profil-Ansicht.
