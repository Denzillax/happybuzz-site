-- (1) Abgelaufene Inserate sind nicht kaufbar, auch wenn Status noch 'active' ist.
-- (2) Gebühren-Default vereinheitlicht: 7% (wie createListing/fee_tier 'impact'),
--     vorher inkonsistent 5% in den RPCs.
-- Identitäts-Guards aus 20260618_harden_identity_rpcs.sql bleiben erhalten.

CREATE OR REPLACE FUNCTION public.create_purchase(p_listing_id uuid, p_buyer_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_listing RECORD; v_fee DECIMAL; v_platform DECIMAL; v_bee DECIMAL; v_purchase_id UUID; v_price DECIMAL;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_buyer_id THEN RAISE EXCEPTION 'Nicht autorisiert'; END IF;
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing nicht verfuegbar'; END IF;
  IF v_listing.expires_at IS NOT NULL AND v_listing.expires_at < now() THEN RAISE EXCEPTION 'Inserat ist abgelaufen'; END IF;
  IF v_listing.user_id = p_buyer_id THEN RAISE EXCEPTION 'Eigene Inserate koennen nicht gekauft werden'; END IF;
  v_price := COALESCE(v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * COALESCE(v_listing.fee_percentage, 7) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  INSERT INTO purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method)
  VALUES (p_listing_id, p_buyer_id, v_listing.user_id, v_price, COALESCE(v_listing.fee_percentage, 7), v_fee, v_platform, v_bee, COALESCE(v_listing.shipping_cost, 0), v_listing.shipping_method)
  RETURNING id INTO v_purchase_id;
  UPDATE listings SET status = 'sold' WHERE id = p_listing_id;
  RETURN v_purchase_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_purchase(p_listing_id uuid, p_buyer_id uuid, p_price numeric)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_listing record; v_fee decimal; v_platform decimal; v_bee decimal; v_purchase_id uuid; v_price decimal;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then raise exception 'Nicht autorisiert'; end if;
  select * into v_listing from listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'Listing nicht verfuegbar'; end if;
  if v_listing.expires_at is not null and v_listing.expires_at < now() then raise exception 'Inserat ist abgelaufen'; end if;
  if v_listing.user_id = p_buyer_id then raise exception 'Eigene Inserate koennen nicht gekauft werden'; end if;
  v_price := coalesce(nullif(p_price, 0), v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * coalesce(v_listing.fee_percentage, 7) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  insert into purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method)
  values (p_listing_id, p_buyer_id, v_listing.user_id, v_price, coalesce(v_listing.fee_percentage, 7), v_fee, v_platform, v_bee, coalesce(v_listing.shipping_cost, 0), v_listing.shipping_method)
  returning id into v_purchase_id;
  update listings set status = 'sold' where id = p_listing_id;
  return v_purchase_id;
end; $function$;

CREATE OR REPLACE FUNCTION public.create_purchase(p_listing_id uuid, p_buyer_id uuid, p_price numeric, p_shipping numeric)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_listing record; v_fee decimal; v_platform decimal; v_bee decimal; v_purchase_id uuid; v_price decimal;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then raise exception 'Nicht autorisiert'; end if;
  select * into v_listing from listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'Listing nicht verfuegbar'; end if;
  if v_listing.expires_at is not null and v_listing.expires_at < now() then raise exception 'Inserat ist abgelaufen'; end if;
  if v_listing.user_id = p_buyer_id then raise exception 'Eigene Inserate koennen nicht gekauft werden'; end if;
  v_price := coalesce(nullif(p_price, 0), v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * coalesce(v_listing.fee_percentage, 7) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  insert into purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method)
  values (p_listing_id, p_buyer_id, v_listing.user_id, v_price, coalesce(v_listing.fee_percentage, 7), v_fee, v_platform, v_bee, coalesce(p_shipping, v_listing.shipping_cost, 0), v_listing.shipping_method)
  returning id into v_purchase_id;
  update listings set status = 'sold' where id = p_listing_id;
  return v_purchase_id;
end; $function$;
