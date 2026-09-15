# Inserat-Raster "Luftig mit Abstand" + Raster-Umschalter — Design-Spec

Datum: 15.09.2026 — Status: von Denis freigegeben (Variante B aus dem Mockup)

## Ziel
Karten wirken heute leer (tote Fläche zwischen Preis und Verkäufer) und mit 6
Spalten sind die Bilder klein. Neu: Karte gestrafft, Raster mit Luft statt
Hairlines, Spaltenzahl per Umschalter wählbar, Bildersuche-Knopf auf der Karte.

## 1. ListingCard (`src/components/shared/ListingCard.jsx`)
- Bild 4:3, Radius 12 (unverändert). Typ-Chip oben links, Herz oben rechts.
- NEU unten links auf dem Bild: runder weisser Knopf (28px, `ScanSearch`, Petrol),
  `aria-label` "Ähnliche per Bild finden". Klick: `e.preventDefault()` +
  `router.push('/listing/<id>?bild=1')`. Immer sichtbar.
- Textblock: Titel (2 Zeilen fix, `minHeight` 2 Zeilen, Ellipsis), Preis direkt
  darunter (Sofortpreis-Zeile bei Auktionen bleibt kompakt darunter), EINE
  Meta-Zeile `Zustand · Ort · bis <Datum>` (nowrap, Ellipsis), Verkäufer-Zeile
  mit `marginTop: auto`. Die separate rechtsbündige Countdown-Zeile entfällt;
  Live-Countdown unter 24h bleibt als roter Chip auf dem Bild ("Endet bald").
- Höhe: alle Karten einer Reihe gleich hoch (Titel fix 2 Zeilen, Meta fix 1 Zeile).

## 2. Inseratseite (`ListingClient.jsx`)
- `?bild=1` beim Laden: sobald das Inserat geladen ist, `sucheAehnlichePerBild()`
  einmalig starten (Ref-Guard), Parameter aus der URL entfernen.

## 3. Raster (`globals.css`)
- `.listing-grid` und `.search-results-grid`: `gap: 14px`, kein Hintergrund,
  Zellen ohne Padding und ohne `box-shadow`, weiss.
- Spalten über Klasse am `<html>`: `html.raster-gross` → 3, Standard/`raster-mittel`
  → 4, `raster-kompakt` → 6 (Desktop ≥1025px). Tablet 768–1024: 3. Mobil <768: 2
  (unverändert). `home-swipe`-Reihen auf der Startseite folgen derselben Spaltenzahl.

## 4. Umschalter (`src/components/shared/RasterUmschalter.jsx`)
- Pille mit drei Icon-Knöpfen (Lucide `LayoutGrid`-Varianten: `Grid2x2`, `Grid3x3`,
  `LayoutGrid`), aktive Stufe weiss hinterlegt. `aria-label` je Stufe.
- Speicher: `localStorage['beedaro_raster']` ∈ gross|mittel|kompakt.
- Klasse am `<html>` setzen; beim ersten Laden per Inline-Script im `<head>`
  (`app/layout.tsx`) VOR dem Malen, damit nichts springt.
- Platz: Startseite in `SectionHeader` rechts neben "Alle ansehen" (nur bei
  Raster-Sektionen: NewListings, PopularListings), Suche in der Titelzeile.
  Mobil (<768) ausgeblendet.

## Test (live)
1. Startseite/Suche in gross/mittel/kompakt: 3/4/6 Spalten, Wahl überlebt Reload
   und gilt auf beiden Seiten, kein Springen beim Laden.
2. Karten einer Reihe gleich hoch; Meta einzeilig; kein Countdown-Leerraum.
3. Lupen-Knopf auf Karte → Inseratseite, Bildersuche startet von selbst, genau ein Aufruf.
4. Mobil 375px: 2 Spalten, Umschalter unsichtbar, kein Überlauf.
