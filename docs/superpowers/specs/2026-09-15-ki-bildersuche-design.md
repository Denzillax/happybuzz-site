# KI-Bildersuche auf dem Inserat — Design-Spec

Datum: 15.09.2026
Status: von Denis freigegeben (Einstieg: Icon auf dem Inserat; Technik: Bildmodell vergleicht live)

## Ziel
Ein Symbol auf dem Artikelfoto der Inseratseite findet anhand des Fotos ähnliche
aktive Inserate. Ergänzt die bestehende Sektion "Ähnliche Artikel" (rein nach
Kategorie), ersetzt sie nicht.

## Bausteine
1. **Icon** (`ListingClient.jsx`, Galerie): runder weisser Knopf unten rechts auf
   dem Titelbild, Lucide `ScanSearch`, `aria-label`/`title` "Ähnliche per Bild
   finden". Desktop und Mobil. Zustand "Vergleicht..." während des Aufrufs.
2. **Route** `POST /api/ai-similar` `{ listingId }`, nur eingeloggt (Token-Check
   wie `/api/ai-search`). Server: Inserat (Titel, Kategorie, Titelbild-URL) und
   Kandidaten laden: aktive Inserate ausser dem eigenen, gleiche Hauptkategorie
   zuerst, dann Rest, max 24; die ersten 12 mit Titelbild-URL, die übrigen nur
   mit Titel. Bildmodell (OpenRouter, `anthropic/claude-haiku-4.5`) bekommt das
   Artikelfoto + Kandidaten (Bilder als image_url, Titel als Text) und liefert
   JSON `{ treffer: [{ id, grund }], hinweis }` mit max 6 IDs, `grund` ein
   Halbsatz, `hinweis` nur wenn nichts passt. Server validiert IDs gegen die
   Kandidatenliste und liefert die vollständigen Inserate (für ListingCard) in
   der Modellreihenfolge zurück.
3. **Anzeige** (`ListingClient.jsx`): unter der Galerie klappt "Ähnlich per Bild"
   auf: ListingCards im Raster, je ein Chip mit `grund`. Leerfall: Hinweis-Text.
   Schliessen-X.
4. **Fehler**: 401 → "Bitte melde dich an, um die Bildersuche zu nutzen";
   Upstream-Fehler → "Die Bildersuche ist gerade nicht erreichbar". Kein
   Absturz, Knopf wieder frei.

## Grenzen (bewusst)
- Kein Cache, ein Bildaufruf pro Klick (etwa doppelte Kosten einer
  Inserat-Erkennung). Bei mehreren hundert Inseraten Umstieg auf Bild-Tags beim
  Inserieren (Kommentar in der Route).
- Kein Foto-Upload in der Suche (separate Idee).

## Test (live)
1. Klick auf "Nintendo Game Boy Original" → "F1 Pole Position ... Game Boy" ganz oben.
2. Klick ohne Login → Anmelde-Hinweis, kein API-Aufruf ans Modell.
3. Genau ein /api/ai-similar-Aufruf pro Klick; Knopf während des Aufrufs gesperrt.
4. Bestehende Sektion "Ähnliche Artikel" unverändert.
