# BEEDARO — Vollständige Bau-Spezifikation

> Ziel dieses Dokuments: Ein Ingenieur kann BEEDARO damit von Grund auf nachbauen — Datenmodell, Backend-Logik, Frontend-Aufbau, Geschäftsregeln und Fallstricke. Stand: Juni 2026.

---

## 1. Überblick

**BEEDARO** ist ein Schweizer P2P-Secondhand-Marktplatz (Konkurrenz: Ricardo, Tutti). Differenzierung:
- **Listing-Vielfalt:** Festpreis, Auktion, Miete, Gratis, Service — alles in einer Plattform.
- **Wählbare Gebühr (Bee-Rate):** Verkäufer wählt 3/5/7/10 % (Default 7 %).
- **Bee-Impact:** 20 % jeder Gebühr fliesst in Schweizer Bienen-/Naturschutz.
- **Gamification:** Drei Währungen (Pollen, Nektar, Blüten) + Bee-Level.

**Tonalität:** modern, direkt, trockener Humor, Swiss-clean. Kein Werbedeutsch, keine Honig-/Öko-Romantik. Kurze, starke Sätze.

---

## 2. Tech-Stack & Hosting

| Bereich | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Sprache | JavaScript/JSX + etwas TypeScript (.tsx) |
| DB / Auth / Storage / Realtime | Supabase (Postgres), Projekt-Ref `ekfsehsmwzougrgqukgf` |
| Hosting | Vercel (GitHub-Repo) |
| Domain | happybuzz.ch (beedaro.ch noch nicht registriert) |
| Geplante Erweiterungen | PWA/Capacitor, OpenRouter-KI-Beschreibungen |

**Env-Variablen:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
**Supabase-Client:** `src/lib/supabase/supabase.js` — `createClient(url, anonKey)` (funktioniert client- UND serverseitig für public reads; RLS scoped per `auth.uid()`).

---

## 3. Brand & Design-System

### 3.1 Single Source of Truth: `src/lib/theme.js`
Alle Farben/Fonts/Radien als Tokens. **Tailwind-Config spiegelt diese Werte** (`tailwind.config.ts`). Keine dritte Palette.

**Farben (Brand-Spec):**
- `yellow` `#F4C03F` — Gold, NUR Marke/Logo/Featured (nicht inflationär für Buttons)
- `teal` `#0E9493` / `tealDark` `#0A7170` — alles Klickbare/CTA + „verifiziert"
- `nature` `#5B8C5A` / `natureSoft` `#EAF1E9` — Natur-Grün: Bee-Impact, Gratis, Naturschutz
- `dark` `#191615` — Text/Headlines
- `cream` `#F9F4EC` — Seiten-Hintergrund (= `body` bg in globals.css)
- `red` `#EB5E55` / `redSoft` — Signal/Dringlichkeit
- Achtung Alt-Last: `colors.green` ist ein **Legacy-Alias auf Teal** (nicht das Natur-Grün). Für Natur immer `nature`/`natureSoft`.

**Fonts (via `<link>` in `layout.tsx`, NICHT `@import` in CSS):**
- Headlines: **General Sans** (Fontshare)
- Body: **Manrope** (Google Fonts)

**Radien:** `radius` = { sm 8, md 10, lg 14, xl 18, full 9999 }.

### 3.2 Harte Regeln (gelten überall)
1. **KEINE Emojis** — nur Lucide-Icons oder `BeeIcon` (`src/components/shared/BeeIcon.jsx`). Auch keine Unicode-Glyphen (✓ ★ ○ ☆) → Lucide `Check`/`Star`/`Circle`.
2. **KEINE Em-/En-Dashes (— –) in UI-Text** — Punkt, Komma, Doppelpunkt.
3. **CSS `>`-Selektoren** nur in `globals.css`, NICHT in inline `<style>` (Hydration-Error).
4. Fonts via `<link>`, nicht `@import` in CSS (PostCSS strippt es).
5. Supabase-Queries: `.maybeSingle()` statt `.single()` für optionale Lookups (sonst Throw bei 0 Zeilen).

---

## 4. Projektstruktur

