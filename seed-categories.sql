-- ═══════════════════════════════════════════════════
-- BEEDARO: Ricardo-Style Kategorien (komplett neu)
-- ═══════════════════════════════════════════════════

-- Alte Kategorien loeschen (nur 3 Test-Listings betroffen)
UPDATE listings SET category_id = NULL;
DELETE FROM categories;

-- Sort-Order Spalte
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- ─── HAUPTKATEGORIEN ─────────────────────────────────────────
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
('c0010000-0000-0000-0000-000000000001', 'Elektronik & Computer', 'elektronik-computer', 'Laptop', 1),
('c0020000-0000-0000-0000-000000000001', 'Handy & Telefon', 'handy-telefon', 'Smartphone', 2),
('c0030000-0000-0000-0000-000000000001', 'Games & Konsolen', 'games-konsolen', 'Gamepad2', 3),
('c0040000-0000-0000-0000-000000000001', 'TV, Audio & HiFi', 'tv-audio-hifi', 'Tv', 4),
('c0050000-0000-0000-0000-000000000001', 'Foto & Video', 'foto-video', 'Camera', 5),
('c0060000-0000-0000-0000-000000000001', 'Kleidung & Accessoires', 'kleidung-accessoires', 'Shirt', 6),
('c0070000-0000-0000-0000-000000000001', 'Uhren & Schmuck', 'uhren-schmuck', 'Watch', 7),
('c0080000-0000-0000-0000-000000000001', 'Sport & Outdoor', 'sport-outdoor', 'Dumbbell', 8),
('c0090000-0000-0000-0000-000000000001', 'Möbel & Einrichtung', 'moebel-einrichtung', 'Sofa', 9),
('c0100000-0000-0000-0000-000000000001', 'Haushalt & Küche', 'haushalt-kueche', 'CookingPot', 10),
('c0110000-0000-0000-0000-000000000001', 'Garten & Werkstatt', 'garten-werkstatt', 'Wrench', 11),
('c0120000-0000-0000-0000-000000000001', 'Auto & Motorrad', 'auto-motorrad', 'Car', 12),
('c0130000-0000-0000-0000-000000000001', 'Velo & E-Bike', 'velo-ebike', 'Bike', 13),
('c0140000-0000-0000-0000-000000000001', 'Baby & Kind', 'baby-kind', 'Baby', 14),
('c0150000-0000-0000-0000-000000000001', 'Spielzeug & Basteln', 'spielzeug-basteln', 'Puzzle', 15),
('c0160000-0000-0000-0000-000000000001', 'Bücher & Comics', 'buecher-comics', 'BookOpen', 16),
('c0170000-0000-0000-0000-000000000001', 'Filme & Serien', 'filme-serien', 'Clapperboard', 17),
('c0180000-0000-0000-0000-000000000001', 'Musik & Instrumente', 'musik-instrumente', 'Music', 18),
('c0190000-0000-0000-0000-000000000001', 'Beauty & Gesundheit', 'beauty-gesundheit', 'Heart', 19),
('c0200000-0000-0000-0000-000000000001', 'Büro & Industrie', 'buero-industrie', 'Briefcase', 20),
('c0210000-0000-0000-0000-000000000001', 'Sammeln & Seltenes', 'sammeln-seltenes', 'Gem', 21),
('c0220000-0000-0000-0000-000000000001', 'Tickets & Gutscheine', 'tickets-gutscheine', 'Ticket', 22),
('c0230000-0000-0000-0000-000000000001', 'Immobilien', 'immobilien', 'Home', 23),
('c0240000-0000-0000-0000-000000000001', 'Sonstiges', 'sonstiges', 'Package', 24);

