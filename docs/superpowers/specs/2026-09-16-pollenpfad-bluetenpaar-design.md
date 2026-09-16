# Pollenpfad und Blütenpaar (Design, 16.09.2026)

Hinweis: Der Bienenflug (Höher oder Tiefer) war am 16.09. kurz live und wurde noch am selben Abend durch den Pollenpfad ersetzt (Denis: zu simpel). Migration 20260916_pollenpfad.sql entfernt ihn.

Zwei weitere Tagesspiele im Hive neben dem Wabenspiel, gleiche Ökonomie: Einsatz 5/10/20 Pollen, ein Spiel pro Schweizer Kalendertag, alles serverseitig entschieden, Tabellen ohne Policies (RLS an), Zugriff nur über SECURITY-DEFINER-RPCs, Pollen über award_xp mit den Gründen flug_einsat## Pollenpfad (Lauf mit Meta-Fortschritt)
- Ein Lauf pro Tag über 10 Felder. Pro Schritt wählt man: sicherer Weg (8 % Wespe, Stand +0.10), riskanter Weg (35 % Wespe, Stand +0.50) oder Ereignisfeld (30 % Wespe, 25 % Blüte = Stand x1.6, 20 % Regen = ein Feld zurück, 25 % Schild).
- Schild: wehrt einmal eine Wespe ab (Lauf geht weiter, Schild verbraucht). Hat man schon eines, gibt das zweite Stand +0.20. Ein Schild überlebt den Tag: wer den Lauf mit Schild beendet, startet morgen damit.
- Mitnehmen ab Feld 1 (Gewinn = floor(Einsatz x Stand)). Ziel (Feld 10) gibt Stand +0.30 und zahlt automatisch. Wespe: Einsatz weg.
- Wochenpunkte = erreichte Felder (+5 fürs Ziel), unabhängig vom Einsatz. Rangliste pro ISO-Woche (Europe/Zurich). Cron pfad_woche_abrechnen (Sonntag 23:15 UTC, in Zürich schon Montag) schreibt Top 3 50/30/20 Pollen gut (Grund pfad_wochenbonus, mit Glocke), idempotent über pfad_wochenbonus.
- Ökonomie: kompletter sicherer Lauf EV ~1.0, die ersten sicheren Schritte leicht positiv, riskant und Ereignis unter 1 (Ereignis ~0.85, dafür Schilde). Wochenbonus ist ein fixes Budget von 100 Pollen pro Woche.
- RPCs: pfad_heute() (liefert auch, ob ein Schild von gestern wartet), pfad_start(p_einsatz), pfad_schritt(p_lauf, p_weg), pfad_mitnehmen(p_lauf), pfad_rangliste() (Top 10 + eigener Rang). Tabellen pfad_laeufe (mit schritte-Verlauf als jsonb) und pfad_wochenbonus.
- Anzeige (src/components/hive/Pollenpfad.jsx): Pfadleiste 0..10 mit Ziel-Flagge, aktuelle Position dunkel, Schild-Icon darauf; drei Weg-Karten mit Kurzinfo; Ergebniszeile mit Icon; Mitnehmen in Petrol; darunter die Wochenrangliste (Top 5 + eigener Platz).

iel). Tabelle flug_spiele mit verlauf (alle gezogenen Karten).
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