```
src/
├── app/
│   ├── layout.tsx                      # Root: Fonts, Metadata (OG/Twitter/metadataBase), GamificationProvider, BetaFeedback
│   ├── globals.css                     # Alle globalen Styles + responsive Media-Queries + Utility-Klassen
│   ├── robots.ts                       # SEO: erlaubt/verbietet Routen
│   ├── sitemap.ts                      # SEO: statische Seiten + aktive Inserate (revalidate 1h)
│   ├── login/page.jsx                  # Auth (Login/Signup/Reset), liest ?redirect=
│   ├── login/callback/page.jsx
│   └── (public)/
│       ├── (home)/page.tsx             # Homepage: Hero, CommunityImpact, FeaturedSellers, Categories, Seasonal, RecentlyViewed, NewListings, PopularListings, HowItWorks, WhyBeedaro
│       ├── search/page.jsx             # Suche + Filter-Pills + Attribut-Filter
│       ├── listing/[id]/page.jsx       # SERVER-Wrapper: generateMetadata (dynamisches SEO) + rendert ListingClient
│       ├── listing/[id]/ListingClient.jsx  # CLIENT: Inserat-Detail (buy/bid/rent/service inline, Q&A, Lightbox, Map)
│       ├── listings/new/page.jsx       # Inserat erstellen (Auth-gated, ?redirect)
│       ├── listings/page.jsx           # „Meine Inserate" (Desktop-Tabelle / Mobile-Karten, Boost, Statistik)
│       ├── order/[id]/page.jsx         # Bestell-/Auftrags-Flow (Status-Maschine, Käufer+Verkäufer)
│       ├── order/[id]/invoice/page.jsx # QR-Rechnung (PDF/Druck)
│       ├── chat/page.jsx               # Nachrichten-Liste (private Unterhaltungen)
│       ├── chat/[id]/page.jsx          # Chat-Thread (Bubbles, Bilder, Preisvorschläge)
│       ├── hive/page.jsx               # Gamification-Hub (Level, Blüten→Pollen, Nektar-Katalog, Achievements, Leaderboard)
│       ├── impact/page.jsx             # Bee-Impact (CHF-Zähler, Projekte, Belohnungs-Funnel)
│       ├── settings/page.jsx           # Einstellungen (Tabs: Profil/Verifizierung/Zahlung/Adresse/Benachrichtigungen)
│       ├── purchases/page.jsx          # Meine Käufe
│       ├── sales/page.jsx              # Meine Verkäufe
│       ├── favorites/page.jsx          # Favoriten (Inserate + Verkäufer)
│       ├── bids/page.jsx               # Meine Gebote
│       ├── bookings/page.jsx           # Miet-Buchungen
│       ├── fees/page.jsx, fees/invoice/[id]/page.jsx  # Gebühren-Übersicht/Rechnung
│       ├── user/[id]/page.jsx          # Öffentliches Verkäufer-Profil
│       ├── profile/[id]/page.jsx
│       ├── admin/page.jsx              # Admin-Dashboard
│       ├── beta/page.jsx               # Beta-Test-Checkliste (vollständig)
│       └── (legal) about, how-it-works, fees, help, terms, privacy, imprint
├── components/
│   ├── layout/Header.tsx, Footer.tsx, BottomNav.tsx, FloatingButton.tsx
│   ├── shared/Logo.tsx, ListingCard.jsx, BeeIcon.jsx, NotificationBell.jsx,
│   │          NektarBadge.jsx, GamificationProvider.jsx, AccountBadge.jsx,
│   │          BeeLevel.jsx, FavoriteButton.jsx, PriceDisplay.jsx, Badge.jsx, BetaFeedback.jsx
│   ├── home/Hero.tsx, CommunityImpact.jsx, FeaturedSellers.jsx, Categories.tsx,
│   │        NewListings.tsx, PopularListings.tsx, RecentlyViewed.jsx, SeasonalRecommendations.jsx, HowItWorks.tsx, WhyBeedaro.tsx
│   ├── listings/ListingForm.jsx, FeeModel.jsx, form/{ShippingSection.jsx, styles.js}
│   ├── settings/ui.jsx (Badge/Input/Toggle/Btn/Section/TrustMeter)
│   └── order/ServiceInvoiceEditor.jsx, OrderTimeline.jsx, RatingSection.jsx
├── lib/
│   ├── listings.js          # KERN-Datenschicht: Inserate, Suche, Favoriten, Käufe, Auktionen, Chat, Bewertungen
│   ├── notifications.js      # createNotification (ROOT — überall importieren)
│   ├── gamification.js       # Pollen/Nektar/Blüten-Logik, Level, Achievements, Conversion
│   ├── orderStatus.js        # PURCHASE_STATUS (eine Quelle für Bestell-Status: Label/Farbe/Icon)
│   ├── constants.js, theme.js, formatters.js, fees.js, bee-fee-texts.js
│   ├── api/attributes.js     # Kategorie-Attribute (genutzt)
│   ├── api/invoices.js       # Service-Rechnungen (genutzt)
│   ├── api/notifications.js  # NotificationBell-Helfer (read/markRead/subscribe)
│   ├── supabase/supabase.js
│   ├── recentlyViewed.js, recentSearches.js (localStorage)
└── hooks/useFavorite.js
supabase/migrations/*.sql    # DDL-Migrationen
```

---

