# Miet-Abschluss: Benachrichtigungen + Kautionsabrechnung für den Mieter — Design-Spec

Datum: 19.08.2026 · Status: freigegeben

## Ist-Zustand (erhoben)
Von 5 Abschluss-Schritten lösten nur 2 eine Benachrichtigung aus (nur Glocke,
ohne settingsKey also ohne Mail/Push): Rückgabe markiert → Vermieter,
Schaden gemeldet → Mieter. Rückgabe bestätigt, Schaden akzeptiert und
Kaution zurückerstattet waren komplett stumm. Die Kautions-Rechnung
(/order/[id]/invoice?type=deposit, QR Vermieter→Mieter) existiert, war aber
nur im Vermieter-Block verlinkt; RLS erlaubt beiden Parteien den Zugriff.

## Entscheidungen (mit Denis geklärt)
- Alle 5 Schritte benachrichtigen, Glocke + Mail/Push über bestehende
  Kanal-Schlüssel (kein neuer Schalter): Vermieter-Seite `sell_sold`,
  Mieter-Seite `buy_payment`.
- Mieter sieht die Kautionsabrechnung ebenfalls (Box + Rechnungs-Link),
  bei Status returned und completed.

## Umsetzung
### lib/listings.js
- markAsReturned: bestehende Notification + settingsKey "sell_sold".
- confirmReturn: NEU Notification an Mieter ("Rückgabe bestätigt. Kaution
  CHF X wird dir zurückerstattet."), key "buy_payment".
- reportDamage: bestehende Notification + settingsKey "buy_payment".
- acceptDamage: NEU Notification an Vermieter ("Mieter hat die Schadens-
  meldung akzeptiert..."), key "sell_sold".
- confirmDepositReturned: NEU Notification an Mieter ("Kaution CHF X
  zurückerstattet. Miete abgeschlossen."), key "buy_payment".

### Bestellseite (order/[id]/page.jsx)
- Mieter-Block bei Status returned: Abrechnungsbox (Kaution / − Schaden /
  Rückerstattung) + Link "Kautions-Rechnung (QR) ansehen".
- Nach completed (Mieter, nur Miete mit Kaution): derselbe Link unter den
  Abschluss-Links.

## Nicht im Umfang
Keine DB-Änderung, keine neuen Einstellungs-Schalter, kein Escrow.

## Verifikation
Anzeige-Blöcke per Code-Review (echte Miete nicht weiterschalten);
Notifications-Signaturen gegen bestehende Aufrufe geprüft; RepLog + Beta.
