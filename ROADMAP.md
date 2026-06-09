# BEEDARO — Projekt-Roadmap & Status

> **FORMATIERUNG: Keine Bindestriche als Trennlinien verwenden. Immer === verwenden.**
> **TEXTE: Keine Gedankenstriche in UI Texten auf der Website. Stattdessen Punkte, Kommas oder Doppelpunkte verwenden.**

> Letzte Aktualisierung: 9. Juni 2026 (Session: Homepage Redesign, Features, Fixes)
> Tech: Next.js 14 (App Router) + Supabase + Vercel + GitHub (`happybuzz-site`)
> Supabase Project ID: `ekfsehsmwzougrgqukgf`
> Denis User ID: `48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0`
> Marco Test User ID: `00000000-0000-0000-0000-000000000001`
> Chrome MCP Device: `21499ef8-6f48-4570-bc15-4881806baeea` / Tab: `735355968`

===

## PHASE 1: GRUNDSTRUKTUR ✅

### Layout
- **Header** (`src/components/layout/Header.tsx`): Logo, Kategorien-Dropdown, Suchfeld, Herz, Glocke, Inserieren-Button, DM-Avatar + Hamburger-Menü
- **Footer** (`src/components/layout/Footer.tsx`): Links, Impressum, Datenschutz
- **Mobile Header**: DM Avatar + Hamburger öffnen gleiches Slide-Menü (User-Info, Search, Nav-Links mit Icons, Inserieren, Abmelden)
- **Auth-Icons** immer sichtbar (kein conditional rendering → kein Flicker)

### Auth
- Middleware: Session-Refresh only (kein server-side Route-Blocking — Client SDK nutzt localStorage)
- Login-Flow: Blocking profiles query entfernt
- Überall `getSession()` statt `getUser()` (getUser() returned null wegen localStorage)

### Fonts & Colors
- General Sans (Headlines, Fontshare) + Manrope (Body, Google Fonts)
- Geladen als `<link>` in `layout.tsx`, NICHT `@import` in globals.css
- Colors: `#F4C03F` / `#191615` / `#F9F4EC` / `#5B8C5A` / `#94B9C9`

===

## PHASE 2: REFACTORING ✅

### Zentralisierte Libs
- `src/lib/constants.js` — DB-verified Enums und Labels
- `src/lib/theme.js` — Color + Font Tokens
- `src/lib/formatters.js` — `fmtCHF`, `fmtPrice` (Alias), `getCoverUrl`, `getSortedImages`, `timeAgo`, `memberSince`, `conditionLabel`, `listingTypeLabel`, `fmtDate`, `formatPrice`, `getDisplayPrice`
- `src/lib/fees.js` — `calcFeeFromPrice`, `makeBeeRef`, `makeArtRef`, `makeFeeRef`, `calcDueDate`
- `src/lib/supabase/supabase.js` — Single Supabase Client Import

### Shared Components
- `src/components/shared/ListingCard.jsx` — Card mit Badges, Countdown, Favorit
- `src/components/shared/PriceDisplay.jsx`
- `src/components/shared/Badge.jsx`
- `src/components/shared/FavoriteButton.jsx`
- `src/components/shared/BeeIcon.jsx` — Custom Bee-Icon (keine Emojis!)
- `src/components/shared/Logo.tsx`
- `src/components/shared/BeeLevel.jsx` — BeeLevelBadge

### Hooks
- `src/hooks/useFavorite.js`

### Cleanup
- 48 Junk/Duplikat-Dateien gelöscht
- Alle Supabase Calls zentralisiert

===

## PHASE 3: HOMEPAGE ✅

- **Hero** (`src/components/home/Hero`): Carousel mit 3 Modi (product/cover/gradient)
- **Kategorien** (`src/components/home/Categories`)
- Responsive: `flex-direction: column-reverse` + `flex-basis: auto` für Mobile

===

## PHASE 4: SUCHE & LISTING-KARTEN ✅

### Suchseite (`src/app/(public)/search/page.jsx`)
- Filter-Tabs: Alle, Festpreis, Auktion, Mieten, Gratis
- Suche: `.or('title.ilike.%query%,description.ilike.%query%')`
- Sort: Neueste (default)
- Filter-Sidebar (TODO: erweitern)

### ListingCard (`src/components/shared/ListingCard.jsx`)
- **Badges oben links (farbig):**
  - "NEU" (gelb) — Inserat < 24h alt
  - "BELIEBT" (orange + Flamme) — > 5 Gebote ODER > 3 Favoriten ODER > 100 Views
  - "ENDET BALD" (rot) — Auktion endet in < 24h
- **Typ-Badge oben rechts (farbig):**
  - Festpreis (gelb, ShoppingBag-Icon)
  - Auktion (blau, Gavel-Icon)
  - Miete (lila, Home-Icon)
  - Gratis (grün, Gift-Icon)
- **Favoriten-Herz**: unten rechts auf dem Bild
- **Auktions-Info**: Aktuelles Gebot, Anzahl Gebote, Sofortkauf-Preis
- **Timer**: > 24h → Datum+Uhrzeit, < 24h → Live-Countdown, < 1h → rot
- **Miete-Info**: Preis / Tag|Woche|Monat + Kaution
- **Gleiche Card-Höhe**: flex + spacer für alle Typen

===

## PHASE 5: LISTING-DETAIL ✅

### Seite (`src/app/(public)/listing/[id]/page.jsx`)
- **Lightbox**: Fullscreen, ESC/Pfeiltasten, Thumbnails
- **Breadcrumb**: BEEDARO > Kategorie > Unterkategorie
- **Galerie**: Carousel mit Pfeilen + Thumbnail-Leiste
- **Zustand / Kategorie / Standort** Grid
- **Beschreibung**
- **Lieferung & Bezahlung**: Zeigt "Paket B-Post, CHF 12.00" (formatiert, nicht roher DB-Wert)
  - `shipping_method`: paket/brief/sperrgut → Paket/Brief/Sperrgut
  - `ship_speed`: economy → B-Post, priority → A-Post
  - `free_shipping` → "Gratis"
- **Sidebar**: Preis, Kaufen-Button, Favorit, Bee-Impact, Lieferung, Verkäufer-Mini-Card
- **Chat**: Public + Private Nachrichten
- **Report Modal**: Melden-Funktion
- **Share + Melden** Buttons

### Auktions-Features auf Detail-Seite
- **Aktuelles Gebot** + Anzahl Gebote
- **Countdown**: > 24h → Datum+Uhrzeit, < 24h → Live-Countdown
- **Gebot abgeben** Modal mit Preislimit
- **Preislimit-Anzeige**: "Du führst!" (grün) / "Du wurdest überboten" (orange)
- **Preislimit entfernen**: Link (Gebot bleibt, nur auto-bid weg)
- **Sofortkauf** Button (wenn buy_now_price gesetzt)
- **Unified Buy Modal**: Für Festpreis UND Sofortkauf

### Miet-Features
- **Rental Booking** mit Datumswahl
- **Deposit/Kaution** Anzeige

===

## PHASE 6: PROXY-BIDDING (RICARDO-STYLE) ✅

### Logik (`src/lib/listings.js` → `placeBid`)
- User gibt MAX-Gebot (Preislimit) ein, System bietet automatisch Minimum
- Ein Bid-Eintrag pro User pro Auktion (UPSERT: `onConflict: "listing_id,bidder_id"`)
- Preislimit kann erhöht UND gesenkt werden (aber nie unter aktuelles Gebot)
- "Preislimit entfernen" = max_amount auf amount setzen (Gebot bleibt — BINDEND)
- **Keine Löschung von Geboten möglich**

### Erhöhungsschritte (`getBidIncrement`)
- < CHF 10 → +0.50
- 10-50 → +1
- 50-100 → +2
- 100-500 → +5
- 500-1000 → +10
- > 1000 → +20

### Timer-Verlängerung
- Gebot in letzten 3 Min → auction_end um 3 Min verlängert

### Auktions-Ende (`finalizeAuction`)
- Prüft ob auction_end vorbei + listing still "active"
- **Duplikat-Schutz**: Prüft ob Purchase bereits existiert
- Mit Geboten → höchster Bieter gewinnt → Purchase erstellt → Listing "sold"
- Ohne Gebote → Listing "expired"
- Auto-Trigger: Bei Page Load + wenn Countdown 0 erreicht

### DB
- `bids`: +`max_amount`, unique index `bids_listing_bidder_unique`
- `bids` RLS: users_update_own_bids, users_delete_own_bids
- `listings`: +`bid_count` (aktualisiert bei jedem Gebot)

===

## PHASE 7: LISTING-ERSTELLUNG ✅

### ListingForm (`src/components/listings/ListingForm.jsx`)
- **4 Typen**: Festpreis, Auktion, Miete, Gratis
- **Felder**: Titel, Beschreibung, Kategorie (2-stufig), Zustand, Preis
- **Auktions-Felder**: Startpreis, Sofortkauf, Mindestpreis, Dauer, Enddatum
- **Miet-Felder**: Mietpreis, Zeitraum, Kaution, Min/Max Tage
- **Versand**: Methode (Paket/Brief/Sperrgut), Geschwindigkeit (A-Post/B-Post), Kosten, Gratis-Versand, Abholung
- **Bilder**: Upload mit Sortierung
- **Bee-Rate / Fee-Modell** (`src/components/listings/FeeModel.jsx`)

### Fee-Tier Mapping
- DB erlaubt: `fair` (3%), `supporter` (5%), `impact` (7%), `hero` (10%)
- Alte Namen (starter/basic/plus/pro) → automatisch gemappt
- Default: `supporter` (5%)

### Speicherung
- `createListing` + `updateListing` in `listings.js`
- Alle Felder inkl. `ship_speed`, `free_shipping` werden korrekt gespeichert

===

## PHASE 8: MEINE INSERATE ✅

### Seite (`src/app/(public)/listings/page.jsx`)
- Liste aller eigenen Inserate
- **Buttons**: Verkauft/Vermietet/Reaktivieren
- Soft Delete (status → "deleted", nicht aus DB gelöscht)
- View-Count + Favorite-Count Anzeige

===

## PHASE 9: FAVORITEN ✅

### Seite (`src/app/(public)/favorites/page.jsx`)
- Grid mit ListingCards
- Toggle via `useFavorite` Hook
- DB: `favorites` Tabelle (user_id + listing_id, kein id-Column)

===

## PHASE 10: ORDER-FLOW (RICARDO-STYLE) ✅

### Purchase-System
- **DB**: `purchases` Tabelle mit Status-Flow
- **Status-Constraint**: `confirmed`, `payment_pending`, `paid`, `shipped`, `picked_up`, `delivered`, `completed`, `cancelled`, `disputed`
- **RLS**: SELECT + INSERT + UPDATE für Käufer/Verkäufer

### Purchase Events Timeline
- **DB**: `purchase_events` Tabelle
- Event-Types: `purchased`, `payment_marked`, `payment_confirmed`, `payment_rejected`, `shipped`, `picked_up`, `delivered`, `completed`, `disputed`, `cancelled`

