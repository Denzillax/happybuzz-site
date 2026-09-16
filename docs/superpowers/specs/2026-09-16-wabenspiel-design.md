# Wabenspiel im Hive (Design, 16.09.2026)

## Ziel
Tägliche Bindung: einmal pro Tag ein kleines Spiel im Hive, das Pollen bringt oder kostet (Denis: "es sollte auch Pollen abziehen wenn man verliert").

## Spiel
- 9 Waben (3x3), davon 7 Honig und 2 Wespen, serverseitig gemischt.
- Einsatz wählbar: 5, 10 oder 20 Pollen. Ein Spiel pro Schweizer Kalendertag.
- Der Einsatz wird beim Start abgezogen. Jede aufgedeckte Honigwabe hebt den Multiplikator: 1.2 / 1.5 / 2 / 3 / 5 / 10 / 25 (nach 1..7 Honig). Gewinn = floor(Einsatz x Multiplikator).
- "Mitnehmen" jederzeit ab einer Honigwabe. Wespe: Spiel verloren, Einsatz weg. Alle 7 Honig: automatisch mitgenommen.
- Fairness: fairer Multiplikator wäre 1/P(überleben) = 1.29 / 1.71 / 2.4 / 3.6 / 6 / 12 / 36. Der Erwartungswert liegt bei jedem Ausstieg bei 0.83 bis 0.93 des Einsatzes, also leichter Hausvorteil, keine Pollen-Inflation.
- Laufendes Spiel von einem früheren Tag verfällt beim nächsten Aufruf (Einsatz weg).

## Server (supabase/migrations/20260916_wabenspiel.sql)
- Tabelle waben_spiele (user_id, tag, einsatz, felder int[9], aufgedeckt int[], status laeuft/mitgenommen/verloren/verfallen, gewinn). RLS an, keine Policies: Zugriff nur über SECURITY-DEFINER-RPCs. Unique (user_id, tag).
- RPCs: waben_heute(), waben_start(p_einsatz), waben_aufdecken(p_spiel, p_feld), waben_mitnehmen(p_spiel). Antwort immer {ok, spiel, pollen?}; spiel.felder ist null, solange das Spiel läuft.
- Pollen über award_xp mit Gründen waben_einsatz (negativ) und waben_gewinn (positiv), Level wird mitgerechnet.

## Anzeige
- src/components/hive/WabenSpiel.jsx, eingebunden in hive/page.jsx unter dem Level-Block. Sechseck-Waben (clip-path), Honey-Gelb verdeckt, hell mit Tropfen bei Honig, dunkel mit Käfer bei Wespe. Nach Spielende bleibt das aufgelöste Raster sichtbar.
- Texte: "Ab 5 Pollen spielbar." / "Einsatz 10, jetzt 15 Pollen, nächste Honigwabe: 20" / "Mitgenommen: +15 Pollen" / "Wespe. 10 Pollen weg. Morgen wieder." / "Heute schon gespielt. Morgen wieder."
- Pollen-Verlauf zeigt "Wabenspiel: Einsatz" (rot, minus) und "Wabenspiel: Gewinn". Der globale Pollen-Toast bleibt für waben_* stumm, das Spiel meldet selbst.

## Bewusst nicht dabei
Rangliste fürs Spiel, Einsatz über 20, mehrere Spiele pro Tag, Startseiten-Teaser.
