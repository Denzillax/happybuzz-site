# Beschreibungs-Editor mit Formatierung (Richtext)

## Entscheid (Brainstorming 17.08.2026, freigegeben)
Echter WYSIWYG-Editor (kein Markdown-Feld) mit Fett, Kursiv, Aufzählung und
Zwischentitel. Der Ricardo/Tutti/eBay-Import übernimmt Formatierung aus der
Quelle statt sie zu verwerfen.

## Datenformat + Sicherheit
- `listings.description` speichert ein striktes Mini-HTML: NUR b, i, ul/li,
  h3, p, br — keine Attribute, keine Links, kein Rest.
- Eine Quelle: `src/lib/richtext.js` mit `sanitizeDescription` (DOM-Walk mit
  Allowlist, kanonisiert strong→b, em→i, ol→ul, h1-h6→h3, div→p; Inhalt von
  script/style/iframe u.ä. wird KOMPLETT verworfen), `isFormattedDescription`,
  `descriptionPlainText`, `plainToHtml`.
- Gefiltert wird dreifach: beim Einfügen in den Editor (Paste-Handler), beim
  Speichern (createListing/updateListing via cleanDescription) und beim
  Rendern (Detailseite jagt auch DB-Bestand frisch durch den Filter).
- Alt-Bestand ohne Formatierung wird erkannt (isFormattedDescription false)
  und unverändert als Plaintext mit pre-wrap gerendert.
- Serverseite (Metadata/JSON-LD in listing/[id]/page.jsx) reduziert die
  Beschreibung per Regex auf reinen Text — dort wird nie HTML gerendert.

## Editor
`src/components/shared/RichTextEditor.jsx`: contentEditable + execCommand
(bold/italic/insertUnorderedList/formatBlock h3-Toggle), Toolbar mit 4
Knöpfen, Platzhalter via CSS :empty, Paste sanitisiert sofort. Kein
Fremdpaket. Zeichenzähler und Pflichtfeld-Prüfung laufen über
descriptionPlainText (Limit 5000 Textzeichen). Styles (Editor + Anzeige
teilen sich h3/ul/p-Formate) in globals.css (.rte-area / .rich-desc).

## Import
`importListing.js` neu: `toRichSubset` (regex-basiert, läuft in Browser und
Node wie der Rest des Parsers) dampft Quell-HTML aufs Subset ein; die
Blockauswahl-Heuristik behält vom Gewinner-Block das Roh-HTML. parseListingHtml
liefert zusätzlich `descriptionHtml` (leer, wenn die Quelle keine Formatierung
hat); das Formular bevorzugt es. Finale Absicherung bleibt die DOM-Sanitisierung
im Client. Tests: tests/importListing.test.js (+3, gesamt 24 grün).

## Verifiziert
Editor rendert mit Toolbar, Fett-Tippen erzeugt <b>; Paste-Angriff
(<script>, img onerror, onclick-Attribut) wird vollständig entschärft,
window.hacked blieb unberührt; Detailseite rendert formatierte Beschreibungen
über .rich-desc, alte Plaintext-Beschreibungen unverändert.
