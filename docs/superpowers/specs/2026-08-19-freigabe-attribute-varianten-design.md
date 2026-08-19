# Freigabe-Flow, Attribut-Anzeige, Varianten & Stückzahl für Neuware — Design-Spec

Datum: 19.08.2026 · Status: freigegeben

## Probleme (erhoben)
1. Bearbeiten-Seite schaltete beim Veröffentlichen direkt auf active: der
   Owner/Admin umging so die eigene Freigabe-Queue, normale Nutzer bekämen
   eine rohe Trigger-Exception statt einer sauberen Wiedereinreichung.
2. Der Wächter-Trigger enforce_listing_publish_gate prüfte hart auf den Owner
   statt is_staff: Mitarbeiter-Freigaben (Ferienvertretung!) wären am Trigger
   gescheitert, obwohl die RPC seit heute offen ist.
3. Die Inserat-Seite zeigte gespeicherte Kategorie-Eigenschaften (Grösse,
   Farbe...) nirgends an.
4. saveListingAttributes ordnete Werte per attribute_key über ALLE Kategorien
   zu (Farbe = Kleidung + Handy + Haushalt...): Duplikate in listing_attributes.
5. Neuware: Käufer soll Grösse/Farbe beim Kauf wählen können, mit Stückzahl.

## Entscheidungen (mit Denis geklärt)
- Varianten + Stückzahl, NUR bei Festpreis + Zustand 'Neu'.
- Nie freigegebene Inserate gehen beim Bearbeiten-Veröffentlichen (zurück) in
  die Freigabe, für alle inkl. Owner. Bereits freigegebene bleiben aktiv.
- Bestehendes T-Shirt bleibt aktiv.

## Umsetzung
### DB (Migration, live + Datei)
- enforce_listing_publish_gate: is_staff(auth.uid()) statt Owner-Hardcode.
- listings.quantity int not null default 1 (check >= 0),
  listings.variant_options jsonb (z.B. {"groesse":["S","M","L"],"farbe":["Blau"]}).
- purchases.variant_choice jsonb (Schnappschuss, z.B. {"Grösse":"L"}).
- Trigger purchases BEFORE INSERT (nur listing_type sell): atomar
  quantity-1 (Abbruch bei 0: 'Ausverkauft'), Status sold erst bei 0.
  Der Client setzt sell-Inserate nicht mehr selbst auf sold.
- Datenbereinigung: listing_attributes-Zeilen löschen, deren Attribut zu einer
  Kategorie ausserhalb der Ahnenkette des Inserats gehört.

### Client
- saveListingAttributes(listingId, values, categoryId): nur Attribute der
  Kategorie-Ahnenkette; beide Aufrufer geben die Kategorie mit.
- Edit-Seite: publish bei Status draft/pending_review -> submitForReview
  (Toast 'zur Freigabe eingereicht'); sonst Status unangetastet (paused -> active bleibt).
- ListingForm: Sektion 'Neuware: Varianten & Stückzahl' (nur sell + condition new):
  Stückzahl-Feld (>=1) + pro select-Attribut Wert-Chips (Mehrfachauswahl).
- Inserat-Seite: Eigenschaften-Block (Mono-Label + Wert) unter der Beschreibung;
  bei variant_options Pflicht-Dropdowns vor dem Kaufen + 'Noch X Stück' ab quantity > 1.
- Kauf-Flow: gewählte Varianten -> purchases.variant_choice.
- Bestellseite: Variantenzeile für beide Seiten; Rechnung: Zusatz an der Artikelposition.

## Verifikation
Wegwerf-Inserat Stückzahl 3: drei Käufe (aktiv/aktiv/verkauft), vierter
abgelehnt; Formular-Sektion nur bei Neu+Festpreis; Pflicht-Dropdown blockt
Kauf ohne Wahl; Eigenschaften-Block am T-Shirt sichtbar; Edit-Publish eines
pending-Inserats landet in der Freigabe. RepLog + Beta + Hilfe-FAQ.
