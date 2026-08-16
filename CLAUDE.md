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

### Farben
- Yellow: `#F4C03F`
- Dark: `#191615`
- Cream: `#F9F4EC`
- Teal: `#0E9493` (Buttons, aktive States)
- Green: `#5B8C5A`

### Fonts
- Headlines: General Sans (Fontshare, via `<link>` in layout.tsx)
- Body: Manrope (Google Fonts, via `<link>` in layout.tsx)
- NICHT `@import` in CSS verwenden (PostCSS/Tailwind strippt es)

### Tonalität
Modern, direkt, trockener Humor, Swiss-clean. NICHT süss/honig-lastig/öko-romantisch.
Kurze starke Sätze, kein Werbedeutsch.
- Gut: "Nicht neu. Nur interessanter." / "Dein Keller hat Inventar. Wir haben Käufer."
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
│   ├── shared/Logo.tsx, ListingCard.jsx, BeeIcon.jsx
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