### Order-Flow Funktionen (`src/lib/listings.js`)
- `getPurchaseDetail(purchaseId)` — Profile separat laden (FK → auth.users, nicht profiles)
- `getPurchaseByListing(listingId)` — Fallback-Lookup
- `getPurchaseEvents(purchaseId)`
- `addPurchaseEvent(purchaseId, eventType, message, trackingNumber, userId)`
- `updatePurchaseStatus(purchaseId, newStatus)`
- `markAsPaid(purchaseId, userId)` — Käufer: "Ich habe bezahlt"
- `confirmPayment(purchaseId, userId)` — Verkäufer: "Zahlung erhalten"
- `markAsShipped(purchaseId, userId, trackingNumber)` — mit Post CH Tracking
- `markAsPickedUp(purchaseId, userId)` — Abholung
- `confirmDelivery(purchaseId, userId)` — Käufer: "Empfang bestätigt"
- `completeTransaction(purchaseId, userId)` — Abschluss

### Order-Detail-Seite (`src/app/(public)/order/[id]/page.jsx`)
- **2-Spalten-Layout** (responsive, 1-spaltig unter 800px)
- **Linke Spalte**: Aktions-Box (kontextabhängig Käufer/Verkäufer), Timeline, Bewertung
- **Rechte Spalte**: QR-Block (Zahlungsinfos), Zusammenfassung
- Akzeptiert Purchase-ID ODER Listing-ID (Fallback)
- Kein Browser-Alert, stille Fehlerbehandlung

### QR-Block (rechte Spalte)
- Weisse Box mit: Begünstigter (volle Adresse), IBAN, Betrag (inkl. Versand), Zahlungszweck (BEE-Ref)
- Copy-Buttons für jedes Feld
- Gelber "QR-Rechnung anzeigen" Button → `/order/[id]/invoice`
- Nur für Käufer sichtbar

### Zusammenfassung (rechte Spalte)
- Artikelpreis, Versandkosten, Gebühr, Bee-Impact, Verkäufer/Käufer, Referenz

### Bewertung (nach Abschluss)
- Erscheint bei Status "delivered" oder "completed"
- 5 Sterne + Kommentar
- Speichert in `ratings` Tabelle (rater_id, rated_id, score, comment, purchase_id)
- Prüft ob bereits bewertet

### QR-Rechnung / Invoice (`src/app/(public)/order/[id]/invoice/page.jsx`)
- Swiss QR-Rechnung (SPC v2.0)
- BEEDARO Logo + Adressen + Positionen-Tabelle
- Artikel + Versandkosten = Gesamtpreis
- QR-Code (generiert via api.qrserver.com)
- Gebühren-Info (Plattformgebühr + Bee-Impact)
- Zahlungsfrist: "Zahlbar innert 30 Tagen"
- Print-optimiert (A4, keine Browser-Header)
- Nutzt `calcFeeFromPrice`, `makeBeeRef`, `makeArtRef`, `makeFeeRef`, `calcDueDate` aus `fees.js`

===

## PHASE 11: EINSTELLUNGEN ✅

### Settings-Seite (`src/app/(public)/settings/page.jsx`)
- **Profil**: Display Name, Avatar, Bio
- **Adresse**: Strasse, PLZ, Ort, Kanton
- **Konto**: Email, Passwort, IBAN
- **Benachrichtigungen**: Ricardo-Style Toggles (Auktion endet bald, Überboten, etc.)
- **Bee-Rate**: Preferred Fee Tier

===

## PHASE 12: CONTENT-SEITEN ✅

- Hilfe / FAQ
- So funktioniert's
- Bee-Impact
- Über uns
- AGB
- Datenschutz
- Impressum
- Kontakt

===

## PHASE 13: BETA-COCKPIT ✅

### BetaFeedback (`src/components/shared/BetaFeedback.jsx`)
- Floating gelber Button
- 2 Tabs: Checkliste + Feedback
- **Context-Aware**: Tests pro Seite via `usePathname()`
- Seiten-spezifische Tests: / (5), /search (6), /listings/new (16), /listing/ (12), /settings (9), /listings (6), /order/ (6), /favorites (3)
- 7 zusätzliche Mobile-Tests auto-gezeigt
- DB: `beta_feedback` Tabelle

### Beta-Seite (`src/app/(public)/beta/page.jsx`)
- Vollständige Test-Checkliste: 11 Kategorien, 120+ Items

===

## DB-SCHEMA (VERIFIZIERT)

### Tabellen (13 User Tables)
`profiles`, `listings`, `listing_images`, `categories`, `conversations`, `messages`, `transactions`, `reviews`, `favorites`, `notifications`, `payouts`, `reports`, `bee_rate_config`

### Zusätzliche Tabellen
`bids`, `purchases`, `purchase_events`, `ratings`, `beta_feedback`

### Listings-Spalten (verifiziert)
- `condition` (NOT condition_type)
- `shipping_available` + `pickup_only` (NOT delivery_type)
- `shipping_payer` (NOT shipping_paid_by)
- `shipping_method` (paket/brief/sperrgut)
- `ship_speed` (economy/priority)
- `free_shipping` (boolean)
- `shipping_cost` (numeric)
- `fee_percentage` + `fee_tier` (fair/supporter/impact/hero)
- `contact_phone` = bool; `phone_number` = text
- `pay_twint` / `pay_bank` / `pay_cash` = booleans
- `listing_type` = sell/auction/rent/free
- Auction: `start_price`, `buy_now_price`, `min_price`, `auction_duration`, `auction_end`
- Rent: `rent_price`, `rent_period`, `deposit_amount`, `min_rent_days`, `max_rent_days`
- `bid_count` (integer, updated bei jedem Gebot)
- `view_count`, `favorite_count`

### Profiles-Spalten
- `display_name` (NOT full_name)
- `iban`, `street`, `postal_code`, `city`, `phone`, `avatar_url`, `bio`
- `bee_rate_tier`, `bee_impact_total`, `bee_level`, `avg_rating`, `rating_count`

### FK-Hinweise
- `profiles!listings_user_id_fkey` für Seller-Join
- `purchases.buyer_id/seller_id` → `auth.users` (NICHT profiles!) → separat laden
- `purchase_events.created_by` → `profiles` (aber FK funktioniert nicht immer → ohne Hint)
- `ratings`: `rater_id`, `rated_id`, `purchase_id`, `score`, `comment`

### Wichtige RLS-Policies
- purchases: SELECT (buyer/seller), INSERT (auth), UPDATE (buyer/seller)
- purchase_events: SELECT + INSERT (buyer/seller of purchase)
- bids: SELECT (public), INSERT/UPDATE/DELETE (own)

===

## TEST-DATEN

### Denis (yam_89xr)
- 5 Auktions-Inserate (PS2, N64, Swatch, Victorinox, LEGO Porsche)
- Diverse Festpreis-Inserate (Trompete, PS1, Nintendo, Laptop, etc.)
- 1 Miet-Inserat (Tromä)

### Marco Bernasconi (Test-User)
- 5 Auktions-Inserate (Mountainbike, iPhone 13 Pro, Weber Grill, Bosch Akkuschrauber, MSR Zelt)
- Purchases: Trompete (CHF 490), PS1 (CHF 90), Gitarre (CHF 290)
- Gewonnene Auktionen: Bosch Akkuschrauber (CHF 10), LEGO Porsche (CHF 120)

===

## BEKANNTE PATTERNS & LEARNINGS

### CSS/Tailwind
- Tailwind v4 responsive classes unzuverlässig → `<style>` Tags mit custom CSS
- `<style>` Tags IN Komponenten → Hydration Errors → in `globals.css` verschieben
- `className` als JSX-Attribut, NICHT in style-Objekt

### Supabase
- `.maybeSingle()` statt `.single()` für optionale Queries
- `listing_images!inner` schliesst Listings ohne Bilder aus → outer join für Search
- FK-Hints nur wenn FK auf profiles zeigt (nicht auth.users)

### Auth
- Immer `getSession()` verwenden (nicht `getUser()`)
- `onAuthStateChange` Listener für reactive auth

===

## PHASE 14: ORDER-SYSTEM OVERHAUL (RICARDO-STYLE) ✅

> Datum: 2. Juni 2026
> Referenz: Ricardo.ch Kauf/Verkauf-Seiten als Vorlage

### Nummern-System
- **BEE-XXXXXXXX** — Eine einzige Order-Referenz für Käufer UND Verkäufer (aus Purchase-ID, erste 8 Zeichen)
- **ART-XXXXXXXX** — Artikel-Referenz (aus Listing-ID, erste 8 Zeichen), suchbar in Suchleiste
- Keine getrennten Kauf/Verkauf-Nummern wie bei Ricardo — eine BEE-Nummer für beide Seiten

### Order-Detail-Seite (`src/app/(public)/order/[id]/page.jsx`) — Komplett Neu
- **Perspektive**: Automatische Erkennung Käufer vs Verkäufer → Titel "Kauf BEE-XXX" oder "Verkauf BEE-XXX"
- **Produkt-Card** (oben): Bild, Titel (verlinkt), Kauf/Verkaufsdatum, Lieferart, Gesamtpreis
- **Status-Banner**: Grün "Kauf/Verkauf abgeschlossen — Fertig!" bei Status delivered/completed
- **Interaktive Aktions-Box**: Je nach Status und Rolle verschiedene Buttons:
  - Käufer confirmed → "Ich habe bezahlt"
  - Käufer payment_pending → Wartemeldung "Verkäufer prüft"
  - Verkäufer confirmed/pending_payment/payment_pending → **Immer** "Zahlung erhalten" Button (Weg B: Verkäufer kann unabhängig bestätigen, auch wenn Käufer nicht markiert hat)
  - Verkäufer paid → "Als versendet markieren" + Sendungsnummer-Feld
  - Käufer shipped → "Empfang bestätigen" + Tracking-Link
- **Timeline**: Ricardo-Style mit Dots + Lines, "Siehe Verlauf" / "Weniger anzeigen" Toggle (Top 2 Events sichtbar, Rest auf Klick)
- **Perspektivische Timeline-Texte**: z.B. Käufer sieht "Du hast bezahlt markiert", Verkäufer sieht "Käufer hat bezahlt markiert. Muss überprüft werden."
- **Event-Kategorien**: "Artikel gekauft/verkauft", "Zahlung", "Lieferung", "Kauf/Verkauf abgeschlossen"
- **"Bankverbindung des Verkäufers"** Link in Timeline nach payment_marked Event (scrollt zu Zahlungsblock)
- **Bewertungs-Sektion**: Sterne + Kommentar, Anzeige nach Abschluss
- **Action Links**: "Kaufbestätigung ansehen" / "Artikel weiterverkaufen" (nur bei Abschluss)
- **Sidebar (rechts)**:
  - Kaufübersicht / Verkaufsübersicht (Preisaufschlüsselung mit Gesamtpreis)
  - Lieferart (Paket/Brief/Sperrgut + A-Post/B-Post)
  - Lieferadresse (Käufer-Adresse)
  - Sendungsnummer (wenn vorhanden, mit Post.ch Link)
  - Verkauft von / Verkauft an (Counterpart-Info)
  - Kauf/Verkauf Details (BEE-Ref, ART-Ref, Link zur Angebotsseite)
- **Zahlungsinformationen** (nur Käufer): Begünstigter, IBAN, Betrag, Zahlungszweck mit Copy-Buttons + QR-Rechnung Button
- **Hilfe-Box**: "Verkäufer/Käufer reagiert nicht?" mit Links zu Tipps/Kontakt

