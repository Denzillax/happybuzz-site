# BEEDARO — Projektgedächtnis

> Diese Datei ist die erste Referenz für jeden neuen Chat.
> Lies sie IMMER bevor du Code änderst.

## Stack
- **Frontend:** Next.js 14 (App Router) + React
- **Backend:** Supabase (ekfsehsmwzougrgqukgf)
- **Hosting:** Vercel + GitHub (repo: happybuzz-site)
- **Fonts:** General Sans (Headlines) + Manrope (Body) — via globals.css
- **Styling:** Inline Styles + theme.js tokens (kein CSS-Modules)

## Goldene Regeln
1. **Keine kompletten Seiten überschreiben** wenn nur Design geändert wird
2. **Keine DB-Felder erfinden** — immer erst in Supabase prüfen
3. **Keine funktionierenden Features entfernen**
4. **Design-Änderungen** → theme.js + Shared Components
5. **Daten-Änderungen** → constants.js
6. **DB-Logik** → listings.js (einzige Datei die mit Supabase spricht)
7. **Keine Emojis** — überall Lucide-Icons oder BeeIcon (`src/components/shared/BeeIcon.jsx`) verwenden

## Ordnerstruktur
```
src/
├── app/
│   ├── globals.css              # Font-Imports, Body-Defaults
│   ├── layout.tsx               # Root Layout
│   ├── login/                   # Auth
│   └── (public)/
│       ├── layout.tsx           # Header + Footer
│       ├── (home)/page.tsx      # Startseite
│       ├── search/page.jsx      # Suche + Filter
│       ├── listing/[id]/page.jsx # Detailseite (public)
│       ├── listings/page.jsx    # Meine Inserate
│       ├── listings/new/page.jsx # Neues Inserat
│       ├── listings/[id]/page.jsx # Inserat bearbeiten
│       ├── favorites/page.jsx   # Favoriten
│       └── settings/page.jsx    # Einstellungen (alle Tabs)
├── components/
│   ├── shared/                  # Wiederverwendbare UI
│   │   ├── ListingCard.jsx
│   │   ├── PriceDisplay.jsx
│   │   ├── Badge.jsx
│   │   ├── FavoriteButton.jsx
│   │   └── Logo.tsx
│   ├── forms/                   # Formulare (TODO: extract)
│   ├── listings/
│   │   ├── ListingForm.jsx
│   │   └── FeeModel.jsx
│   ├── home/
│   │   ├── Hero.tsx             # Karussell mit modes: product/cover/gradient
│   │   ├── Categories.tsx
│   │   ├── HowItWorks.tsx
│   │   └── WhyBeedaro.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── hooks/
│   └── useFavorite.js
└── lib/
    ├── constants.js             # Enums, Labels, Tiers, Kantone
    ├── theme.js                 # Farben, Fonts, Spacing, Radii
    ├── formatters.js            # Preis, Zeit, Bilder, Labels
    ├── listings.js              # CRUD, Search, Favorites, Images
    └── supabase/
        └── supabase.js          # Zentraler Client
```

## Datenbank-Schema (LIVE verifiziert)

### listings (48 Spalten)
```
id, user_id, title, slug, description, listing_type, status, condition,
category_id, price, currency, is_negotiable, rent_price, rent_period,
deposit_amount, min_rent_days, max_rent_days, city, canton, postal_code,
location, shipping_available, shipping_cost, pickup_only, seller_fee_pct,
buyer_fee_pct, search_vector, view_count, favorite_count, published_at,
expires_at, created_at, updated_at, start_price, buy_now_price, min_price,
auction_duration, auction_end, pay_twint, pay_bank, pay_cash, contact_chat,
contact_phone, phone_number, shipping_method, shipping_payer, fee_tier,
fee_percentage
```

### listing_images (10 Spalten)
```
id, listing_id, url, storage_path, alt_text, sort_order, is_cover,
width, height, created_at
```
⚠️ Spalte heisst `url` — NICHT `image_url`
⚠️ Spalte heisst `sort_order` — NICHT `position`

