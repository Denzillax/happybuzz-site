# Gebührenmodell: 3% bleibt, Mindest-Rechnungsbetrag CHF 10

Datum: 16.08.2026 · Status: vom Nutzer freigegeben

## Entscheidungen (Nutzer)

- Die 3%-Stufe bleibt. Analyse: Stripe/TWINT betreffen nur die Bezahlung der
  FEE-Monatsrechnung (nicht den Verkaufspreis, kein Escrow geplant). Die
  Einzugskosten sind wenige Prozent DER GEBÜHR, umgerechnet ~0.05-0.1% des
  Verkaufs. Alle Stufen (3/5/7/10%) bleiben profitabel; dem Kunden wird
  nie 2.9% + 30 Rp. aufgeschlagen.
- Einziges echtes Problem sind Mini-Rechnungen (Fixkosten + Aufwand beim
  Einzug). Lösung: Mindest-Rechnungsbetrag CHF 10 mit Übertrag.

## Umsetzung

1. **RPC create_monthly_fee_invoice (Migration):** Beim Lauf für Monat M
   werden ALLE offenen (pending) fee_ledger-Zeilen bis Ende Monat M
   zusammengezählt (ältere Monate inklusive = automatischer Übertrag).
   Ist die Summe unter CHF 10, wird KEINE Rechnung gestellt (Zeilen bleiben
   pending und rollen in den Folgemonat). Ab CHF 10 wird eine Rechnung über
   alle diese Zeilen erstellt (Referenz FEE-JJJJ-MM-XXXXXX des Laufmonats).
2. **constants.js:** `MIN_INVOICE_CHF = 10` als Frontend-Quelle (der
   SQL-Wert 10 ist in der Migration kommentiert darauf referenziert).
3. **/fees-Seite:** Hinweis beim offenen Saldo, wenn er unter CHF 10 liegt:
   Betrag wird erst in Rechnung gestellt, sobald CHF 10 zusammenkommen;
   bis dahin Übertrag in den Folgemonat.
4. **Beta-Checkliste:** Punkt für Mindest-Rechnungsbetrag + Übertrag.

## Verifikation

Transaktional (raise exception als Rollback): Seller mit CHF 4 offen ->
RPC gibt NULL, Zeilen bleiben pending; nach weiteren CHF 7 (Summe 11) ->
Rechnung über CHF 11 inkl. Vormonatszeilen. Bestehende Rechnungen bleiben
unverändert (Idempotenz-Guard bleibt).

## Nicht in diesem Umfang

Keine Änderung an Stufen, Bee-Impact, Bagatellgrenze; keine
Zahlungsabwicklungsgebühr (kein Checkout/Escrow geplant).
