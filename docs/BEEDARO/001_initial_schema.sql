-- ============================================================
-- BEEDARO – Datenbank-Schema v1 (Supabase / PostgreSQL)
-- Migration: 001_initial_schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Fuzzy-Suche
CREATE EXTENSION IF NOT EXISTS "postgis";       -- Geo / Standort

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE listing_type AS ENUM ('sell', 'rent');
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'sold', 'rented', 'expired', 'deleted');
CREATE TYPE condition_type AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');
CREATE TYPE rent_period AS ENUM ('hour', 'day', 'week', 'month');
CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled');
CREATE TYPE message_type AS ENUM ('text', 'image', 'offer', 'system');
CREATE TYPE bee_rate_tier AS ENUM ('starter', 'basic', 'plus', 'pro');
CREATE TYPE report_reason AS ENUM ('spam', 'fraud', 'inappropriate', 'counterfeit', 'other');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================
-- 1. PROFILES (erweitert auth.users)
-- ============================================================

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  phone           TEXT,
  
  -- Standort
  city            TEXT,
  canton          TEXT,
  postal_code     TEXT,
  location        GEOGRAPHY(POINT, 4326),  -- PostGIS Punkt
  
  -- Stripe Connect
  stripe_account_id    TEXT,
  stripe_onboarded     BOOLEAN DEFAULT FALSE,
  
  -- Bee-Rate Tier
  bee_rate_tier   bee_rate_tier DEFAULT 'starter',
  
  -- Statistiken (denormalisiert für Performance)
  rating_avg      DECIMAL(2,1) DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  listings_count  INTEGER DEFAULT 0,
  sales_count     INTEGER DEFAULT 0,
  
  -- Flags
  is_verified     BOOLEAN DEFAULT FALSE,
  is_banned       BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Username-Suche (case-insensitive)
CREATE UNIQUE INDEX idx_profiles_username_lower ON profiles (LOWER(username));
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================

CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  icon            TEXT,                    -- Emoji oder Icon-Name
  parent_id       UUID REFERENCES categories(id),
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories (parent_id);
CREATE INDEX idx_categories_slug ON categories (slug);

-- ============================================================
-- 3. LISTINGS (Inserate)
-- ============================================================

CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Grunddaten
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  listing_type    listing_type NOT NULL DEFAULT 'sell',
  status          listing_status NOT NULL DEFAULT 'draft',
  condition       condition_type,
  
  -- Kategorie
  category_id     UUID REFERENCES categories(id),
  
  -- Preis (Verkauf)
  price           DECIMAL(10,2),
  currency        TEXT DEFAULT 'CHF',
  is_negotiable   BOOLEAN DEFAULT FALSE,
  
  -- Miete
  rent_price      DECIMAL(10,2),
  rent_period     rent_period,
  deposit_amount  DECIMAL(10,2),
  min_rent_days   INTEGER,
  max_rent_days   INTEGER,
  
  -- Standort
  city            TEXT,
  canton          TEXT,
  postal_code     TEXT,
  location        GEOGRAPHY(POINT, 4326),
  
  -- Versand
  shipping_available  BOOLEAN DEFAULT FALSE,
  shipping_cost       DECIMAL(10,2),
  pickup_only         BOOLEAN DEFAULT TRUE,
  
  -- Bee-Rate zum Zeitpunkt der Erstellung
  seller_fee_pct  DECIMAL(4,2) NOT NULL DEFAULT 3.00,
  buyer_fee_pct   DECIMAL(4,2) NOT NULL DEFAULT 20.00,
  
  -- SEO & Suche
  search_vector   TSVECTOR,
  
  -- Statistiken
  view_count      INTEGER DEFAULT 0,
  favorite_count  INTEGER DEFAULT 0,
  
  -- Zeitstempel
  published_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Unique slug pro User
CREATE UNIQUE INDEX idx_listings_user_slug ON listings (user_id, slug);
CREATE INDEX idx_listings_status ON listings (status) WHERE status = 'active';
CREATE INDEX idx_listings_category ON listings (category_id);
CREATE INDEX idx_listings_type ON listings (listing_type);
CREATE INDEX idx_listings_price ON listings (price);
CREATE INDEX idx_listings_location ON listings USING GIST (location);
CREATE INDEX idx_listings_search ON listings USING GIN (search_vector);
CREATE INDEX idx_listings_created ON listings (created_at DESC);
CREATE INDEX idx_listings_user ON listings (user_id);

