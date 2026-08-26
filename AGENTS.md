# BEEDARO — Leitfaden für externe Agenten und Entwickler

Dieses Dokument enthält alles, was du brauchst, um an BEEDARO mitzuarbeiten.
Lies es vollständig, bevor du Code änderst.

## Was ist BEEDARO?

Schweizer Peer-to-Peer-Secondhand-Marktplatz (beedaro.ch), aktuell in
**geschlossener Beta**. Differenzierung gegenüber Ricardo/Tutti:

- **Fünf Inseratformate** in einer Plattform: Festpreis, Auktion, Miete, Gratis, Service
- **Wählbare Bee-Rate**: Verkäufer wählen ihre Gebühr selbst (3/5/7/10%, Standard 7% = Tier "impact")
- **Bee-Impact**: 20% jeder Gebühr fliessen in Schweizer Bienen-/Naturschutzprojekte

### Gebührenmodell (verbindlich, nicht ändern ohne Rücksprache)
- Verkäufe **unter CHF 20 sind gebührenfrei** (Bagatellgrenze)
- **Gebühren-Deckel CHF 200** pro Verkauf: `fee = min(preis × rate, 200)` (Ricardo: 290)
- Bee-Impact = 20% der (gedeckelten) Gebühr
- Einzige Quelle im Frontend: `FEE_CAP`, `FEE_FREE_BELOW`, `DEFAULT_FEE_TIER`,
  `DEFAULT_FEE_PERCENT` in `src/lib/constants.js` und `calcFee()` in `src/lib/fees.js`.
  **Nie Gebühren inline rechnen, nie Defaults hartkodieren** (`fee_percentage || 5` war ein Bug).
- Serverseitig rechnet der Trigger `create_fee_ledger_entry` (fee_ledger = Quelle der
  Wahrheit) plus die `create_purchase`-Funktionen — identische Formel.

### Konkurrenzlage
Ricardo und Tutti gehören beide zur SMG Swiss Marketplace Group. Tutti ist gratis
(Reichweite), Ricardo kostenpflichtig (8–12% Provision, Deckel 290). Auktionen hat
nur Ricardo. Miete und Service hat kein Schweizer Konkurrent. Das Preisargument
zielt auf Ricardo; gegen Tutti zählt der Format-Umfang.

## Tech-Stack

- **Next.js 14, App Router** (Verzeichnis `src/app`), JavaScript/JSX mit einzelnen TSX-Dateien
- **Supabase** (Postgres, Auth, Storage, Edge Functions) — Zugang siehe "Was du NICHT tust"
- **Vercel** Hosting; Deploy per Push auf `main` (GitHub-Repo `Denzillax/happybuzz-site`)
- Styling: Inline-Styles + `src/app/globals.css` (kein Tailwind-Klassen-System in den Komponenten,
  obwohl Tailwind eingebunden ist)
- Fonts: General Sans (Headlines, via `<link>` in layout.tsx) + Manrope (Body, Google Fonts).
  **Nie per `@import` in CSS einbinden** (PostCSS strippt es).

## Projektstruktur (Auszug)

```
src/
├── app/
│   ├── globals.css                     # globale Styles, Grid-/Responsive-Regeln
│   ├── login/page.jsx                  # Login + Registrierung
│   └── (public)/
│       ├── (home)/page.tsx             # Startseite (Sektions-Reihenfolge)
│       ├── listing/[id]/ListingClient.jsx  # Inserat-Detail (gross, Auktion inline)
│       ├── search/page.jsx             # Suche mit Filter-Pills
│       ├── listings/new/page.jsx       # Inserieren (nutzt ListingForm)
│       ├── order/[id]/page.jsx         # Bestell-/Abwicklungsseite
│       └── settings/page.jsx           # Einstellungen
├── components/
│   ├── layout/Header.tsx, Footer.tsx, BottomNav.tsx, Ticker.jsx
│   ├── shared/ListingCard.jsx          # DIE Inseratkarte (überall verwendet)
│   ├── listings/ListingForm.jsx, FeeModel.jsx
│   └── home/*                          # Startseiten-Sektionen
├── lib/
│   ├── constants.js                    # Gebühren, Tiers, Kategorien-Konstanten
│   ├── fees.js                         # calcFee, Referenznummern
│   ├── listings.js                     # CRUD, Suche, Favoriten, Käufe
│   ├── katalog.js                      # zentrale Design-Tokens (Klar-Look)
│   └── supabase/supabase.js
supabase/migrations/                    # SQL-Migrationen (nur Dateien anlegen, nie anwenden)
```

