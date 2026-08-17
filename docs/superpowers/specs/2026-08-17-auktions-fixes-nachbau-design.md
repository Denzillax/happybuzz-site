# Auktions-Fixes: Nachbau der Cloud-Session vom 17.08.2026

## Kontext
Eine parallele claude.ai/code-Session (nur GitHub-Leserechte) hat aus dem
Beta-Test der NES-Auktion 5 Fehler gefixt und 1 Feature gebaut. Ihre
DB-Änderungen waren bereits live, ihre 9 Code-Commits existierten nur als
Patch in jener Session. Statt den Patch einzuspielen (hätte mit den heutigen
Änderungen an denselben Dateien kollidiert) wurde die Code-Seite hier
nachgebaut — exakt ausgerichtet an den LIVE-Serverfunktionen, die direkt aus
der Datenbank gelesen wurden (proxy_bid, bid_increment, effective_bid_increment,
set_bid_limit_down).

## Nachgebaut (Code)
1. **Enddatum**: createListing berechnet auction_end aus der Dauer (vorher
   blieb es leer — Auktion wäre nie zu Ende gegangen). updateListing fasst ein
   laufendes Ende nie an (vorher NULLTE jede Bearbeitung die Uhr).
2. **Gebotsmaske = Serverregeln**: Staffel-Spiegel von bid_increment
   (<10→0.50, <50→1, <100→2, <500→5, <1000→10, sonst 20), bid_step gewinnt.
   Erstes Gebot ab Startpreis; Zeile "Nächstes Gebot"; Erhöhen-Vorbelegung =
   eigenes Limit + Schritt; Senken bis zum eigenen aktuellen Gebot
   (set_bid_limit_down erlaubt >= amount).
3. **Verlaufs-Sortierung**: getBidHistory sortiert bei identischem Zeitstempel
   (Auto-Gegengebot in derselben Transaktion) zusätzlich nach Betrag.
4. **Gebotsschritt-Feld** im Auktionsformular: 0.10/1.00/5.00, Standard 1.00;
   createListing/updateListing persistieren bid_step (DB-CHECK erzwingt die Liste).

## Migrationen rekonstruiert (bereits live, Dateien fürs Repo)
- 20260817_profiles_staff_update.sql (Staff darf fremde Profile bearbeiten —
  Beta-Zugang/Sperren/Verifikation trafen vorher still null Zeilen)
- 20260817_auction_bid_step.sql (bid_step + CHECK + effective_bid_increment)
- 20260817_proxy_bid_notifies_seller.sql (finale proxy_bid: bid_step,
  Verkäufer-Benachrichtigung Glocke/E-Mail/Push serverseitig)

## Verifiziert
- NES-Detailseite: Enddatum "30. Aug. 2026, 23:51" sichtbar (vorher Strich);
  Gebotsverlauf zeigt AHA (4.50, automatisch) ZUOBERST trotz identischem
  Zeitstempel mit Ivans Gebot; 4 Gebote.
- Maskenrechnung gegen Live-Daten: bid_step 1, Top 4.50 → nächstes Gebot 5.50.
- Formular: Gebotsschritt-Select mit exakt 3 Optionen, Standard CHF 1.00.
- Alle 67 Tests grün. Nicht live testbar ohne Fremdkonto: das Abgeben eines
  echten Gebots (laufende echte Auktion mit echten Testern — bewusst nicht
  angefasst); die Server-Seite ist von der Cloud-Session bereits live erprobt.
