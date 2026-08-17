# Challenges: Kategorie-Bedingung, neue Arten, Startseiten-Push

## Entscheid (Brainstorming 17.08.2026, freigegeben)
1. Inserat-Challenges können auf eine Kategorie (inkl. Unterkategorien)
   eingeschränkt werden ("3 Inserate in Games & Spielkonsolen").
2. Drei neue Ziel-Aktionen: Käufe tätigen (buy_completed), Bewertungen
   abgeben (rating_given), Inserate in N verschiedenen Kategorien
   (distinct_categories). "Artikel merken" bewusst nicht (zu leicht erklickbar).
3. Startseiten-Push als eigene Sektion unter dem Hero (nicht Hero-Slide).

## Mechanik
Fortschritt bleibt live berechnet (kein Zähler): Anzeige clientseitig in
getChallengesWithProgress, Auszahlung serverseitig in claim_challenge — beide
mit identischen Bedingungen, Betrug über den Client ist damit ausgeschlossen.

## Umsetzung
- Migration `20260817_challenges_kategorie_featured.sql`:
  challenges.category_id (FK categories) + challenges.featured;
  ensure_weekly_challenges vererbt beide von der Vorlage an die Wochen-Instanz;
  SQL-Helfer category_tree_ids (rekursiv); claim_challenge mit Kategorie-Filter
  und den drei neuen Aktionen.
- lib/gamification.js: categoryTreeIds (Client-Spiegel), neue Aktionen in
  getChallengesWithProgress, getFeaturedChallenge, Kategorie-Name im
  Challenge-Select (join categories).
- Admin ChallengesTab: 6 Ziel-Aktionen, optionales Kategorie-Dropdown (nur bei
  "Inserate erstellen"; Baum mit eingerückten Unterkategorien), Häkchen
  "Auf Startseite zeigen"; Tabelle/Karten zeigen Kategorie + Startseite-Pill.
- Homepage: ChallengeBanner unter dem Hero (Katalog-Stil, Honig-Schatten):
  Kicker CHALLENGE DER WOCHE, Titel · Kategorie, Beschreibung, +N Pollen,
  Restzeit, eingeloggt Fortschrittsbalken (geschafft → "Im Hive einlösen",
  sonst "Jetzt inserieren", ausgeloggt "Mitmachen" → /login), Link /hive.
  Ohne featured Challenge rendert die Sektion nichts.
- Hive: Kategorie-Name auf der Challenge-Karte.

## Verifiziert (Preview, echte Daten)
Test-Challenge "Games-Woche" (3 Inserate in Games, featured): Banner erschien
mit Kategorie + Countdown; Fortschritt zählte exakt die 2 Games-Inserate des
Owners und ignorierte Service/Miete-Inserate anderer Kategorien; Zeitfenster
greift (Inserate vor starts_at zählen nicht). Test-Challenge danach entfernt.
