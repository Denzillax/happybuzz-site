# BEEDARO — Projektkontext für Claude Code

## Was ist BEEDARO?
Schweizer P2P-Secondhand-Marktplatz. Differenzierung: Listing-Vielfalt (Festpreis, Auktion, Miete, Gratis, Service), wählbare Bee-Rate Gebühr (3/5/7/10%), Bee-Impact (20% der Gebühr für Bienenschutz).

### Konkurrenzlage (Stand Juli 2026)
Ricardo und Tutti sind **keine zwei getrennten Konkurrenten**, sondern gehören beide zur
SMG Swiss Marketplace Group (seit Sept. 2025 börsenkotiert), inkl. Cross-Posting zwischen
den beiden. Ein Konzern mit bewusster Zweiteilung: Tutti gratis für Reichweite, Ricardo
kostenpflichtig für die Transaktionen.

| BEEDARO-Typ | Echter Konkurrent | Deren Preis |
|---|---|---|
| Auktion | nur Ricardo (**Tutti hat kein Auktionsformat**) | 8–12% Erfolgsprovision |
| Festpreis | Tutti + Ricardo | 0% / 8–12% |
| Gratis | Tutti | 0% |
| Miete, Service | keiner | — |

Konsequenz fürs Preisargument: Gegen Tutti gewinnt man nicht über den Preis (die sind
gratis), gegen Ricardo schon. Der eigentliche Vorteil ist, dass BEEDARO beide Hälften
plus Miete/Service in einem Produkt abdeckt. Siehe auch Fee-Model unter Architektur-Regeln.

## Tech Stack
- **Framework**: Next.js 14 App Router
- **DB**: Supabase (Projekt-ID: `ekfsehsmwzougrgqukgf`)
- **Hosting**: Vercel (altes Projekt lief via GitHub Repo `happybuzz-site`, wird durch BEEDARO-Deploy abgelöst)
- **Domain**: beedaro.ch (registriert seit 16.08.2026; happybuzz.ch wird abgelöst)

## Supabase Zugang
- URL: `https://ekfsehsmwzougrgqukgf.supabase.co`
- Dashboard: `https://supabase.com/dashboard/project/ekfsehsmwzougrgqukgf`
- Anon Key: steht in `.env.local`
- MCP Setup für direkten DB-Zugriff:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "ekfsehsmwzougrgqukgf"]
    }
  }
}
```

## Brand & Design

### Design: Meeko (seit 20.09.2026)
Vorbild ist die Framer-Vorlage Meeko. Formensprache: 1 px Ink-Rand statt Schatten, Pastellflächen, grosse Rundungen,
leichte grosse Titel. Rückweg zum alten Klar-Look: Git-Tag `design-alt-2026-09`.
Stand 20.09.2026: lokal fertig, noch NICHT gepusht (Denis schaut lokal, pusht selbst).

### Farben
- Ink `#1D1D1D`: Schrift, Ränder (`1px solid`), dunkler Hauptknopf. Ersetzt Teal (`#007C7C`) und das alte Dark `#191615`.
- Pastelle (Variablen `--mk-*` auf `:root` in `globals.css`): Lavendel `#E3E3FF`, Himmel `#E3F2FF`, Rosa `#FFE3FB`,
  Mint `#DBF5F0`, Rosé `#FBEBEA`, Butter `#FFE7A9`. Helles Lavendel `#F3F3FF` ersetzt die grauen Flächen.
- Jedes Format hat seine Pastelltafel (`TYP_PASTELL` in `src/lib/constants.js`): Festpreis Rosé, Auktion Lavendel,
  Miete Himmel, Gratis Butter, Service Rosa. Mint gehört dem Hero (`--mk-hero`) und dem App-Icon.
- Gewählt/eingeschaltet = Mint, im Inserieren-Formular die Farbe des gewählten Formats (`--lf-akzent`).
- Hover: Schrift bleibt Ink, dahinter eine Lavendel-Fläche. KEINE Butter-Kachel als Hover (Denis lehnte sie ab).
- Das alte Gelb `#F4C03F` lebt nur noch in Bewertungssternen, Status "wartet" und den Hive-Spielen. Als Fläche: Butter.
- KEIN Grau, KEIN Cream/Sand/Beige, KEIN Teal, keine Schlagschatten auf Karten.
- Green `#50804F` bleibt für Bienenschutz und Erfolg.

### Formen
- Karten und Boxen: Rundung 20 (grosse Abschnittskarten 28), `1px solid #1D1D1D`.
- Knöpfe: 10 px Ecken oder Pille, eingedrückter Schatten unten (`inset 0 -4px 0 rgba(29,29,29,.16)`). Hauptknopf Mint mit Ink-Rand und Ink-Schrift
  (Denis 20.09.2026, schwarze Knöpfe abgelehnt), Hover Lavendel. Auf der Mint-Tafel des Hero ist der Hauptknopf Lavendel. Nebenknopf weiss.