## Design-System "Klar" (seit August 2026, verbindlich)

Heller, flacher Look, inspiriert von Ricardo, differenziert über Gelb + Biene.
Der frühere "Katalog-Look" (eckig, schwarze Rahmen, Schreibmaschinen-Schrift,
harte Versatzschatten) ist **abgelöst** — nichts davon wieder einführen.

**Farben**
| Rolle | Wert |
|---|---|
| Grundfläche | `#FFFFFF` |
| Panels / Bänder | `#F4F4F2`, Hero-Band `#F6F4EF` |
| Hairline-Rahmen/Trennlinien | `#E4E0D8` (Kartenraster `#E8E4DC`) |
| Chips/Pills-Hintergrund | `#F2EEE7` |
| Text (Ink) | `#191615` |
| CTA / Primärbutton | Honey `#F4C03F` (Text Ink) |
| Akzent/Links/Fokus | Teal `#0E9493` |
| Grün (Gratis, Impact) | `#5B8C5A` |

**Regeln**
- Ecken weich: Karten/Boxen `borderRadius: 10–14`, Buttons und Filter als **runde Pillen** (`999`)
- Schatten weich und sparsam (`0 2px 8px rgba(25,22,21,.15)`), nie harte Versatzschatten
- Primäraktion = gelbe Pille, Zweitaktion = weisse Pille mit Hairline
- Fokus-Zustand: Teal-Rahmen + weicher Ring `0 0 0 3px rgba(14,148,147,.15)`
- Labels in Manrope, normale Schreibweise (keine VERSALIEN-Schreie, kein Space Mono)
- Zentrale Tokens in `src/lib/katalog.js` importieren, nicht lokal kopieren
- **Inseratkarten** (`ListingCard.jsx`): Bild 4:3 quer, farbige Typ-Chips
  (Festpreis gelb, Auktion `#94B9C9`, Miete `#8B6DB0`, Gratis grün, Service `#E67E22`),
  "Endet bald" (rot) und "Hot" (orange) unten links, feste Zeilenplätze, Verkäufer am Kartenboden.
  1px-Hairline-Raster zwischen Karten kommt aus `globals.css` (Zell-Schatten-Technik).

**UI-Text-Tonalität**: Modern, direkt, trockener Humor, Swiss-clean. Kurze Sätze.
- **KEINE Emojis** — nur Lucide-Icons oder `BeeIcon`
- **KEINE Em-Dashes (—)** in UI-Texten — Punkte, Kommas, Doppelpunkte
- **Schweizer Rechtschreibung: ss statt ß**, Preise als `CHF 1'234.00` (de-CH)

## Kritische technische Fallen (Ursache echter Bugs)

**DB-Spaltennamen** (weichen von naheliegenden Namen ab):
- `listings.condition` (nicht condition_type), `fee_percentage` + `fee_tier` (nicht bee_rate),
  `shipping_available`/`pickup_only` (nicht delivery_type), `shipping_payer`
- `listing_images.url` + `sort_order` (nicht image_url/position)
- `profiles.display_name` (nicht full_name)
- `favorites` hat KEINE id-Spalte (nur user_id + listing_id + created_at)
- `ratings` (rater_id/rated_id, Order-Flow) vs. `reviews` (reviewer_id/reviewed_id) sind verschieden

