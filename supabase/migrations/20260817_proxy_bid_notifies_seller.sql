-- Rekonstruiert aus der Cloud-Session vom 17.08.2026 (bereits live angewendet).
-- proxy_bid final: nutzt den waehlbaren bid_step (Fallback Preisstaffel) und
-- benachrichtigt den VERKAEUFER serverseitig bei jedem Gebot (Glocke immer,
-- E-Mail/Push ueber die Kanal-RPCs mit Einstellung sell_new_bid). Vorher wurde
-- nur der ueberbotene Bieter im Browser benachrichtigt — der Verkaeufer kam
-- im Code schlicht nicht vor.
CREATE OR REPLACE FUNCTION public.proxy_bid(p_listing_id uuid, p_max_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bidder uuid := auth.uid();
  v_listing RECORD;
  v_top RECORD;
  v_mine RECORD;
  v_inc numeric;
  v_new_price numeric;
  v_is_top boolean := true;
  v_msg text;
  v_outbid uuid := NULL;
  v_hist_count int;
BEGIN
  IF v_bidder IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  IF p_max_amount IS NULL OR p_max_amount <= 0 THEN RAISE EXCEPTION 'Ungueltiger Betrag'; END IF;

  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inserat nicht gefunden'; END IF;
  IF v_listing.listing_type <> 'auction' THEN RAISE EXCEPTION 'Kein Auktionsinserat'; END IF;
  IF v_listing.status <> 'active' THEN RAISE EXCEPTION 'Auktion nicht aktiv'; END IF;
  IF v_listing.auction_end IS NOT NULL AND v_listing.auction_end < now() THEN RAISE EXCEPTION 'Auktion beendet'; END IF;
  IF v_listing.user_id = v_bidder THEN RAISE EXCEPTION 'Du kannst nicht auf dein eigenes Inserat bieten'; END IF;
  IF v_listing.buy_now_price IS NOT NULL AND v_listing.buy_now_price > 0 AND p_max_amount >= v_listing.buy_now_price THEN
    RAISE EXCEPTION 'Max. Preislimit: CHF %. Nutze Sofortkauf.', to_char(v_listing.buy_now_price - 1, 'FM999999990.00');
  END IF;

  SELECT * INTO v_top FROM bids
  WHERE listing_id = p_listing_id
  ORDER BY max_amount DESC, created_at ASC
  LIMIT 1;

  SELECT * INTO v_mine FROM bids
  WHERE listing_id = p_listing_id AND bidder_id = v_bidder;

  IF FOUND THEN
    IF p_max_amount <= v_mine.max_amount THEN
      RAISE EXCEPTION 'Dein aktuelles Preislimit ist bereits CHF %. Gib ein hoeheres ein.', to_char(v_mine.max_amount, 'FM999999990.00');
    END IF;
    UPDATE bids SET max_amount = p_max_amount WHERE id = v_mine.id;

    IF v_top.id IS NOT NULL AND v_top.bidder_id <> v_bidder THEN
      IF p_max_amount > v_top.max_amount THEN
        v_inc := COALESCE(v_listing.bid_step, bid_increment(v_top.max_amount));
        v_new_price := LEAST(p_max_amount, v_top.max_amount + v_inc);
        UPDATE bids SET amount = v_new_price WHERE id = v_mine.id;
        UPDATE listings SET price = v_new_price WHERE id = p_listing_id;
        INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_bidder, v_new_price, 'manual');
        v_outbid := v_top.bidder_id;
        v_msg := 'Du fuehrst jetzt!';
      ELSE
        v_inc := COALESCE(v_listing.bid_step, bid_increment(p_max_amount));
        v_new_price := LEAST(v_top.max_amount, p_max_amount + v_inc);
        UPDATE bids SET amount = v_new_price WHERE id = v_top.id;
        UPDATE bids SET amount = p_max_amount WHERE id = v_mine.id;
        UPDATE listings SET price = v_new_price WHERE id = p_listing_id;
        INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_bidder, p_max_amount, 'manual');
        INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_top.bidder_id, v_new_price, 'auto');
        v_is_top := false;
        v_msg := 'Du wurdest automatisch ueberboten.';
      END IF;
    ELSE
      v_new_price := COALESCE(v_listing.price, v_listing.start_price, 1);
      v_msg := 'Preislimit erhoeht.';
    END IF;
  ELSE
    IF v_top.id IS NULL THEN
      IF p_max_amount < COALESCE(v_listing.start_price, 1) THEN
        RAISE EXCEPTION 'Mindestgebot: CHF %', to_char(COALESCE(v_listing.start_price, 1), 'FM999999990.00');
      END IF;
      v_new_price := COALESCE(v_listing.start_price, 1);
      INSERT INTO bids (listing_id, bidder_id, amount, max_amount)
      VALUES (p_listing_id, v_bidder, v_new_price, p_max_amount);
      INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_bidder, v_new_price, 'manual');
      v_msg := 'Du fuehrst!';
    ELSIF p_max_amount > v_top.max_amount THEN
      v_inc := COALESCE(v_listing.bid_step, bid_increment(v_top.max_amount));
      v_new_price := LEAST(p_max_amount, v_top.max_amount + v_inc);
      INSERT INTO bids (listing_id, bidder_id, amount, max_amount)
      VALUES (p_listing_id, v_bidder, v_new_price, p_max_amount);
      INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_bidder, v_new_price, 'manual');
      v_outbid := v_top.bidder_id;
      v_msg := 'Du fuehrst!';
    ELSE
      v_inc := COALESCE(v_listing.bid_step, bid_increment(p_max_amount));
      v_new_price := LEAST(v_top.max_amount, p_max_amount + v_inc);
      INSERT INTO bids (listing_id, bidder_id, amount, max_amount)
      VALUES (p_listing_id, v_bidder, p_max_amount, p_max_amount);
      UPDATE bids SET amount = v_new_price WHERE id = v_top.id;
      INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_bidder, p_max_amount, 'manual');
      INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_top.bidder_id, v_new_price, 'auto');
      v_is_top := false;
      v_msg := 'Du wurdest automatisch ueberboten.';
    END IF;
    UPDATE listings SET price = v_new_price WHERE id = p_listing_id;
  END IF;

  IF v_listing.auction_end IS NOT NULL
     AND v_listing.auction_end > now()
     AND v_listing.auction_end < now() + interval '3 minutes' THEN
    UPDATE listings SET auction_end = now() + interval '3 minutes' WHERE id = p_listing_id;
  END IF;

  SELECT count(*) INTO v_hist_count FROM bid_history WHERE listing_id = p_listing_id;
  UPDATE listings SET bid_count = v_hist_count WHERE id = p_listing_id;

  -- Verkaeufer ueber das neue Gebot informieren (Einstellung sell_new_bid).
  -- Glocke immer, Kanaele E-Mail/Push pruefen die RPCs selbst.
  INSERT INTO notifications (user_id, type, title, message, link, is_read)
  VALUES (v_listing.user_id, 'bid', 'Neues Gebot auf dein Inserat',
    format('Bei "%s" liegt das Gebot jetzt bei CHF %s.', v_listing.title,
           to_char(v_new_price, 'FM999999990.00')),
    '/listing/' || p_listing_id, false);
  PERFORM queue_notification_email(v_listing.user_id, 'Neues Gebot auf dein Inserat',
    format('Bei "%s" liegt das Gebot jetzt bei CHF %s.', v_listing.title,
           to_char(v_new_price, 'FM999999990.00')),
    '/listing/' || p_listing_id, 'sell_new_bid');
  PERFORM queue_notification_push(v_listing.user_id, 'Neues Gebot auf dein Inserat',
    format('Bei "%s" liegt das Gebot jetzt bei CHF %s.', v_listing.title,
           to_char(v_new_price, 'FM999999990.00')),
    '/listing/' || p_listing_id, 'sell_new_bid');

  RETURN jsonb_build_object(
    'display_price', v_new_price,
    'is_top_bidder', v_is_top,
    'message', v_msg,
    'outbid_user_id', v_outbid,
    'listing_title', v_listing.title,
    'seller_id', v_listing.user_id
  );
END;
$function$;
