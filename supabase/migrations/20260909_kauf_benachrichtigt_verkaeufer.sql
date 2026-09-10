-- 09.09.2026 (Beta-Feedback Denis, 01.09.): Ein angenommener Preisvorschlag
-- (und generell jeder Sofortkauf ueber create_purchase) erzeugte KEINERLEI
-- Benachrichtigung - rekonstruiert am Standventilator-Kauf vom 01.09.:
-- null notifications im Zeitfenster, weder an Kaeufer noch Verkaeufer.
-- Nur der Auktionsende-Pfad (finalize_ended_auctions) meldete sich.
--
-- Fix zentral: alle drei create_purchase-Overloads benachrichtigen nach dem
-- Kauf den VERKAEUFER per Glocke, Mail und Push (Schluessel sell_sold).
-- Der Kaeufer ist immer selbst der Ausloeser (RPC verlangt auth.uid = buyer)
-- und braucht keine Meldung. Das Artikelbild ergaenzt die Mail-Warteschlange
-- seit 28.08. selbst aus dem /order/-Link.
--
-- Technik: pg_get_functiondef + Einfuegen vor "return v_purchase_id;" -
-- so bleiben die drei Funktionskoerper exakt wie deployed (Deckel,
-- Bagatellgrenze, Varianten) und nur der Meldeblock kommt dazu.
do $notify$
declare
  r record;
  v_sql text;
  v_block text := $blk$
  insert into notifications (user_id, type, title, message, link, is_read)
  values (v_listing.user_id, 'purchase', 'Verkauft',
    '"' || coalesce(v_listing.title, 'Inserat') || '" für CHF ' || trim(to_char(v_price, 'FM999990D00')) || ' verkauft. Jetzt abwickeln.',
    '/order/' || v_purchase_id, false);
  perform queue_notification_email(v_listing.user_id,
    'Verkauft: ' || coalesce(v_listing.title, 'Inserat'),
    'Dein Inserat wurde für CHF ' || trim(to_char(v_price, 'FM999990D00')) || ' gekauft. Öffne die Bestellung für die Abwicklung.',
    '/order/' || v_purchase_id, 'sell_sold');
  perform queue_notification_push(v_listing.user_id, 'Verkauft',
    '"' || coalesce(v_listing.title, 'Inserat') || '" für CHF ' || trim(to_char(v_price, 'FM999990D00')) || '.',
    '/order/' || v_purchase_id, 'sell_sold');
  return v_purchase_id;$blk$;
begin
  for r in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'create_purchase' and n.nspname = 'public'
  loop
    v_sql := pg_get_functiondef(r.oid);
    if v_sql like '%Jetzt abwickeln%' then continue; end if;  -- idempotent
    v_sql := replace(v_sql, 'return v_purchase_id;', v_block);
    execute v_sql;
  end loop;
end $notify$;
