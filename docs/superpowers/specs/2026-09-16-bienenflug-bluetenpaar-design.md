# Bienenflug und Blütenpaar (Design, 16.09.2026)

Zwei weitere Tagesspiele im Hive neben dem Wabenspiel, gleiche Ökonomie: Einsatz 5/10/20 Pollen, ein Spiel pro Schweizer Kalendertag, alles serverseitig entschieden, Tabellen ohne Policies (RLS an), Zugriff nur über SECURITY-DEFINER-RPCs, Pollen über award_xp mit den Gründen flug_einsatz/flug_gewinn und paar_einsatz/paar_gewinn. Alle drei Spiele stehen als Reiter im Block "Tägliche Spiele" (src/components/hive/TaeglicheSpiele.jsx), die Einsatzwahl ist geteilt (EinsatzWahl.jsx).

## Bienenflug (Höher oder Tiefer)
- Karten 1 bis 12, erste Karte liegt offen. Tipp "hoch" oder "tief" auf die nächste Karte, gleiche Karte zählt als daneben.
- Multiplikator nach Treffern: 1.3 / 1.7 / 2.3 / 3.2 / 4.5 / 6.5. Mitnehmen ab einem Treffer, nach 6 Treffern automatisch.
- Optimales Tippen trifft im Mittel zu 71 Prozent (8.5 von 12). Erwartungswert je Ausstieg 0.80 bis 0.92 des Einsatzes.
- RPCs: flug_heute(), flug_start(p_einsatz), flug_tipp(p_spiel, p_tipp), flug_mitnehmen(p_spiel). Tabelle flug_spiele mit verlauf (alle gezogenen Karten).
- Anzeige: Verlauf als kleine matte Karten, aktuelle Karte gross, Knöpfe Höher/Tiefer (bei 12 bzw. 1 gesperrt), Mitnehmen in Petrol.

## Blütenpaar (Memory)
- 12 Karten, 6 Motive doppelt (Lucide-Pflanzen-Icons), 8 Züge (ein Zug = zwei Karten).
- Auszahlung nach Paaren: 0-1 = Einsatz weg, 2 = 0.7x, 3 = 1x, 4 = 1.5x, 5 = 2x, 6 = 3x. Geschicklichkeit, ein guter Spieler liegt bei 4-5 Paaren.
- RPCs: paar_heute(), paar_start(p_einsatz), paar_aufdecken(p_spiel, p_karte). Die Sicht liefert Werte nur für gefundene Karten und die offene erste Karte; ein nicht passendes Paar kommt einmalig mit beiden Werten zurück, der Browser zeigt es 0.9 s und dreht es zurück. Nach Spielende alle Werte.
- Tabelle paar_spiele: karten, gefunden, erste, zuege, paare, status laeuft/fertig/verfallen.

## Gemeinsam
- Spiel von gestern im Status laeuft verfällt beim nächsten Aufruf.
- Pollen-Verlauf zeigt Einsatz (minus, rot) und Gewinn (plus). Der globale Pollen-Toast ist für waben_/flug_/paar_ stumm.
- Bewusst nicht dabei: Ranglisten, Einsatz über 20, mehrere Spiele pro Tag und Spiel, Wochenwette (Idee C, später).