-- ─── SUBKATEGORIEN: Elektronik & Computer ────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0010001-0000-0000-0000-000000000001', 'Laptops & Notebooks', 'laptops-notebooks', 'Laptop', 'c0010000-0000-0000-0000-000000000001', 1),
('c0010002-0000-0000-0000-000000000001', 'Desktop PCs', 'desktop-pcs', 'Monitor', 'c0010000-0000-0000-0000-000000000001', 2),
('c0010003-0000-0000-0000-000000000001', 'Tablets', 'tablets', 'Tablet', 'c0010000-0000-0000-0000-000000000001', 3),
('c0010004-0000-0000-0000-000000000001', 'Monitore & Bildschirme', 'monitore', 'Monitor', 'c0010000-0000-0000-0000-000000000001', 4),
('c0010005-0000-0000-0000-000000000001', 'Drucker & Scanner', 'drucker-scanner', 'Printer', 'c0010000-0000-0000-0000-000000000001', 5),
('c0010006-0000-0000-0000-000000000001', 'Netzwerk & WLAN', 'netzwerk-wlan', 'Wifi', 'c0010000-0000-0000-0000-000000000001', 6),
('c0010007-0000-0000-0000-000000000001', 'PC-Komponenten', 'pc-komponenten', 'Cpu', 'c0010000-0000-0000-0000-000000000001', 7),
('c0010008-0000-0000-0000-000000000001', 'Software', 'software', 'Code', 'c0010000-0000-0000-0000-000000000001', 8),
('c0010009-0000-0000-0000-000000000001', 'Zubehör', 'elektronik-zubehoer', 'Plug', 'c0010000-0000-0000-0000-000000000001', 9);

-- ─── SUBKATEGORIEN: Handy & Telefon ──────────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0020001-0000-0000-0000-000000000001', 'Smartphones', 'smartphones', 'Smartphone', 'c0020000-0000-0000-0000-000000000001', 1),
('c0020002-0000-0000-0000-000000000001', 'Handyhüllen & Schutz', 'handyhuellen', 'Shield', 'c0020000-0000-0000-0000-000000000001', 2),
('c0020003-0000-0000-0000-000000000001', 'Ladegeräte & Kabel', 'ladegeraete', 'BatteryCharging', 'c0020000-0000-0000-0000-000000000001', 3),
('c0020004-0000-0000-0000-000000000001', 'Smartwatches', 'smartwatches', 'Watch', 'c0020000-0000-0000-0000-000000000001', 4),
('c0020005-0000-0000-0000-000000000001', 'Festnetztelefone', 'festnetz', 'Phone', 'c0020000-0000-0000-0000-000000000001', 5);

-- ─── SUBKATEGORIEN: Games & Konsolen ─────────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0030001-0000-0000-0000-000000000001', 'Konsolen', 'konsolen', 'Gamepad2', 'c0030000-0000-0000-0000-000000000001', 1),
('c0030002-0000-0000-0000-000000000001', 'Spiele', 'spiele', 'Disc', 'c0030000-0000-0000-0000-000000000001', 2),
('c0030003-0000-0000-0000-000000000001', 'Controller & Zubehör', 'controller-zubehoer', 'Joystick', 'c0030000-0000-0000-0000-000000000001', 3),
('c0030004-0000-0000-0000-000000000001', 'Retro Gaming', 'retro-gaming', 'Gamepad', 'c0030000-0000-0000-0000-000000000001', 4),
('c0030005-0000-0000-0000-000000000001', 'PC Gaming', 'pc-gaming', 'Monitor', 'c0030000-0000-0000-0000-000000000001', 5),
('c0030006-0000-0000-0000-000000000001', 'VR & AR', 'vr-ar', 'Glasses', 'c0030000-0000-0000-0000-000000000001', 6);

-- ─── SUB-SUB: Games > Konsolen (Marken) ──────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0030101-0000-0000-0000-000000000001', 'Nintendo', 'nintendo', 'Gamepad2', 'c0030001-0000-0000-0000-000000000001', 1),
('c0030102-0000-0000-0000-000000000001', 'PlayStation', 'playstation', 'Gamepad2', 'c0030001-0000-0000-0000-000000000001', 2),
('c0030103-0000-0000-0000-000000000001', 'Xbox', 'xbox', 'Gamepad2', 'c0030001-0000-0000-0000-000000000001', 3),
('c0030104-0000-0000-0000-000000000001', 'Sega', 'sega', 'Gamepad', 'c0030001-0000-0000-0000-000000000001', 4),
('c0030105-0000-0000-0000-000000000001', 'Atari', 'atari', 'Gamepad', 'c0030001-0000-0000-0000-000000000001', 5);

-- ─── SUB-SUB: Games > Spiele (nach Konsole) ──────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0030201-0000-0000-0000-000000000001', 'Nintendo Switch Spiele', 'switch-spiele', 'Disc', 'c0030002-0000-0000-0000-000000000001', 1),
('c0030202-0000-0000-0000-000000000001', 'PS5 Spiele', 'ps5-spiele', 'Disc', 'c0030002-0000-0000-0000-000000000001', 2),
('c0030203-0000-0000-0000-000000000001', 'PS4 Spiele', 'ps4-spiele', 'Disc', 'c0030002-0000-0000-0000-000000000001', 3),
('c0030204-0000-0000-0000-000000000001', 'Xbox Spiele', 'xbox-spiele', 'Disc', 'c0030002-0000-0000-0000-000000000001', 4),
('c0030205-0000-0000-0000-000000000001', 'PC Spiele', 'pc-spiele', 'Disc', 'c0030002-0000-0000-0000-000000000001', 5),
('c0030206-0000-0000-0000-000000000001', 'Retro Spiele', 'retro-spiele', 'Disc', 'c0030002-0000-0000-0000-000000000001', 6);