- Statusfarben: Warnung `#8A5A00` auf Butter, Erfolg Green auf Mint, Fehler `#C62828` auf Rosé, Info Ink auf Himmel. Links sind Ink.
- Hot-Schild: weiss mit roter Flamme. Bottom-Nav aktiv: das Symbol füllt sich Rosa mit Ink-Kontur, keine Fläche (Mint-Pille, Ink-Strich, Lavendel-Kachel und Himbeer lehnte Denis ab). Ausgeloggt im Header: nur Personen-Symbol im Avatar-Kreis.
- Inseratkarte (`ListingCard`): Foto liegt mit eigenem Ink-Rand auf der Pastelltafel des Formats. Kein zweiter Rahmen darum.
- Favoriten-Herz ist app-weit das um 90 Grad gedrehte B (`BLogo herz`), gesetzt: Himbeer `#C2255C` auf Rosa.
- Abstände im Formular: 24 px zwischen Karten, 18 px zwischen den Teilen einer Karte (CSS `.lf-section`).
- Logo: `BLogo` (kacheliges B, ein einziger Pfad) plus Wortmarke "beedaro" in Sora 700, Komponente `Logo.tsx`.
  Favicon und App-Icon: Ink-B auf Mint.

### Fonts
- Ganze Seite: Instrument Sans (Google Fonts, via `<link>` in layout.tsx). Wortmarke im Logo: Sora 700.
- General Sans und Manrope sind nur noch Rückfall in den Schriftstapeln.
- NICHT `@import` in CSS verwenden (PostCSS/Tailwind strippt es)

### Gemeinsame Stilquellen (dort ändern, nie lokal kopieren)
- `src/lib/theme.js` (colors, radius, shadows), `src/lib/katalog.js` (K, card, input, btnPrimary), `src/lib/constants.js`
  (TYP_PASTELL, TYP_LABEL). Viele Seiten haben zusätzlich eine lokale Palette `K` oder Konstanten `SAND`/`INK`/`HONEY`.
- Header `hd-*`, Fuss `ft-*`, Bottom-Nav `bn-*`, Formular `lf-*`, Meeko-Bausteine `mk-*` stehen in `globals.css`.
- Achtung: `ListingForm.jsx` hat ein lokales `Check` (Kästchen-Bauteil), nicht das Lucide-Symbol.

### Tonalität
Modern, direkt, trockener Humor, Swiss-clean. NICHT süss/honig-lastig/öko-romantisch.
Kurze starke Sätze, kein Werbedeutsch.
- Gut: "Was du suchst, hat schon jemand." / "Dein Keller hat Inventar. Wir haben Käufer."
- Nicht mehr verwenden: "Nicht neu. Nur interessanter." (Denis 19.09.2026: klingt komisch). Generell keine "Nicht X, sondern Y"-Sätze, keine Wirkungsversprechen ("Du rettest ein Ökosystem"), keine Ausrufezeichen in Systemtexten.
- Schlecht: "Entdecke die Magie des nachhaltigen Handels! 🐝✨"

### Regeln
- KEINE Emojis — nur Lucide Icons oder `BeeIcon` (`src/components/shared/BeeIcon.jsx`)
- KEINE Em-Dashes (—) in UI-Text — Punkte, Kommas oder Doppelpunkte verwenden
- CSS `>` Selektoren NICHT in inline `<style>` Tags (Hydration-Error) — immer in `globals.css`

## Projektstruktur
```
src/
├── app/
│   ├── globals.css
│   └── (public)/
│       ├── (home)/page.tsx          # Homepage
│       ├── listing/[id]/page.jsx    # Listing-Detail
│       ├── search/page.jsx          # Suchseite (Filter Pills)
│       ├── order/[id]/page.jsx      # Bestellseite
│       ├── order/[id]/invoice/      # QR-Rechnung PDF
│       ├── settings/page.jsx        # Einstellungen
│       ├── listings/new/page.jsx    # Inserat erstellen
│       └── favorites/page.jsx
├── components/
│   ├── layout/Header.tsx, Footer.tsx, BottomNav.tsx, FloatingButton.tsx
│   ├── shared/Logo.tsx, BLogo.jsx, ListingCard.jsx, BeeIcon.jsx
│   ├── listings/ListingForm.jsx, FeeModel.jsx
│   ├── home/Hero.tsx, Categories.tsx, NewListings.tsx, PopularListings.tsx
│   └── order/ServiceInvoiceEditor.jsx, OrderTimeline.jsx, RatingSection.jsx
├── lib/
│   ├── listings.js          # CRUD, Search, Favorites, Transactions
│   ├── notifications.js     # createNotification
│   ├── constants.js, theme.js, formatters.js, fees.js
│   ├── api/
│   │   ├── attributes.js    # Kategorie-Attribute
│   │   ├── invoices.js      # Service-Rechnungen
│   │   └── bookings.js
│   └── supabase/supabase.js
└── hooks/useFavorite.js
```

