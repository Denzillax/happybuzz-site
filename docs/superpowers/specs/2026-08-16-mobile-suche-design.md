# Mobile Suche: Suchfeld auf /search statt im Hamburger

Datum: 16.08.2026 · Status: vom Nutzer freigegeben (Ansatz 1)

## Problem

Die /search-Seite hat kein Freitext-Suchfeld; auf Desktop übernimmt das die
Header-Leiste, mobil gibt es die Suche nur versteckt im Hamburger-Menü. Der
"Suche"-Tab der Bottom-Nav führt auf eine Seite, auf der man nichts
eintippen kann.

## Lösung (Ansatz 1)

1. **/search (src/app/(public)/search/page.jsx):** Ganz oben im Inhalt eine
   Suchzeile im Katalog-Look (1.5px Ink-Rahmen, Suchen-Knopf in Ink),
   nur mobil sichtbar (CSS-Klasse `search-mobile-bar`, unter 768px).
   Eigener Draft-State, synchronisiert mit dem bestehenden `query`-State;
   Enter oder Knopf setzt `query` + `setPage(1)` (bestehende Suchlogik).
   `autoFocus`, wenn ohne Suchbegriff angekommen: auf Desktop wirkungslos,
   weil das Feld display:none ist.
2. **globals.css:** `.search-mobile-bar { display: none }`, unter 768px
   `display: flex`.
3. **Header (src/components/layout/Header.tsx):** Der Suchblock im
   Hamburger-Menü wird ersatzlos entfernt. Desktop-Suchleiste unverändert.
4. **Beta-Checkliste:** `mob_search`-Punkt beschreibt das neue Verhalten
   (Suche-Tab -> Suchfeld oben auf der Seite, nicht mehr im Hamburger).

## Verifikation

Preview mobil (375px): /search zeigt Suchfeld oben, Tippen + Suchen filtert
die Treffer; Hamburger-Menü ohne Suchfeld. Desktop (1280px): Suchfeld der
Seite unsichtbar, Header-Suche wie bisher.

## Nicht in diesem Umfang

Kein Vorschlags-Dropdown in der mobilen Zeile, kein Sticky-Verhalten,
kein Vollbild-Overlay.
