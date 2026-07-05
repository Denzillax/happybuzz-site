-- Sicherheits-Härtung der SECURITY-DEFINER-RPCs (Audit 2026-06-18).
-- Problem: create_purchase/place_bid/upsert_bid/get_unread_count_for_user waren für anon
-- ausführbar und vertrauten der übergebenen Identität (p_buyer_id/p_bidder_id/p_user_id).
-- DEFINER umgeht RLS → gespoofte Käufe/Gebote im fremden Namen waren möglich.
-- Fix: (1) Guard auth.uid() = p_*_id in allen Overloads, (2) EXECUTE von PUBLIC/anon entzogen,
--      (3) place_bid/upsert_bid (vom Client ungenutzt) nur noch service_role.

-- ── create_purchase (2-arg) ──
CREATE OR REPLACE FUNCTION public.create_purchase(p_listing_id uuid, p_buyer_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_listing RECORD; v_fee DECIMAL; v_platform DECIMAL; v_bee DECIMAL; v_purchase_id UUID; v_price DECIMAL;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_buyer_id THEN RAISE EXCEPTION 'Nicht autorisiert'; END IF;
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing nicht verfuegbar'; END IF;
  IF v_listing.user_id = p_buyer_id THEN RAISE EXCEPTION 'Eigene Inserate koennen nicht gekauft werden'; END IF;
  v_price := COALESCE(v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * COALESCE(v_listing.fee_percentage, 5) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  INSERT INTO purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method)
  VALUES (p_listing_id, p_buyer_id, v_listing.user_id, v_price, COALESCE(v_listing.fee_percentage, 5), v_fee, v_platform, v_bee, COALESCE(v_listing.shipping_cost, 0), v_listing.shipping_method)
  RETURNING id INTO v_purchase_id;
  UPDATE listings SET status = 'sold' WHERE id = p_listing_id;
  RETURN v_purchase_id;
END;
$function$;

-- ── create_purchase (3-arg) ──
CREATE OR REPLACE FUNCTION public.create_purchase(p_listing_id uuid, p_buyer_id uuid, p_price numeric)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_listing record; v_fee decimal; v_platform decimal; v_bee decimal; v_purchase_id uuid; v_price decimal;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then raise exception 'Nicht autorisiert'; end if;
  select * into v_listing from listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'Listing nicht verfuegbar'; end if;
  if v_listing.user_id = p_buyer_id then raise exception 'Eigene Inserate koennen nicht gekauft werden'; end if;
  v_price := coalesce(nullif(p_price, 0), v_listing.price, v_listing.buy_now_price, v_listing.rent_price, 0);
  v_fee := v_price * coalesce(v_listing.fee_percentage, 5) / 100.0;
  v_bee := v_fee * 0.2;
  v_platform := v_fee - v_bee;
  insert into purchases (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, shipping_cost, shipping_method)
  values (p_listing_id, p_buyer_id, v_listing.user_id, v_price, coalesce(v_listing.fee_percentage, 5), v_fee, v_platform, v_bee, coalesce(v_listing.shipping_cost, 0), v_listing.shipping_method)
  returning id into v_purchase_id;
  update listings set status = 'sold' where id = p_listing_id;
  return v_purchase_id;
end; $function$;

-- ── create_purchase (4-arg) ──
CREATE OR REPLACE FUNCTION public.create_purchase(p_listing_id uuid, p_buyer_id uuid, p_price numeric, p_shipping numeric)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_listing record; v_fee decimal; v_platform decimal; v_bee decimal; v_purchase_id uuid; v_price decimal;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then raise exception 'Nicht autorisiert'; end if;
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
end; $function$;

-- ── get_unread_count_for_user: nur eigener Zähler ──
CREATE OR REPLACE FUNCTION public.get_unread_count_for_user(p_user_id uuid)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RETURN 0; END IF;
  RETURN (
    SELECT COUNT(*)::INT FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.buyer_id = p_user_id OR c.seller_id = p_user_id)
      AND c.buyer_id <> c.seller_id
      AND m.sender_id <> p_user_id
      AND m.is_read = false
  );
END;
$function$;

-- ── Ausführungsrechte: PUBLIC-Default-Grant entfernen, gezielt neu vergeben ──
REVOKE EXECUTE ON FUNCTION public.create_purchase(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_purchase(uuid, uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_purchase(uuid, uuid, numeric, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_unread_count_for_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.place_bid(uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_bid(uuid, uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_purchase(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase(uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase(uuid, uuid, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_count_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bid(uuid, uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_bid(uuid, uuid, numeric, numeric) TO service_role;