### Meine Käufe (`src/app/(public)/purchases/page.jsx`) — Bugfixes
- **Auth-Fix**: `getSession()` statt `getUser()` (getUser() returned null wegen localStorage)
- **Status-Fix**: Filter nach echtem `status` Feld statt nicht-existierendem `shipping_status`
- **Referenz-Fix**: `makeBeeRef(p.id)` statt nicht-existierendem `order_number`
- **STATUS_CONFIG**: Alle 10 Status korrekt gemappt (confirmed, pending_payment, payment_pending, paid, shipped, picked_up, delivered, completed, cancelled, disputed)
- **Filter-Tabs**: "Alle", "Offen" (confirmed/pending_payment/payment_pending), "Bezahlt", "Unterwegs" (shipped/picked_up), "Abgeschlossen" (delivered/completed)
- Link-Farbe auf `colors.yellow` (statt `colors.blue`)

### Meine Verkäufe (`src/app/(public)/sales/page.jsx`) — Bugfixes
- Gleiche Fixes wie purchases (Auth, Status, Referenz, Filter)
- Filter-Tabs: "Alle", "Offen" (inkl. paid), "Versendet", "Abgeschlossen"

### ART/BEE Suche (`src/lib/listings.js` → `searchListings`)
- **ART-Prefix**: Suche nach `ART-XXXXXXXX` → findet Listing per ID-Prefix (auch verkaufte/inaktive Artikel)
- **BEE-Prefix**: Suche nach `BEE-XXXXXXXX` → findet Purchase per ID-Prefix → zeigt verknüpftes Listing
- Prefix-Erkennung case-insensitive (toUpperCase)
- Kein Status-Filter bei Prefix-Suche (damit man auch abgeschlossene Artikel findet)

### Design-Entscheidung: Weg B (Zahlungsbestätigung)
- Verkäufer kann **immer** "Zahlung erhalten" klicken, auch wenn Käufer nicht "Ich habe bezahlt" markiert hat
- Grund: In der Praxis bezahlen Leute per Bank/Twint aber vergessen den Button
- Kontextabhängiger Text: "Der Käufer hat markiert..." vs "Sobald die Zahlung eingegangen ist..."
- Status springt direkt auf `paid` → Verkäufer kann sofort versenden

### Namen & Kontaktdaten Fix
- `getPurchaseDetail` nutzt jetzt `select("*")` für Profile (vorher explizite Spalten die 400-Fehler verursachten weil `email`/`first_name`/`last_name` ggf. nicht existieren)
- **WICHTIG**: `profiles` Tabelle hat möglicherweise KEINE `first_name`, `last_name`, `email` Spalten — `select("*")` holt was da ist, ohne zu brechen
- **Lieferadresse**: Zeigt `fullName()` (first_name + last_name, Fallback display_name)
- **Verkauft von / Verkauft an**: Zeigt: Voller Name → Benutzername (gelb) → Email (wenn vorhanden) → Telefon
- **Zahlungsinformationen Begünstigter**: Zeigt `fullName()` statt display_name
- **TODO**: `first_name`, `last_name`, `email` Spalten in `profiles` Tabelle anlegen (via Supabase Dashboard) damit korrekte Namen angezeigt werden

### Sofortkauf-Preis Fix (`src/app/(public)/listing/[id]/page.jsx`)
- **Bug**: Bei Auktion mit Sofortkauf wurde der Auktionspreis (aktuelles Gebot) statt buy_now_price in der Purchase gespeichert
- **Fix**: Nach `createPurchase` wird `purchases.price` explizit auf `buy_now_price` aktualisiert
- **Bonus-Fix**: `handleBuy` (Festpreis) hatte vertauschte Parameter: `createPurchase(l.id, user.id)` → korrigiert zu `createPurchase(user.id, l.id)`
- **Bonus-Fix**: `router.push` nutzt jetzt die echte Purchase-ID statt Listing-ID für die Weiterleitung zur Order-Seite

===

## PHASE 15: MIETLOGIK (GEPLANT) 🔲

> Status: Brainstorming — 2. Juni 2026
> Voraussetzung: Phase 14 abgeschlossen, IBAN Pflicht für alle User

### Grundprinzip
- Gleiche Order-Seite `/order/[id]` wie Kauf/Verkauf — erkennt Miet-Kontext anhand `listing_type === "rental"`
- Gleicher 2-Spalten-Aufbau, gleiche Sidebar, gleiche QR-Zahlungslogik
- Nur andere Labels, Felder und Timeline-Schritte

### IBAN Pflicht
- **IBAN wird Pflichtfeld für ALLE User** die vermieten ODER mieten
- Grund: Kaution-Rückzahlung braucht QR-Rechnung in Gegenrichtung (Vermieter → Mieter)
- Enforcement: Bei Miet-Buchung prüfen ob IBAN hinterlegt, sonst Weiterleitung zu Settings

### Listing-Typ Erweiterung
- Neuer `listing_type`: `"rental"` (neben `"auction"` und `"fixed"`)
- Neue Felder im Listing:
  - `rental_price_per_day` (decimal)
  - `rental_min_days` (integer)
  - `rental_max_days` (integer)
  - `deposit_amount` (decimal, optional)
  - `early_return_allowed` (boolean) — vorzeitige Rückgabe mit anteiliger Rückerstattung

### Seitentitel & Labels
- Mieter: "Miete BEE-XXXXXXXX"
- Vermieter: "Vermietung BEE-XXXXXXXX"

### Sidebar — Mietübersicht
- Preis: z.B. CHF 5.00/Tag × 7 Tage = CHF 35.00
- Kaution: CHF 50.00 (falls vorhanden)
- Lieferart oder Abholung
- Mietdauer: 2. Juni – 9. Juni 2026
- Rückgabedatum: 9. Juni 2026
- Vermietet von / Gemietet von (Counterpart-Info)
- BEE + ART Referenz

### Zahlungsblock
- Betrag = Mietpreis + Kaution + ggf. Versand — eine QR-Rechnung
- Zahlungszweck: BEE-XXXXXXXX

### Interaktive Timeline — Miet-Flow
1. **Gemietet** — "Du hast den Artikel gemietet!" / "Dein Artikel wurde gemietet!"
2. **Zahlung** — Mieter: "Ich habe bezahlt" / Vermieter: "Zahlung erhalten" (Weg B, unabhängig)
3. **Übergabe/Versand** — Vermieter: "Als versendet/übergeben markieren" / Mieter: "Artikel erhalten"
4. **Mietzeit läuft** — Countdown-Anzeige mit Fortschrittsbalken, Rückgabedatum prominent
5. **Rückgabe** — Mieter: "Ich habe zurückgegeben" / Vermieter: "Rückgabe erhalten"
6. **Prüfung** — Vermieter prüft Zustand → 3 Optionen (OK / Teilschaden / Totalschaden)
7. **Kaution** — QR-Rechnung Gegenrichtung (Vermieter → Mieter), volle oder Teil-Kaution
8. **Abgeschlossen** — "Miete abgeschlossen" / "Vermietung abgeschlossen" + Bewertung

### Schadensfälle nach Rückgabe
Vermieter prüft Artikel und hat 3 Optionen:

**Option A: Alles OK**
- "Rückgabe OK — Kaution zurückerstatten"
- QR-Rechnung → voller Kautionsbetrag an Mieter
- Abgeschlossen

**Option B: Teilschaden**
- "Schaden melden" → Formular:
  - Schadensbeschreibung (Pflicht)
  - Fotos hochladen (Pflicht, max 5 Bilder)
  - Schadenshöhe in CHF
  - System rechnet: Kaution − Schaden = Rückerstattung
- Mieter sieht Fotos + Beschreibung und wählt:
  - "Akzeptieren" → Teil-Kaution zurück, Rest bleibt beim Vermieter
  - "Ablehnen" → Streitfall

**Option C: Totalschaden / Verlust**
- Gleicher Flow wie Teilschaden, Schadenshöhe = Kautionsbetrag
- Rückerstattung = CHF 0
- Falls Schaden > Kaution: Vermieter kann Nachforderung stellen (separate Rechnung)

### Schadens-Dokumentation (Vorher/Nachher)
- Vermieter kann **vor der Übergabe** Fotos hochladen ("Zustand bei Übergabe")
- Und **bei Rückgabe** nochmal Fotos ("Zustand bei Rückgabe")
- Klarer Vorher/Nachher-Vergleich bei Streitfällen

### Streitfall-Eskalation
- Mieter lehnt Schadensmeldung ab → Status `disputed`
- **Phase 1 — Einigung** (7 Tage): Nachrichten + neuen Betrag vorschlagen
- **Phase 2 — BEEDARO Support**: "Support einschalten" → Team prüft Fotos + entscheidet
- Timeline zeigt alle Schritte transparent

### Verspätete Rückgabe
- Rückgabedatum überschritten → automatischer Tagesaufschlag (1.5× Tagespreis)
- Tag 1–3: Erinnerung + Zuschlag, Timeline: "Rückgabe überfällig — Tag 3 — Zuschlag CHF 7.50"
- Tag 7+: Warnung "Kaution wird einbehalten wenn Artikel nicht zurückkommt"
- Tag 14+: Automatisch "nicht zurückgegeben" → Kaution weg + Nachforderung möglich

### Vorzeitige Rückgabe
- Vermieter entscheidet bei Inseratserstellung: "Vorzeitige Rückgabe möglich" (Toggle)
- Wenn ja → anteilige Rückerstattung automatisch berechnet (z.B. 3 von 7 Tagen genutzt → 4 Tage zurück)

### Stornierung vor Übergabe
- Mieter kann innerhalb 24h nach Buchung stornieren
- Kaution + Mietpreis komplett zurück → QR-Rechnung Gegenrichtung
- Nach Übergabe: keine Stornierung mehr, nur noch Rückgabe

### Artikel nicht wie beschrieben (Mieter-Beschwerde)
- Mieter erhält Artikel und er ist anders als beschrieben
- "Problem melden" Button → Fotos + Beschreibung
- Mieter wählt: "Trotzdem behalten" oder "Zurücksenden — Vollerstattung"
- Gegenstück zum Schadenfall, aber aus Mieter-Perspektive

### Wiederholte Vermietung (Zukunft)
- Gleicher Artikel kann mehrfach vermietet werden (Mietvelo, Werkzeug, etc.)
- Listing bleibt aktiv, wird NICHT "sold"
- Kalender-Ansicht: Vermieter sieht gebuchte Tage
- Mieter sieht verfügbare Zeiträume bei Buchung

### Listing-Status nach Rückgabe
- **Beim Kauf:** Listing → `sold` → bleibt inaktiv, fertig
- **Beim Vermieten:** Listing → `rented` (nicht in Suche sichtbar) → nach bestätigter Rückgabe + Kaution erledigt → **automatisch zurück auf `active`** → wieder in der Suche, nächste Person kann mieten
- **Sonderfälle:**
  - Totalschaden / Verlust: Listing bleibt `rented` oder wechselt auf `archived` — Vermieter entscheidet ob reaktivieren
  - Vermieter will pausieren: kann Listing manuell auf `draft` setzen statt automatisch aktiv
- **Neues Feld im Listing:** `auto_reactivate` (boolean, default true) — "Nach Rückgabe automatisch wieder aktivieren" Toggle im Inserat-Formular
- **Automatik:** Wenn Purchase-Status auf `completed` wechselt UND `listing_type === "rental"` UND `auto_reactivate === true` → Listing-Status zurück auf `active`

### Versicherung / Mietschutz (Backlog)
- Optional: Mieter bucht "Mietschutz" für z.B. CHF 2/Tag
- Deckt Schäden bis Kautionsbetrag ab
- Zusätzliche Einnahmequelle für BEEDARO
- Erst wenn Basis-Mietlogik steht

