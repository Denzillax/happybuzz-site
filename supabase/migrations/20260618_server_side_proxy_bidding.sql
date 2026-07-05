-- ═══════════════════════════════════════════════════════════════════════════
-- Serverseitiges Proxy-Bidding (Audit 2026-06-18)
-- Probleme vorher:
--  (1) bids war komplett öffentlich lesbar — inkl. max_amount (geheimes Preislimit!)
--  (2) Proxy-Logik lief im Client und schrieb fremde Zeilen (listings.price,
--      Gegner-amount), die unter owner-only-RLS STILL fehlschlugen → Anzeige-Bugs
--  (3) Keine Atomarität: zwei gleichzeitige Gebote konnten sich überholen
-- Lösung: EINE definer-RPC proxy_bid (Identität = auth.uid(), Zeilen-Lock),
--         öffentliche View public_bids OHNE max_amount, bids-Tabelle nur noch
--         own-rows lesbar und ausschliesslich via RPC beschreibbar.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Erhöhungsschritte (Ricardo-Stil), identisch zum bisherigen Client ──
CREATE OR REPLACE FUNCTION public.bid_increment(p numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p < 10 THEN 0.50
    WHEN p < 50 THEN 1
    WHEN p < 100 THEN 2
    WHEN p < 500 THEN 5
    WHEN p < 1000 THEN 10
    ELSE 20 END;
$$;

-- ── Haupt-RPC: Gebot abgeben / Preislimit erhöhen ──
CREATE OR REPLACE FUNCTION public.proxy_bid(p_listing_id uuid, p_max_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
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

  -- Listing sperren → Gebote auf dasselbe Inserat laufen seriell (keine Races)
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inserat nicht gefunden'; END IF;
  IF v_listing.listing_type <> 'auction' THEN RAISE EXCEPTION 'Kein Auktionsinserat'; END IF;
  IF v_listing.status <> 'active' THEN RAISE EXCEPTION 'Auktion nicht aktiv'; END IF;
  IF v_listing.auction_end IS NOT NULL AND v_listing.auction_end < now() THEN RAISE EXCEPTION 'Auktion beendet'; END IF;
  IF v_listing.user_id = v_bidder THEN RAISE EXCEPTION 'Du kannst nicht auf dein eigenes Inserat bieten'; END IF;
  IF v_listing.buy_now_price IS NOT NULL AND v_listing.buy_now_price > 0 AND p_max_amount >= v_listing.buy_now_price THEN
    RAISE EXCEPTION 'Max. Preislimit: CHF %. Nutze Sofortkauf.', to_char(v_listing.buy_now_price - 1, 'FM999999990.00');
  END IF;

  -- Aktueller Top-Bieter (nach geheimem Maximum, bei Gleichstand der Frühere)
  SELECT * INTO v_top FROM bids
  WHERE listing_id = p_listing_id
  ORDER BY max_amount DESC, created_at ASC
  LIMIT 1;

  -- Eigenes bestehendes Gebot?
  SELECT * INTO v_mine FROM bids
  WHERE listing_id = p_listing_id AND bidder_id = v_bidder;

  IF FOUND THEN
    -- ── Preislimit erhöhen ──
    IF p_max_amount <= v_mine.max_amount THEN
      RAISE EXCEPTION 'Dein aktuelles Preislimit ist bereits CHF %. Gib ein hoeheres ein.', to_char(v_mine.max_amount, 'FM999999990.00');
    END IF;
    UPDATE bids SET max_amount = p_max_amount WHERE id = v_mine.id;

    IF v_top.id IS NOT NULL AND v_top.bidder_id <> v_bidder THEN
      IF p_max_amount > v_top.max_amount THEN
        -- Wir überbieten den bisherigen Top-Bieter
        v_inc := bid_increment(v_top.max_amount);
        v_new_price := LEAST(p_max_amount, v_top.max_amount + v_inc);
        UPDATE bids SET amount = v_new_price WHERE id = v_mine.id;
        UPDATE listings SET price = v_new_price WHERE id = p_listing_id;
        INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_bidder, v_new_price, 'manual');
        v_outbid := v_top.bidder_id;
        v_msg := 'Du fuehrst jetzt!';
      ELSE
        -- Immer noch überboten: Auto-Bid des Top-Bieters verteidigt
        v_inc := bid_increment(p_max_amount);
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
      -- Wir sind bereits Top (oder einziger Bieter): nur Maximum erhöht
      v_new_price := COALESCE(v_listing.price, v_listing.start_price, 1);
      v_msg := 'Preislimit erhoeht.';
    END IF;
  ELSE
    -- ── Neuer Bieter ──
    IF v_top.id IS NULL THEN
      -- Erster Bieter: Startpreis muss gedeckt sein
      IF p_max_amount < COALESCE(v_listing.start_price, 1) THEN
        RAISE EXCEPTION 'Mindestgebot: CHF %', to_char(COALESCE(v_listing.start_price, 1), 'FM999999990.00');
      END IF;
      v_new_price := COALESCE(v_listing.start_price, 1);
      INSERT INTO bids (listing_id, bidder_id, amount, max_amount)
      VALUES (p_listing_id, v_bidder, v_new_price, p_max_amount);
      INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_bidder, v_new_price, 'manual');
      v_msg := 'Du fuehrst!';
    ELSIF p_max_amount > v_top.max_amount THEN
      -- Neuer Bieter übernimmt die Führung
      v_inc := bid_increment(v_top.max_amount);
      v_new_price := LEAST(p_max_amount, v_top.max_amount + v_inc);
      INSERT INTO bids (listing_id, bidder_id, amount, max_amount)
      VALUES (p_listing_id, v_bidder, v_new_price, p_max_amount);
      INSERT INTO bid_history (listing_id, bidder_id, amount, bid_type) VALUES (p_listing_id, v_bidder, v_new_price, 'manual');
      v_outbid := v_top.bidder_id;
      v_msg := 'Du fuehrst!';
    ELSE
      -- Top-Bieter verteidigt per Auto-Bid
      v_inc := bid_increment(p_max_amount);
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

  -- Timer-Verlängerung: Gebot in den letzten 3 Minuten → +3 Minuten
  IF v_listing.auction_end IS NOT NULL
     AND v_listing.auction_end > now()
     AND v_listing.auction_end < now() + interval '3 minutes' THEN
    UPDATE listings SET auction_end = now() + interval '3 minutes' WHERE id = p_listing_id;
  END IF;

  -- bid_count = Anzahl Gebots-Events (konsistent in ALLEN Pfaden)
  SELECT count(*) INTO v_hist_count FROM bid_history WHERE listing_id = p_listing_id;
  UPDATE listings SET bid_count = v_hist_count WHERE id = p_listing_id;

  RETURN jsonb_build_object(
    'display_price', v_new_price,
    'is_top_bidder', v_is_top,
    'message', v_msg,
    'outbid_user_id', v_outbid,
    'listing_title', v_listing.title
  );
