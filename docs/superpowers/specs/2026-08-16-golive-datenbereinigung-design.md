# Go-Live-Datenbereinigung (16.08.2026)

## Entscheid (Brainstorming, vom Owner freigegeben)
Vor dem Start werden alle Testdaten entfernt. Es bleibt: das Owner-Konto
(yam_89xr, 48fbdb7f) mit Profil, Adresse, Benachrichtigungs-Einstellungen und
Push-Abo, seine 7 aktiven Inserate mit Bildern, sowie sämtliche Konfiguration
(Kategorien, Attribute, Challenge-Definitionen, Bee-Rate-Stufen, Firmendaten,
Site-Einstellungen, Ankündigung). Owner-Spielstände (Pollen/Nektar/Blüten/
Achievements/Streaks) auf 0, Gebührenrechnungen inkl. offener FEE-Rechnung
gelöscht, Beta-Feedback und Admin-Protokoll geleert (alles Testbetrieb).

## Ausführung
- Vollbackup zuerst: alle 36 Public-Tabellen + Auth-Konten als JSON nach
  `C:\Users\Denzil\beedaro-backup-2026-08-16\` (ausserhalb des Repos),
  inkl. Liste der gelöschten Storage-Pfade (`storage-zu-loeschen.json`).
- Löschung als EIN transaktionaler DO-Block (execute_sql), Reihenfolge
  Kinder vor Eltern: rental_bookings → purchase_events → invoice_items →
  ratings/reviews → purchases → bid_history → bids → fee_ledger →
  fee_invoices → transactions → messages → conversations → notifications →
  push_queue → email_log → listing_views → favorites → favorite_sellers →
  reports → applications → beta_feedback → admin_audit_log → Gamification-Logs
  (xp/nektar/blueten/achievements/user_challenges) → listing_attributes/
  listing_images/listings (alles ausser Owner-aktiv) → Profil-Reset →
  fremde user_addresses/staff_roles → fremde profiles → fremde auth.users.
- Zähler der verbleibenden Inserate (Aufrufe/Favoriten/Gebote) auf 0.
- Storage: 26 Bilddateien gelöschter Inserate aus `listing-images` entfernt
  (Batch-DELETE mit prefixes). Keine Test-Avatare/-Dokumente vorhanden.

## Ergebnis (verifiziert)
- Zeilen nach Lauf: listings 7, listing_images 10, profiles 1,
  push_subscriptions 1, user_addresses 1, alle Bewegungstabellen 0.
- Preview als Owner: Homepage rendert die 7 Inserate ohne kaputte Bilder,
  Header zeigt Entdecker/0 Pollen, Favoriten leer.

## Wiederherstellung
Im Notfall Zeilen aus den JSON-Dumps via Service-Role-REST re-inserten
(Passwort-Hashes der Testkonten sind nicht exportierbar; Testkonten wären
neu anzulegen).
