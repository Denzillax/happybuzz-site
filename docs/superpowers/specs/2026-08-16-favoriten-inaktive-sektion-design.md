# Favoriten: Sektion "Nicht mehr verfügbar"

## Problem
`getUserFavorites` lädt Favoriten ohne Status-Filter. Verkaufte, abgelaufene und
sogar gelöschte Inserate rendern als normale, aktiv aussehende Karten; der
Status ist erst auf der Detailseite erkennbar.

## Entscheid (Brainstorming 16.08.2026)
Eigener Bereich unterhalb der aktiven Favoriten (Option "Eigener Bereich"),
zusätzlich innerhalb des Bereichs ausgegraute Karten mit Status-Stempel.

## Verhalten
- Klassifizierung:
  - Aktiv: `status = 'active'` und (keine Auktion oder `auction_end` in der Zukunft).
  - Nicht mehr verfügbar: `status = 'sold'` (Stempel VERKAUFT); `status = 'expired'`
    oder aktive Auktion mit `auction_end` in der Vergangenheit (Stempel BEENDET).
  - `status = 'deleted'`: erscheint gar nicht (Filter in `getUserFavorites`).
- Darstellung: unter dem normalen Grid eine Sektion mit Mono-Titel
  "NICHT MEHR VERFÜGBAR (n)", ein-/ausklappbar (Standard: ausgeklappt).
  Karten dort gedimmt (Bild entsättigt), Stempel quer auf dem Bild im
  Katalog-Stempel-Stil. Herz zum Entfernen funktioniert weiter.
- Suche filtert beide Bereiche; Tab-Zähler "Inserate (n)" zählt alle (ohne deleted).
- Sektion erscheint nur, wenn es inaktive Favoriten gibt.

## Umsetzung
- `src/lib/listings.js` `getUserFavorites`: deleted ausfiltern (Query-Filter
  `status neq deleted`), Rest unverändert liefern.
- `src/components/shared/ListingCard.jsx`: neuer optionaler Prop
  `statusOverlay` (String). Wenn gesetzt: Karte gedimmt (opacity/grayscale auf
  dem Bild) + Stempel-Overlay mit dem Text. Kein Verhalten-Change ohne Prop.
- `src/app/(public)/favorites/page.jsx`: Klassifizierungs-Helfer, zwei Grids,
  Collapse-State für die Sektion.
- Beta-Checkliste: 2 neue Checkpunkte (Sektion + Stempel/deleted).
