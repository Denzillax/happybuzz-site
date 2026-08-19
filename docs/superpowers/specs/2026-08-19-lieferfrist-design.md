# Lieferfrist (Versandbereit innert) — Design-Spec

Datum: 19.08.2026 · Status: freigegeben

## Problem
Versand impliziert heute "geht sofort raus". Neuware (Print-on-Demand,
Lieferantenbestellung) und Ferien brauchen eine deklarierte Frist, sonst
entstehen falsche Kaeufer-Erwartungen.

## Umsetzung
- DB: listings.handling_days int not null default 2, check in (2,5,7,14).
  Bestehende Inserate bleiben bei 2 (= 1-2 Tage, bisheriges Verhalten).
- ListingForm: Select "Versandbereit innert" in der Versand-Sektion
  (sichtbar wenn Versand aktiv): 1-2 Tage / 3-5 Tage / 1 Woche / 2 Wochen.
- Anzeige: Inserat-Seite (Lieferung-Box), Kauf-Dialog (vor Bestaetigen),
  Bestellseite Kaeufer-Hinweis wenn Frist > 1-2 Tage ("Der Verkaeufer
  verschickt innert X nach Zahlungseingang").
- Label-Helfer handlingLabel() in lib/formatters.js.

## Nicht im Umfang
Keine Eskalation/Mahnung bei Ueberschreitung, kein Freitext, Deckel 2 Wochen.

## Verifikation
Formular-Select sichtbar + speichert; Inserat-Seite und Kauf-Dialog zeigen die
Frist; Bestellseiten-Hinweis per Code-Review (kein echter Kauf). RepLog + Beta.
