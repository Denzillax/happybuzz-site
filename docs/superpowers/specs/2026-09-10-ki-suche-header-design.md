# KI-Suche im Header-Suchfeld — Design-Spec

Datum: 10.09.2026
Status: von Denis freigegeben (Variante Sparkles-Knopf im Feld)

## Ziel

Die KI-Suche (Panel auf /search, seit 10.09.) ist auch aus dem Header-Suchfeld
erreichbar: ein Klick auf ein Sparkles-Symbol im Feld öffnet die Suchseite mit
offenem KI-Panel und nimmt bereits getippten Text mit.

## Umsetzung

### Header (`src/components/layout/Header.tsx`)
- In der Desktop-Suchleiste, rechts im Feld direkt VOR dem Honey-Suchen-Knopf:
  ein Icon-Button mit Lucide `Sparkles` (Farbe Petrol #0B5E5C, dezent,
  `aria-label`/`title` "KI-Suche").
- Klick: `router.push("/search?ki=1" + (text ? "&q=" + encodeURIComponent(text) : ""))`
  mit dem aktuell getippten Text des Header-Suchfelds. Leeres Feld ist erlaubt
  (öffnet nur das Panel).
- Der Header enthält KEINE KI-Logik, er reicht nur weiter.
- Mobile Such-Pille bleibt unverändert (führt auf /search, dort steht der
  KI-Knopf neben dem Titel).

### Suchseite (`src/app/(public)/search/page.jsx`)
- Beim Laden Query-Parameter lesen: `ki=1` setzt `kiOffen=true`; ein
  mitgegebenes `q` wird als `kiText` übernommen (das normale `q`-Verhalten
  der Stichwortsuche darf dabei nicht anspringen — der Text gehört der KI).
- Ist Text dabei, startet `kiSuchen()` automatisch, genau EINMAL
  (Ref-Guard gegen Re-Render/StrictMode-Doppelauslösung).
- Ohne Text: Panel offen, Fokus im KI-Eingabefeld (autoFocus besteht schon).
- Fehlerfälle unverändert im Panel: Anmelde-Hinweis ohne Login,
  Nichterreichbarkeit, Sortiments-Hinweis.

## Abgrenzung
- Keine automatische Spracherkennung im Header, kein Dropdown beim Tippen
  (bewusst verworfen: Aufwand bzw. unberechenbare KI-Kosten).

## Test (live im Preview)
1. Header: Text tippen, Sparkles klicken → /search mit offenem Panel,
   Text übernommen, KI-Suche läuft und setzt Filter.
2. Sparkles mit leerem Feld → Panel offen, Fokus im KI-Feld, kein KI-Aufruf.
3. Enter im Header-Feld → weiterhin normale Stichwortsuche (unverändert).
4. Doppel-Ausführungs-Schutz: ein einziger /api/ai-search-Aufruf pro Einstieg.