END;
$$;

-- ── Preislimit senken/entfernen (nur eigenes Gebot, nie unter sichtbares Gebot) ──
CREATE OR REPLACE FUNCTION public.set_bid_limit_down(p_listing_id uuid, p_new_max numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_bidder uuid := auth.uid();
  v_mine RECORD;
  v_buy_now numeric;
BEGIN
  IF v_bidder IS NULL THEN RAISE EXCEPTION 'Nicht eingeloggt'; END IF;
  SELECT * INTO v_mine FROM bids WHERE listing_id = p_listing_id AND bidder_id = v_bidder;
  IF NOT FOUND THEN RAISE EXCEPTION 'Du hast noch kein Gebot abgegeben'; END IF;
  IF p_new_max < v_mine.amount THEN
    RAISE EXCEPTION 'Preislimit kann nicht unter dein aktuelles Gebot von CHF % gesenkt werden.', to_char(v_mine.amount, 'FM999999990.00');
  END IF;
  IF p_new_max = v_mine.max_amount THEN RAISE EXCEPTION 'Das ist bereits dein aktuelles Preislimit.'; END IF;
  SELECT buy_now_price INTO v_buy_now FROM listings WHERE id = p_listing_id;
  IF v_buy_now IS NOT NULL AND v_buy_now > 0 AND p_new_max >= v_buy_now THEN
    RAISE EXCEPTION 'Preislimit muss unter dem Sofortkauf-Preis von CHF % liegen.', to_char(v_buy_now, 'FM999999990.00');
  END IF;
  UPDATE bids SET max_amount = p_new_max WHERE id = v_mine.id;
  RETURN jsonb_build_object('new_max', p_new_max, 'amount', v_mine.amount);
END;
$$;

-- ── Öffentliche Gebots-Ansicht: OHNE max_amount (Definer-View, Owner = postgres) ──
CREATE OR REPLACE VIEW public.public_bids AS
  SELECT b.id, b.listing_id, b.bidder_id, b.amount, b.created_at,
         p.display_name AS bidder_name
  FROM public.bids b
  LEFT JOIN public.profiles p ON p.id = b.bidder_id;
GRANT SELECT ON public.public_bids TO anon, authenticated;

-- ── bids-RLS: nur eigene Zeilen lesbar, Schreiben NUR via Definer-RPCs ──
DROP POLICY IF EXISTS "Anyone can read bids" ON public.bids;
DROP POLICY IF EXISTS "Anyone can see bids" ON public.bids;
DROP POLICY IF EXISTS "Auth users can bid" ON public.bids;
DROP POLICY IF EXISTS "Bidders can insert own bids" ON public.bids;
DROP POLICY IF EXISTS "Bidders can update own bids" ON public.bids;
DROP POLICY IF EXISTS "users_update_own_bids" ON public.bids;
DROP POLICY IF EXISTS "users_delete_own_bids" ON public.bids;
CREATE POLICY "bids_select_own" ON public.bids FOR SELECT USING (bidder_id = auth.uid());
CREATE POLICY "bids_select_staff" ON public.bids FOR SELECT USING (public.is_staff(auth.uid()));

-- ── Ausführungsrechte ──
REVOKE EXECUTE ON FUNCTION public.proxy_bid(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_bid_limit_down(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proxy_bid(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_bid_limit_down(uuid, numeric) TO authenticated;

-- ── Backfill: listings.price + bid_count für aktive Auktionen reparieren ──
-- (die alten client-seitigen Updates schlugen unter RLS still fehl)
UPDATE listings l SET price = t.top_amount
FROM (SELECT listing_id, max(amount) AS top_amount FROM bids GROUP BY listing_id) t
WHERE l.id = t.listing_id AND l.listing_type = 'auction' AND l.status = 'active'
  AND (l.price IS NULL OR l.price < t.top_amount);

UPDATE listings l SET bid_count = h.cnt
FROM (SELECT listing_id, count(*) AS cnt FROM bid_history GROUP BY listing_id) h
WHERE l.id = h.listing_id AND l.listing_type = 'auction' AND COALESCE(l.bid_count, 0) <> h.cnt;
