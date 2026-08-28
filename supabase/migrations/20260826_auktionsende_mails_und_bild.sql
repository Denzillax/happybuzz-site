-- 26.08.2026: Auktionsende loest jetzt Mail + Push aus, Mails koennen ein
-- Artikelbild zeigen, und die Gebuehrenformel im Auktionsabschluss zieht
-- mit dem Deckel gleich.
--
-- Ausgangslage: finalize_ended_auctions (Juni) entstand VOR der
-- Mail-Infrastruktur und legte nur In-App-Notifications an. "Auktion
-- gewonnen" / "Auktion verkauft" kamen nie per Mail/Push, und eine
-- Auktion ohne Gebote endete fuer den Verkaeufer voellig still.
-- Die Settings-Schluessel buy_won / sell_sold existieren bereits.

-- 1) Mail-Warteschlange um Artikelbild erweitern.
--    LEHRE 21.08.: neue Parameter = neue Signatur -> die ALTE Version MUSS
--    weg, sonst ist jeder 5-Argument-Aufruf ambiguos und schlaegt fehl.
drop function if exists public.queue_notification_email(uuid, text, text, text, text);

create or replace function public.queue_notification_email(
  p_recipient uuid,
  p_subject text,
  p_message text,
  p_link text,
  p_settings_key text,
  p_image text default null,
  p_item_title text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefs jsonb;
  v_email text;
begin
  if p_recipient is null or p_subject is null or p_settings_key is null then
    return false;
  end if;

  select notification_settings into v_prefs from profiles where id = p_recipient;
  if v_prefs is not null and (v_prefs -> p_settings_key ->> 'email') = 'false' then
    return false;
  end if;

  select email into v_email from auth.users where id = p_recipient;
  if v_email is null then return false; end if;

  if (select count(*) from email_log
      where recipient_id = p_recipient and created_at > now() - interval '1 hour') >= 30 then
    return false;
  end if;

  insert into email_log (recipient_id, recipient_email, subject, template, context, status)
  values (
    p_recipient, v_email, p_subject, 'notification',
    jsonb_strip_nulls(jsonb_build_object(
      'message', p_message, 'link', p_link, 'settings_key', p_settings_key,
      'image', p_image, 'item_title', p_item_title
    )),
    'pending'
  );
  return true;
end $$;

revoke all on function public.queue_notification_email(uuid, text, text, text, text, text, text) from public, anon, authenticated;

-- 2) Auktionsabschluss: Mails/Push + Deckel-konforme Gebuehr + Ohne-Gebote-Info
create or replace function public.finalize_ended_auctions()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  l record;
  top_bid record;
  fee numeric;
  fee_amt numeric;
  new_pid uuid;
  n integer := 0;
  price_txt text;
  v_img text;
  v_title text;
begin
  for l in
    select * from public.listings
    where listing_type = 'auction' and status = 'active'
      and auction_end is not null and auction_end <= now()
    order by auction_end
    for update skip locked
  loop
    select b.bidder_id, b.amount into top_bid
    from public.bids b
    where b.listing_id = l.id
    order by b.amount desc, b.created_at asc
    limit 1;

    -- Artikelbild fuer die Mail (Cover = kleinste sort_order)
    select url into v_img from public.listing_images
    where listing_id = l.id order by sort_order asc limit 1;
    v_title := coalesce(l.title, 'Inserat');

    if top_bid.bidder_id is null then
      update public.listings set status = 'expired' where id = l.id;
      -- Verkaeufer nicht im Dunkeln lassen: Auktion lief aus, ohne Gebote
      insert into public.notifications (user_id, type, title, message, link, is_read) values
        (l.user_id, 'listing', 'Auktion ohne Gebote beendet',
         '"' || v_title || '" ist ohne Gebote ausgelaufen. Du kannst das Inserat neu einstellen.',
         '/listings', false);
      perform queue_notification_email(l.user_id, 'Auktion ohne Gebote beendet',
        '"' || v_title || '" ist ohne Gebote ausgelaufen. Du kannst das Inserat mit einem Klick neu einstellen.',
        '/listings', 'sell_expiring', v_img, v_title);
      perform queue_notification_push(l.user_id, 'Auktion ohne Gebote beendet',
        '"' || v_title || '" ist ausgelaufen.', '/listings', 'sell_expiring');
      continue;
    end if;

    -- Gebuehr wie ueberall: unter CHF 20 frei, sonst min(Rate, Deckel 200)
    fee := coalesce(l.fee_percentage, 7);
    if top_bid.amount < 20 then
      fee_amt := 0;
    else
      fee_amt := least(top_bid.amount * fee / 100, 200);
    end if;

    insert into public.purchases
      (listing_id, buyer_id, seller_id, price, fee_percentage, fee_amount, platform_fee, bee_impact, status)
    values
      (l.id, top_bid.bidder_id, l.user_id, top_bid.amount, fee, fee_amt, fee_amt * 0.8, fee_amt * 0.2, 'confirmed')
    returning id into new_pid;

    update public.listings set status = 'sold', price = top_bid.amount where id = l.id;

    price_txt := 'CHF ' || trim(to_char(top_bid.amount, 'FM999990D00'));

    insert into public.notifications (user_id, type, title, message, link, is_read) values
      (top_bid.bidder_id, 'purchase', 'Auktion gewonnen',
       '"' || v_title || '" für ' || price_txt || '. Jetzt bezahlen.',
       '/order/' || new_pid, false),
      (l.user_id, 'purchase', 'Auktion verkauft',
       '"' || v_title || '" für ' || price_txt || ' verkauft.',
       '/order/' || new_pid, false);

    -- Transaktionskritisch: Gewinner und Verkaeufer per Mail + Push
    perform queue_notification_email(top_bid.bidder_id, 'Auktion gewonnen',
      'Glückwunsch: Du hast "' || v_title || '" für ' || price_txt || ' gewonnen. Schliesse den Kauf jetzt ab.',
      '/order/' || new_pid, 'buy_won', v_img, v_title);
    perform queue_notification_push(top_bid.bidder_id, 'Auktion gewonnen',
      '"' || v_title || '" für ' || price_txt || '. Jetzt bezahlen.', '/order/' || new_pid, 'buy_won');

    perform queue_notification_email(l.user_id, 'Auktion verkauft',
      '"' || v_title || '" ist für ' || price_txt || ' verkauft. Der Käufer wurde zur Zahlung aufgefordert.',
      '/order/' || new_pid, 'sell_sold', v_img, v_title);
    perform queue_notification_push(l.user_id, 'Auktion verkauft',
      '"' || v_title || '" für ' || price_txt || ' verkauft.', '/order/' || new_pid, 'sell_sold');

    n := n + 1;
  end loop;
  return n;
end;
$function$;

revoke all on function public.finalize_ended_auctions() from public, anon, authenticated;
