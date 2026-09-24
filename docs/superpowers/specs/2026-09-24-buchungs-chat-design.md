# Chat aus Buchung und Bestellung (Design)

Datum: 24.09.2026. Entschieden mit Denis im Brainstorming.

## Problem

Die Buchungsseite zeigt seit heute überfällige Mieten und sagt "die Gegenseite anschreiben". Es gibt aber
weder auf der Buchungsseite noch auf der Bestellseite einen Weg in den Chat. Wer schreiben will, geht
über das Profil der Gegenseite oder über das Inserat. Dazu kommt die Hemmschwelle: was schreibt man,
ohne unfreundlich zu klingen.

## Entscheidungen

- Chat-Knopf auf **allen** Buchungen (offen, überfällig, abgeschlossen), nicht nur auf überfälligen.
- Bei Überfälligkeit öffnet der Chat mit einer **vorbereiteten Nachricht im Eingabefeld**. Nichts wird
  automatisch abgeschickt, keine Systemnachricht im Chat. Die Überfälligkeit erreicht den Mieter schon
  über den Cron `notify-rental-reminders`.
- Vorlagen (Tonalität: direkt, trocken, keine Ausrufezeichen):
  - Vermieter: `Hallo, die Rückgabe von "<Titel>" war am <Datum> vereinbart. Wann bekomme ich sie zurück?`
  - Mieter: `Hallo, ich bin mit "<Titel>" spät dran. Wann kann ich sie zurückbringen?`
- Der Knopf kommt auch auf die **Bestellseite**, für alle Bestellarten (Kauf, Miete, Service).
- Umsetzung in **beiden Designs** (master = Meeko, BEEDARO-alt = Live).

## Ansatz

Bestehenden Inserat-Chat wiederverwenden. Eine Konversation ist heute Inserat + Käufer + Verkäufer
(`conversations`: `listing_id`, `buyer_id`, `seller_id`, `is_public = false`). Jede Buchung und jede
Bestellung kennt diese drei Werte. Kein neues Schema.

Verworfen: eigener Chat pro Bestellung (`purchase_id` auf `conversations`). Neue Migration, zweite
Chatliste, Fragen von vor der Buchung lägen in einem anderen Thread. Zu viel für das Problem.

## Bausteine

### `openBookingChat({ listingId, buyerId, sellerId })` in `src/lib/listings.js`
Sucht die private Konversation zu Inserat, Käufer und Verkäufer, legt sie an, wenn es keine gibt,
und gibt die Konversations-ID zurück. Wirft bei Fehlern. Zieht die heutige Logik aus
`ListingClient.jsx` (dort `handleChat`) in eine Funktion, die Inseratseite ruft sie ebenfalls auf
statt sie zu kopieren. Kein Chat mit sich selbst: gibt `null` zurück, wenn Käufer gleich Verkäufer.

### Vorlage: `mahnText(rolle, titel, endDatum)` in `src/lib/bookingStatus.js`
Liefert den Vorlagentext für `rolle = "owner" | "renter"`. Datum im Format `31. Aug.` (de-CH, Tag
und Kurzmonat). Liegt neben `bookingState()`, weil beides die Buchung deutet.

### Chatseite `/chat/[id]`
Liest einmal beim Laden den Suchparameter `text` und setzt ihn ins Eingabefeld, wenn das Feld leer
ist. Schickt nichts ab. Neu laden bringt den Text zurück, das ist gewollt. Länge auf 500 Zeichen
begrenzt, sonst ignoriert.

### Buchungsseite `/bookings`
In der Aktionsspalte jeder Buchung ein Knopf "Nachricht" (weiss, Symbol `MessageCircle`), bei
Überfälligkeit "Anschreiben" in Gelb, "Jetzt abschliessen" dann weiss. Klick: `openBookingChat`,
danach `router.push("/chat/<id>" + (überfällig ? "?text=" + encodeURIComponent(mahnText(...)) : ""))`.
Käufer ist `renter_id`, Verkäufer `owner_id`. Der rote Hinweis oben bleibt.

### Bestellseite `/order/[id]`
In der Seitenleiste bei der Gegenpartei unter Name und Kontakt ein Knopf "Nachricht schreiben"
(Nebenknopf, volle Breite). Käufer ist `buyer_id`, Verkäufer `seller_id`. Bei Mieten mit
`bookingState(...).key === "overdue"` (Buchung wird dort schon geladen) dieselbe Vorlage.

## Fehler

- Konversation lässt sich nicht öffnen: Toast "Chat konnte nicht geöffnet werden." Knopf bleibt
  klickbar. Während des Öffnens ist der Knopf gesperrt (kein Doppelklick, keine doppelte Konversation).
- Ausgeloggt: `/login`, wie heute überall.

## Test

- Beta-Checkliste (`/beta`, Abschnitt Gebote & Buchungen): "Buchung: Knopf Nachricht öffnet den Chat
  zum Inserat" und "Überfällige Miete: Anschreiben öffnet den Chat mit vorbereitetem Text, nichts
  wird automatisch gesendet". Abschnitt Käufe & Verkäufe: "Bestellseite: Nachricht schreiben öffnet
  den Chat".
- Preview als Denis (Vermieter der Buchung Tromä, 24 Tage überfällig): Knopf Anschreiben, Chat
  öffnet, Vorlage steht im Feld, nichts gesendet. Zweiter Klick öffnet dieselbe Konversation.
- Beide Designs.

## Nicht Teil davon

Systemnachrichten im Chat bei Überfälligkeit, eigener Chat pro Bestellung, Mahnstufen.