**Architektur-Regeln:**
1. CSS-Kindselektoren (`>`) und spitze Klammern NIE in inline `<style>`-Tags
   (Hydration-Error) — immer in `globals.css`
2. Queries mit `.maybeSingle()` statt `.single()` wenn 0 Treffer möglich sind
3. `createNotification` explizit importieren: `import { createNotification } from "@/lib/notifications"`
4. Inline-Styles schlagen CSS: Media-Query-Overrides gegen Inline-Werte brauchen `!important`
5. Responsive Spaltenbreiten in `globals.css` definieren, nicht inline (sonst gewinnt inline)
6. **RPC-Signaturen erweitern = alte Signatur DROPPEN.** Neue Parameter erzeugen sonst
   einen zweiten Overload und PostgREST wirft "Could not choose the best candidate
   function" — das hat schon einmal jeden Sofortkauf lahmgelegt.
7. Kauf-Status-Flow: confirmed → payment_marked → paid → shipped/picked_up → delivered
   → completed (Service: confirmed → payment_pending → payment_marked → paid → completed)
8. Beschreibungs-HTML immer durch `sanitizeDescription` filtern, nie roh rendern

## Wie du arbeitest (Workflow)

1. **Branch erstellen**, ändern, **Pull Request** stellen — nie direkt auf `main`/`master` pushen
2. Vercel baut pro PR automatisch eine **Preview-URL** — verweise in der PR-Beschreibung darauf
3. Verifiziere Änderungen im laufenden **Dev-Server** (`npm run dev`), nicht nur im Kopf.
   **Achtung: kein `npm run build`, während ein Dev-Server läuft** (korrumpiert `.next`)
4. Responsive immer mitprüfen: 375px (Handy) und Desktop. Kein horizontales Scrollen,
   kein Text, der aus Boxen ragt
5. Commit-Messages auf Deutsch im Stil `fix(bereich): kurze Beschreibung`
6. DB-Änderungen: SQL-Datei in `supabase/migrations/` ablegen (Namensschema
   `YYYYMMDD_beschreibung.sql`) und im PR erklären — **niemals selbst auf die
   Live-Datenbank anwenden**. Das macht der Betreiber.

## Was du NICHT tust

- **Keine Secrets anfassen oder anfragen**: kein Service-Role-Key, keine `.env.local`.
  Für lokalen Betrieb reichen `NEXT_PUBLIC_SUPABASE_URL` und der öffentliche Anon-Key
  (beim Betreiber anfragen).
- **Keine Aktionen auf Live-Daten**: keine Test-Käufe, keine Gebote auf echte Auktionen,
  keine Mails/Push-Rundrufe auslösen, keine Nutzerdaten ändern oder löschen.
  Die Beta hat echte Testerinnen und Tester mit echten Inseraten.
- **Nicht als fremde Nutzer einloggen.** Für Tests eigenes Konto über die Registrierung
  anlegen (geschlossene Beta: die Seite zeigt ausgeloggt eine Sperrseite; nach der
  Registrierung bist du automatisch Tester).
- Keine neuen Abhängigkeiten ohne Begründung im PR.
- Keine Design-Alleingänge: Der Klar-Look oben ist verbindlich; grössere visuelle
  Vorschläge zuerst als PR-Beschreibung/Screenshot, nicht als vollendete Tatsache.

## Offene Roadmap (Kontext, nicht Auftrag)

Gamification-Ausbau (Bee-Level, Challenges laufen bereits), Gebühren-Ranking
(höhere Bee-Rate = bessere Platzierung), BEEDARO-Wallet, Escrow,
PWA/App-Store-Verpackung, KI-Beschreibungsgenerator (läuft bereits über `/api`).

## Kontakt

Betreiber: Denis Mihaljevic (MOQRO by Denis Mihaljevic, Kriens) — info@beedaro.ch.
Bei Unsicherheit zu Gebühren, Datenbank oder Live-Daten: erst fragen, dann bauen.
