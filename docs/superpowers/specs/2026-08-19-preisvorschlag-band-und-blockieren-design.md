# Preisvorschlags-Band + Nutzer blockieren — Design-Spec

Datum: 19.08.2026 · Status: freigegeben

## Problem
1. Preisvorschläge hatten keine Grenzen: bei einem CHF-50-Inserat gingen 4.90
   (Erst-Vorschlag) und 60 (Gegenvorschlag, ÜBER dem Preis) durch. Die
   Hilfe-Seite verspricht längst "zwischen 70% und 99% des Preises".
2. Es gibt keine Möglichkeit, nervige Nutzer zu sperren.

## Entscheidungen (mit Denis geklärt)
- Band 70%–99% des Inseratpreises, für BEIDE Seiten (Vorschlag und Gegenvorschlag).
- Sperre umfasst Kontakt UND Kaufen/Bieten (Ricardo-Style).

## Umsetzung

### DB (Migration user_blocks_und_offer_band, live + Datei)
- Tabelle `user_blocks(blocker_id, blocked_id, created_at, PK beide, check ungleich)`,
  RLS: nur eigene Zeilen lesen/anlegen/löschen (blocker_id = auth.uid()).
- Helfer `user_blocked(p_blocker, p_blocked)` (security definer, stable).
- Trigger `messages` BEFORE INSERT:
  - Sperre in BEIDE Richtungen zwischen den Konversationsparteien -> Exception
    'Du kannst diesem Nutzer nicht schreiben (blockiert).'
  - Offer-Band: bei message_type='offer' mit offer_amount und sell-Inserat mit
    Preis > 0: Betrag muss in [price*0.7, price*0.99] liegen -> Exception mit Bereich.
- Trigger `conversations` BEFORE INSERT: Sperre in beide Richtungen -> Exception.
- Trigger `bids` BEFORE INSERT: Verkäufer hat Bieter gesperrt -> Exception
  'Der Verkäufer nimmt von dir keine Gebote an.'
- Trigger `purchases` BEFORE INSERT: NUR wenn auth.uid() = buyer_id (käufer-
  initiierter Kauf; Auktionsabschluss per Cron und Vermieter-Bestätigung
  bleiben unberührt): Verkäufer hat Käufer gesperrt -> Exception.

### Client
- ListingClient sendPriceOffer: Band client-seitig prüfen, erlaubter Bereich
  steht im Vorschlags-Dialog; DB-Fehlertext wird als Toast durchgereicht.
- Chat counterOffer: gleiche Bandprüfung (Inseratpreis aus conv.listing),
  Bereich steht im Eingabe-Dialog.
- Chat-Detailseite: "Blockieren"-Knopf im Kopf (mit Rückfrage); blockiert +
  blendet das Gespräch aus; bei bestehender Sperre "Entsperren".
- Einstellungen: neue Sektion "Blockierte Nutzer" (Name + Entsperren).
- lib/blocks.js: blockUser/unblockUser/getMyBlocks (+ Profilnamen).
- Hilfe-FAQ: Eintrag zum Blockieren.

### Verifikation
Wegwerf-Testkonto (kein echter Tester) via Admin-API; Sperr-Durchsetzung per
REST direkt gegen die DB (Nachricht/Vorschlag/Gebot/Kauf je als Gesperrter ->
Exception); Band am Adiletten-Inserat (34.99 ab, 35 ok, 49.50 ok, 49.51 ab,
60 ab); UI als Denis (Knopf, Einstellungs-Liste). Testkonto danach löschen.
RepLog + Beta-Checkliste.

## Nicht im Umfang
Melden/Eskalation an Admin (gibt es schon), Sperren von Verkäuferseite auf
Auktionen mit BESTEHENDEN Geboten rückwirkend löschen, Block-Sichtbarkeit
für den Gesperrten (bewusst neutral gehalten).
