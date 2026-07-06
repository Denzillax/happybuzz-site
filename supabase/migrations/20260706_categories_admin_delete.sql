-- Staff/Owner dürfen Kategorien löschen. Datenintegrität ist über FKs abgesichert:
-- listings.category_id + categories.parent_id = NO ACTION (Löschen einer genutzten
-- Kategorie schlägt fehl), category_attributes = CASCADE (wird mitgelöscht).
-- Die UI blockt zusätzlich mit freundlicher Meldung, wenn Unterkategorien/Inserate hängen.
CREATE POLICY "categories_admin_delete" ON public.categories
  FOR DELETE USING (public.is_staff(auth.uid()));
