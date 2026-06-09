-- ═══════════════════════════════════════════════════════════════
-- BEEDARO: Kategorie-spezifische Attribute (Ricardo-Style Tiefenfilter)
-- Zuerst Tabellen erstellen, dann Seed-Daten einfügen
-- ═══════════════════════════════════════════════════════════════

-- ─── TABELLE 1: category_attributes ──────────────────────────
-- Definiert welche Attribute eine Kategorie hat
CREATE TABLE IF NOT EXISTS category_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  attribute_type TEXT NOT NULL DEFAULT 'select',
  options JSONB,
  unit TEXT,
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catattr_category ON category_attributes(category_id);

-- ─── TABELLE 2: listing_attributes ──────────────────────────
-- Speichert die Werte pro Inserat
CREATE TABLE IF NOT EXISTS listing_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES category_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(listing_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_listattr_listing ON listing_attributes(listing_id);
CREATE INDEX IF NOT EXISTS idx_listattr_attribute ON listing_attributes(attribute_id);
CREATE INDEX IF NOT EXISTS idx_listattr_value ON listing_attributes(attribute_id, value);


-- ═══════════════════════════════════════════════════════════════
-- SEED: Attribute pro Hauptkategorie
-- ═══════════════════════════════════════════════════════════════

-- ─── Elektronik & Computer ───────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0010000-0000-0000-0000-000000000001', 'Marke', 'marke', 'select', '["Apple","Lenovo","HP","Dell","Asus","Acer","Microsoft","Samsung","MSI","Razer","Andere"]', 1),
('c0010000-0000-0000-0000-000000000001', 'Speicher', 'speicher', 'select', '["64GB","128GB","256GB","512GB","1TB","2TB"]', 2),
('c0010000-0000-0000-0000-000000000001', 'RAM', 'ram', 'select', '["4GB","8GB","16GB","32GB","64GB"]', 3),
('c0010000-0000-0000-0000-000000000001', 'Bildschirmgrösse', 'bildschirm', 'select', '["11\"","13\"","14\"","15\"","16\"","17\"","24\"","27\"","32\""]', 4);

-- ─── Handy & Telefon ─────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0020000-0000-0000-0000-000000000001', 'Marke', 'marke', 'select', '["Apple","Samsung","Google","Huawei","Xiaomi","OnePlus","Oppo","Sony","Nokia","Andere"]', 1),
('c0020000-0000-0000-0000-000000000001', 'Speicher', 'speicher', 'select', '["32GB","64GB","128GB","256GB","512GB","1TB"]', 2),
('c0020000-0000-0000-0000-000000000001', 'Farbe', 'farbe', 'select', '["Schwarz","Weiss","Blau","Rot","Grün","Gold","Silber","Violett","Andere"]', 3),
('c0020000-0000-0000-0000-000000000001', 'Display', 'display', 'select', '["5.0\"","5.5\"","6.0\"","6.1\"","6.5\"","6.7\"","6.9\""]', 4);

-- ─── Games & Konsolen ────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0030000-0000-0000-0000-000000000001', 'Plattform', 'plattform', 'select', '["PlayStation 5","PlayStation 4","Nintendo Switch","Xbox Series X/S","Xbox One","PC","Retro"]', 1),
('c0030000-0000-0000-0000-000000000001', 'Genre', 'genre', 'select', '["Action","Adventure","RPG","Sport","Racing","Shooter","Puzzle","Strategie","Simulation","Andere"]', 2);

-- ─── TV, Audio & HiFi ────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0040000-0000-0000-0000-000000000001', 'Marke', 'marke', 'select', '["Samsung","LG","Sony","Bose","Sonos","JBL","Sennheiser","Denon","Yamaha","Andere"]', 1),
('c0040000-0000-0000-0000-000000000001', 'Typ', 'typ', 'select', '["TV","Soundbar","Kopfhörer","Lautsprecher","Verstärker","Plattenspieler","Radio","Andere"]', 2);

-- ─── Foto & Video ────────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0050000-0000-0000-0000-000000000001', 'Marke', 'marke', 'select', '["Canon","Nikon","Sony","Fujifilm","Panasonic","Olympus","GoPro","DJI","Andere"]', 1),
('c0050000-0000-0000-0000-000000000001', 'Typ', 'typ', 'select', '["Spiegelreflex","Systemkamera","Kompaktkamera","Action Cam","Drohne","Objektiv","Stativ","Andere"]', 2);

-- ─── Kleidung & Accessoires ──────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0060000-0000-0000-0000-000000000001', 'Grösse', 'groesse', 'select', '["XXS","XS","S","M","L","XL","XXL","3XL","Einheitsgrösse"]', 1),
('c0060000-0000-0000-0000-000000000001', 'Farbe', 'farbe', 'select', '["Schwarz","Weiss","Blau","Rot","Grün","Gelb","Braun","Grau","Beige","Pink","Orange","Mehrfarbig"]', 2),
('c0060000-0000-0000-0000-000000000001', 'Material', 'material', 'select', '["Baumwolle","Polyester","Leder","Wolle","Seide","Denim","Leinen","Synthetik","Andere"]', 3),
('c0060000-0000-0000-0000-000000000001', 'Marke', 'marke', 'text', NULL, 4),
('c0060000-0000-0000-0000-000000000001', 'Geschlecht', 'geschlecht', 'select', '["Herren","Damen","Unisex","Kinder"]', 5);

-- ─── Uhren & Schmuck ─────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0070000-0000-0000-0000-000000000001', 'Typ', 'typ', 'select', '["Armbanduhr","Taschenuhr","Smartwatch","Ring","Kette","Armband","Ohrringe","Andere"]', 1),
('c0070000-0000-0000-0000-000000000001', 'Marke', 'marke', 'text', NULL, 2),
('c0070000-0000-0000-0000-000000000001', 'Material', 'material', 'select', '["Gold","Silber","Edelstahl","Titan","Platin","Leder","Andere"]', 3);

-- ─── Sport & Outdoor ─────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0080000-0000-0000-0000-000000000001', 'Sportart', 'sportart', 'select', '["Fitness","Wandern","Ski/Snowboard","Fussball","Tennis","Schwimmen","Yoga","Klettern","Laufen","Camping","Andere"]', 1),
('c0080000-0000-0000-0000-000000000001', 'Grösse', 'groesse', 'select', '["XS","S","M","L","XL","XXL","Einheitsgrösse"]', 2);

-- ─── Möbel & Einrichtung ─────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0090000-0000-0000-0000-000000000001', 'Stil', 'stil', 'select', '["Modern","Vintage","Skandinavisch","Industrial","Landhaus","Mid-Century","Andere"]', 1),
('c0090000-0000-0000-0000-000000000001', 'Material', 'material', 'select', '["Holz","Metall","Glas","Stoff","Leder","Kunststoff","Andere"]', 2),
('c0090000-0000-0000-0000-000000000001', 'Farbe', 'farbe', 'select', '["Schwarz","Weiss","Braun","Grau","Beige","Natur","Andere"]', 3);

-- ─── Auto & Motorrad ─────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0120000-0000-0000-0000-000000000001', 'Marke', 'marke', 'select', '["Audi","BMW","Mercedes","VW","Toyota","Honda","Ford","Opel","Renault","Fiat","Porsche","Tesla","Andere"]', 1),
('c0120000-0000-0000-0000-000000000001', 'Jahrgang', 'jahrgang', 'number', NULL, 2),
('c0120000-0000-0000-0000-000000000001', 'Kilometer', 'kilometer', 'number', NULL, 3),
('c0120000-0000-0000-0000-000000000001', 'Treibstoff', 'treibstoff', 'select', '["Benzin","Diesel","Elektro","Hybrid","Gas","Andere"]', 4),
('c0120000-0000-0000-0000-000000000001', 'Getriebe', 'getriebe', 'select', '["Manuell","Automatik"]', 5);

-- ─── Velo & E-Bike ───────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0130000-0000-0000-0000-000000000001', 'Typ', 'typ', 'select', '["Rennvelo","Mountainbike","E-Bike","Citybike","Gravel","BMX","Kinderrad","Andere"]', 1),
('c0130000-0000-0000-0000-000000000001', 'Rahmengrösse', 'rahmengroesse', 'select', '["XS (bis 155cm)","S (155-165cm)","M (165-175cm)","L (175-185cm)","XL (185cm+)"]', 2),
('c0130000-0000-0000-0000-000000000001', 'Marke', 'marke', 'text', NULL, 3);

-- ─── Baby & Kind ─────────────────────────────────────────────
INSERT INTO category_attributes (category_id, name, attribute_key, attribute_type, options, sort_order) VALUES
('c0140000-0000-0000-0000-000000000001', 'Alter', 'alter', 'select', '["0-6 Monate","6-12 Monate","1-2 Jahre","2-4 Jahre","4-6 Jahre","6-10 Jahre","10+ Jahre"]', 1),
('c0140000-0000-0000-0000-000000000001', 'Geschlecht', 'geschlecht', 'select', '["Mädchen","Junge","Unisex"]', 2);


-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_attributes ENABLE ROW LEVEL SECURITY;

-- category_attributes: alle lesen, nur admin schreiben
CREATE POLICY "category_attributes_read" ON category_attributes FOR SELECT USING (true);

-- listing_attributes: alle lesen, owner schreiben
CREATE POLICY "listing_attributes_read" ON listing_attributes FOR SELECT USING (true);
CREATE POLICY "listing_attributes_insert" ON listing_attributes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "listing_attributes_update" ON listing_attributes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "listing_attributes_delete" ON listing_attributes FOR DELETE USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);
