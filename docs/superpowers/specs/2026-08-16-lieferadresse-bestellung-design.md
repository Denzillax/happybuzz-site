# Lieferadresse pro Bestellung (Auswahl auf der Bestellseite)

Datum: 16.08.2026 · Status: vom Nutzer freigegeben (Ansatz A)

## Problem

Die Lieferadressen aus den Einstellungen (user_addresses) werden nirgends
verwendet; Verkäufer sehen immer die Hauptadresse aus dem Käuferprofil.

## Lösung

1. **Migration:** `purchases.delivery_address jsonb` (Schnappschuss:
   name, company, street, postal_code, city). Kein FK auf user_addresses:
   spätere Änderungen/Löschungen dürfen die Bestellung nicht verändern.
   Update-Policy für Käufer existiert bereits (buyers_sellers_update_purchases).
2. **Bestellseite (order/[id]/page.jsx):**
   - Anzeige überall (Verkäufer-Versandblock + Sidebar) über einen Helfer:
     delivery_address falls gesetzt, sonst Profil-Hauptadresse des Käufers.
   - Käufer, kein Service-Auftrag, Versand möglich, Status VOR
     shipped/picked_up: "Ändern"-Knopf in der Sidebar-Sektion Lieferadresse.
     Auswahl: Hauptadresse (Profil) + alle user_addresses; Speichern schreibt
     den Schnappschuss; Link "Neue Adresse anlegen" -> /settings (Adressen).
   - Gilt für Sofortkauf UND gewonnene Auktionen (beides landet hier).
3. **Checkliste:** Punkte für Auswahl, Schnappschuss-Verhalten und Sperre
   nach Versand.

## Verifikation

Preview als Denis-Bestellung: Adresse wechseln -> Verkäuferblock + Sidebar
zeigen die gewählte; nach "versendet" kein Ändern-Knopf mehr; Löschen der
user_address ändert die Bestellung nicht (Schnappschuss). Push nach Grün.

## Nicht in diesem Umfang

Keine Adresswahl im Kauf-Dialog, keine Adressverwaltung auf der Bestellseite
(nur Link in die Einstellungen), kein Verkäufer-Edit.