-- Automatisch search_vector updaten
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('german', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('german', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('german', COALESCE(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listings_search_vector
  BEFORE INSERT OR UPDATE OF title, description, city
  ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_search_vector();

-- ============================================================
-- 4. LISTING IMAGES
-- ============================================================

CREATE TABLE listing_images (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  storage_path    TEXT NOT NULL,           -- Supabase Storage Pfad
  alt_text        TEXT,
  sort_order      INTEGER DEFAULT 0,
  is_cover        BOOLEAN DEFAULT FALSE,
  width           INTEGER,
  height          INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_images_listing ON listing_images (listing_id, sort_order);

-- ============================================================
-- 5. FAVORITES (Merkliste)
-- ============================================================

CREATE TABLE favorites (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX idx_favorites_listing ON favorites (listing_id);

-- ============================================================
-- 6. CONVERSATIONS & MESSAGES
-- ============================================================

CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  
  -- Unread-Counts
  buyer_unread    INTEGER DEFAULT 0,
  seller_unread   INTEGER DEFAULT 0,
  
  is_archived     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- Eine Konversation pro Listing+Buyer
  UNIQUE (listing_id, buyer_id)
);

CREATE INDEX idx_conversations_buyer ON conversations (buyer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON conversations (seller_id, last_message_at DESC);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  message_type    message_type DEFAULT 'text',
  content         TEXT NOT NULL,
  
  -- Falls Angebot
  offer_amount    DECIMAL(10,2),
  
  -- Metadata
  image_url       TEXT,
  is_read         BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);

-- ============================================================
-- 7. TRANSACTIONS (Käufe & Mieten)
-- ============================================================

CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  buyer_id        UUID NOT NULL REFERENCES profiles(id),
  seller_id       UUID NOT NULL REFERENCES profiles(id),
  
  -- Typ
  listing_type    listing_type NOT NULL,
  status          transaction_status DEFAULT 'pending',
  
  -- Beträge
  item_price      DECIMAL(10,2) NOT NULL,
  seller_fee      DECIMAL(10,2) NOT NULL,  -- 3% / 5% / 7% / 10%
  buyer_fee       DECIMAL(10,2) NOT NULL,  -- 20% / 25% / 30% / 35%
  shipping_cost   DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2) NOT NULL,  -- Was der Käufer zahlt
  seller_payout   DECIMAL(10,2) NOT NULL,  -- Was der Verkäufer bekommt
  platform_revenue DECIMAL(10,2) NOT NULL, -- seller_fee + buyer_fee
  
  -- Miet-spezifisch
  rent_start      DATE,
  rent_end        DATE,
  deposit_amount  DECIMAL(10,2),
  deposit_returned BOOLEAN DEFAULT FALSE,
  
  -- Stripe
  stripe_payment_intent_id  TEXT,
  stripe_transfer_id        TEXT,
  
  -- Versand
  shipping_address    JSONB,
  tracking_number     TEXT,
  
  -- Zeitstempel
  paid_at         TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_buyer ON transactions (buyer_id, created_at DESC);
CREATE INDEX idx_transactions_seller ON transactions (seller_id, created_at DESC);
CREATE INDEX idx_transactions_listing ON transactions (listing_id);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_stripe ON transactions (stripe_payment_intent_id);

-- ============================================================
-- 8. REVIEWS (Bewertungen)
-- ============================================================

CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id  UUID NOT NULL REFERENCES transactions(id) UNIQUE,
  reviewer_id     UUID NOT NULL REFERENCES profiles(id),
  reviewed_id     UUID NOT NULL REFERENCES profiles(id),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_reviewed ON reviews (reviewed_id, created_at DESC);

-- Trigger: Rating-Durchschnitt auf Profil aktualisieren
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    rating_avg = (
      SELECT ROUND(AVG(rating)::NUMERIC, 1)
      FROM reviews WHERE reviewed_id = NEW.reviewed_id
    ),
    rating_count = (
      SELECT COUNT(*) FROM reviews WHERE reviewed_id = NEW.reviewed_id
    ),
    updated_at = NOW()
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_rating
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- ============================================================
-- 9. REPORTS (Meldungen)
-- ============================================================

CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID NOT NULL REFERENCES profiles(id),
  listing_id      UUID REFERENCES listings(id),
  user_id         UUID REFERENCES profiles(id),
  reason          report_reason NOT NULL,
  description     TEXT,
  is_resolved     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. BEE RATE TIERS (Konfiguration)
-- ============================================================

CREATE TABLE bee_rate_config (
  tier            bee_rate_tier PRIMARY KEY,
  seller_fee_pct  DECIMAL(4,2) NOT NULL,
  buyer_fee_pct   DECIMAL(4,2) NOT NULL,
  label           TEXT NOT NULL,
  description     TEXT,
  is_default      BOOLEAN DEFAULT FALSE
);

INSERT INTO bee_rate_config (tier, seller_fee_pct, buyer_fee_pct, label, description, is_default) VALUES
  ('starter', 3.00, 20.00, 'Starter Bee',   'Einstiegstarif – günstig starten', TRUE),
  ('basic',   5.00, 25.00, 'Basic Bee',     'Mehr Sichtbarkeit, mehr Reichweite', FALSE),
  ('plus',    7.00, 30.00, 'Plus Bee',      'Premium-Platzierung + Badges', FALSE),
  ('pro',    10.00, 35.00, 'Pro Bee',       'Maximale Power für Power-Seller', FALSE);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT,
  link            TEXT,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC);

-- ============================================================
-- 12. PAYOUTS (Auszahlungen an Verkäufer)
-- ============================================================

CREATE TABLE payouts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  amount          DECIMAL(10,2) NOT NULL,
  currency        TEXT DEFAULT 'CHF',
  status          payout_status DEFAULT 'pending',
  stripe_payout_id TEXT,
  transaction_ids UUID[] NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_payouts_user ON payouts (user_id, created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER (für alle Tabellen)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated  BEFORE UPDATE ON profiles     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_listings_updated  BEFORE UPDATE ON listings     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES: Jeder kann lesen, nur eigenes bearbeiten
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- LISTINGS: Aktive öffentlich, eigene verwalten
CREATE POLICY "listings_select_public" ON listings FOR SELECT
  USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "listings_insert" ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_update" ON listings FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "listings_delete" ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- LISTING IMAGES: Via Listing-Owner
CREATE POLICY "listing_images_select" ON listing_images FOR SELECT USING (true);
CREATE POLICY "listing_images_insert" ON listing_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid()));
CREATE POLICY "listing_images_delete" ON listing_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid()));

