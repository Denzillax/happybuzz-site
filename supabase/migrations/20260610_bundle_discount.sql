-- Bundle-Rabatt-Konfiguration pro Verkaeufer
alter table public.profiles add column if not exists bundle_min_items integer not null default 0;
alter table public.profiles add column if not exists bundle_discount_pct integer not null default 0;

-- create_purchase mit Preis + Versand-Override (fuer Warenkorb/gebuendelten Versand).
create or replace function public.create_purchase(p_listing_id uuid, p_buyer_id uuid, p_price numeric, p_shipping numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_listing record; v_fee decimal; v_platform decimal; v_bee decimal; v_purchase_id uuid; v_price decimal;
begin
  select * into v_listing from listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'Listing nicht verfuegbar'; end if;
  if v_listing.user_id = p_buyer_id then raise exception 'Eigene Inserate koennen nicht gekauft werden'; end if;
  v_price := coalesce(nullif(p_price, 0), v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * coalesce(v_listing.fee_percentage, 5) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  insert into purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method)
  values (p_listing_id, p_buyer_id, v_listing.user_id, v_price, coalesce(v_listing.fee_percentage, 5), v_fee, v_platform, v_bee, coalesce(p_shipping, v_listing.shipping_cost, 0), v_listing.shipping_method)
  returning id into v_purchase_id;
  update listings set status = 'sold' where id = p_listing_id;
  return v_purchase_id;
end; $$;
grant execute on function public.create_purchase(uuid, uuid, numeric, numeric) to authenticated, anon;