### profiles
```
id, display_name, avatar_url, bio, created_at, ...
```
⚠️ FK-Hint nötig: `profiles!listings_user_id_fkey`
⚠️ Spalte heisst `display_name` — NICHT `full_name`

### favorites
```
user_id, listing_id (composite PK — KEIN id-Feld)
```

### categories
```
id, name, slug, parent_id, icon, is_active, sort_order
```

## Enum-Werte (LIVE verifiziert)

| Typ | Werte |
|-----|-------|
| listing_type | sell, auction, rent, free |
| listing_status | draft, active, paused, sold, rented, expired, deleted |
| condition_type | new, like_new, good, fair, poor |
| rent_period | hour, day, week, month |
| bee_rate_tier | starter, basic, plus, pro |

## CHECK Constraints
| Constraint | Werte |
|-----------|-------|
| listings_fee_tier_check | fair, supporter, impact, hero |
| listings_shipping_payer_check | buyer, seller |

## Fee-System
- fee_tier: fair (3%), supporter (5%), impact (7%), hero (10%)
- Bee-Impact: immer 20% der Gesamtgebühr
- Plattform: 80% der Gesamtgebühr

## Storage
- Bucket: `listing-images` (PUBLIC)
- 4 Policies (SELECT, INSERT, UPDATE, DELETE)

## Design-Tokens (theme.js)
- Yellow: #F4C03F / Dark: #191615 / Cream: #F9F4EC
- Green: #5B8C5A / Blue: #94B9C9
- Headlines: General Sans / Body: Manrope

## BEEDARO Tonalität
Modern, direkt, trocken witzig, charmant, schweizerisch sauber.
NICHT süss/kitschig/honiglastig/öko-romantisch/generisch.
Gebrauchte Dinge = Legenden mit Geschichte.
Bee-Impact subtil, nie Hauptthema.
Kurze starke Sätze, kein Werbesprech.

## Geschäftsregeln (Inserat erstellen)
- **Standort**: Wird vom User-Profil übernommen, nicht im Formular eingegeben
- **Kontakt**: Nur Chat — kein Telefon. Verhindert Geschäfte ausserhalb der Plattform
- **Barzahlung**: Nur bei Abholung möglich. Wenn Versand aktiv → Barzahlung deaktiviert
- **Inserattypen**: Festpreis / Auktion / Mieten als 3 Haupttabs mit kontextabhängigen Feldern. Verschenken = Festpreis mit "Gratis"-Toggle (setzt listing_type=free, price=0)
- **Bee-Rate**: Immer wählbar (Fair 3% / Supporter 5% / Impact 7% / Hero 10%)
- **Fotos**: Beschriftete Slots wie Ricardo (Hauptbild, Jede Seite, Mängel, Details etc.)
- **KI-Buttons**: Platzhalter für Titel- und Beschreibungs-Generator (OpenRouter, kommt später)

## Bekannte Risiken
- Supabase Client wird in manchen Seiten noch lokal erstellt statt aus supabase.js
- Settings-Page hat sehr viel Inline-Styling (Refactoring-Kandidat)
- Hero-Bilder sind Platzhalter — Denis tauscht sie selbst aus

## Supabase SQL-Funktionen (PFLICHT)
Diese RPC-Funktionen müssen im Supabase SQL Editor ausgeführt werden.
Sie brauchen `SECURITY DEFINER` damit auch anonyme / fremde User Views und Favoriten zählen können.

```sql
-- View Count: Atomar, auch für anonyme User
CREATE OR REPLACE FUNCTION increment_view_count(listing_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = listing_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Favorite Count: Zählt aus der favorites-Tabelle, aktualisiert listings
CREATE OR REPLACE FUNCTION update_favorite_count(listing_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET favorite_count = (
    SELECT COUNT(*) FROM favorites WHERE listing_id = listing_id_input
  )
  WHERE id = listing_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
