# Effekte (Denis, 18.09.2026)

Ziel: Die Seite antwortet sichtbar auf Handlungen und wirkt beim Scrollen und Laden
hochwertiger. Ton: trocken, präzise, keine Deko. Kein Konfetti, keine Verläufe.

## Regeln
- Alles respektiert `prefers-reduced-motion`: dann keine Bewegung, nur Endzustand.
- Dauer 150 bis 600 ms, Ausklang `cubic-bezier(.2,.7,.2,1)`.
- Inhalte dürfen nie unsichtbar bleiben, wenn JavaScript nicht läuft.
- Bausteine an einem Ort: `src/components/shared/effects.jsx` und ein Block
  "EFFEKTE" in `globals.css`. Klassen mit Präfix `bd-fx-`.

## Die elf Effekte
1. Favorit: Herz springt beim Setzen kurz an (Karte und Inseratseite).
2. Gebot: Preis zählt von alt auf neu, Zeile blitzt kurz in Honig.
3. Kauf: Stempel "Gekauft" / "Gemietet" setzt sich auf die Bestellseite, einmal pro
   Bestellung, nur für den Käufer, nur in den ersten zwei Minuten nach dem Kauf.
4. Nektar im Header: Zahl zählt hoch, "+N" steigt auf und verblasst.
5. Inseratkarten blenden gestaffelt ein, wenn sie ins Bild kommen (40 ms Versatz).
6. Zahlenband auf der Startseite zählt hoch, sobald es sichtbar ist.
7. Auktions-Countdown: letzte Stunde pulsiert, letzte Minute tickt rot.
8. Skelett-Platzhalter mit Schimmer (Suche).
9. Seitenwechsel: kurzes Einblenden (nur Deckkraft, damit fixierte Elemente halten).
10. Kartenbild: Zoom beim Hover etwas weiter, mit langsamem Ausklang.
11. Magnetische Hauptknöpfe im Hero (nur mit Maus, maximal 6 px).

## Nicht enthalten
Ton, Haptik, Partikel, Parallax.
