# Bewerben v2: Alle Tester Allrounder + Mitarbeiter-Bewerbung + Hero-Timing

Datum: 16.08.2026 · Status: vom Nutzer freigegeben

## Entscheidungen (Nutzer)

- Beta-Tester: KEINE Rollenwahl mehr, alle sind Allrounder (ein Klick).
- Mitarbeiter-Bewerbung: alle vier Funktionen wählbar (Support, Moderation,
  Finanzen, Manager), je mit Erklärung was man tut und welche Admin-Bereiche
  man sieht.
- Nach der Mitarbeiter-Bewerbung vergibt der Owner die Rolle MANUELL im
  Mitarbeiter-Tab. Eine Bewerbung schaltet NIE selbst eine Rolle frei.
- Beta-Willkommens-Slide im Hero bleibt länger stehen als die anderen.

## 1. Hero-Timing (src/components/home/Hero.tsx)

Slides erhalten optionales Feld `dwell` (ms): Beta-Slide 12000, Rest ohne
Feld = 6500 Standard. Das fixe `setInterval(6500)` wird durch eine
setTimeout-Kette ersetzt, die `slides[current].dwell ?? 6500` nutzt
(Cleanup im Effect wie bisher).

## 2. /bewerben (src/app/(public)/bewerben/page.jsx)

Zwei Sektionen, Katalog-Look bleibt:

**Beta-Tester** (oben): eine Karte "Als Beta-Tester bewerben", Text:
alle Tester sind Allrounder und testen querbeet (Kaufen, Verkaufen, Mieten,
Checkliste abhaken, Feedback melden). Klick = insert applications mit
`role = 'beta_tester'`. Beworben-Zustand wie bisher (Moss-Haken).

**Mitarbeiter werden** (darunter): vier Karten mit `role`-Keys
`mitarbeiter_support`, `mitarbeiter_moderation`, `mitarbeiter_finance`,
`mitarbeiter_manager`. Kartentexte:

- Support: "Hilft Nutzern bei Fragen und Problemen. Du siehst: Benutzer,
  Bestellungen, Meldungen, E-Mails, Feedback."
- Moderation: "Prüft neue Inserate und Meldungen, greift bei Verstössen
  durch. Du siehst: Inserate, Meldungen, Benutzer."
- Finanzen: "Behält Gebühren, Rechnungen und Mahnwesen im Blick. Du siehst:
  Rechnungen, Mahnungen, Analytik."
- Manager: "Koordiniert den ganzen Betrieb. Du siehst: fast alle Bereiche."

Hinweis unter der Sektion: "Deine Bewerbung geht direkt an Denis. Die Rolle
wird persönlich vergeben, eine Bewerbung schaltet nichts frei." Mehrere
Funktionen wählbar (Unique user+role deckt Doppelklicks ab).

Owner-Benachrichtigung wie bisher (`createNotification` an OWNER_ID),
Text nennt das deutsche Label der Funktion.

## 3. Admin-Übersicht (OverviewTab)

`ROLLE_LABEL` neu: beta_tester = "Beta-Tester (Allrounder)",
mitarbeiter_support = "Mitarbeiter: Support", analog moderation/finance/
manager. Alte Tester-Keys bleiben im Mapping (Alt-Datensätze lesbar).

Aktionen pro Bewerbung:
- role = beta_tester → wie heute: "Beta-Zugang erteilen" + "Erledigt".
- role beginnt mit `mitarbeiter_` → "Rolle vergeben" (springt via
  `setTab('mitarbeiter')` in den Mitarbeiter-Tab; `setTab` aus dem Hook,
  Export in der Implementierung prüfen und falls nötig ergänzen) +
  "Erledigt". KEIN automatisches Setzen von staff_roles.

## 4. Kein DB-Umbau

`applications` bleibt unverändert; nur neue role-Werte. RLS unverändert
(insert own, select own+staff, update staff).

## 5. Verifikation

- Hero: Beta-Slide steht messbar ~12s, die anderen ~6.5s (Timestamps im
  Preview beobachten).
- /bewerben als Zeggy: Tester-Klick + eine Mitarbeiter-Funktion → zwei
  applications-Zeilen, zwei Owner-Glocken, Beworben-Zustände korrekt.
- Admin: beide Bewerbungen sichtbar mit passenden Aktionen; "Rolle vergeben"
  landet im Mitarbeiter-Tab; "Erledigt" räumt weg (Audit-Eintrag).
- Testdaten danach entfernen. Beta-Checkliste um die Punkte ergänzen.

## Nicht in diesem Umfang

- Kein Freitext/Anschreiben, keine E-Mail an Bewerber, kein automatischer
  staff_roles-Eintrag, keine Ablehnen-Aktion (Erledigt genügt).
