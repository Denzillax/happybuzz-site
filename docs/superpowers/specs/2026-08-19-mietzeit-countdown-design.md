# Mietzeit Live-Countdown — Design-Spec

Datum: 19.08.2026 · Status: freigegeben

## Problem
Der Status "Mietzeit läuft" auf der Bestellseite zeigt nur eine blasse 6px-Leiste
mit ganzen Tagen, einmalig beim Laden berechnet. Wirkt statisch wie jeder andere
Status. Zudem lief die Rechnung bis Mitternacht am ANFANG des letzten Miettags,
der letzte Tag zählte faktisch nicht.

## Entscheidung (mit Denis geklärt)
Grosser Live-Countdown im Katalog-Stil (statt Ring oder aufgehübschter Leiste).

## Umsetzung
Neue reine Darstellungs-Komponente `src/components/order/RentalCountdown.jsx`
mit Props `startDate`, `endDate`:

- Anzeigetafel: 4 Ziffernkästchen (TAGE / STD / MIN / SEK), Mono-Schrift,
  weisse Kästchen mit Ink-Rahmen auf Sand-Hintergrund (#F9F4EC) mit Ink-Rahmen.
  Tickt sekündlich (setInterval 1s).
- Zeitrechnung: Countdown bis ENDE des letzten Miettags (23:59:59.999),
  da end_date nur ein Datum ist.
- Fortschrittsbalken: 10px mit Ink-Rahmen, Start-/Enddatum an den Enden in Mono.
  Farben: Moss-Grün (#5B8C5A) normal, Honig-Gelb (#F4A100) ab 80% verstrichener
  Zeit, Rot (#c62828) überfällig.
- Überfällig: Tafel zählt vorwärts, Ziffern rot, Label "Überfällig seit".
- Einbau: ersetzt die bisherigen Inline-Fortschrittsblöcke in BEIDEN
  "Mietzeit läuft"-Blöcken der Bestellseite (Mieter- und Vermieter-Sicht);
  restlicher Text (Kaution, Rückgabe-Knopf) bleibt.

## Nicht im Umfang
Kein DB-Change, keine Benachrichtigungen bei Überfälligkeit (existierendes
Verhalten bleibt), keine Änderung am Rückgabe-Flow.

## Verifikation
Preview mit echter Miet-Bestellung (tickt, beide Rollen), Überfällig-Fall durch
lokal manipuliertes Enddatum; RepLog + Beta-Checkliste ergänzen.
