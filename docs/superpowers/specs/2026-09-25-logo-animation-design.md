# Animiertes Logo für App-Start und Admin (Design)

Datum: 25.09.2026. Entschieden mit Denis im Brainstorming. Gilt fürs Live-Design (`BEEDARO-alt`), das neue Design bekommt dasselbe Bauteil später.

## Problem

Der Splash der installierten App zeigt Logo-Pop, gelben Wisch und Claim, ohne Bezug zum neuen Logo. Das Admin-Dashboard hat noch das
alte `logo.svg` in der Seitenleiste und drei hüpfende Waben als Ladeanzeige.

## Entscheidungen

- Animation A: das B steht, die sechs Kacheln rasten von aussen nach innen ein, danach wischt sich die Wortmarke von links auf.
  In Schleife lösen sich die Kacheln wieder und kommen erneut, die Wortmarke bleibt.
- Einsatz: Splash der App (einmal) und Admin (Seitenleiste neues Logo in Weiss, Ladeanzeige in Schleife). Nicht im Browser beim
  ersten Aufruf, das würde die Startseite verzögern.
- Reines CSS (Keyframes mit Verzögerung pro Kachel), kein JavaScript-Timer.

## Bausteine

- `src/components/shared/LogoAnimiert.jsx`: Props `width`, `white`, `schleife`. SVG mit B und sechs Kacheln (Masse aus `BLogo.jsx`,
  dort neu exportiert als `B_ALLEIN` und `QUADRATE_LISTE`), Wortmarke in Sora. Reihenfolge der Kacheln: entfernteste zuerst, die
  drei am B zuletzt, je 90 ms versetzt, kurzes Überschwingen. Wortmarke ab 0.65 s per clip-path aufgedeckt. Gesamt etwa 1.3 s.
- `globals.css`, Block LOGO ANIMIERT (`la-*`): Keyframes `la-ein` (einmal), `la-schleife-kachel` (2.6 s, Kacheln ein, Pause, aus),
  `la-wort`. Bei `prefers-reduced-motion` keine Animation, alles sofort sichtbar.
- `AppSplash.jsx`: `LogoAnimiert` statt Logo plus Balken, Claim blendet nach 0.9 s ein. Ausblenden nach 1.9 s, weg nach 2.35 s.
- `AdminShell.jsx`: `Logo width={124} white` statt `logo.svg`.
- `admin/page.jsx`: Ladezustand mit `LogoAnimiert schleife` und "Dashboard wird geladen" statt Waben.

## Test

- Preview `/?splash=1` (Splash im Browser erzwingen) und `/admin`.
- Beta-Checkliste: "App-Start: Logo baut sich aus Kacheln auf, danach die Wortmarke".
