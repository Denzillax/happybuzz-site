-- 25.08.2026: Gebuehren-Deckel CHF 200 pro Verkauf (Entscheid Denis).
-- Ricardo deckelt bei CHF 290; BEEDARO bleibt mit 200 auch bei teuren
-- Artikeln klar guenstiger (ohne Deckel waere 7% ab ~CHF 4200 teurer
-- als Ricardo). Ein Deckel fuer alle Bee-Rates: fee = least(price*pct, 200).
-- Bee-Impact bleibt 20% der (gedeckelten) Gebuehr, also max. CHF 40.
-- Muss mit FEE_CAP in src/lib/constants.js uebereinstimmen.
--
-- Nebenbei: die create_purchase-Overloads vom 19.08. hatten die
-- Bagatellgrenze (unter CHF 20 gebuehrenfrei) verloren; das Ledger (die
-- massgebliche Abrechnung) hatte sie korrekt. Hier werden purchases.*
-- und fee_ledger wieder deckungsgleich: unter 20 -> 0, sonst min(pct, 200).

-- 1) Abrechnungs-Trigger (fee_ledger = Quelle der Wahrheit)
create or replace function public.create_fee_ledger_entry()
returns trigger
language plpgsql
security definer
as $function$
declare
  v_listing RECORD;
  v_pct numeric;
  v_fee numeric;
begin
  select title, fee_percentage into v_listing from listings where id = NEW.listing_id;

  v_pct := coalesce(v_listing.fee_percentage, 7);  -- Standard-Bee-Rate: Impact / 7%

  if coalesce(NEW.price, 0) < 20 then              -- Bagatellgrenze CHF 20
    v_fee := 0;
  else
    v_fee := least(NEW.price * v_pct / 100, 200);  -- Gebuehren-Deckel CHF 200
  end if;

  insert into fee_ledger (seller_id, purchase_id, listing_title, sale_price, shipping_cost, fee_percent, fee_amount, bee_impact)
  values (
    NEW.seller_id,
    NEW.id,
    v_listing.title,
    NEW.price,
    coalesce(NEW.shipping_cost, 0),
    v_pct,
    v_fee,
    v_fee * 0.20   -- Bee-Impact: 20% der Gebuehr
  );
  return NEW;
end;
$function$;

-- 2) create_purchase-Overloads: gleiche Formel fuer purchases.fee_amount
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
  if v_price < 20 then v_fee := 0; else v_fee := least(v_price * coalesce(v_listing.fee_percentage, 7) / 100.0, 200); end if;
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
  if v_price < 20 then v_fee := 0; else v_fee := least(v_price * coalesce(v_listing.fee_percentage, 7) / 100.0, 200); end if;
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
  if v_price < 20 then v_fee := 0; else v_fee := least(v_price * coalesce(v_listing.fee_percentage, 7) / 100.0, 200); end if;
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
