-- Neue Hauptkategorie "Tierbedarf & Haustiere" (sort 24, zwischen Tickets und
-- Dienstleistungen) mit 10 Unterkategorien, plus 2 neue Dienstleistungs-
-- Unterkategorien (Tierbetreuung, Garten & Aussenbereich).
-- Entscheid: nur Tierbedarf, keine lebenden Tiere.

INSERT INTO categories (id, name, slug, icon, parent_id, sort_order, is_active) VALUES
  ('c0260000-0000-0000-0000-000000000001', 'Tierbedarf & Haustiere', 'tierbedarf-haustiere', 'PawPrint', NULL, 24, true),
  ('c0260001-0000-0000-0000-000000000001', 'Hunde',                  'hunde',                 NULL, 'c0260000-0000-0000-0000-000000000001', 1,  true),
  ('c0260002-0000-0000-0000-000000000001', 'Katzen',                 'katzen',                NULL, 'c0260000-0000-0000-0000-000000000001', 2,  true),
  ('c0260003-0000-0000-0000-000000000001', 'Nagetiere & Kleintiere', 'nagetiere-kleintiere',  NULL, 'c0260000-0000-0000-0000-000000000001', 3,  true),
  ('c0260004-0000-0000-0000-000000000001', 'Vögel',                  'voegel',                NULL, 'c0260000-0000-0000-0000-000000000001', 4,  true),
  ('c0260005-0000-0000-0000-000000000001', 'Aquaristik',             'aquaristik',            NULL, 'c0260000-0000-0000-0000-000000000001', 5,  true),
  ('c0260006-0000-0000-0000-000000000001', 'Terraristik',            'terraristik',           NULL, 'c0260000-0000-0000-0000-000000000001', 6,  true),
  ('c0260007-0000-0000-0000-000000000001', 'Pferdebedarf',           'pferdebedarf',          NULL, 'c0260000-0000-0000-0000-000000000001', 7,  true),
  ('c0260008-0000-0000-0000-000000000001', 'Tierfutter',             'tierfutter',            NULL, 'c0260000-0000-0000-0000-000000000001', 8,  true),
  ('c0260009-0000-0000-0000-000000000001', 'Tiertransport',          'tiertransport',         NULL, 'c0260000-0000-0000-0000-000000000001', 9,  true),
  ('c0260010-0000-0000-0000-000000000001', 'Sonstiger Tierbedarf',   'sonstiger-tierbedarf',  NULL, 'c0260000-0000-0000-0000-000000000001', 10, true),
  ('c0250008-0000-0000-0000-000000000001', 'Tierbetreuung',          'tierbetreuung',         NULL, 'c0250000-0000-0000-0000-000000000001', 8,  true),
  ('c0250009-0000-0000-0000-000000000001', 'Garten & Aussenbereich', 'garten-aussenbereich',  NULL, 'c0250000-0000-0000-0000-000000000001', 9,  true)
ON CONFLICT (id) DO NOTHING;
