-- ════════════════════════════════════════════════════════════
-- Beendete Auktionen serverseitig finalisieren + benachrichtigen
-- Vorher lief finalizeAuction() nur client-seitig beim Öffnen der Inserat-Seite
-- -> ungeöffnete, beendete Auktionen blieben 'active' ohne Kauf (Gewinner sah
-- nichts). Jetzt per pg_cron alle 5 Minuten, inkl. Notification an Gewinner +
-- Verkäufer. Spiegelt lib/listings.js finalizeAuction(). Idempotent.
-- ════════════════════════════════════════════════════════════

create or replace function public.finalize_ended_auctions()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  l record;
  top_bid record;
  fee numeric;
  fee_amt numeric;
  new_pid uuid;
  price_txt text;
  n integer := 0;
begin
  for l in
    select id, user_id, title, fee_percentage
    from public.listings
    where listing_type = 'auction'
      and status = 'active'
      and auction_end is not null
      and auction_end < now()
  loop
    if exists (select 1 from public.purchases where listing_id = l.id) then
      continue;
    end if;

    select bidder_id, amount into top_bid
    from public.bids
    where listing_id = l.id
    order by amount desc
    limit 1;

    if top_bid.bidder_id is null then
      update public.listings set status = 'expired' where id = l.id;
      continue;
    end if;

    fee := coalesce(l.fee_percentage, 7);
    fee_amt := top_bid.amount * fee / 100;

    insert into public.purchases
      (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, status)
    values
      (l.id, top_bid.bidder_id, l.user_id, top_bid.amount, fee, fee_amt, fee_amt * 0.8, fee_amt * 0.2, 'confirmed')
    returning id into new_pid;

    update public.listings set status = 'sold', price = top_bid.amount where id = l.id;

    price_txt := 'CHF ' || trim(to_char(top_bid.amount, 'FM999990D00'));

    insert into public.notifications (user_id, type, title, message, link, is_read) values
      (top_bid.bidder_id, 'purchase', 'Auktion gewonnen',
       '"' || coalesce(l.title, 'Inserat') || '" für ' || price_txt || '. Jetzt bezahlen.',
       '/order/' || new_pid, false),
      (l.user_id, 'purchase', 'Auktion verkauft',
       '"' || coalesce(l.title, 'Inserat') || '" für ' || price_txt || ' verkauft.',
       '/order/' || new_pid, false);

    n := n + 1;
  end loop;
  return n;
end;
$function$;
revoke all on function public.finalize_ended_auctions() from public, anon, authenticated;

-- Alle 5 Minuten ausführen
select cron.schedule('finalize-ended-auctions', '*/5 * * * *', $$select public.finalize_ended_auctions();$$);
