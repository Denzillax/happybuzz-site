# Bewerben v3: Tester = alle Angemeldeten, eine Stelle pro Person, Absage

Datum: 16.08.2026 · Status: vom Nutzer freigegeben

## Entscheidungen (Nutzer)

- Beta-Tester sind ALLE, die sich anmelden. Sie sind normale Kunden, es gibt
  keine Tester-Bewerbung mehr.
- Man kann sich nur auf EINE Mitarbeiter-Stelle bewerben (gleichzeitig).
- Der Owner kann eine Bewerbung absagen. Der Bewerber sieht: "Leider müssen
  wir dir mitteilen ..." (Glocke + Status auf /bewerben). Nach einer Absage
  wird der Platz frei: eine andere Stelle ist wieder wählbar, dieselbe nicht.
- /beta bekommt oben eine Erklär-Sektion in einfachen menschlichen Worten mit
  etwas Humor; die Checkliste bleibt darunter und wird auf den neuesten Stand
  gebracht.

## 1. Migration (supabase/migrations/20260816_applications_v3.sql)

- Check-Constraint neu: status in ('neu','erledigt','abgesagt').
- Partieller Unique-Index: unique(user_id) where status = 'neu'
  (nur eine offene Bewerbung pro Person, auch auf DB-Ebene).

## 2. /bewerben (src/app/(public)/bewerben/page.jsx)

- Tester-Karte und TESTER-Konstante entfernen. Oben stattdessen Hinweisbox:
  wer angemeldet ist, ist schon Beta-Tester, es gibt nichts zu bewerben
  (Link zu /beta).
- Vier Funktionskarten bleiben. Kartenzustände:
  - status neu: Moss-Haken, "Beworben. Denis meldet sich bei dir."
  - status erledigt: Moss-Haken, "Bewerbung abgeschlossen."
  - status abgesagt: gesperrt, Text "Leider müssen wir dir mitteilen:
    diesmal hat es nicht geklappt. Danke für dein Interesse."
  - keine eigene Zeile, aber eine offene (neu) Bewerbung existiert:
    gesperrt, "Du hast dich schon als X beworben. Eine Stelle pro Person."
  - sonst: klickbar.
- Insert-Fehler 23505 (gleiche Rolle nochmal ODER Race auf den
  One-Open-Index) wird still als "schon beworben" behandelt.
- Owner-Notification bleibt wie in v2.

## 3. Admin-Übersicht (OverviewTab + useAdminData)

Bewerbungs-Karte: dritter Knopf "Absagen" (bei jeder Bewerbung).
Handler rejectApplication(a):
- update applications set status='abgesagt'
- createNotification(a.user_id, 'application', 'Deine Bewerbung',
  'Leider müssen wir dir mitteilen: mit der Stelle als <Label> hat es
  diesmal nicht geklappt. Danke für dein Interesse.', '/bewerben')
- Audit-Eintrag application_rejected.
Abgesagte verschwinden aus der Karte (sie zeigt nur status neu).

## 4. Hero (src/components/home/Hero.tsx)

Beta-Slide: Beschreibung sagt, dass jeder mit Konto automatisch Tester ist.
CTAs neu: "So funktioniert die Beta" -> /beta (primär, Honey) und
"Mitarbeiter werden" -> /bewerben (sekundär).

## 5. /beta (src/app/(public)/beta/page.jsx)

Oberhalb der Checkliste eine Erklär-Sektion, Katalog-Look, Du-Form, trockener
Humor, keine Emojis, keine Em-Dashes. Inhalt: was die geschlossene Beta ist;
dass jeder mit Konto automatisch Tester ist (kein Casting, kein Formular);
was man tun soll (die Seite wie ein normaler Kunde benutzen und alles melden,
was klemmt, über den Feedback-Knopf); dass die Checkliste freiwillig für
Gründliche ist; wie man Mitarbeiter wird (/bewerben).

Checkliste aktualisieren: die Bewerben-v2-Punkte auf das neue Modell
korrigieren (kein Tester-Bewerben mehr, eine Stelle, Absage-Flow, neue
Hero-CTAs) + Punkt für die Erklär-Sektion.

## Verifikation

Live als Denis: eine Stelle bewerben -> andere gesperrt; Admin Absagen ->
Glocke mit Absage-Text, Karte "abgesagt", andere Stelle wieder wählbar;
DB-Index verhindert zweite offene Bewerbung. Testdaten danach löschen.
npm test grün.

## Nicht in diesem Umfang

- Kein E-Mail-Versand an Bewerber, keine Wiederbewerbung auf dieselbe Stelle,
  kein Freitext.
