-- 19.08.2026: Neuware-Varianten + Stueckzahl, Publish-Gate auf is_staff,
-- Attribut-Datenbereinigung (live via MCP "varianten_stueckzahl_und_gate_staff")

-- 1) Publish-Gate auf is_staff (Mitarbeiter-Freigabe lief sonst gegen den Trigger)
create or replace function public.enforce_listing_publish_gate()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'active'
     and OLD.status in ('draft','pending_review')
     and auth.uid() is not null
     and not public.is_staff(auth.uid()) then
    raise exception 'Inserate werden erst nach Admin-Freigabe aktiv';
  end if;
  return NEW;
end; $$;

-- 2) Neuware: Stueckzahl + waehlbare Varianten
alter table public.listings add column if not exists quantity int not null default 1;
alter table public.listings drop constraint if exists listings_quantity_min;
alter table public.listings add constraint listings_quantity_min check (quantity >= 0);
alter table public.listings add column if not exists variant_options jsonb;
comment on column public.listings.variant_options is 'Neuware: vom Kaeufer waehlbare Werte je Attribut, z.B. {"groesse":["S","M"]}';
alter table public.purchases add column if not exists variant_choice jsonb;
comment on column public.purchases.variant_choice is 'Schnappschuss der Kaeuferwahl, z.B. {"Groesse":"L"}';

-- 3) create_purchase (3 Overloads): p_variant, Ausverkauft-Pruefung, sell zaehlt
--    atomar runter (sold erst bei 0), andere Typen wie bisher sofort sold.
create or replace function public.create_purchase(p_listing_id uuid, p_buyer_id uuid, p_variant jsonb default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_listing record; v_fee decimal; v_platform decimal; v_bee decimal; v_purchase_id uuid; v_price decimal;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then raise exception 'Nicht autorisiert'; end if;
  select * into v_listing from listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'Listing nicht verfuegbar'; end if;
  if v_listing.expires_at is not null and v_listing.expires_at < now() then raise exception 'Inserat ist abgelaufen'; end if;
  if v_listing.user_id = p_buyer_id then raise exception 'Eigene Inserate koennen nicht gekauft werden'; end if;
  if v_listing.listing_type = 'sell' and coalesce(v_listing.quantity, 1) <= 0 then raise exception 'Ausverkauft'; end if;
  v_price := coalesce(v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * coalesce(v_listing.fee_percentage, 7) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  insert into purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method, variant_choice)
  values (p_listing_id, p_buyer_id, v_listing.user_id, v_price, coalesce(v_listing.fee_percentage, 7), v_fee, v_platform, v_bee, coalesce(v_listing.shipping_cost, 0), v_listing.shipping_method, p_variant)
  returning id into v_purchase_id;
  if v_listing.listing_type = 'sell' then
    update listings set quantity = greatest(coalesce(quantity,1) - 1, 0),
      status = case when coalesce(quantity,1) - 1 <= 0 then 'sold' else status end
      where id = p_listing_id;
  else
    update listings set status = 'sold' where id = p_listing_id;
  end if;
  return v_purchase_id;
end; $function$;

create or replace function public.create_purchase(p_listing_id uuid, p_buyer_id uuid, p_price numeric, p_variant jsonb default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_listing record; v_fee decimal; v_platform decimal; v_bee decimal; v_purchase_id uuid; v_price decimal;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then raise exception 'Nicht autorisiert'; end if;
  select * into v_listing from listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'Listing nicht verfuegbar'; end if;
  if v_listing.expires_at is not null and v_listing.expires_at < now() then raise exception 'Inserat ist abgelaufen'; end if;
  if v_listing.user_id = p_buyer_id then raise exception 'Eigene Inserate koennen nicht gekauft werden'; end if;
  if v_listing.listing_type = 'sell' and coalesce(v_listing.quantity, 1) <= 0 then raise exception 'Ausverkauft'; end if;
  v_price := coalesce(nullif(p_price, 0), v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * coalesce(v_listing.fee_percentage, 7) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  insert into purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method, variant_choice)
  values (p_listing_id, p_buyer_id, v_listing.user_id, v_price, coalesce(v_listing.fee_percentage, 7), v_fee, v_platform, v_bee, coalesce(v_listing.shipping_cost, 0), v_listing.shipping_method, p_variant)
  returning id into v_purchase_id;
  if v_listing.listing_type = 'sell' then
    update listings set quantity = greatest(coalesce(quantity,1) - 1, 0),
      status = case when coalesce(quantity,1) - 1 <= 0 then 'sold' else status end
      where id = p_listing_id;
  else
    update listings set status = 'sold' where id = p_listing_id;
  end if;
  return v_purchase_id;
end; $function$;

create or replace function public.create_purchase(p_listing_id uuid, p_buyer_id uuid, p_price numeric, p_shipping numeric, p_variant jsonb default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_listing record; v_fee decimal; v_platform decimal; v_bee decimal; v_purchase_id uuid; v_price decimal;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then raise exception 'Nicht autorisiert'; end if;
  select * into v_listing from listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'Listing nicht verfuegbar'; end if;
  if v_listing.expires_at is not null and v_listing.expires_at < now() then raise exception 'Inserat ist abgelaufen'; end if;
  if v_listing.user_id = p_buyer_id then raise exception 'Eigene Inserate koennen nicht gekauft werden'; end if;
  if v_listing.listing_type = 'sell' and coalesce(v_listing.quantity, 1) <= 0 then raise exception 'Ausverkauft'; end if;
  v_price := coalesce(nullif(p_price, 0), v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * coalesce(v_listing.fee_percentage, 7) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  insert into purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method, variant_choice)
  values (p_listing_id, p_buyer_id, v_listing.user_id, v_price, coalesce(v_listing.fee_percentage, 7), v_fee, v_platform, v_bee, coalesce(p_shipping, v_listing.shipping_cost, 0), v_listing.shipping_method, p_variant)
  returning id into v_purchase_id;
  if v_listing.listing_type = 'sell' then
    update listings set quantity = greatest(coalesce(quantity,1) - 1, 0),
      status = case when coalesce(quantity,1) - 1 <= 0 then 'sold' else status end
      where id = p_listing_id;
  else
    update listings set status = 'sold' where id = p_listing_id;
  end if;
  return v_purchase_id;
end; $function$;

-- 4) Datenbereinigung: Attribut-Zeilen fremder Kategorien entfernen
--    (Ursache: saveListingAttributes ordnete per attribute_key global zu)
with recursive kette as (
  select l.id as listing_id, l.category_id as cat_id from listings l where l.category_id is not null
  union all
  select k.listing_id, c.parent_id from kette k join categories c on c.id = k.cat_id where c.parent_id is not null
)
delete from listing_attributes la
using category_attributes ca
where ca.id = la.attribute_id
and not exists (select 1 from kette k where k.listing_id = la.listing_id and k.cat_id = ca.category_id);
