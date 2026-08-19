# Kommunikation & Laufschrift Redesign — Design-Spec

Datum: 19.08.2026 · Status: freigegeben (Variante A)

## Problem

1. Die Laufschrift hat eine fixe Animationsdauer (30s in globals.css). Das Tempo
   hängt damit von der Textlänge ab (kurz = langsam, lang = schnell) und ist
   nicht einstellbar.
2. Der Text wird fix 6x wiederholt statt passend zur Bildschirmbreite.
3. Die Admin-Vorschau ist ein eigenes, dupliziertes Markup (Mini-Version),
   entspricht nicht der echten Laufschrift.
4. Der Kommunikations-Tab quetscht Banner, Laufschrift und Rundruf in ein
   Auto-Grid mit ungleich hohen Karten; die Historie ist ein rohes Textgrid.

## Entscheidungen (mit Denis geklärt)

- Umfang: Technik UND Tab-Redesign.
- Banner und Laufschrift bleiben getrennte Elemente (auch gleichzeitig nutzbar),
  bekommen aber denselben Editor-Aufbau.
- Tempo: 3 Stufen (langsam/normal/schnell), kein stufenloser Regler, kein Hover-Pause.
- Layout: Variante A — Unter-Pills im Tab (Banner · Laufschrift · Rundruf · Historie),
  immer ein Bereich in voller Breite.

## Umsetzung

### DB
`site_ticker` + Spalte `speed text not null default 'normal'`
mit Check `speed in ('slow','normal','fast')`. Migration live + Datei
`supabase/migrations/20260819_ticker_speed.sql`.

### Ticker-Komponente (src/components/layout/Ticker.jsx)
- `TickerBar({ message, bgColor, textColor, speed, disabled })`: reine Darstellung.
  - Misst die Breite einer Text-Einheit (`"TEXT · "`) per verstecktem Span.
  - Wiederholungen pro Hälfte: `max(2, ceil(containerBreite / einheitBreite) + 1)`.
  - Tempo in px/s: slow 45, normal 90, fast 150. Dauer = Hälftenbreite / pxProSekunde,
    gesetzt als CSS-Variable `--ticker-dur` am Track.
  - Nachmessen bei Resize (ResizeObserver) und nach `document.fonts.ready`.
- `Ticker({ placement })`: Lader wie bisher (holt site_ticker, prüft enabled/placement),
  rendert `TickerBar`.
- globals.css: `.ticker-track { animation: tickerLoop var(--ticker-dur, 30s) linear infinite; }`,
  reduced-motion unverändert (Animation aus).

### Admin (src/components/admin/tabs/KommunikationTab.jsx)
- Pills oben: Banner · Laufschrift · Rundruf · Historie (lokaler State, Default Banner).
- Gemeinsamer Editor-Aufbau für Banner und Laufschrift: grosse Live-Vorschau
  zuoberst (Laufschrift = echte `TickerBar` in Originalgrösse), dann Status-Toggle,
  Text, Farbe (Presets + Hex), Spezialzeilen (Banner: Animation; Laufschrift:
  Tempo-Segment + Platzierung), unten ein Speichern-Knopf.
- Historie in voller Breite mit Filter-Pills (Alle/Rundruf/Banner/Laufschrift),
  Zeilen mit Chip, Datum, Klartext (inkl. Tempo im Audit-Detail).
- useAdminData: ticker-State + speed, saveTicker schreibt speed und loggt es im Audit.

### Verifikation (Preview als Denis)
- Kurzer vs. langer Text bei gleicher Stufe: gleiches Tempo (px/s messbar via
  Animationsdauer/Trackbreite).
- Drei Stufen durchschalten, Vorschau = Startseiten-Laufschrift.
- Tab mobil (Pills umbrechen, Editor volle Breite).
- RepLog + Beta-Checkliste ergänzen.

## Nicht im Umfang
Zusammenlegen von Banner+Ticker, Hover-Pause, stufenloses Tempo, Zeitsteuerung.