## DB Schema — Kritische Spaltennamen

### listings
- `condition` (NICHT `condition_type`): new/like_new/good/fair/poor
- `listing_type`: sell/auction/rent/free/service
- `fee_percentage` + `fee_tier` (NICHT `bee_rate_percentage`)
- `fee_tier`: fair/supporter/impact/hero (Default: impact = 7%)
- `shipping_available` + `pickup_only` (NICHT `delivery_type`)
- `shipping_payer` (NICHT `shipping_paid_by`)
- `contact_phone` = bool, `phone_number` = text
- `pay_twint`/`pay_bank`/`pay_cash` = bool
- Auction: `start_price`, `buy_now_price`, `min_price`, `auction_duration`, `auction_end`
- Rent/Service: `rent_price`, `rent_period`, `deposit_amount`, `min_rent_days`, `max_rent_days`

### listing_images
- `url` (NICHT `image_url`)
- `sort_order` (NICHT `position`)

### profiles
- `display_name` (NICHT `full_name`)
- FK: `profiles!listings_user_id_fkey`

### favorites
- Nur `user_id` + `listing_id` + `created_at` (KEINE `id` Spalte)

### ratings vs reviews
- `ratings`: `rater_id`/`rated_id` (Order-Flow)
- `reviews`: `reviewer_id`/`reviewed_id`

### purchases (Status-Flow)
- Normaler Kauf: confirmed → payment_marked → paid → shipped/picked_up → delivered → completed
- Service: confirmed → payment_pending (Rechnung) → payment_marked (bezahlt) → paid → completed
- WICHTIG: `markAsPaid` setzt `payment_marked` (NICHT `payment_pending`)

### category_attributes + listing_attributes
- Attribute pro Kategorie/Subkategorie
- API: `getCategoryAttributes` geht den Baum hoch (Kind → Eltern)
- Games-Attribute auf SUBKATEGORIEN (c0030001-c0030005), nicht Hauptkategorie

### invoice_items
- Service-Rechnungen mit Einzelpositionen
- Templates: Anfahrtspauschale (CHF 30), Arbeitsstunde (CHF 65), Material, Entsorgung, Freitext

## Architektur-Regeln

1. **listing/[id]/page.jsx** rendert Auction-UI INLINE — kein separater AuctionPanel Import
2. **createNotification** muss explizit importiert werden: `import { createNotification } from "@/lib/notifications"`
3. **CSS `>` Selektoren** → globals.css, NICHT inline `<style>` (Hydration-Error)
4. **Fonts** via `<link>` in layout.tsx, nicht `@import` in CSS
5. **Queries**: `.maybeSingle()` statt `.single()` für optionale Queries
6. **Dedup**: Timeline Events haben 2-Minuten Dedup-Fenster
7. **Notifications**: Transaktionskritische sind immer an, nur Kanal (Email/Push) konfigurierbar
8. **Fee-Model**: Bee-Impact = 20% der Gebühr. Default Bee-Rate = 7% (Tier `impact`).
   Einzige Quelle: `DEFAULT_FEE_TIER` / `DEFAULT_FEE_PERCENT` in `src/lib/constants.js`.
   Nie hartkodieren, auch nicht als Fallback (`fee_percentage || 5` war ein Bug).

## Kategorie-IDs (korrekt verifiziert)
```
c0010000 = Elektronik & Computer
c0020000 = Handy & Telefon
c0030000 = Games & Spielkonsolen (Attribute auf Subkategorien!)
c0040000 = Foto & Optik
c0050000 = Audio, TV & Video
c0060000 = Fahrzeuge
c0070000 = Fahrzeugzubehör
c0080000 = Sport
c0090000 = Kleidung & Accessoires
c0100000 = Uhren & Schmuck
c0110000 = Haushalt & Wohnen
c0120000 = Handwerk & Garten
c0130000 = Kind & Baby
c0140000 = Bücher & Comics
```

## Offene Features (Roadmap)
1. ~~Usertyp Privat/Unternehmen~~ ✅ ERLEDIGT — `profiles.account_type` ('private'/'business'), `company_name`, `company_uid`; Settings-Umschalter; `AccountBadge` auf ListingCard/Listing-Detail/Profil; Firmenname + UID auf Rechnung
2. Gamification (Bee-Level, Community Counter)
3. Gebühren-Ranking (höhere Bee-Rate = bessere Platzierung)
4. BEEDARO Wallet (internes Token-System)
5. Escrow (Geld halten bis Empfangsbestätigung)
6. PWA + ggf. Capacitor für App Stores
7. OpenRouter KI Beschreibungsgenerator
8. Domain beedaro.ch registrieren

## Test-Accounts
- Denis (Seller): ID `48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0`, Username `yam_89xr`
- Marco Bernasconi (Buyer): ID `00000000-0000-0000-0000-000000000001`
