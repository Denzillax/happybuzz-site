-- Kategorien-Verwaltung: Staff darf Kategorien anlegen/ändern (Name, Aktiv-Status, Sortierung).
-- Lesen bleibt öffentlich. Kein DELETE-Recht: Deaktivieren statt Löschen,
-- damit bestehende Inserate ihre Kategorie behalten.
-- (is_active + sort_order Spalten existierten bereits im Schema.)
CREATE POLICY "categories_admin_insert" ON public.categories
  FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "categories_admin_update" ON public.categories
  FOR UPDATE USING (public.is_staff(auth.uid()));