-- FAVORITES: Eigene verwalten
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (user_id = auth.uid());

-- CONVERSATIONS: Nur Teilnehmer
CREATE POLICY "conversations_select" ON conversations FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "conversations_insert" ON conversations FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- MESSAGES: Nur in eigenen Konversationen
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  ));
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  ));

-- TRANSACTIONS: Nur beteiligte Parteien
CREATE POLICY "transactions_select" ON transactions FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- REVIEWS: Öffentlich lesbar, nur eigene erstellen
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- NOTIFICATIONS: Nur eigene
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS (via Supabase Dashboard oder API)
-- ============================================================
-- Buckets werden beim Setup erstellt:
--   • listing-images  (public, max 5MB, image/*)
--   • avatars         (public, max 2MB, image/*)
--   • message-images  (private, max 5MB, image/*)

-- ============================================================
-- SEED: Standardkategorien
-- ============================================================

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Elektronik',      'elektronik',      '💻', 1),
  ('Mode & Kleidung', 'mode-kleidung',   '👗', 2),
  ('Möbel & Wohnen',  'moebel-wohnen',   '🛋️', 3),
  ('Sport & Freizeit','sport-freizeit',   '⚽', 4),
  ('Fahrzeuge',       'fahrzeuge',        '🚗', 5),
  ('Bücher & Medien', 'buecher-medien',   '📚', 6),
  ('Spielzeug',       'spielzeug',        '🧸', 7),
  ('Garten & Werkzeug','garten-werkzeug', '🔧', 8),
  ('Musik',           'musik',            '🎸', 9),
  ('Sonstiges',       'sonstiges',        '📦', 10);

-- Subkategorien Elektronik
INSERT INTO categories (name, slug, icon, parent_id, sort_order)
SELECT name, slug, icon, (SELECT id FROM categories WHERE slug = 'elektronik'), sort_order
FROM (VALUES
  ('Smartphones',    'smartphones',     '📱', 1),
  ('Laptops',        'laptops',         '💻', 2),
  ('Tablets',        'tablets',         '📱', 3),
  ('Kameras',        'kameras',         '📷', 4),
  ('Audio',          'audio',           '🎧', 5),
  ('Gaming',         'gaming',          '🎮', 6),
  ('Zubehör',        'zubehoer-elektronik', '🔌', 7)
) AS t(name, slug, icon, sort_order);
