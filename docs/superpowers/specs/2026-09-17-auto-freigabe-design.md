# Automatische Inserat-Freigabe (Design, 17.09.2026)

## Ziel
Inserate sollen ohne manuelle Freigabe live gehen, sobald eine KI-Vorprüfung sie als unauffällig einstuft. Denis prüft nur noch, was Aufmerksamkeit braucht: Blocker (Verbotenes, Betrug, Fälschung) und auffällige Inserate neuer Verkäufer. Die Prüfung deckt Verbotenes und Qualität gleichermassen ab. Automatisch abgelehnt wird nie; die KI kann in die Warteschlange schicken, entscheiden tut ein Mensch.

## Regelsatz

Eingabe an die KI: Titel, Beschreibung (Klartext), Kategorie-Pfad, Inserattyp, Preis (bzw. Startpreis, Mietpreis), Zustand, die ersten vier Bilder.

Ausgabe (strukturiert, JSON):
- `blocker[]`: verbotene Ware (Waffen, Tiere, Tabak, Medikamente, Erotik, gestohlen wirkend), Markenfälschung (Replica, auffällig billige Luxusmarke), Betrugsmuster (Vorkasse ausserhalb der Plattform, Telefonnummer, WhatsApp, Mail-Adresse, Links im Text), Bild passt nicht zum Text, Stockfoto oder Screenshot, absurder Preis. Jeder Blocker mit `code` und `grund` (ein Satz, deutsch).
- `hinweise[]`: Beschreibung unter 30 Wörtern, Foto unscharf oder dunkel, Kategorie passt nicht (mit `vorschlag`), Preis deutlich über oder unter üblich, Titel nur Grossbuchstaben. Jeder Hinweis mit `code`, `tipp` (Satz für den Verkäufer).
- `bilder_geprueft`: boolean (false, wenn kein Bild ladbar war).

Vertrauensstufe (aus der Datenbank, nicht von der KI): `bewaehrt` = mindestens drei Inserate, die je durch manuelle oder automatische Freigabe aktiv wurden, und keine Ablehnung in den letzten 90 Tagen. Sonst `neu`.

Entscheidung:
1. Blocker vorhanden → Warteschlange (`pending_review` bleibt), `review_hold_reason` = Blocker-Gründe.
2. Kein Blocker, Verkäufer bewährt → live.
3. Kein Blocker, Verkäufer neu, höchstens zwei Hinweise → live.
4. Kein Blocker, Verkäufer neu, drei oder mehr Hinweise → Warteschlange, `review_hold_reason` = "Neues Konto, mehrere Hinweise".
5. KI nicht erreichbar oder ungültige Antwort → kein Ergebnis gespeichert, bleibt in der Warteschlange; Cron versucht es nach fünf Minuten nochmals, maximal zwei Versuche, danach bleibt es manuell.

"Live" heisst: dieselbe Logik wie die manuelle Freigabe (`review_listing` mit `approve`): `active`, oder `scheduled`, wenn `publish_at` in der Zukunft liegt; `published_at`, Ablaufdatum, Gamification-Gutschrift wie heute.

## Bausteine

### Datenbank (Migration `20260917_auto_freigabe.sql`)
- `listings.review_ai jsonb` (Ergebnis: blocker, hinweise, bilder_geprueft, modell, geprueft_am, versuche).
- `listings.review_hold_reason text`.
- `listings.review_source text` ('manual' | 'auto'), gesetzt bei jeder Freigabe.
- `site_settings.auto_review_enabled boolean default true` (bestehende Einzeiler-Tabelle `site_settings`, id = 1, wird schon für den Site-Gate genutzt).
- RPC `auto_review_listing(p_listing uuid, p_ergebnis jsonb)`, SECURITY DEFINER, nur Service-Role ausführbar: speichert `review_ai`, berechnet Vertrauensstufe, wendet den Regelsatz an, ändert den Status nur, wenn er noch `pending_review` ist (Schutz gegen Doppelaufruf), schreibt Audit-Eintrag `listing_auto_approve` bzw. `listing_auto_hold`, legt die Verkäufer-Meldung an ("Dein Inserat ist live" mit Tipps, oder "Wird persönlich geprüft"). Gibt `{status, entscheidung, grund}` zurück.
- RPC `auto_review_faellig()` für den Cron: liefert Inserate in `pending_review` ohne `review_ai` oder mit `versuche < 2`, älter als fünf Minuten.

