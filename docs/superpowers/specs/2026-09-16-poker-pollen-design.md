# Poker mit Pollen (Design, 16.09.2026)

## Ziel
Texas Hold'em zwischen Beedaro-Nutzern, zeitversetzt (wie Schach per Post), mit Pollen als Chips. Pollen wandern nur zwischen Spielern, das Haus nimmt 2 Prozent Rake pro Pot (Bee-Impact-Geschichte, keine Inflation). Nektar und Blüten bleiben aussen vor (Geldwert, Geldspielgesetz).

## Regeln
- No-Limit Texas Hold'em, 2 bis 6 Plätze pro Tisch.
- Buy-in 20, 50 oder 100 Pollen. Blinds: Small Blind = Buy-in / 20, Big Blind = 2 x Small Blind (20: 1/2, 50: 2/4 gerundet, 100: 5/10). Der Buy-in wird beim Hinsetzen von den Pollen abgezogen (Grund poker_buyin) und beim Aufstehen als Chipstand gutgeschrieben (poker_cashout).
- Wer am Zug ist, hat 12 Stunden. Danach passt der Spieler automatisch (Check, wenn möglich, sonst Fold). Meldung in der Glocke und per Push "Du bist am Zug".
- Eine Hand nach der anderen, solange mindestens zwei Spieler Chips haben. Wer 0 Chips hat, verlässt den Tisch automatisch. Aufstehen ist zwischen den Händen möglich; während einer Hand bedeutet Aufstehen Fold plus Aufstehen nach der Hand.
- Showdown: beste 5 aus 7 Karten, Standard-Rangfolge, Side-Pots bei All-in, Split bei Gleichstand (Rest an den Spieler links vom Dealer).
- Der Tisch schliesst, wenn weniger als zwei Spieler sitzen.

## Server (supabase/migrations/20260916_poker.sql)
- Tabellen: poker_tische, poker_sitze, poker_haende (Deck, Karten pro Sitz, Board, Phase, Einsätze, Pot, wer am Zug, Frist, Log, Ergebnis). RLS an, keine Policies, Zugriff nur über SECURITY-DEFINER-RPCs. Das Deck und fremde Karten verlassen die Datenbank nie vor dem Showdown.
- RPCs: poker_tische() (offene Tische + meine), poker_tisch_erstellen(name, buy_in, max), poker_setzen(tisch), poker_starten(tisch) (Ersteller, ab 2 Spielern; automatisch bei vollem Tisch), poker_sicht(tisch) (Stand aus meiner Sicht: eigene Karten, Board, Pot, Chips aller, wer dran, Frist, Log, letzte Ergebnisse), poker_aktion(tisch, aktion, betrag) mit fold / check / call / raise / allin, poker_aufstehen(tisch), poker_timeouts() für den Cron alle 10 Minuten.
- Blattbewertung in plpgsql: poker_bewerte5 (Kategorie x 15^5 + Kicker) und poker_bewerte7 (beste der 21 Kombinationen).
- Pollen-Buchungen über award_xp: poker_buyin (minus), poker_cashout (plus). Rake bleibt unverbucht.

## Anzeige
- /poker: Tische eröffnen (Name, Buy-in, Plätze), offene Tische mit Platzzahl und Buy-in, meine Tische mit "Du bist am Zug"-Markierung.
- /poker/[id]: Tisch mit Plätzen im Kreis (Name, Chips, Dealer-Button, Einsatz, "am Zug", gefoldet), Board in der Mitte, Pot, eigene zwei Karten unten, Aktionsleiste (Passen, Schieben / Mitgehen mit Betrag, Erhöhen mit Feld + Vorschlägen, All-in), Frist-Anzeige, Verlauf der letzten Aktionen, Ergebnis der letzten Hand mit aufgedeckten Karten. Aktualisierung alle 10 Sekunden und beim Fokus.
- Header-Menü "Kaufen" bekommt keinen Eintrag; der Einstieg ist der Hive-Block "Tägliche Spiele" (Reiter "Poker" verlinkt auf /poker) und der Link im Hive-Menü.

## Bewusst nicht dabei
Echtzeit mit Timer, Turniere, private Tische mit Passwort, Chat am Tisch, Statistiken. Alles baubar auf demselben Dealer.
