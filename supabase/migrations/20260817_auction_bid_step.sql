-- Rekonstruiert aus der Cloud-Session vom 17.08.2026 (bereits live angewendet).
-- Waehlbarer Gebotsschritt pro Auktion: 0.10 / 1.00 / 5.00 (Ricardo-Stufen).
-- Zwei Schutzschichten: das Formular bietet nur diese Liste an, und der
-- CHECK laesst nur dieselben Werte zu — ein manipulierter Client kann keinen
-- Schritt von 0.01 oder 5000 einschleusen. NULL = gestaffelter Automatik-
-- Fallback (bid_increment), den die Oberflaeche nicht mehr anbietet.
alter table listings add column if not exists bid_step numeric;
alter table listings add constraint listings_bid_step_check
  check (bid_step is null or bid_step = any (array[0.1, 1::numeric, 5::numeric]));

-- Effektiver Schritt einer Auktion: bid_step, sonst Preisstaffel
create or replace function public.effective_bid_increment(p_listing_id uuid, p_price numeric)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select l.bid_step from listings l where l.id = p_listing_id),
    public.bid_increment(p_price)
  );
$$;
