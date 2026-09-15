-- 15.09.2026 (Beta-Feedback Tacocat 14.09.): Die "Inserat laeuft ab"-Mail
-- versprach "mit einem Klick verlaengern", ging aber (a) auch an Auktionen,
-- deren expires_at = Auktionsende ist und die gar nicht verlaengerbar sind,
-- und (b) nur auf die Inserate-Liste statt zum Inserat.
-- Fix: Auktionen ausgenommen (die haben notify_auction_ending), Link fuehrt
-- auf /listings?verlaengern=<id>, wo die Seite ein Verlaengern-Banner zeigt.
create or replace function public.notify_listing_expiring()
returns void language plpgsql security definer set search_path = public as $$
declare
  rec record; v_title text; v_msg text; v_link text;
begin
  for rec in
    select l.id, l.title, l.user_id, l.expires_at
    from listings l
    where l.status = 'active' and l.expires_at is not null
      and l.listing_type <> 'auction'
      and l.expires_at > now() and l.expires_at <= now() + interval '24 hours'
  loop
    insert into notify_once (user_id, kind, ref) values (rec.user_id, 'expiring', rec.id::text)
    on conflict do nothing;
    if found then
      v_title := 'Dein Inserat läuft ab';
      v_msg := format('"%s" läuft in weniger als 24 Stunden ab. Mit einem Klick verlängerst du es um 60 Tage.', rec.title);
      v_link := '/listings?verlaengern=' || rec.id;
      insert into notifications (user_id, type, title, message, link, is_read)
      values (rec.user_id, 'system', v_title, v_msg, v_link, false);
      perform queue_notification_email(rec.user_id, v_title, v_msg, v_link, 'sell_expiring');
      perform queue_notification_push(rec.user_id, v_title, v_msg, v_link, 'sell_expiring');
    end if;
  end loop;
end;
$$;