## 5. Datenmodell (Postgres / Supabase)

RLS ist auf allen Nutzer-Tabellen aktiv. Prinzip: Lesen öffentlich wo sinnvoll (aktive Inserate, Bewertungen, Bee-Impact-Aggregate), Schreiben/Privat-Lesen nur `auth.uid() = owner`.

### 5.1 Kern-Tabellen

**`profiles`** (1:1 zu auth.users via Trigger `handle_new_user`)
- `id` (uuid, = auth user), `display_name` (NICHT full_name), `username`, `avatar_url`, `bio`, `city`, `canton`
- `account_type` ('private' | 'business'), `company_name`, `company_uid`
- `xp_total` (int, Pollen), `nektar` (int), `blueten` (int), `bee_level` (text), `bee_impact_total` (numeric, CHF, Käufer+Verkäufer-Credit)
- `avg_rating`, `rating_count`, `current_streak`, `longest_streak`
- `notification_settings` (jsonb), `iban`, Verifizierungs-Flags (`id_verified`, `id_document_url` …)
- FK in Joins: `profiles!listings_user_id_fkey`

**`listings`**
- `id`, `user_id`, `title`, `slug`, `description`, `category_id`
- `condition` (NICHT condition_type): new/like_new/good/fair/poor
- `listing_type`: sell/auction/rent/free/service
- `status`: active/paused/sold/rented/expired/draft/deleted (KEIN „completed")
- `price`, `fee_percentage` + `fee_tier` (fair/supporter/impact/hero, Default supporter/7 %)
- `shipping_available`, `pickup_only`, `shipping_payer`, `pay_twint`/`pay_bank`/`pay_cash` (bool)
- `contact_phone` (bool), `phone_number` (text), `contact_chat` (bool)
- **Laufzeit:** `expires_at` (timestamptz; Festpreis ~60 Tage)
- Auktion: `start_price`, `buy_now_price`, `min_price`, `auction_duration`, `auction_end`
- Rent/Service: `rent_price`, `rent_period` (hour/day/week/month), `deposit_amount`, `min_rent_days`, `max_rent_days`
- `view_count`, `favorite_count`, `bid_count` (= Anzahl Gebots-Events, s. Auktionen)

**`listing_images`**: `url` (NICHT image_url), `sort_order` (NICHT position).

**`bids`**: 1 Zeile pro Bieter (Proxy-Bidding) — `listing_id`, `bidder_id`, `amount` (aktuelles öffentliches Gebot), `max_amount` (geheimes Limit). Unique (listing_id, bidder_id).

**`bid_history`**: Event-Log jeder preisverändernden Bietaktion — `listing_id`, `bidder_id`, `amount`, `bid_type` ('manual'|'auto'), `created_at`. RLS: „Anyone can read", INSERT public.

**`purchases`** (= Bestellungen, auch Miete/Service): `id`, `listing_id`, `buyer_id`, `seller_id`, `price`, `fee_percentage`, `fee_amount`, `platform_fee` (80 %), `bee_impact` (20 %), `status`, `notes`, `created_at`.
- **Status-Flow normal:** confirmed → payment_marked → paid → shipped/picked_up → delivered → completed
- **Status-Flow Service:** confirmed → payment_pending (Rechnung) → payment_marked → paid → completed
- WICHTIG: „als bezahlt markieren" (Käufer) setzt `payment_marked`; Verkäufer bestätigt → `paid`.

**`purchase_events`**: Timeline-Ereignisse (2-Min-Dedup-Fenster).

**`conversations`** + **`messages`**:
- `conversations`: `listing_id`, `buyer_id`, `seller_id`, `is_public` (öffentliche Q&A vs. privater Chat), `last_message_at`.
- `messages`: `conversation_id`, `sender_id`, `content`, `is_read`, `message_type` ('text'|'image'|'offer'|'system'), `image_url`, `offer_amount`.

**`notifications`**: `user_id`, `type` (bid/purchase/message/rating/booking/system/rental), `title`, `message`, `link`, `is_read`. RLS: nur eigene.

**`fee_ledger`**: pro Verkauf eine Zeile (Trigger bei purchase-Insert) — `seller_id`, `purchase_id`, `sale_price`, `fee_percent`, `fee_amount`, `bee_impact` (20 %), `status` (paid/pending/cancelled). Quelle für Bee-Impact-Zähler.
**`fee_invoices`** + `invoice_items`: monatliche Gebühren-Rechnungen + Service-Rechnungs-Positionen.

**Gamification:** `xp_log`, `nektar_log`, `blueten_log` (je amount/reason/reference_id/balance_after), `user_achievements`, `challenges` + `user_challenges`, `nektar_redemptions` (eingelöste Belohnungen/Boosts: reward_type/status/expires_at/nektar_spent).

**Weitere:** `categories`, `category_attributes` + `listing_attributes`, `favorites` (nur user_id+listing_id+created_at, KEINE id-Spalte), `favorite_sellers`, `ratings` (rater_id/rated_id, Order-Flow) vs `reviews` (reviewer_id/reviewed_id), `user_addresses`, `user_notes`, `rental_bookings`, `reports`, `bee_rate_config`, `beta_feedback`, `listing_views`, `transactions`, `payouts`, `email_log`.

### 5.2 Wichtige RPCs / Funktionen (app-relevant)
- **Gamification:** `award_xp` (Pollen; setzt `bee_level` aus XP-Schwellen; bei Level-Up +25 Nektar via `award_nektar`), `award_nektar`, `award_blueten` (alle SECURITY DEFINER, nur server/trigger), `convert_blueten_to_pollen(p_amount)` (manuell vom User, 100 Blüten = 1 Pollen, 100er-Schritte, `auth.uid()`-scoped), `redeem_nektar`, `expire_nektar_boosts`, `grant_achievement`, `touch_streak`.
- **Auktion:** `place_bid`/`upsert_bid`/`update_bid` (DB-Variante), `log_bid`, `extend_auction_end`, **`finalize_ended_auctions`** (Cron), `recalc_bee_impact`.
- **Kauf:** `create_purchase`, `confirm_shipping`, `confirm_receipt`, `create_rating`, `recalc_user_rating`, `submit_service_invoice`, `create_fee_ledger_entry` (Trigger), `create_monthly_fee_invoice`.
- **Aggregate:** `get_community_impact_stats` (→ {impact, articles} aus fee_ledger), `get_seller_stats`, `get_listing_analytics`, `get_unread_count_for_user`.
- **Sonstiges:** `handle_new_user` (Profil bei Signup), `increment_view_count`, `get_or_create_conversation`, `pause_seller_listings`/`reactivate_seller_listings`.

### 5.3 Trigger
- `purchases` AFTER UPDATE OF status → `trg_award_purchase_xp`: bei status→completed Blüten an Käufer+Verkäufer (= bee_impact ×100), Nektar-Boni (bee_rate_bonus ≥7 %/10 %), Verkaufs-Achievements/Meilensteine.
- `purchases` AFTER INSERT → `create_fee_ledger_entry` (fee_ledger).
- `purchases` AFTER INSERT/UPDATE → `trigger_update_bee_impact` → `recalc_bee_impact` (setzt bee_impact_total; setzt KEIN bee_level mehr).
- Weitere: `trg_award_listing_xp`, `trg_award_rating_xp`, `trg_award_profile_complete`, `trg_set_listing_expiry` (setzt expires_at), `update_favorite_count`, `update_listing_search_vector`, `set_updated_at`.

### 5.4 Cron (pg_cron)
- `expire-nektar-boosts` — stündlich (`0 * * * *`): `expire_nektar_boosts()`.
- `finalize-ended-auctions` — alle 5 Min (`*/5 * * * *`): `finalize_ended_auctions()`.

---

## 6. Geschäftslogik pro Feature (wie es funktionieren MUSS)

### 6.1 Auth & Profile
- Login/Signup/Passwort-Reset auf `/login`. Nach Login Redirect auf `?redirect=`-Param (Default `/`).
- Signup-Trigger `handle_new_user` legt `profiles`-Zeile an.
- `account_type`: 'private' | 'business'. Business zeigt `company_name`/`company_uid` (Rechnung, `AccountBadge`). `AccountBadge` rendert nur für business.

### 6.2 Inserat erstellen (`ListingForm.jsx`)
- 5 Typen (sell/auction/rent/free/service) mit typ-spezifischen Feldern.
- Fotos-Upload + Sortieren/Löschen (Storage `listing-images`, `sort_order`).
- Bee-Rate-Auswahl (Default = User-Standard). FeeModel zeigt Aufteilung (20 % Bee-Impact).
- Laufzeit: Trigger `trg_set_listing_expiry` setzt `expires_at` (Festpreis ~60 Tage; Auktion via `auction_end`).
- Service-Inserat blockiert, solange ein früherer Auftrag noch nicht in Rechnung gestellt ist.
- Auth-gated: ohne Login → `/login?redirect=/listings/new`.

### 6.3 Suche (`search/page.jsx`)
- Volltext + Filter-Pills (Kategorie, Preis [Anwenden-Button], Zustand, Typ, Lieferung) + **Kategorie-Attribut-Filter** (`lib/api/attributes.js`).
- Attribut-Filter triggert Suche über `useEffect`-Dependency auf `attrFilters` (NICHT `setTimeout(doSearch)` — sonst stale closure!).
- Leerer Treffer: CTA „Alle Inserate ansehen" + „Filter zurücksetzen".

### 6.4 Listing-Detail (`ListingClient.jsx`)
- Server-Wrapper `page.jsx` liefert `generateMetadata` (Titel/Description/OG-Bild pro Inserat). Client-Komponente rendert die UI INLINE (kein separater AuctionPanel/BookingPanel — die existierten als Leichen und wurden gelöscht).
- Festpreis: KAUFEN → `create_purchase`. Auktion: Gebot/Sofortkauf. Miete: Zeitraum + Kaution → `createBooking` (Fehler bei < `min_rent_days` MUSS sichtbar sein). Service: Anfrage → später Rechnung.
- **Öffentliche Q&A** unten (über das Inserat), private Nachricht → Chat. `getListingQuestions` lädt Conversations inkl. Messages **verschachtelt in EINER Query** (kein N+1).
- Lightbox, Hover-Zoom, Karte (PostGIS/OpenStreetMap).

### 6.5 Auktionen (Proxy-Bidding) — FRAGILER BEREICH, genau lesen
Modell wie Ricardo (geheimes Maximum/Auto-Bid):
- Pro Bieter **eine `bids`-Zeile**: `amount` (öffentliches Gebot) + `max_amount` (geheimes Limit). Mehrfaches Bieten erhöht nur `max_amount`.
- `place_bid(listingId, bidderId, maxAmount)` (`lib/listings.js`):
  - Cap bei `buy_now_price`.
  - Bestehender Bieter: Limit erhöhen; ggf. überbieten oder Auto-Bid-Verteidigung.
  - Neuer Bieter: Erst-Gebot = `start_price`; oder Überbieten (Inkrement-Schritte `getBidIncrement`); oder direkt Auto-überboten.
  - **`recordBid()`** schreibt bei JEDER preisverändernden Aktion eine `bid_history`-Zeile (manuell + Auto-Verteidigung). Reine Limit-Erhöhung während man führt → KEIN Log (würde geheimes Max verraten).
  - **`notifyOutbid()`** benachrichtigt den entthronten Bieter („Du wurdest überboten", Einstellung `buy_outbid`).
  - `listing.bid_count` = Anzahl `bid_history`-Events (NICHT Bieter-Zeilen!).
  - Timer-Verlängerung: Gebot in letzten 3 Min → `auction_end` +3 Min.
- **Anzeige-Preis (displayPrice):** aktuelles Höchstgebot = `max(bids.amount)` bzw. Top-Bieter (`bids[0].amount` nach `max_amount` sortiert).
- **Gebotsverlauf:** rendert für ALLE Status (ausser pausiert) — NICHT hinter `status === "active"` einsperren (sonst verschwindet er nach Verkauf/Ablauf). Nur die interaktiven Bedienelemente (Bieten/Sofortkauf/Preislimit) sind active-only.
- **Finalisierung:** `finalize_ended_auctions()` (Cron alle 5 Min) erstellt für jede beendete, noch aktive Auktion den Kauf des Höchstbietenden (status 'confirmed'), setzt Listing 'sold' (keine Gebote → 'expired') und benachrichtigt Gewinner + Verkäufer. Idempotent. (Client finalisiert zusätzlich beim Seitenaufruf — gleiche Logik, als Backup.)

### 6.6 Kauf-/Bestell-Flow (`order/[id]/page.jsx`)
- Status-Maschine s. 5.1. Käufer- und Verkäufer-Sicht je Status unterschiedlich.
- **Service** durchläuft confirmed → payment_pending (Verkäufer stellt Rechnung via `ServiceInvoiceEditor`) → payment_marked → paid → **completed** (Verkäufer „Auftrag abschliessen", `completeTransaction`). Service hat KEINEN Versand/Übergabe-Schritt — die Waren-UI (`shipping_available`/`pickup_only`) ist mit `!isService` zu gaten, sonst hängt der Auftrag bei „paid".
- Bestell-Status zentral in `lib/orderStatus.js` (`PURCHASE_STATUS`: Label/Farbe/Icon) — von purchases/sales/order genutzt.
- Gebühr/Bee-Impact: `fee_amount = price * fee% /100`; `platform_fee = 80 %`, `bee_impact = 20 %`. Default-Fallback fee% = **7** (nicht 5).
- QR-Rechnung: `order/[id]/invoice` (echter Name, bei business Firmenname+UID).

### 6.7 Chat / Nachrichten
- `chat/page.jsx` (Liste): nur **private** Conversations (`!is_public`). Pro Eintrag: **Inserat-Thumbnail als Anker** (Avatar-Overlay), **Rollen-Chip „Kaufen/Verkaufen"** (aus `buyer_id === userId`), letzte Nachricht, Zeit. Filter Alle/Ungelesen. `getMyConversations` lädt Messages verschachtelt (kein N+1), leitet Unread + letzte Nachricht in JS ab; Thumbnail nach `sort_order`.
- `chat/[id]/page.jsx` (Thread): **eine** kompakte Kopfleiste (Inserat→Listing, Name→Profil, Rolle+Preis). Bubbles: eigene = **Teal** (weisser Text), Gegenüber = weiss. Tages-Trenner, System-Nachrichten, **Preisvorschlag-Karten** (Annehmen/Gegenvorschlag/Ablehnen), Bild-Nachrichten, Schnellantworten.
- **Optimistisches Senden:** nach Senden Nachricht sofort lokal anhängen (id-Dedup), da Realtime unzuverlässig.
- **Angebot annehmen** (`acceptOffer`): `createPurchaseAtPrice` + System-Nachricht. `offerResolved` per `>=`-Zeitvergleich; Buttons während `sending` disabled (keine Doppelannahme).
- `markMessagesRead` setzt is_read + dispatcht `window` Event `beedaro:messages-read` → Header-Badge aktualisiert sofort.

### 6.8 Notifications
- `createNotification(userId, type, title, message, link, settingsKey)` — IMMER aus `@/lib/notifications` importieren (es gibt ein totes Duplikat in `lib/api/notifications.js`, das nur read/markRead/subscribe für die Glocke liefert).
- `NotificationBell` (Header, Desktop): lädt Unread-Count beim Mount, volle Liste beim Öffnen, Realtime-Subscription. Badge nur bei `unread > 0`.
- Transaktionskritische Notifications sind immer an; nur der Kanal (Email/Push) ist via `notification_settings` konfigurierbar. Beispiele: `buy_outbid` (überboten), `buy_won`, `buy_payment`, `buy_auction_end`.
- Header **Nachrichten-Badge** (separat von der Glocke): Anzahl ungelesener Chat-Nachrichten via `get_unread_count_for_user`; gleicher Stil wie die Glocke (16px, `#c62828`); aktualisiert bei Focus + `beedaro:messages-read`-Event (nicht nur 30s-Poll).

### 6.9 Gamification — Drei Währungen (`gamification.js`, `hive/page.jsx`)
Trichter: **Transaktion → Blüten → (manuell 100:1) → Pollen → Level → Nektar → Belohnung.** Interaktion → Pollen direkt.

| Währung | Verdient durch | Zweck |
|---|---|---|
| **Blüten** | jede Transaktion (Kauf & Verkauf, beide Seiten) = Bee-Impact-CHF ×100 | Naturschutz-Beitrag in Punkten; „Blüten" = umgangssprachlich Geld |
| **Pollen** (`xp_total`) | Interaktion (inserieren, bewerten, Streak, Achievements) + umgewandelte Blüten | treibt das **Bee-Level** (Entdecker→Sammler→Hive Builder→Queen Bee→Legende bei 0/100/500/2000/5000 XP) |
| **Nektar** | Level-Ups (+25) & Meilensteine | Belohnungswährung; ausgeben für Boosts/Rewards |

- **Umwandlung Blüten→Pollen:** manuell im Hive, `convert_blueten_to_pollen`, 100 Blüten = 1 Pollen (100er-Schritte). Verbraucht Blüten.
- **Transaktionen geben KEINEN Routine-Pollen mehr** — nur Blüten (×100 des Bee-Impact, an Käufer+Verkäufer, via `trg_award_purchase_xp`). Achievements geben weiterhin Pollen.
- **Nektar-Katalog** (`NEKTAR_CATALOG` in gamification.js): Spotlight (50, 24h), Goldener Stempel (100, 3T), **Schaufenster** (200, Profil 1 Woche auf Homepage), Mega-Boost (300), Patenschaften (Impact), Custom Badge/Shop-Farbe/Early Access. Einlösen via `redeem_nektar` → `nektar_redemptions`. Boosts laufen via `expire_nektar_boosts` (Cron) ab.
- **Boosts auf Karten:** `getActiveBoosts` → ListingCard zeigt „Gesponsert" (spotlight, gelber Rahmen) / „Featured" (golden_stamp).
- **Anzeige:** Profil/Admin zeigen `blueten` (Belohnung), Header-Badge `NektarBadge` zeigt Level + Nektar (+ Blüten im Dropdown). Echtes Geld bleibt CHF (Homepage „Von dir beigetragen", Rechnungen).

### 6.10 Bee-Impact
- `get_community_impact_stats()` → {impact = Σ fee_ledger.bee_impact (status ≠ cancelled, also bezahlt + pending), articles = Anzahl}. Eine Quelle für ALLE Zähler (Homepage `CommunityImpact` + `/impact`).
- Homepage „Von dir beigetragen" = Σ der EIGENEN fee_ledger.bee_impact (seller_id = ich) → summiert sich exakt zum Gesamtbetrag.
- 20 % jeder Gebühr = Bee-Impact. CO2-Schätzung: ~25 kg pro gerettetem Artikel.

### 6.11 Schaufenster (`FeaturedSellers.jsx`)
- Zeigt Verkäufer mit aktiver `showcase`-Einlösung (`nektar_redemptions`, reward_type='showcase', status active, nicht abgelaufen) direkt unter der Bee-Impact-Sektion. Verkäufer-Grid: Avatar, Name, AccountBadge, Bewertung, bis zu 3 Inserate. RLS-Policy erlaubt öffentliches Lesen aktiver showcase-Zeilen.

### 6.12 SEO
- `layout.tsx`: `metadataBase` (https://happybuzz.ch), Title-Template `%s | BEEDARO`, OpenGraph/Twitter-Defaults (OG-Bild `/images/bee-impact.jpg`).
- `listing/[id]/page.jsx`: `generateMetadata` — Titel = Inserat-Titel, Description aus Beschreibung, OG-Bild = erstes Inserat-Bild; `robots: noindex` wenn nicht active.
- `robots.ts`: öffentliche Seiten erlaubt; gesperrt: /admin, /settings, /order/, /chat, /favorites, /purchases, /sales, /bids, /bookings, /hive, /listings, /login, /beta.
- `sitemap.ts`: statische Seiten + alle aktiven Inserate (revalidate 1h).

### 6.13 ListingCard (`shared/ListingCard.jsx`) — überall dieselbe Karte
- Props: `listing`, `userId`, `boost`, `onUnfavorite`.
- 4:3-Bild, Typ-Badge, Status-Badges (Neu/Beliebt/Featured/Gesponsert/Endet bald), Favoriten-Herz (`useFavorite`), Preis (typ-abhängig; Auktion = Höchstgebot + Gebote-Zähler aus `listing.bid_count`), Ort + Verkäufer + Rating.
- **Zeitangabe (`Countdown`-Komponente) für ALLE Typen:** >24h → „bis 14. Juni, 15:00" (Datum+Uhrzeit); <24h → live „3h 5m" / „12m 9s" (rot); abgelaufen → „Beendet" (Auktion) / „Abgelaufen". Quelle: Auktion `auction_end` (Fallback `expires_at`), sonst `expires_at`. Live-Intervall nur < 24h (Grid-Performance).
- **WICHTIG:** Favoriten, Suche, Home, RecentlyViewed nutzen ALLE diese eine Karte — keine Duplikate.

### 6.14 Home-Sektionen (`(home)/page.tsx`)
Reihenfolge: Hero → CommunityImpact → **FeaturedSellers** → Categories → SeasonalRecommendations → RecentlyViewed → NewListings → PopularListings → HowItWorks → WhyBeedaro.
- **Hero:** Suchfeld (Enter/Klick → `/search?q=`) + „Gratis inserieren" → `/listings/new` + „So funktionierts". Produkt-Karussell (4.5s).
- **CommunityImpact:** Zwei-Spalten, Foto-Karussell (`bee-impact.jpg/_GB/_Vinyl`, next/image) + Stats + „Mehr über Bee-Impact" → /impact.
- **RecentlyViewed/NewListings/PopularListings:** laden FRISCH aus DB (Auktionspreis = `max(bids.amount)`, `bid_count` aus Spalte). RecentlyViewed nimmt nur IDs/Reihenfolge aus localStorage, lädt aber live (kein veralteter Snapshot-Preis).

### 6.15 Settings (`settings/page.jsx`)
- Tabs: Profil / Verifizierung / Zahlung / Adresse / Benachrichtigungen.
- UI-Helfer (Badge/Input/Toggle/Btn/Section/TrustMeter) aus `components/settings/ui.jsx`.
- Adresse mit Strassen-Autocomplete; mehrere Lieferadressen; IBAN verschlüsselt.

---

## 7. Konventionen & Fallstricke (unbedingt beachten)

1. **listing/[id]** rendert Auktions-/Buy-UI INLINE (kein separater Panel-Import).
2. `createNotification` immer aus `@/lib/notifications`.
3. CSS `>`-Selektoren → globals.css, nicht inline.
4. Fonts via `<link>` in layout.tsx.
5. `.maybeSingle()` statt `.single()` für optionale Queries.
6. Timeline-Events: 2-Minuten-Dedup.
7. Transaktionskritische Notifications immer an; nur Kanal konfigurierbar.
8. Fee-Model: Bee-Impact = 20 % der Gebühr; Default-Bee-Rate 7 %.
9. Games-Attribute hängen an SUBKATEGORIEN (c0030001–c0030005), nicht der Hauptkategorie.
10. `favorites` hat keine `id`-Spalte (PK = user_id+listing_id).
11. **Realtime ist unzuverlässig** in diesem Setup → optimistische Updates (Chat) + Polling (GamificationProvider) verwenden.
12. **Tailwind liest die Config nur beim Prozess-Start** — Token-Änderungen greifen erst nach Dev-Server-Neustart / im Build.
13. **Mehrzeilige Imports** brechen zeilenbasierte Greps — bei „unused"-Checks vorsichtig sein (sonst löscht man genutzte Module wie `api/notifications.js`).

### 7.1 Kanonische Auktions-Anzeige (offene Empfehlung)
Preis und Gebotszahl werden aktuell an mehreren Stellen berechnet (Karten: `max(bids.amount)`; Detail: Top-Bieter; Spalten `listings.price`/`bid_count` driften). **Empfehlung:** eine DB-View/RPC `auction_display(listing_id)` → {displayPrice = aktuelles Höchstgebot, bid_count = bid_history-Events}, überall einsetzen. Verhindert die wiederkehrenden Inkonsistenzen.

---

## 8. Kategorie-IDs
```
c0010000 Elektronik & Computer | c0020000 Handy & Telefon | c0030000 Games & Spielkonsolen (Attribute auf Subkat.!)
c0040000 Foto & Optik | c0050000 Audio, TV & Video | c0060000 Fahrzeuge | c0070000 Fahrzeugzubehör
c0080000 Sport | c0090000 Kleidung & Accessoires | c0100000 Uhren & Schmuck | c0110000 Haushalt & Wohnen
c0120000 Handwerk & Garten | c0130000 Kind & Baby | c0140000 Bücher & Comics
```

---

## 9. Was in dieser Iteration gebaut/gefixt wurde (Changelog)

- **Inserieren-Seite** modernisiert; Laufzeit (`expires_at`) für alle Typen; FAB-Animation.
- **Gamification v2:** Pollen→nur Interaktion, **Blüten** (Transaktion ×100), Nektar (Belohnung); manuelle Umwandlung 100:1; ein Bee-Level (Konflikt zweier Level-Systeme aufgelöst — `recalc_bee_impact` setzt kein bee_level mehr). Nektar-Katalog + Boosts + Expiry-Cron.
- **Bee-Impact-Sektion** mit Foto-Karussell + Zwei-Spalten + CTA; „Von dir beigetragen" aus echten fee_ledger-Verkäufen; ein einziger Impact-Zähler (`get_community_impact_stats`).
- **Schaufenster** (showcase) auf der Homepage aktiviert.
- **SEO-Fundament:** generateMetadata (Inserat), sitemap.ts, robots.ts, OG/Twitter.
- **Conversion:** Hero-Suche + „Gratis inserieren"; Empty-State-CTAs; Login-Redirect.
- **Design-System** vereinheitlicht (theme.js = Quelle, Tailwind angeglichen, `.btn-honey`, `nature`-Token); toter Code entfernt (Panels, api-Duplikate, Heron).
- **Performance:** Homepage-Bilder via next/image; N+1-Queries (Chat-Liste, Inserat-Fragen) beseitigt; Gamification-Polling zusammengefasst.
- **Nachrichten-Sektion** neu (Inserat-Anker + Rollen-Chip in Liste; eine Thread-Leiste; Teal-Bubbles).
- **Auktions-Fixes:** Server-Finalisierung per Cron (`finalize_ended_auctions`) + Gewinner/Verkäufer-Notification; Gebotsverlauf bleibt nach Ende sichtbar; Gebote werden in `bid_history` protokolliert; „X Gebote" = Events; Überboten-Notification.
- **Karten-Zeitangabe** vereinheitlicht (Datum+Uhrzeit, <24h live, alle Typen).
- **Favoriten** nutzen die geteilte ListingCard (onUnfavorite).
- **RecentlyViewed** lädt frische Daten statt Snapshot.
- **Status-Map** zentralisiert (`orderStatus.js`); Service-Bestellung „paid"→„completed"-UI ergänzt; Such-Attributfilter (stale closure) gefixt; Gebühren-Fallback 7 %.

---

## 10. Test-Accounts
- **Denis / yam_89xr** (Seller): id `48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0`.
- **Zeggy** (primärer Test-User): id `430fa5fd-9fc3-439a-b404-30fbda86948b`.
- **Marco Bernasconi** (Buyer): id `00000000-0000-0000-0000-000000000001`.

---

*Ende der Spezifikation. Bei Auktions-/Notification-Arbeit zuerst Abschnitt 6.5 + 7.1 lesen.*
