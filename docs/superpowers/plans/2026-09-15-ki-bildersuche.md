# KI-Bildersuche — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Icon auf dem Artikelfoto findet per Bildmodell ähnliche aktive Inserate.
**Architecture:** Neue Route `/api/ai-similar` (Auth-Check, Kandidaten per PostgREST, OpenRouter Vision, ID-Validierung, Rückgabe fertiger Inserate). ListingClient: Knopf auf dem Titelbild, Ergebnisbereich unter der Galerie mit ListingCards + Grund-Chip.
**Tech Stack:** Next.js 14 App Router, OpenRouter `anthropic/claude-haiku-4.5`, bestehende ListingCard.
**Spec:** `docs/superpowers/specs/2026-09-15-ki-bildersuche-design.md`

### Task 1: Route `src/app/api/ai-similar/route.js`
- [ ] Datei nach Spec anlegen (Auth wie ai-search, Kandidaten max 24 / 12 mit Bild, JSON `{treffer:[{id,grund}],hinweis}`, IDs gegen Kandidaten validieren, Inserate mit `cover_image`/`categoryName`/`sellerName` zurückgeben).
- [ ] Ohne Token: `curl -X POST .../api/ai-similar -d '{}'` → 401.

### Task 2: ListingClient
- [ ] State: `bildSuche` `{ status: "idle"|"laedt"|"fertig"|"fehler", treffer, hinweis, fehler }`.
- [ ] Funktion `sucheAehnlichePerBild()`: Session-Token holen (sonst Fehler "Bitte melde dich an, um die Bildersuche zu nutzen"), POST mit `listingId`, Ergebnis in State; Upstream-Fehler → "Die Bildersuche ist gerade nicht erreichbar".
- [ ] Knopf im Galerie-Container nach dem Favoriten-Herz: `position:absolute; bottom:14px; right:14px`, 40px rund, weiss 85%, Lucide `ScanSearch`, `aria-label="Ähnliche per Bild finden"`, `e.stopPropagation()`, disabled während `laedt`.
- [ ] Bereich direkt nach der Galerie (vor der nächsten Sektion): Überschrift "Ähnlich per Bild", X zum Schliessen, Raster `repeat(auto-fill, minmax(200px,1fr))` mit `ListingCard` + Chip `grund`; Leerfall zeigt `hinweis`; Fehlerfall roter Text.
- [ ] Import `ScanSearch` ergänzen.

### Task 3: Live-Test (Preview, eingeloggt via mksession)
- [ ] Game-Boy-Inserat: Klick → zweites Game-Boy-Inserat zuoberst, genau ein Aufruf.
- [ ] Ausgeloggt: Anmelde-Hinweis, kein Modell-Aufruf.
- [ ] Bestehende "Ähnliche Artikel"-Sektion weiterhin vorhanden.

### Task 4: Nachführen
- [ ] Beta-Checkliste (Inserat-Detail): "Bildersuche-Icon auf dem Foto findet ähnliche Inserate mit Begründung; ohne Login Hinweis".
- [ ] Rep-Log 15.09.: neues Feature, melder Denis.
- [ ] Commit + Push.
