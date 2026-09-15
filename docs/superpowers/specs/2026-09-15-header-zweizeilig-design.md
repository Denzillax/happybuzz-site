# Header zweizeilig (Ricardo-Vorbild) — Design-Spec

Datum: 15.09.2026 — Status: von Denis freigegeben (Variante D)

## Ziel
Der einzeilige Header drängte Suche, zwei gelbe Knöpfe, vier Symbole, Level-Abzeichen
und Avatar in eine Zeile. Neu: zwei Zeilen, die Suche bekommt die volle Breite.

## Zeile 1 (56px, sticky)
Logo · "Kategorien"-Pille (Hairline, rund, öffnet MegaMenu) · Freiraum · Inserieren
(Honey-Pille, einziger gelber Knopf) · Trennlinie · Herz (Favoriten-Dropdown) ·
Glocke · Chat · Trennlinie · Avatar (+Chevron, Profilmenü). Das Level-Abzeichen
(NektarBadge) verlässt den Header und steht im Kopf des Profilmenüs.

## Zeile 2 (52px, scrollt mit)
Suche über volle Breite: Chip-Pille (#F2EEE7), Lupe, Eingabe mit Platzhalter
"Was suchst du? Zum Beispiel: Rennvelo unter 300 Franken", Sparkles (KI-Suche,
Verhalten unverändert), Suchen-Knopf schwarz (#191615, weisse Schrift, rund).
Autocomplete klappt unter dem Feld auf.

## Mobil (<768px)
Unverändert: Logo, Symbole, Such-Pille unter dem Logo. Zeile 2 wird nicht gezeigt.

## Technik
`Header.tsx` liefert `<div class="hdr-top">` (sticky, top 0, z-index 50) und
`<div class="hdr-searchrow hdr-desktop">` als Geschwister. Alle Handler bleiben.

## Test (live, 1400px + 375px)
Zeile 1 klebt beim Scrollen, Zeile 2 nicht; nichts bricht um; Suche, KI-Sparkles,
Kategorien-Menü, Dropdowns funktionieren; mobil unverändert, kein Überlauf.

## Nachtrag 15.09. (Denis, Ricardo-Vorbild, Variante A)
- Ganzer Header sticky (beide Zeilen).
- Suchfeld weiss, 2px Honey-Rand, 48px, angesetzter Honey-Suchen-Block mit Lupe rechts, Sparkles davor.
- Zeile 1 rechts: Textmenues mit Pfeil statt Symbolen: Inserieren (Honey-Pille: Neues
  Inserat, Meine Inserate, Meine Verkaeufe, Gebuehren), Kaufen (Stoebern, Meine Kaeufe,
  Meine Gebote, Buchungen), Favoriten (Artikel, Verkaeufer, gespeicherte Suchen),
  Trennlinie, Glocke, Chat, Trennlinie, Profil (Avatar + Vorname: Hive mit Level,
  Einstellungen, Admin, Abmelden). Gast: Menues fuehren zum Login, rechts "Anmelden".