-- ─── SUBKATEGORIEN: TV, Audio & HiFi ────────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0040001-0000-0000-0000-000000000001', 'Fernseher', 'fernseher', 'Tv', 'c0040000-0000-0000-0000-000000000001', 1),
('c0040002-0000-0000-0000-000000000001', 'Kopfhörer', 'kopfhoerer', 'Headphones', 'c0040000-0000-0000-0000-000000000001', 2),
('c0040003-0000-0000-0000-000000000001', 'Lautsprecher', 'lautsprecher', 'Speaker', 'c0040000-0000-0000-0000-000000000001', 3),
('c0040004-0000-0000-0000-000000000001', 'HiFi-Anlagen', 'hifi-anlagen', 'Music', 'c0040000-0000-0000-0000-000000000001', 4),
('c0040005-0000-0000-0000-000000000001', 'Streaming & Media Player', 'streaming', 'Play', 'c0040000-0000-0000-0000-000000000001', 5);

-- ─── SUBKATEGORIEN: Foto & Video ─────────────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0050001-0000-0000-0000-000000000001', 'Kameras', 'kameras', 'Camera', 'c0050000-0000-0000-0000-000000000001', 1),
('c0050002-0000-0000-0000-000000000001', 'Objektive', 'objektive', 'Aperture', 'c0050000-0000-0000-0000-000000000001', 2),
('c0050003-0000-0000-0000-000000000001', 'Drohnen', 'drohnen', 'Plane', 'c0050000-0000-0000-0000-000000000001', 3),
('c0050004-0000-0000-0000-000000000001', 'Stative & Zubehör', 'foto-zubehoer', 'Wrench', 'c0050000-0000-0000-0000-000000000001', 4),
('c0050005-0000-0000-0000-000000000001', 'Videokameras', 'videokameras', 'Video', 'c0050000-0000-0000-0000-000000000001', 5);

-- ─── SUBKATEGORIEN: Kleidung & Accessoires ───────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0060001-0000-0000-0000-000000000001', 'Damenmode', 'damenmode', 'Shirt', 'c0060000-0000-0000-0000-000000000001', 1),
('c0060002-0000-0000-0000-000000000001', 'Herrenmode', 'herrenmode', 'Shirt', 'c0060000-0000-0000-0000-000000000001', 2),
('c0060003-0000-0000-0000-000000000001', 'Kindermode', 'kindermode', 'Baby', 'c0060000-0000-0000-0000-000000000001', 3),
('c0060004-0000-0000-0000-000000000001', 'Schuhe', 'schuhe', 'Footprints', 'c0060000-0000-0000-0000-000000000001', 4),
('c0060005-0000-0000-0000-000000000001', 'Taschen & Rucksäcke', 'taschen', 'ShoppingBag', 'c0060000-0000-0000-0000-000000000001', 5),
('c0060006-0000-0000-0000-000000000001', 'Accessoires', 'accessoires', 'Glasses', 'c0060000-0000-0000-0000-000000000001', 6);

-- ─── SUBKATEGORIEN: Sport & Outdoor ──────────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0080001-0000-0000-0000-000000000001', 'Fitness & Training', 'fitness', 'Dumbbell', 'c0080000-0000-0000-0000-000000000001', 1),
('c0080002-0000-0000-0000-000000000001', 'Wintersport', 'wintersport', 'Mountain', 'c0080000-0000-0000-0000-000000000001', 2),
('c0080003-0000-0000-0000-000000000001', 'Camping & Wandern', 'camping-wandern', 'Tent', 'c0080000-0000-0000-0000-000000000001', 3),
('c0080004-0000-0000-0000-000000000001', 'Ballsport', 'ballsport', 'CircleDot', 'c0080000-0000-0000-0000-000000000001', 4),
('c0080005-0000-0000-0000-000000000001', 'Wassersport', 'wassersport', 'Waves', 'c0080000-0000-0000-0000-000000000001', 5),
('c0080006-0000-0000-0000-000000000001', 'Sportbekleidung', 'sportbekleidung', 'Shirt', 'c0080000-0000-0000-0000-000000000001', 6);