### Neue DB-Tabellen / Felder
- `damage_reports`: purchase_id, reporter_id, description, damage_amount, status (pending/accepted/disputed/resolved)
- `damage_images`: damage_report_id, url, type (before_handover/after_return)
- `purchases.deposit_amount` — Kautionsbetrag
- `purchases.deposit_refund_amount` — tatsächlich zurückerstatteter Betrag
- `purchases.rental_start_date`, `purchases.rental_end_date`
- `purchases.return_date` — tatsächliches Rückgabedatum

### Neue Status-Werte für Miet-Purchases
- `rented` — Mietvertrag aktiv, Mietzeit läuft
- `return_pending` — Mieter hat Rückgabe markiert
- `return_inspection` — Vermieter prüft Artikel
- `damage_reported` — Schaden gemeldet, warten auf Mieter
- `damage_accepted` — Mieter akzeptiert Schadensmeldung
- `returned` — Rückgabe bestätigt
- `deposit_returned` — Kaution zurückerstattet
- `overdue` — Rückgabedatum überschritten

===

## PHASE 16: GAMIFICATION-SYSTEM (GEPLANT) 🔲

> Status: Brainstorming — 2. Juni 2026
> Philosophie: Subtil und echt — KEINE physischen Preise, kein Badge-Fatigue, kein aggressives Pushing

### Bee-Level System (5 Stufen)

| Level | XP-Schwelle | Mindest-Rate | Perks |
|---|---|---|---|
| Bee Starter | 0 | 3% (Fair) | Standard |
| Busy Bee | 100 | 3% (Fair) | Achievement-Badges sichtbar auf Profil |
| Hive Builder | 300 | 2% (Lite) | Tiefere Mindestgebühr |
| Queen Bee | 750 | 1% | + 1× Gratis-Gutschein (0% auf einen Verkauf) |
| Bee Legend | 1500 | 1% | + 3× Gratis-Gutscheine, goldener Profilrahmen |

### 3 Ebenen der Gamification

**Ebene 1 — Visibility:**
- Bee-Level Badge neben Username überall (Listings, Chat, Profil, Bewertungen)
- Badge-Design passend zum Level (dezent, nicht überladen)
- Fortschrittsbalken im Profil: "Noch 45 XP bis Queen Bee"

**Ebene 2 — Advantages:**
- Höheres Level = tiefere Mindest-Bee-Rate (siehe Tabelle)
- Gratis-Gutscheine als Einmal-Belohnung (0% Gebühren auf einen Verkauf)
- User spart Gutschein für teure Verkäufe auf — fühlt sich wie echtes Geschenk an
- BEEDARO verdient immer mindestens 1% (ausser bei eingelöstem Gutschein)
- **Von jeder Gebühr gehen 20% an Bienenschutz (Bee-Impact)** — auch bei 1% Mindestgebühr
- Beispiel: Verkauf CHF 100 bei 1% Rate → CHF 1 Gebühr → davon CHF 0.20 an Bee-Impact
- Das heisst: selbst die günstigste Stufe unterstützt noch Bienen

**Ebene 3 — Community Impact:**
- Öffentlicher Counter auf Homepage: "BEEDARO Community hat X Artikel gerettet"
- Gemeinsame Bee-Impact Summe: "Zusammen CHF X für Bienenschutz"
- Bei grossen Meilensteinen: alle aktiven User bekommen Bonus-XP
- Echte Projekt-Updates (welche Bienenprojekte unterstützt werden)

### Bee-XP System

**Punkte pro Aktion:**
- Inserat erstellen: +10 XP
- Verkauf abschliessen: +25 XP
- Positive Bewertung erhalten: +15 XP
- Artikel verschenken: +30 XP (mehr als Verkauf — belohnt Grosszügigkeit)
- Profil vervollständigen: +20 XP
- Erste Miete abschliessen: +20 XP
- Streitfall fair gelöst: +10 XP
- Freund eingeladen (Referral): +50 XP für beide

**XP-Regeln:**
- XP verfallen NIE — einmal verdient, für immer
- Level kann nie sinken — kein Stress
- Kein Pay-to-Win — nur durch echte Aktivität verdienbar

### Achievements / Meilensteine

Jedes Achievement gibt Bonus-XP und ist auf dem öffentlichen Profil sichtbar (wie PlayStation Trophäen):

- "Erste Legende verkauft" — erster Verkauf (+10 XP)
- "Sammler" — 10 Käufe (+20 XP)
- "Blitzverkäufer" — Artikel innerhalb 24h verkauft (+15 XP)
- "5-Sterne-Händler" — 10 Bewertungen mit 5 Sternen (+25 XP)
- "Bienenfleissig" — 30 Tage am Stück aktiv (+30 XP)
- "Verschenker" — 5 Artikel verschenkt (+20 XP)
- "Vermieter des Monats" — meiste Vermietungen in einem Monat (+25 XP)
- "Profil-Profi" — alle Verifizierungen abgeschlossen (+15 XP)
- "Botschafter" — 10 Freunde eingeladen (+30 XP)

### Monats-Challenges

- Monatlich wechselnde Aufgaben, auf der Homepage angezeigt
- Beispiele:
  - "Juni-Challenge: Verkaufe 3 Artikel aus Kategorie Sport"
  - "Sommer-Challenge: Vermiete dein erstes Item"
  - "Herbst-Challenge: Verschenke 2 Artikel"
- Belohnung: Bonus-XP + exklusives zeitlich limitiertes Badge
- Challenges verpassen = keine Bonus-XP (sanfter FOMO, kein Stress)
- Hält die Plattform frisch, gibt Gründe zurückzukommen

### Profil-Flair (visuell)

- Jedes Level schaltet neue Profilrahmen frei
- Bee Legend: goldener Rahmen um Avatar
- Saisonale Flair-Items (z.B. Winter-Biene, Sommer-Biene) — durch Monats-Challenges verdienbar
- Achievement-Badges als kleine Icons auf dem Profil

### Referral-System

- Persönlicher Einladungslink im Profil
- "Lade Freunde ein → beide bekommen 50 XP"
- Kein Geld, nur XP — bleibt sauber
- Zeigt im Profil: "Hat 12 Freunde eingeladen"
- Tracking via `referral_code` in profiles + `referred_by` bei Registration

### Saisonale Ranglisten (dezent, opt-in)

- Monats-Top-Verkäufer pro Kategorie
- Nicht aggressiv — eher "Top 10 Elektronik-Verkäufer diesen Monat"
- Opt-in: Wer nicht in der Rangliste sein will, kann es in Settings ausschalten
- Kleines Badge für Top-10 Platzierung

### Community-Meilensteine (kollektiv)

- "BEEDARO Community hat 1'000 Artikel gerettet"
- "Gemeinsam CHF 5'000 Bee-Impact erreicht"
- Live-Counter auf Homepage (Bee-Impact Counter existiert bereits)
- Bei Meilenstein: alle aktiven User bekommen Bonus-XP

### Neue DB-Tabellen / Felder

- `profiles.xp_total` (integer, default 0)
- `profiles.bee_level` (text: starter/busy_bee/hive_builder/queen_bee/bee_legend)
- `profiles.referral_code` (text, unique)
- `profiles.referred_by` (uuid, nullable)
- `user_achievements` Tabelle: user_id, achievement_key, earned_at
- `user_vouchers` Tabelle: user_id, type (free_fee), earned_at, used_at, purchase_id
- `challenges` Tabelle: id, title, description, category, target_count, xp_reward, badge_key, start_date, end_date
- `user_challenges` Tabelle: user_id, challenge_id, progress, completed_at
- `xp_log` Tabelle: user_id, action, xp_amount, created_at (für Nachvollziehbarkeit)

===

## BRAINSTORMING-NOTIZEN (2. Juni 2026)

### MWST / Steuer-Handling (Option A + Admin-Toggle)

**Entscheidung:** Bee-Rates (3/5/7/10%) beinhalten MWST bereits — Seller sieht immer denselben Prozentsatz, egal ob BEEDARO MWST-pflichtig ist oder nicht. **Bee-Impact wird IMMER auf die Brutto-Gebühr berechnet** — saubere Zahlen, starke Marketing-Message.