### Route `POST /api/ai-review`
- Body `{ listing_id }`. Prüft das Login des Aufrufers (wie `ai-listing`) und dass er Besitzer ist; alternativ Cron-Aufruf mit Service-Secret im Header.
- Lädt Inserat, Bilder (öffentliche URLs), Kategorie-Pfad mit Service-Role.
- Fragt OpenRouter (Modell wie `ai-search`, mit Bildeingabe), Timeout 25 Sekunden, verlangt JSON.
- Ruft `auto_review_listing` auf. Antwort an den Client nur `{ ok: true }` (keine Entscheidung im Client).
- Ist `site_settings.auto_review_enabled` aus: Route tut nichts, Inserat bleibt in der Warteschlange.

### Cron
- Alle 5 Minuten: `auto_review_faellig()` abholen und je Inserat die Route mit Service-Secret aufrufen (pg_net wie beim Notify-Worker).

### Client
- `submitForReview` ruft nach dem Statuswechsel `fetch("/api/ai-review")` auf (fire-and-forget, Fehler ignoriert).
- Meine Inserate: Status-Text "Wird geprüft (meist unter einer Minute)"; wenn `review_hold_reason` gesetzt: "Wird persönlich geprüft".
- Admin, Reiter "Wartet auf Freigabe": pro Inserat die KI-Begründung (Blocker rot, Hinweise grau), Vertrauensstufe, Hinweis "Bilder nicht geprüft" falls zutreffend. Knöpfe Freigeben/Ablehnen bleiben.
- Admin, neuer Reiter "Automatisch freigegeben": Inserate mit `review_source = 'auto'` der letzten 7 Tage, mit KI-Hinweisen, als Stichprobe.
- Admin-Einstellungen: Schalter "Automatische Freigabe".

## Fehlerfälle
- KI-Timeout oder kein gültiges JSON: kein `review_ai`, Versuchszähler hoch, Cron holt nach.
- Bild nicht ladbar: Prüfung nur mit Text, `bilder_geprueft = false`, sichtbar für Denis.
- Doppelaufruf (Client und Cron): RPC entscheidet nur bei Status `pending_review`, zweiter Aufruf ist wirkungslos.
- Verkäufer bearbeitet das Inserat, während die Prüfung läuft: Ergebnis wird trotzdem angewendet; Bearbeitungen aktiver Inserate werden nicht neu geprüft (bewusst ausgeklammert).

## Sicherheit
- Nur die Inserat-ID kommt vom Client. Entscheidung und Statuswechsel laufen mit Service-Role in der RPC.
- OpenRouter-Key bleibt serverseitig.
- Cron-Aufrufe authentifizieren sich über ein Service-Secret im Header, nicht über ein Nutzer-Login.

## Kosten
Text plus vier Bilder, etwa ein bis zwei Rappen pro Inserat. Bei 100 Inseraten pro Tag rund CHF 1.50.

## Test
Mit dem Testverkäufer-Konto (neu, nicht bewährt):
1. Sauberes Inserat → live innert einer Minute, Meldung "Dein Inserat ist live".
2. Inserat mit WhatsApp-Nummer im Text → Warteschlange, Blocker "Kontaktdaten" im Admin sichtbar.
3. Dünne Beschreibung plus dunkles Foto plus Grossbuchstaben-Titel → drei Hinweise, Warteschlange mit "Neues Konto, mehrere Hinweise".
4. Route mit ungültigem Key → kein Ergebnis, nach fünf Minuten Cron-Versuch, nach zwei Versuchen bleibt es manuell.
5. Testkonto per SQL auf "bewährt" setzen, Inserat aus Fall 3 nochmals einreichen → live mit Tipps.
Danach Testinserate und Meldungen löschen. Beta-Checkliste und Rep-Log ergänzen.

## Nicht dabei
Automatisches Ablehnen, Prüfung von Bearbeitungen aktiver Inserate, Prüfung von Chat-Nachrichten, Profil-Prüfung. Alles später auf derselben Route und RPC möglich.

## Anzeige im Admin (Ergänzung 17.09., Abend)
Die KI-Begründung steht nicht mehr als Text unter dem Titel (sprengte die Zeile), sondern als Chip neben der Artikelnummer: "KI ✓ unauffällig" (grün), "KI · n Hinweise" (grau), "KI · n Blocker" (rot), "KI ausstehend". Hover oder Klick öffnet ein Kärtchen mit Vertrauensstufe, Prüfzeit, Blockern, Hinweisen und Wartegrund.