-- ─── SUBKATEGORIEN: Möbel & Einrichtung ──────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0090001-0000-0000-0000-000000000001', 'Sofas & Sessel', 'sofas-sessel', 'Sofa', 'c0090000-0000-0000-0000-000000000001', 1),
('c0090002-0000-0000-0000-000000000001', 'Tische', 'tische', 'Table', 'c0090000-0000-0000-0000-000000000001', 2),
('c0090003-0000-0000-0000-000000000001', 'Schränke & Regale', 'schraenke-regale', 'DoorOpen', 'c0090000-0000-0000-0000-000000000001', 3),
('c0090004-0000-0000-0000-000000000001', 'Betten & Matratzen', 'betten', 'Bed', 'c0090000-0000-0000-0000-000000000001', 4),
('c0090005-0000-0000-0000-000000000001', 'Dekoration', 'dekoration', 'Flower', 'c0090000-0000-0000-0000-000000000001', 5),
('c0090006-0000-0000-0000-000000000001', 'Beleuchtung', 'beleuchtung', 'Lightbulb', 'c0090000-0000-0000-0000-000000000001', 6);

-- ─── SUBKATEGORIEN: Bücher & Comics ──────────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0160001-0000-0000-0000-000000000001', 'Romane & Erzählungen', 'romane', 'BookOpen', 'c0160000-0000-0000-0000-000000000001', 1),
('c0160002-0000-0000-0000-000000000001', 'Sachbücher', 'sachbuecher', 'BookOpen', 'c0160000-0000-0000-0000-000000000001', 2),
('c0160003-0000-0000-0000-000000000001', 'Comics & Manga', 'comics-manga', 'BookOpen', 'c0160000-0000-0000-0000-000000000001', 3),
('c0160004-0000-0000-0000-000000000001', 'Kinderbücher', 'kinderbuecher', 'BookOpen', 'c0160000-0000-0000-0000-000000000001', 4),
('c0160005-0000-0000-0000-000000000001', 'Lehrbücher & Studium', 'lehrbuecher', 'GraduationCap', 'c0160000-0000-0000-0000-000000000001', 5);

-- ─── SUBKATEGORIEN: Musik & Instrumente ──────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0180001-0000-0000-0000-000000000001', 'Gitarren', 'gitarren', 'Guitar', 'c0180000-0000-0000-0000-000000000001', 1),
('c0180002-0000-0000-0000-000000000001', 'Keyboards & Pianos', 'keyboards-pianos', 'Piano', 'c0180000-0000-0000-0000-000000000001', 2),
('c0180003-0000-0000-0000-000000000001', 'Schlagzeug', 'schlagzeug', 'Drum', 'c0180000-0000-0000-0000-000000000001', 3),
('c0180004-0000-0000-0000-000000000001', 'Blasinstrumente', 'blasinstrumente', 'Music', 'c0180000-0000-0000-0000-000000000001', 4),
('c0180005-0000-0000-0000-000000000001', 'DJ & Studio', 'dj-studio', 'Headphones', 'c0180000-0000-0000-0000-000000000001', 5),
('c0180006-0000-0000-0000-000000000001', 'Vinyl & CDs', 'vinyl-cds', 'Disc3', 'c0180000-0000-0000-0000-000000000001', 6);

-- ─── SUBKATEGORIEN: Sammeln & Seltenes ───────────────────────
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
('c0210001-0000-0000-0000-000000000001', 'Münzen', 'muenzen', 'Coins', 'c0210000-0000-0000-0000-000000000001', 1),
('c0210002-0000-0000-0000-000000000001', 'Briefmarken', 'briefmarken', 'Stamp', 'c0210000-0000-0000-0000-000000000001', 2),
('c0210003-0000-0000-0000-000000000001', 'Antiquitäten', 'antiquitaeten', 'Landmark', 'c0210000-0000-0000-0000-000000000001', 3),
('c0210004-0000-0000-0000-000000000001', 'Trading Cards', 'trading-cards', 'Layers', 'c0210000-0000-0000-0000-000000000001', 4),
('c0210005-0000-0000-0000-000000000001', 'Militaria', 'militaria', 'Shield', 'c0210000-0000-0000-0000-000000000001', 5);

-- Check
SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE parent_id IS NULL) as main, COUNT(*) FILTER (WHERE parent_id IS NOT NULL) as sub FROM categories;