**Admin-Toggle im Dashboard:**
- `mwst_active: false` (Standard, solange unter CHF 100'000 Jahresumsatz)
- `mwst_active: true` (sobald MWST-Schwelle erreicht)
- `mwst_rate: 8.1` (konfigurierbar falls Satz sich ändert)

**Berechnung wenn MWST aktiv (z.B. 5% auf CHF 100 Verkauf):**
```
Gebühr total:     CHF 5.00 (5% — Seller sieht nur das)
├= Bee-Impact:    CHF 1.00 (20% von 5.00 brutto — immer glatt, immer gleich)
├= MWST:          CHF 0.33 (8.1% vom BEEDARO-Anteil: 4.00 ÷ 1.081)
└= BEEDARO:       CHF 3.67 (Rest nach Bee-Impact und MWST)
```

**Berechnung wenn MWST nicht aktiv:**
```
Gebühr total:     CHF 5.00
├= Bee-Impact:    CHF 1.00 (20% von 5.00)
└= BEEDARO:       CHF 4.00 (Rest)
```

**Warum Brutto statt Netto für Bee-Impact:**
- "20% jeder Gebühr geht an Bienenschutz" — saubere Message, kein Kleingedrucktes
- Bee-Impact ist immer exakt 20% der sichtbaren Gebühr — egal ob MWST aktiv oder nicht
- MWST kommt aus BEEDARO's Anteil, nicht aus dem Bee-Impact
- Differenz ist minimal (7 Rappen pro CHF 5 Gebühr) — saubere Botschaft ist mehr wert
- Community-Counter auf Homepage zeigt immer glatte, ehrliche Zahlen

**Pre-Beta Task:** Rechtsform / Treuhänder-Erstberatung (Einzelfirma vs. GmbH, MWST-Registration, Bee-Impact steuerlich korrekt abwickeln)

**Offene Frage für Treuhänder: Bee-Impact als Durchlaufposten?**
- Wenn der Bee-Impact (20%) direkt an eine gemeinnützige Organisation weitergeleitet wird, könnte er als **Durchlaufposten** gelten → kein Umsatz, keine MWST darauf
- Variante 1 (optimal): Durchlaufposten → MWST fällt nur auf BEEDARO's 80%-Anteil an
- Variante 2 (Fallback): BEEDARO nimmt alles ein, spendet 20% weiter → Spende als Geschäftsaufwand absetzbar (bis 20% des Reingewinns in CH)
- Voraussetzung für Variante 1: Empfänger-Organisation muss gemeinnützig/steuerbefreit sein
- Muss rechtlich korrekt aufgesetzt werden → Treuhänder klären

### Kauf-Flow Vereinheitlichung (geplant)
- Festpreis-Kauf und Auktions-Sofortkauf sollen **einen einzigen Kauf-Flow** nutzen
- `createPurchase(userId, listingId, price)` bekommt expliziten Preis-Parameter
- Festpreis: `price = listing.price`
- Sofortkauf: `price = listing.buy_now_price`
- Eliminiert Race Condition (Listing-Price-Update vor Purchase-Erstellung)

**Auktionslogik bleibt komplett bestehen:**
- Bieten ab 1 CHF aufwärts, Preislimit (max_amount), Überbieten
- Gebote gedeckelt auf `buy_now_price - 1` (z.B. max 139 CHF wenn Sofortkauf bei 140)
- Warnung wenn Gebot nahe am Sofortkauf: z.B. bei 138 CHF Gebot → "Dein Gebot ist nahe am Sofortkauf-Preis von CHF 140. Sofort kaufen?"
- Ab `buy_now_price - 2` erscheint der Sofortkauf-Hinweis
- Auktions-Timer, Verlängerung bei Last-Second-Bid — alles unverändert
- Nur der letzte Schritt (Purchase erstellen bei Sofortkauf-Klick) wird mit Festpreis vereinheitlicht

**Aktueller Bug (gefixt in Phase 14):**
- `handleBuy()` hatte vertauschte Parameter: `createPurchase(l.id, user.id)` → `createPurchase(user.id, l.id)`
- Sofortkauf schrieb Auktionspreis statt buy_now_price in Purchase → jetzt explizites Update nach Erstellung
- Langfristig: mit dem neuen `price`-Parameter entfällt dieser Workaround komplett

### Pflichtfelder-Definition (plattformweit)

**Profil / Registration:**
- Display Name (Benutzername) — Pflicht
- Vorname + Nachname — Pflicht (für Lieferadresse, QR-Rechnung)
- Email — Pflicht (kommt von Auth, bereits da)
- Strasse + PLZ + Ort — Pflicht sobald man kauft oder mietet (Lieferadresse)
- IBAN — Pflicht sobald man verkauft oder vermietet (Zahlungsempfang + Kaution-Rückzahlung)
- Telefon — optional, aber empfohlen

**Inserat erstellen (alle Typen):**
- Titel — Pflicht
- Beschreibung — Pflicht
- Mindestens 1 Bild — Pflicht
- Kategorie — Pflicht
- Zustand — Pflicht
- Standort (PLZ/Ort) — Pflicht
- Mindestens eine Zahlungsart (Twint/Bank/Bar) — Pflicht
- Versand UND/ODER Abholung — mindestens eins muss aktiv sein, beides gleichzeitig möglich (`shipping_available` + `pickup_only` sind unabhängige Booleans, Käufer wählt bei Checkout)
- Bee-Rate Stufe — Default wird aus Settings übernommen, kann aber pro Inserat überschrieben werden

**Zusätzlich bei Festpreis:**
- Preis — Pflicht

**Zusätzlich bei Auktion:**
- Startpreis — Pflicht
- Auktionsdauer — Pflicht
- Gebotsschritt — Pflicht (default CHF 1)
- Sofortkauf-Preis — optional
- Mindestpreis (Reserve) — optional

**Zusätzlich bei Vermietung:**
- Mietpreis pro Tag — Pflicht
- Mindest-Mietdauer — Pflicht
- Max-Mietdauer — optional
- Kaution — optional aber empfohlen

**Beim Kaufen / Mieten (vor Checkout):**
- Lieferadresse komplett (Vorname, Nachname, Strasse, PLZ, Ort) — Pflicht wenn Versand
- IBAN — Pflicht bei Miete (für Kaution-Rückerstattung)

**Bee-Rate Logik:**
- User stellt Default Bee-Rate in Settings ein (z.B. "Fair" 3%)
- Beim neuen Inserat wird der Default vorausgefüllt
- User kann pro Inserat überschreiben (z.B. für spezielles Item "Supporter" 7%)
- Kein Extra-Aufwand wenn man immer gleich bleiben will

**Enforcement-Strategie: Progressive Pflichtfelder**
- NICHT alles bei Registration verlangen (schreckt User ab)
- Stattdessen: erst wenn eine Aktion ausgeführt wird
  - Will verkaufen → "Bitte IBAN hinterlegen" → Weiterleitung zu Settings
  - Will kaufen mit Versand → "Bitte Adresse vervollständigen" → Weiterleitung zu Settings
  - Will mieten → "Bitte IBAN + Adresse hinterlegen"
- Rotes Badge in Settings wenn Felder fehlen: "Profil unvollständig"
- Check-Funktion: `checkProfileComplete(action)` → prüft ob alle nötigen Felder für die gewünschte Aktion vorhanden sind

### Verkaufte / Nicht verfügbare Artikel weiterhin sichtbar
- `/listing/[id]` zeigt **immer** den Artikel an, egal welcher Status (active, sold, rented, archived, draft)
- **Verkauft** → Rotes Banner oben: "Verkauft" + Datum, Kaufen-Button deaktiviert/ausgeblendet
- **Vermietet** → Banner: "Aktuell vermietet — verfügbar ab [Datum]", Mieten-Button deaktiviert
- **Archiviert** → Banner: "Nicht mehr verfügbar"
- **Draft** → nur für Besitzer sichtbar, andere sehen 404
- Alle Infos bleiben sichtbar: Bilder, Beschreibung, Preis, Verkäufer, Bewertungen
- Bei verkauften Artikeln zusätzlich: "Verkauft am [Datum]" + "Ähnliche Artikel" Vorschläge unten
- **ART-Suche**: Bereits implementiert (Phase 14) — funktioniert über die **normale Suchleiste** im Header. User tippt z.B. "ART-D6A6D640" → `searchListings` erkennt Prefix → sucht nach Listing-ID ohne Status-Filter → findet auch verkaufte/archivierte Artikel. Gleiches für "BEE-XXXXXXXX" → findet Purchase → zeigt verknüpftes Listing.
- **Suche ohne Prefix**: Auch die nackte Nummer (z.B. "D6A6D640") soll funktionieren → `searchListings` erkennt 8-stelligen Hex-Code → versucht als Listing-ID UND Purchase-ID zu matchen → findet Artikel ohne ART-/BEE-Prefix
- **Normale Suche** (ohne Prefix): Verkaufte/archivierte Artikel tauchen NICHT in regulären Suchergebnissen auf — nur über ART/BEE-Nummer oder nackte Nummer findbar
- **Direktlink**: Funktioniert immer — URL bleibt dauerhaft gültig, nie 404 (ausser Draft von fremdem User)
- **Listing-Detail-Seite anpassen**: Status-Check entfernen der aktuell möglicherweise sold/archived blockiert

### Auktions-Verbesserungen (geplant)

**1. Gebotsschritt wählbar (wie Ricardo)**
- Verkäufer wählt beim Inserieren den Gebotsschritt: CHF 1 / 2 / 5 / 10 / 20 / 50
- Neues Feld im Listing: `bid_step` (decimal, default 1.00)
- Dropdown im Inserat-Formular: "Gebotsschritt" mit Optionen
- Smarter Default: System schlägt vor basierend auf Startpreis (z.B. Startpreis 200 → Default CHF 5)
- `placeBid` prüft: nächstes Gebot muss mindestens `aktuelles Gebot + bid_step` sein
- Anzeige beim Bieten: "Mindestgebot: CHF 25 (Schritt: CHF 5)"

**2. Mindestpreis (Reserve Price)**
- Verkäufer setzt versteckten Mindestpreis beim Inserieren
- Neues Feld: `reserve_price` (decimal, optional)
- Wenn Auktion endet und Höchstgebot < reserve_price → "Mindestpreis nicht erreicht", kein Verkauf
- Käufer sehen nur "Mindestpreis nicht erreicht" — nie den Betrag
- Anzeige während Auktion: "Mindestpreis noch nicht erreicht" / "Mindestpreis erreicht ✓"
- Schützt Verkäufer bei wertvollen Artikeln

**3. Gebotsverlauf sichtbar (Transparenz)**
- Aufklappbare Liste auf der Listing-Seite: "5 Gebote" → zeigt wer wann wie viel
- Username + Betrag + Zeitpunkt pro Gebot
- Schafft Vertrauen und Transparenz (wie bei Ricardo)

**4. Zweite-Chance-Angebot**
- Wenn Gewinner nicht zahlt (nach 7 Tagen keine Zahlung → Stornierung):
  - Automatisch dem Zweitplatzierten angeboten zum Preis seines Gebots
  - Zweitplatzierter hat 48h Zeit zu akzeptieren
  - Spart dem Verkäufer das Neueinbuchen
- Falls Zweitplatzierter auch ablehnt → Artikel wird wieder aktiv gestellt

**5. Countdown-Benachrichtigungen**
- Wer beobachtet oder geboten hat, bekommt Notifications:
  - "Endet in 1 Stunde"
  - "Endet in 10 Minuten"
  - "Du wurdest überboten!"
  - "Gewonnen! Bitte zahle innerhalb von 7 Tagen"
- Timing konfigurierbar in Settings (bereits in Roadmap als fehlendes Feature)

**6. Preislimit-UX verbessern**
- Klarere Darstellung für den Bieter:
  - "Du bist Höchstbietender mit CHF 45 (dein Preislimit: CHF 80)"
  - "Jemand bietet bis CHF 60 — du bist trotzdem vorne weil dein Limit bei CHF 80 liegt"
- Grafische Anzeige: Balken der zeigt aktuelles Gebot vs. eigenes Preislimit
- Beim Bieten: "Preislimit setzen" prominenter machen, erklären warum es smart ist

**7. Nicht-Zahler-Schutz**
- Tag 3: Erinnerung an Käufer "Bitte bezahle deinen Kauf"
- Tag 5: Warnung "Kauf wird in 2 Tagen storniert"
- Tag 7: Automatische Stornierung → Zweite-Chance-Angebot → oder Artikel wieder aktiv
- Strike-System: Nicht-Zahler bekommt Strike
  - 1 Strike: Warnung
  - 2 Strikes: 7 Tage Biet-Sperre
  - 3 Strikes: 30 Tage Biet-Sperre
- Strike verfällt nach 6 Monaten

===

## PENDING / NÄCHSTE SCHRITTE

### Hoch-Priorität
- [x] ~~**FULL AUDIT**: Kompletten BEEDARO-Ordner durchgehen~~ ✅ 2. Juni 2026
  - 32 Seiten existieren, alle funktional
  - **Gelöscht**: `src/lib/BEEDARO/`, `src/utils/happybuzz/`, `src/types/happybuzz/`, `src/listings/` (alles Junk/Duplikate)
  - **Gelöscht**: 5 alte doppelte Funktionen in listings.js (getOrderDetail, confirmShipping, confirmReceipt, submitRating, getRatingsForPurchase) — ersetzt durch Phase 14 Funktionen
  - **Existiert bereits**: Admin-Dashboard, öffentliches Profil, Chat, Bookings, Beta-Feedback, alle Legal-Seiten, Help, How It Works, Impact, Fees, Contact, BeeLevel Component
  - **Fehlt noch**: Custom 404/Error-Seite, Transaktions-Emails, nackte Nummer-Suche (Hex-Erkennung)
- [ ] **PRE-BETA**: Rechtsform klären + Treuhänder-Erstberatung (Einzelfirma vs. GmbH, MWST, Bee-Impact steuerlich)
- [x] ~~Benachrichtigungssystem (notifications + createNotification Import Fix + alle Transaktions-Events)~~ ✅ 9. Juni 2026
- [x] ~~Meine Käufe / Meine Verkäufe Seiten (Liste → Order-Detail)~~ ✅ Phase 14
- [ ] Content-Filtering (Block personal info in Messages)
- [ ] Responsive / Mobile Testing komplett
  - [x] ~~Footer Mobile Fix (4-Spalten → 1-Spalte auf Mobile, 2-Spalten auf Tablet)~~ ✅
  - [ ] Alle Order-Seiten (Kauf/Verkauf/Miete) auf Mobile testen
  - Sidebar muss unter den Hauptinhalt rutschen (grid → 1 Spalte, bereits mit CSS `@media max-width:800px`)
  - Touch-Targets min 44×44px prüfen
  - QR-Zahlungsblock auf kleinen Screens testen
- [ ] Verkaufte Auktionen aus Suche ausblenden (status = "sold" bereits gefixt, aber ggf. andere Listings prüfen)
- [x] ~~Custom 404-Seite + Error-Seite (not-found.tsx, error.tsx)~~ ✅
- [x] ~~Nackte Nummer-Suche (8-stelliger Hex-Code ohne ART-/BEE-Prefix erkennen)~~ ✅
- [x] ~~Verkaufte/archivierte Artikel über Direktlink + ART-Suche weiterhin sichtbar (Banner statt 404)~~ ✅
- [ ] Transaktions-Emails via Resend (Kaufbestätigung, Zahlungserinnerung, "Du wurdest überboten", Versandbestätigung)
- [ ] Kauf-Flow Vereinheitlichung (Festpreis + Sofortkauf = ein Flow)
- [ ] IBAN Pflichtfeld für alle User (Voraussetzung für Mietlogik)

### Mittel-Priorität
- [ ] Gamification Phase 16 (siehe unten — Bee-XP, Achievements, Challenges, Referrals)
- [ ] Benachrichtigungs-Preferences in DB speichern (aktuell nur Toast)
- [ ] Settings Benachrichtigungen: "Auktion endet bald" Timing-Dropdown
- [ ] 3 fehlende Notification-Types: Verloren, Verlängert, Preislimit erreicht
- [ ] Phase 15: Mietlogik — Basis-Flow (ohne Kalender, ohne Versicherung)
  - [x] ~~Listing-Formular mit Miet-Feldern~~ ✅ (existierte bereits)
  - [x] ~~Buchungs-UI auf Listing-Detail (Datumswahl, Preisberechnung)~~ ✅ (existierte bereits)
  - [x] ~~createBooking Funktion~~ ✅ (existierte bereits)
  - [x] ~~Bookings-Seite (Anfragen + Meine Buchungen)~~ ✅ (existierte bereits, Auth-Bug gefixt)
  - [x] ~~Booking bestätigt → Purchase erstellen → Order-Flow~~ ✅ (neu implementiert)
  - [x] ~~Order-Seite erkennt Miet-Kontext (Labels: Miete/Vermietung/Mietübersicht)~~ ✅
  - [x] ~~Purchases/Sales zeigen "Miete"/"Vermietung" Label~~ ✅
  - [ ] `purchase_id` Spalte in `rental_bookings` Tabelle anlegen (uuid, nullable, FK zu purchases)
  - [ ] Rückgabe-Flow (Mieter markiert Rückgabe → Vermieter bestätigt → Kaution)
  - [ ] Schadensfälle nach Rückgabe
  - [ ] Listing-Reaktivierung nach Rückgabe
- [ ] Auktions-Verbesserungen: Gebotsschritt wählbar (bid_step Feld + Dropdown)
- [ ] Auktions-Verbesserungen: Mindestpreis / Reserve Price
- [ ] Auktions-Verbesserungen: Gebotsverlauf sichtbar (Transparenz)
- [ ] Auktions-Verbesserungen: Preislimit-UX verbessern
- [ ] Nicht-Zahler-Schutz (Erinnerung → Warnung → Stornierung → Strike-System)
- [ ] Zweite-Chance-Angebot bei Nicht-Zahlung

### Backlog (zuletzt)
- [ ] PWA (installierbar auf Homescreen)
- [ ] OpenRouter KI-Beschreibungsgenerator
- [ ] Gebühren-Ranking: höhere Bee-Rate = höherer Search-Platz ("Relevanz")
- [x] ~~Kategorie-spezifische filterbare Attribute (category_attributes + listing_attributes + Filter Pills)~~ ✅ 9. Juni 2026
- [ ] BEEDARO Wallet (internes Token-System)
- [ ] Escrow (Geld gehalten bis Käufer bestätigt)
- [ ] Mietlogik: Wiederholte Vermietung + Kalender-Ansicht
- [ ] Mietlogik: Versicherung / Mietschutz
- [ ] Domain `beedaro.ch` registrieren
- [ ] GitHub Deploy + Vercel Production
- [ ] Kryptowährung als Zahlungsoption (Backlog/Brainstorming): Verkäufer hinterlegt Wallet-Adresse, Käufer sieht als Zahlungsoption neben IBAN/Twint/Bar, P2P-Zahlung (BEEDARO hält nie Crypto), Bee-Rate weiterhin in CHF, FINMA-Fragen vorher klären

===

## PROJEKT-STRUKTUR (nach Audit, 2. Juni 2026)

```
src/
├== app/(public)/
│   ├== (home)/page.tsx          # Homepage (Wrapper für Components)
│   ├== about/page.jsx           # Über BEEDARO (Team-Fotos = Platzhalter)
│   ├== admin/page.jsx           # Admin-Dashboard (671 Zeilen, voll funktional)
│   ├== beta/page.jsx            # Beta-Feedback-Checkliste
│   ├== bookings/page.jsx        # Miet-Buchungen
│   ├== chat/
│   │   ├== page.jsx             # Chat-Liste (Meine Gespräche)
│   │   └== [id]/page.jsx        # Chat-Detail
│   ├== contact/page.jsx         # Kontaktseite
│   ├== favorites/page.jsx       # Favoriten
│   ├== fees/
│   │   ├== page.jsx             # Gebührenübersicht (Bee-Rate Erklärung)
│   │   └== invoice/[id]/page.jsx # Gebühren-Rechnung
│   ├== help/page.jsx            # Hilfe / FAQ
│   ├== how-it-works/page.jsx    # So funktioniert's
│   ├== impact/page.jsx          # Bee-Impact Seite
│   ├== imprint/page.jsx         # Impressum
│   ├== listing/[id]/page.jsx    # Listing Detail (1087 Zeilen)
│   ├== listings/
│   │   ├== page.jsx             # Meine Inserate
│   │   ├== new/page.jsx         # Neues Inserat (Wrapper → ListingForm)
│   │   └== [id]/page.jsx        # Inserat bearbeiten (Wrapper → ListingForm)
│   ├== order/[id]/
│   │   ├== page.jsx             # Order Detail (Ricardo-Style, Phase 14)
│   │   └== invoice/page.jsx     # QR-Rechnung (druckbar)
│   ├== privacy/page.jsx         # Datenschutz
│   ├== purchases/page.jsx       # Meine Käufe (Phase 14)
│   ├== sales/page.jsx           # Meine Verkäufe (Phase 14)
│   ├== search/page.jsx          # Suche (mit ART/BEE-Prefix)
│   ├== settings/page.jsx        # Einstellungen (1396 Zeilen, alle Tabs)
│   ├== terms/page.jsx           # AGB
│   └== user/[id]/page.jsx       # Öffentliches Profil (Tabs, Bewertungen, Inserate)
├== app/login/
│   ├== page.jsx                 # Login/Register
│   └== callback/page.jsx        # Auth Callback
├== components/
│   ├== layout/Header.tsx + Footer.tsx
│   ├== shared/
│   │   ├== Logo.tsx, BeeIcon.jsx, BeeLevel.jsx
│   │   ├== ListingCard.jsx, PriceDisplay.jsx, Badge.jsx
│   │   ├== FavoriteButton.jsx, CategoryIcon.jsx, MegaMenu.jsx
│   │   └== BetaFeedback.jsx
│   ├== listings/ListingForm.jsx + FeeModel.jsx
│   └== home/Hero.tsx, Categories.tsx, CommunityImpact.jsx,
│         HowItWorks.tsx, WhyBeedaro.tsx, Heron.tsx
├== hooks/useFavorite.js
├== lib/
│   ├== listings.js              # CRUD + Search + Bidding + Orders + Chat + Bookings
│   ├== constants.js, theme.js, formatters.js, fees.js
│   └== supabase/supabase.js
├== middleware.ts
└== styles/ (globals.css referenziert in layout)
```

===================================================================
## Session 3. Juni 2026 (Abend): Bee-Fees, Bewertungen, Suchfilter
===================================================================

### Emotionale Bee-Fee Texte (100 rotierend)
- **Neue Datei**: `src/lib/bee-fee-texts.js` mit 25 Texten pro Stufe
- 3% Texte bewusst schwach ("Ein Blümchen am Wegrand")
- 7% DEFAULT, emotional stark ("1'000 Bienen finden ein Zuhause")
- 10% episch ("Ein ganzes Tal blüht wieder")
- Texte basieren auf echten Projekten (FreeTheBees, BienenSchweiz)
- `getRandomBeeTexts()` liefert bei jedem Laden neue Texte
- Bee-Rate aus Settings entfernt, nur noch beim Inserieren
- Default überall auf 7% (impact) geändert
- Emotionaler Intro: "Jeder Verkauf auf BEEDARO schützt Bienen und Natur in der Schweiz."

### Bewertungssystem (Rating Modal)
- Bewertung sofort offen ab Bestellung (nicht erst nach Abschluss)
- Popup-Modal mit 5 Sternen + Scale-Animation
- Labels: Schlecht / Geht so / Okay / Gut / Ausgezeichnet
- DB-Spalte heisst `rating` (NICHT `score`), `role` ist NOT NULL
- Insert mit Fallback: erst `select existing` dann `update` oder `insert`
- Supabase: UNIQUE Constraint `(purchase_id, rater_id)` + UPDATE RLS Policy

### Community Impact Counter (Redesign)
- Neu: Heller Hintergrund, goldene Akzente, Bienen-Wasserzeichen
- "GEMEINSAM BEWIRKT" + CHF-Betrag + m² Blühflächen Umrechnung
- Persönlicher Beitrag wenn eingeloggt: "Danke dafür, Denis."
- Position: Unter dem Hero, überlappend (marginTop: -50px)
- Alter Counter aus Hero.tsx entfernt

### Suchseite: Neue Filter + Sortierung
- 6 Sortieroptionen: Relevanz (DEFAULT), Neueste, Preis ↑/↓, Endet bald, Meiste Gebote
- Relevanz = höherer Bee-Fee Prozentsatz zuerst (Gebühren-Ranking)
- Neue Filter: Ort + Umkreis (5/10/25/50/100 km), Lieferung (Versand/Abholung), Angebotsart
- Umkreis-Geodistanz noch nicht implementiert (braucht lat/lng Koordinaten)

### Inserieren: Fixes
- Beschreibung + Fotos sind KEINE Pflichtfelder
- "Als Entwurf" braucht nur Titel (keine volle Validierung)
- Fehler-Zusammenfassung als Orange Box über Submit-Buttons
- Versand-Toggle: pay_bank wird beim Ausschalten zurückgesetzt
- IBAN-Check vor Veröffentlichung via `checkProfileComplete()`
- IBAN-Validierung in Settings: CH + 21 Zeichen

### Order-Seite: Fixes
- Doppelte Events dedupliziert (gleicher Typ innerhalb 5 Sek)
- Profil-Links: Namen verlinken auf `/user/{user_id}`
- Listing-Reaktivierung nach Miet-Rückgabe (status → active)

### Gedankenstrich-Bereinigung
- 14+ Dateien gescannt und alle UI-Texte mit Gedankenstrichen umformuliert
- Regel in ROADMAP und Memory: keine Gedankenstriche, stattdessen Punkte, Kommas, Doppelpunkte

### Supabase-Änderungen (diese Session)
- `UNIQUE (purchase_id, rater_id)` auf `ratings` Tabelle
- `UPDATE` RLS Policy auf `ratings` Tabelle
- DB-Defaults für `pay_twint` und `pay_cash` auf `false`

### Corporate Design Guide
- Interaktives React-Artifact mit 5 Tabs: Farben, Typografie, UI Elemente, Tonfall, Logo
- Alle Design Tokens dokumentiert

### Potenzielle Partner (recherchiert)
- **FreeTheBees** (freethebees.ch): Wilde Honigbienen, Zeidlerei, BeeMapping, Baumhöhlen
- **BienenSchweiz** (bienen.ch / floris.bienen.ch): Blühflächen (1 Mio m² in 2 Jahren), Imkerförderung
- **WildBee.ch** (wildbee.ch): Wildbienen, natürliche Nistplätze, 620 Arten / 45% bedroht
- **NimS** (natur-im-siedlungsraum.ch): Wildbienen in Städten, Wildbienensand, Senf-Aktionen
- **ProSpecieRara** (prospecierara.ch): Genetische Vielfalt, Basel, seit 1982

### Geänderte Dateien (Session)
```
ROADMAP.md
src/lib/bee-fee-texts.js (NEU)
src/lib/listings.js
src/components/listings/ListingForm.jsx
src/components/shared/BeeLevel.jsx
src/components/home/CommunityImpact.jsx
src/components/home/Hero.tsx
src/components/home/HowItWorks.tsx
src/components/home/Heron.tsx
src/components/home/WhyBeedaro.tsx
src/app/(public)/(home)/page.tsx
src/app/(public)/order/[id]/page.jsx
src/app/(public)/settings/page.jsx
src/app/(public)/search/page.jsx
src/app/(public)/listing/[id]/page.jsx
src/app/(public)/impact/page.jsx
src/app/(public)/help/page.jsx
src/app/(public)/favorites/page.jsx
src/app/(public)/how-it-works/page.jsx
src/app/(public)/about/page.jsx
```

### Pending (nächste Session)
- [ ] Gamification Phase 16 (Bee-Levels, XP, Achievements, Challenges, Referrals)
- [ ] Umkreis-Suche mit Geodistanz (lat/lng auf Listings speichern)
- [ ] `bid_count` Spalte in DB für "Meiste Gebote" Sortierung
- [ ] Transaktions-Emails via Resend
- [ ] Benachrichtigungssystem (Glocke + DB + Echtzeit)
- [ ] Responsive / Mobile Testing
- [ ] Partnerschaften anfragen (FreeTheBees, BienenSchweiz, etc.)

===================================================================
## Session 5. Juni 2026 (Abend): Service, Auktion, Dienstleistung
===================================================================

### Service/Dienstleistung Fixes
- Neuer Listing-Typ `service` (Dienstleistung): Stundensatz, Einsatzdauer, Buchungskalender
- `submit_service_invoice` RPC: Spalte `description` → `message` (korrekter Spaltenname)
- CHECK Constraint `purchase_events_event_type_check` entfernt (blockierte `service_invoiced`)
- Rundungsfehler: `Math.round(total * 100) / 100`
- Service-Übersicht rechts: "Noch offen. Tarif" vor Rechnung, Details nach Rechnung
- Lieferart bei Service ausgeblendet (Header + Sidebar)
- Event Label: `service_invoiced` → Kategorie "Rechnung"
- Order Header: "Service-Auftrag" / "Gebucht am" statt "Verkauft am"

===================================================================
## Session 6. Juni 2026: Auktion komplett + Codebase Refactoring
===================================================================

### Auktion: Komplett gefixt
- **RLS Policies auf `bids` Tabelle** (ROOT CAUSE): RLS war aktiv aber KEINE Policies → niemand konnte Gebote lesen
  - 3 neue Policies: "Anyone can read bids" (SELECT), "Bidders can insert own bids" (INSERT), "Bidders can update own bids" (UPDATE)
- **Sofortkauf NULL-Price Fix**: `create_purchase` RPC nutzt `COALESCE(price, buy_now_price, rent_price, 0)`
- **auction_end Berechnung**: ListingForm sendete nur `auction_duration` (z.B. "7"), `createListing` berechnete NIE `auction_end`
  - Fix: `auction_end = new Date() + parseInt(auction_duration) days` in createListing + updateListing
- **Proxy-Bidding (Ricardo-Stil)**: Funktioniert jetzt korrekt mit Auto-Bidding
  - Bieter setzt Preislimit (geheim), System bietet automatisch das Minimum
  - `placeBid` loggt JEDES Gebot in `bid_history` (manual + auto)
- **Bid History Logging**: `logBid()` Helper mit `try/catch` (Supabase v2)
- **Countdown-Farbe**: Zeitbasiert statt String-Matching (`diff < 3600000` = rot)
- **Gebotszähler**: Nutzt `bidHistory.length` statt `bids.length` (zeigt alle Gebote inkl. Auto)

### Codebase Refactoring V1: listings.js → 10 Domain-Module
- **Vorher**: 1 Datei, 1'482 Zeilen, 72 Funktionen
- **Nachher**: 10 Module + Barrel-Export (19 Zeilen)
- **Migration**: Barrel-Export re-exportiert alles → KEINE Import-Änderungen in Pages nötig

```
src/lib/
  ├── listings.js              (19Z — Barrel Export)
  ├── api/
  │   ├── listings.js         (436Z) CRUD, Search, Images, checkProfileComplete
  │   ├── auctions.js         (294Z) placeBid, getBids, getBidHistory, logBid,
  │   │                              adjustPreislimit, removePreislimit, getBidIncrement,
  │   │                              extendAuctionIfNeeded, finalizeAuction
  │   ├── purchases.js        (182Z) createPurchase, getMyPurchases, getMySales,
  │   │                              getPurchase, updatePurchaseStatus, markAsPaid,
  │   │                              confirmPayment, markAsShipped, confirmDelivery etc.
  │   ├── bookings.js         (126Z) createBooking, getMyBookings, updateBookingStatus,
  │   │                              submitServiceInvoice (RPC + Math.round)
  │   ├── messages.js         (132Z) getOrCreateConversation, sendMessage, getMessages etc.
  │   ├── categories.js       (101Z) getCategories, searchCategories, getCategoryBreadcrumb
  │   ├── profiles.js         (70Z)  getPublicProfile, getUserRatings, getMyBeeProfile
  │   ├── favorites.js        (59Z)  toggleFavorite, getUserFavorites, incrementViewCount
  │   ├── returns.js          (52Z)  markAsReturned, confirmReturn, reportDamage etc.
  │   └── community.js        (8Z)   getCommunityBeeImpact
```

### Listing Detail Seite → 3 Komponenten extrahiert
```
src/components/listing-detail/
  ├── AuctionPanel.jsx    (177Z) Ricardo-Stil Gebotsverlauf, Preislimit,
  │                              Sofortkauf, Countdown, bids-Fallback
  ├── BookingPanel.jsx    (130Z) Miete (Von/Bis) + Service (Datum/Uhrzeit)
  └── MessagePanel.jsx    (120Z) Aufklappbar, öffentlich/privat Toggle
```
- `listing/[id]/page.jsx`: 1145 → 865 Zeilen

### ListingForm → ShippingSection extrahiert
```
src/components/listings/
  ├── ListingForm.jsx          (1264Z, war 1587)
  └── form/
      ├── styles.js            (Shared: inputBase, labelBase, sectionBase)
      └── ShippingSection.jsx  (240Z) Versand + Zahlung (Service/Standard)
```

### Order-Seite → 2 Komponenten extrahiert
```
src/components/order/
  ├── OrderTimeline.jsx   (55Z) Event-Verlauf mit Labels, Tracking-Links
  └── RatingSection.jsx   (95Z) Bewertung + Modal, eigener State
```
- `order/[id]/page.jsx`: 714 → 637 Zeilen
- Service-Fixes: "Service-Auftrag", "Gebucht am", Lieferart ausgeblendet,
  `service_invoiced` → "Rechnung" Label

### Settings-Seite
- Aufteilung in 5 Tab-Komponenten ABGEBROCHEN (zu viele Scope-Abhängigkeiten)
- Settings bleibt als einzelne Datei (1391 Zeilen)
- IBAN-Validierung hinzugefügt: CH + 21 Zeichen
- Bee-Rate Sektion entfernt (nur noch beim Inserieren)

### DB-Änderungen (diese Session)
- `bids` RLS: 3 neue Policies (SELECT/INSERT/UPDATE)
- `purchase_events` CHECK Constraint entfernt
- `submit_service_invoice` RPC neu erstellt mit korrektem Spaltennamen
- Bestehende Auktionen: `auction_end = NOW() + 7 days` wo NULL

### Duplikate entfernt
- `FEE_TIERS` + `BEE_IMPACT_RATE` nur noch in `constants.js` (nicht mehr in listings.js)

### Geänderte Dateien (Session)
```
src/lib/listings.js (Barrel Export, 19Z)
src/lib/api/ (10 neue Module)
src/components/listing-detail/AuctionPanel.jsx
src/components/listing-detail/BookingPanel.jsx
src/components/listing-detail/MessagePanel.jsx
src/components/listings/ListingForm.jsx
src/components/listings/form/styles.js (NEU)
src/components/listings/form/ShippingSection.jsx (NEU)
src/components/order/OrderTimeline.jsx (NEU)
src/components/order/RatingSection.jsx (NEU)
src/app/(public)/listing/[id]/page.jsx
src/app/(public)/order/[id]/page.jsx
src/app/(public)/settings/page.jsx
ROADMAP.md
```

### Lessons Learned
- **Barrel-Export Pattern**: `export * from "./api/module"` ermöglicht modulare Aufteilung ohne Import-Änderungen
- **Settings-Extraktion ist riskant**: Inline-definierte Funktionen teilen Parent-Scope (TDZ, fehlende Imports, C vs colors). Nächstes Mal sauberer mit React Context oder Custom Hooks
- **Supabase v2**: `.insert().catch()` funktioniert nicht → `try/catch` verwenden
- **RLS bei jeder neuen Tabelle prüfen**: `bids` hatte RLS aber keine Policies → stille Fehler
- **auction_end nie berechnet**: ListingForm sendete nur `auction_duration`, Berechnung fehlte komplett
- **Kein Git bei Denis**: Kein Versionskontrolle → Dateien können nicht wiederhergestellt werden. Git init + regelmässige Commits empfohlen

### Pending (nächste Session)
- [ ] Settings-Seite sauber aufteilen (mit React Context statt Prop-Drilling)
- [ ] Git initialisieren + erster Commit
- [ ] Anfahrtspauschale/Kleinmaterial bei Service-Inseraten
- [ ] QR-Rechnung bei Service-Abrechnung
- [ ] Kategorien filtern (Service → nur Dienstleistungen)
- [ ] Roter Badge bei "Meine Buchungen"
- [ ] Gamification Phase 16 (Bee-Levels, XP, Achievements)
- [ ] beedaro.ch Domain registrieren
- [ ] Transaktions-Emails via Resend
- [ ] Benachrichtigungssystem (Glocke + DB + Echtzeit)
- [ ] Responsive / Mobile Testing
- [ ] Partnerschaften anfragen (FreeTheBees, BienenSchweiz, etc.)

===================================================================
## Session 8./9. Juni 2026: Homepage Redesign, Features, Fixes
===================================================================

### Homepage Redesign
- **Header**: Neues Layout (Alle Kategorien Button, breitere Suche, Heart/Bell/Chat Icons, Avatar rechts, kein +Inserieren)
- **BottomNav** (NEU): Mobile Bottom-Nav (Home/Suche/+/Favoriten/Profil)
- **FloatingButton** (NEU): Gelber FAB unten rechts (nur Desktop)
- **Hero**: Altes Carousel beibehalten (Denis wollte kein zentriertes Layout)
- **Categories**: Horizontale Kreis-Icons mit Labels
- **NewListings** (NEU): "Neu eingestellt" 4-Spalten Grid mit ListingCard
- **PopularListings** (NEU): "Beliebt gerade" Section
- **CommunityImpact**: marginTop -50 für Hero-Overlap
- **globals.css**: FAB/BottomNav Sichtbarkeit, Input Focus States, Responsive Grids

### Feature 1: Kategorie-spezifische Attribut-Filter
- **DB**: `category_attributes` + `listing_attributes` Tabellen mit RLS
- **37 Attribute** für 13 Hauptkategorien geseeded (korrigiert am 9. Juni)
- **Games auf SUBKATEGORIEN**: Konsolen (Lieferumfang/Speicher), Videospiele (Plattform/Genre/Sprache), Gaming-Zubehör (Kompatibel mit/Typ), PC-Gaming (Typ/Marke), Retro-Gaming (System/Typ)
- **KATEGORIE-ID FIX**: IDs waren komplett verschoben (c005=Audio statt Foto, c006=Fahrzeuge statt Kleidung, etc.). Alles gelöscht und mit korrekten IDs neu geseeded
- **API**: `src/lib/api/attributes.js` (getCategoryAttributes walks up tree, getFilterableAttributes, saveListingAttributes, filterListingsByAttributes)
- **Suchseite**: Ricardo-Style horizontale Filter-Pills (nicht Sidebar), dynamische Attribute als zweite Pill-Reihe
- **ListingForm**: Eigenschaften-Block zwischen Kategorie und Inserattyp

### Feature 2: Service-Rechnungen mit Positionen
- **DB**: `invoice_items` Tabelle (label, description, quantity, unit_price, total, item_type, sort_order) mit RLS
- **API**: `src/lib/api/invoices.js` mit Templates (Anfahrtspauschale CHF 30, Arbeitsstunde CHF 65, Material, Entsorgung, Freitext), CRUD, submitServiceInvoiceWithItems
- **ServiceInvoiceEditor** (NEU): Positions-Editor mit Template-Dropdown, Menge x Preis, Bemerkung, Subtotal/Gebühr/BeeImpact/Auszahlung
- **ServiceInvoiceView**: Käufer-Ansicht mit einzelnen Positionen + QR-Code (Swiss QR aus Seller IBAN)
- **QR-PDF-Rechnung**: `order/[id]/invoice/page.jsx` zeigt einzelne invoice_items statt nur eine Zeile

### Notification-System Fix
- **ROOT CAUSE**: `createNotification` war in `listings.js` NIE importiert. Alle Notification-Calls haben still gefailed
- **Fix**: `import { createNotification } from "@/lib/notifications"` hinzugefügt
- **Neue Notifications** für alle kritischen Events: markAsPaid→Seller, confirmPayment→Buyer, markAsShipped→Buyer, markAsPickedUp→Buyer, confirmDelivery→Seller, updateBookingStatus(confirmed/rejected)→Renter, markAsReturned→Owner, reportDamage→Renter
- **Transaktions-Notifications fix immer an** (nicht abschaltbar). Nur Kanal (Email/Push) konfigurierbar

### Payment-Flow Fix
- **"Ich habe bezahlt" Endlos-Loop**: `markAsPaid` setzte `payment_pending`, aber Service war schon `payment_pending` nach Rechnungsstellung
- **Fix**: `markAsPaid` setzt jetzt `payment_marked` (neuer, eindeutiger Status)
- **STATUS_MAP**: `payment_marked` hinzugefügt
- **Buyer-Ansicht**: Nach Zahlung zeigt "Zahlung markiert, Anbieter prüft" statt denselben Button nochmal
- **Timeline-Dedup**: Fenster von 5s auf 2 Minuten erweitert

### Service-Buchung Fix
- Rent (Von/Bis Datum-Range) und Service (Wunschdatum + Uhrzeit) sind jetzt GETRENNTE UI-Blöcke
- Service: "Wunschdatum" + "Uhrzeit" + "SERVICE ANFRAGEN" Button
- Rent: "Von" + "Bis" + Preisberechnung + "MIETE ANFRAGEN" Button

### Suchseite Redesign
- Ricardo-Style Filter-Pills statt Sidebar
- FilterPill Dropdown-Komponente (teal active, rounded Dropdowns, ChevronDown Animation)
- Preis-Dropdown mit Von/Bis Eingabefeldern
- Dynamische Kategorie-Attribute als zweite Pill-Reihe
- Sortierung rechts als Dropdown
- CSS `>` Selektoren aus inline `<style>` in `globals.css` verschoben (Hydration-Error Fix)
- Inline `gridTemplateColumns` entfernt, CSS-Klasse übernimmt

### Mobile Grid Fix
- `listing-grid` CSS-Klasse: Desktop 4 Spalten, Tablet 3, Mobile 2 gleich grosse
- `search-results-grid`: Desktop auto-fill, Mobile 2 gleich grosse Spalten
- NewListings + PopularListings verwenden gleiche Klasse (identisches Scaling)
- BottomNav/FAB Sichtbarkeit in globals.css

### Settings + Inserieren Theme-Anpassungen
- Settings: Buttons primary yellow→teal, Toggles yellow→teal
- ListingForm: Chips/Checks yellow→teal, Toggles teal, Section radius 18px

### CLAUDE.md erstellt
- Kompletter Projektkontext für Claude Code
- Inkl. Supabase MCP Setup, DB Schema, Architektur-Regeln, Kategorie-IDs, Roadmap

### Verifizierte Kategorie-IDs (9. Juni 2026)
```
c0010000 = Elektronik & Computer
c0020000 = Handy & Telefon
c0030000 = Games & Spielkonsolen
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

### Geänderte Dateien (Session)
```
CLAUDE.md (NEU)
ROADMAP.md (aktualisiert)
src/app/globals.css (komplett neu mit allen Responsive-Regeln)
src/app/(public)/(home)/page.tsx (NewListings + PopularListings)
src/app/(public)/search/page.jsx (Filter Pills Redesign)
src/app/(public)/order/[id]/page.jsx (Payment-Flow + Notifications + QR + Dedup)
src/app/(public)/order/[id]/invoice/page.jsx (invoice_items in PDF)
src/app/(public)/listing/[id]/page.jsx (Service-Buchung Datum+Uhrzeit)
src/app/(public)/settings/page.jsx (Theme teal)
src/components/layout/Header.tsx (Redesign)
src/components/layout/BottomNav.tsx (NEU)
src/components/layout/FloatingButton.tsx (NEU)
src/components/home/NewListings.tsx (NEU)
src/components/home/PopularListings.tsx (NEU)
src/components/home/Categories.tsx (Kreis-Icons)
src/components/home/CommunityImpact.jsx (Overlap)
src/components/order/ServiceInvoiceEditor.jsx (NEU)
src/components/listings/ListingForm.jsx (Theme + Attribute)
src/lib/listings.js (createNotification Import + markAsPaid Fix)
src/lib/api/attributes.js (NEU)
src/lib/api/invoices.js (NEU)
```

### Pending (nächste Session)
- [ ] Usertyp Privat/Unternehmen (account_type, Firmenname, UID-Nummer, Badge, Filter)
- [ ] Gamification (Bee-Level, XP, Community Counter)
- [ ] Gebühren-Ranking (höhere Bee-Rate = bessere Platzierung)
- [ ] BEEDARO Wallet (internes Token-System)
- [ ] Escrow (Geld halten bis Empfangsbestätigung)
- [ ] PWA + ggf. Capacitor
- [ ] OpenRouter KI Beschreibungsgenerator
- [ ] Domain beedaro.ch registrieren
- [ ] Transaktions-Emails via Resend

===================================================================
## Session 9. Juni 2026 (Status-Check): Code-Audit + Doku-Sync
===================================================================

### Ziel
Code mit Roadmap abgeglichen. Es zeigte sich: der Code ist weiter als die Doku.
Mehrere Features existieren bereits, waren aber nicht als fertig vermerkt.

### Bereits implementiert (war nicht dokumentiert)
- **Notification-System komplett**: `src/lib/api/notifications.js` (getNotifications,
  getUnreadCount, markAsRead, markAllAsRead, deleteNotification, createNotification,
  getNotificationPreferences, saveNotificationPreferences, subscribeToNotifications
  via Supabase Realtime). `src/components/shared/NotificationBell.jsx` im Header
  verdrahtet (Dropdown, Unread-Badge, Realtime-Push, pro-Typ-Preferences).
  Notification-Settings in `profiles.notification_settings` (jsonb).
- **Settings-Tabs DOCH aufgeteilt** (Roadmap sagte "abgebrochen"):
  `src/components/settings/` → ProfileTab, AddressTab, PaymentTab, VerifyTab,
  NotificationsTab, PublicProfileModal, shared.js.
- **Neue Seiten**: `src/app/(public)/bids/page.jsx` (Meine Gebote),
  `src/app/(public)/profile/[id]/page.jsx`.
- **Gamification-Modul angelegt**: `src/lib/gamification.js` (BEE_LEVELS, XP_REWARDS,
  calculateLevel, levelProgress, awardXP, unlockAchievement, ACHIEVEMENTS,
  getUserAchievements, getXPHistory, getActiveChallenges, getUserChallengeProgress).

### Bug gefunden + gefixt
- **NotificationBell.jsx**: `deleteNotification` wurde verwendet (handleDelete,
  handleDeleteAll), aber NIE importiert → `ReferenceError` beim Löschen.
  FIX: Import aus `@/lib/api/notifications` ergänzt. ✅

### Offene Befunde (noch zu erledigen)
- [ ] **Gamification ist totes Modul**: `awardXP`/`unlockAchievement` werden NIRGENDS
  aufgerufen. Es wird nie XP vergeben. Phase 16 muss die Hook-Points einbauen
  (z.B. in purchases.js `completeTransaction` → awardXP sale/purchase_completed,
  createListing → listing_created, etc.) UND die DB-Tabellen anlegen
  (xp_log, user_achievements, challenges, user_challenges + profiles.xp_total,
  profiles.bee_level).
- [ ] **Spalten-Inkonsistenz**: `getUserAchievements` sortiert nach `unlocked_at`,
  `unlockAchievement` schreibt diese Spalte nicht (Roadmap-Schema nennt `earned_at`).
  Vor Aktivierung von Phase 16 vereinheitlichen.
- [ ] **BEE_LEVELS-Schwellen abgeglichen**: Code = 0/100/500/2000/10000,
  frühere Roadmap = 0/100/300/750/1500. Vor Launch final festlegen.
- [ ] **Kein Git**: Weiterhin keine Versionskontrolle. `git init` + erster Commit
  dringend empfohlen (Dateiverlust-Risiko).
