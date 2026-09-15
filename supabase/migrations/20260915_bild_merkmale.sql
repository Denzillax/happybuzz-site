-- 15.09.2026 (Denis): Bildersuche "unmittelbar" wie Ricardo. Statt bei jedem
-- Klick 13 Fotos ans Bildmodell zu schicken, bekommt jedes Inserat einmalig
-- Bild-Merkmale (Art, Marke, Farbe, Material, Stil, Epoche) - der Klick ist
-- dann nur noch ein Merkmalsvergleich in der Datenbank.
alter table listings add column if not exists image_tags text[];
alter table listings add column if not exists image_tags_at timestamptz;
create index if not exists listings_image_tags_gin on listings using gin (image_tags);

-- Aehnliche Inserate per Merkmals-Ueberschneidung. Liefert Id, Trefferzahl
-- und die gemeinsamen Merkmale (fuer die Begruendung in der Anzeige).
create or replace function public.similar_by_tags(p_listing_id uuid, p_limit int default 6)
returns table (id uuid, score int, gemeinsam text[])
language sql stable security definer set search_path = public as $$
  with ziel as (select image_tags from listings where id = p_listing_id)
  select l.id,
         cardinality(array(select unnest(l.image_tags) intersect select unnest(z.image_tags))) as score,
         array(select unnest(l.image_tags) intersect select unnest(z.image_tags)) as gemeinsam
  from listings l, ziel z
  where l.id <> p_listing_id
    and l.status = 'active'
    and (l.expires_at is null or l.expires_at > now())
    and l.image_tags && z.image_tags
    -- Pflicht: Ueberschneidung bei Art, Oberkategorie oder Marke (Slots 1-3),
    -- sonst matcht 'schwarz, kunststoff, tragbar' einen Lautsprecher zum Game Boy
    and l.image_tags && z.image_tags[1:3]
  order by score desc, l.created_at desc
  limit greatest(1, least(p_limit, 12));
$$;
grant execute on function public.similar_by_tags(uuid, int) to anon, authenticated;

-- Merkmale setzen: Eigentuemer und Staff jederzeit; andere Eingeloggte nur,
-- solange noch keine Merkmale gesetzt sind (Lazy-Tagging beim Klick auf die
-- Lupe fuer Altbestand). Die Next-Route schreibt mit dem Nutzer-Token, ein
-- Service-Role-Key liegt bewusst nicht auf Vercel.
create or replace function public.set_image_tags(p_listing_id uuid, p_tags text[])
returns text[] language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_have text[];
begin
  if auth.uid() is null then raise exception 'Nicht autorisiert'; end if;
  select user_id, image_tags into v_owner, v_have from listings where id = p_listing_id;
  if v_owner is null then raise exception 'Inserat nicht gefunden'; end if;
  if v_owner <> auth.uid() and not coalesce(public.is_staff(auth.uid()), false) and v_have is not null then
    raise exception 'Nicht autorisiert';
  end if;
  update listings set image_tags = p_tags, image_tags_at = now() where id = p_listing_id;
  return p_tags;
end $$;
grant execute on function public.set_image_tags(uuid, text[]) to authenticated;
