-- Alle Benachrichtigungs-Schalter bekommen echte Features:
--   buy_auction_end   Auktion endet bald (Vorlauf 5/10/30 Min pro Nutzer, minuetlich)
--   sell_expiring     Inserat laeuft in 24h ab (stuendlich)
--   review_reminder   Bewertung offen nach 3 Tagen (taeglich)
--   sell_report       Monatsbericht am 1. (monatlich, nur E-Mail-Kanal + Glocke)
--   fav_price_change  Preis eines Favoriten geaendert (Trigger, Standard AUS)
--   fav_sold          Favorit wurde verkauft (Trigger, Standard AUS)
-- Glocke immer (bei Standard-AUS-Typen nur bei Opt-in), Mail/Push via
-- queue_notification_email/push (pruefen die Haekchen serverseitig).

-- Einmal-Versand-Sperre: pro Nutzer/Art/Referenz genau eine Benachrichtigung
create table if not exists public.notify_once (
  user_id uuid not null,
  kind text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
alter table public.notify_once enable row level security; -- keine Policies: nur Server

-- Haekchen-Check mit definiertem Standard (fuer Opt-in-Typen wie Favoriten)
create or replace function public.pref_enabled(p_prefs jsonb, p_key text, p_channel text, p_default boolean)
returns boolean language sql immutable as $$
  select coalesce(nullif(p_prefs -> p_key ->> p_channel, '')::boolean, p_default);
$$;

-- ── Auktion endet bald ──────────────────────────────────────────────
create or replace function public.notify_auction_ending()
returns void language plpgsql security definer set search_path = public as $$
declare
  rec record; v_prefs jsonb; v_lead int; v_min int; v_title text; v_msg text; v_link text;
begin
  for rec in
    select l.id, l.title, l.auction_end, u.uid
    from listings l
    join lateral (
      select b.bidder_id as uid from bids b where b.listing_id = l.id
      union
      select f.user_id from favorites f where f.listing_id = l.id
    ) u on u.uid <> l.user_id
    where l.listing_type = 'auction' and l.status = 'active'
      and l.auction_end > now() and l.auction_end <= now() + interval '30 minutes'
  loop
    select notification_settings into v_prefs from profiles where id = rec.uid;
    v_lead := coalesce(nullif(v_prefs -> 'buy_auction_end' ->> 'lead', '')::int, 30);
    if v_lead not in (5, 10, 30) then v_lead := 30; end if;
    if rec.auction_end <= now() + make_interval(mins => v_lead) then
      insert into notify_once (user_id, kind, ref) values (rec.uid, 'auction_end', rec.id::text)
      on conflict do nothing;
      if found then
        v_min := greatest(1, ceil(extract(epoch from (rec.auction_end - now())) / 60));
        v_title := 'Auktion endet bald';
        v_msg := format('"%s" endet in etwa %s Minuten. Jetzt mitbieten oder Limit pruefen.', rec.title, v_min);
        v_link := '/listing/' || rec.id;
        insert into notifications (user_id, type, title, message, link, is_read)
        values (rec.uid, 'bid', v_title, v_msg, v_link, false);
        perform queue_notification_email(rec.uid, v_title, v_msg, v_link, 'buy_auction_end');
        perform queue_notification_push(rec.uid, v_title, v_msg, v_link, 'buy_auction_end');
      end if;
    end if;
  end loop;
end;
$$;

-- ── Inserat laeuft ab (24h vorher) ──────────────────────────────────
create or replace function public.notify_listing_expiring()
returns void language plpgsql security definer set search_path = public as $$
declare
  rec record; v_title text; v_msg text; v_link text;
begin
  for rec in
    select l.id, l.title, l.user_id, l.expires_at
    from listings l
    where l.status = 'active' and l.expires_at is not null
      and l.expires_at > now() and l.expires_at <= now() + interval '24 hours'
  loop
    insert into notify_once (user_id, kind, ref) values (rec.user_id, 'expiring', rec.id::text)
    on conflict do nothing;
    if found then
      v_title := 'Dein Inserat laeuft ab';
      v_msg := format('"%s" laeuft in weniger als 24 Stunden ab. Mit einem Klick verlaengern.', rec.title);
      v_link := '/listings';
      insert into notifications (user_id, type, title, message, link, is_read)
      values (rec.user_id, 'system', v_title, v_msg, v_link, false);
      perform queue_notification_email(rec.user_id, v_title, v_msg, v_link, 'sell_expiring');
      perform queue_notification_push(rec.user_id, v_title, v_msg, v_link, 'sell_expiring');
    end if;
  end loop;
end;
$$;

-- ── Bewertungs-Erinnerung (3 Tage nach Abschluss, einmalig) ─────────
create or replace function public.notify_review_reminder()
returns void language plpgsql security definer set search_path = public as $$
declare
  rec record; v_title text; v_msg text; v_link text;
begin
  for rec in
    select p.id, p.buyer_id, p.seller_id, l.title,
           unnest(array[p.buyer_id, p.seller_id]) as rater
    from purchases p
    join listings l on l.id = p.listing_id
    where p.status = 'completed'
      and p.created_at between now() - interval '14 days' and now() - interval '3 days'
  loop
    if exists (select 1 from ratings r where r.purchase_id = rec.id and r.rater_id = rec.rater) then
      continue;
    end if;
    insert into notify_once (user_id, kind, ref) values (rec.rater, 'review_reminder', rec.id::text)
    on conflict do nothing;
    if found then
      v_title := 'Bewertung offen';
      v_msg := format('Deine Bestellung "%s" wartet noch auf eine Bewertung. Dauert 20 Sekunden.', rec.title);
      v_link := '/order/' || rec.id;
      insert into notifications (user_id, type, title, message, link, is_read)
      values (rec.rater, 'rating', v_title, v_msg, v_link, false);
      perform queue_notification_email(rec.rater, v_title, v_msg, v_link, 'review_reminder');
      perform queue_notification_push(rec.rater, v_title, v_msg, v_link, 'review_reminder');
    end if;
  end loop;
end;
$$;

-- ── Monatlicher Verkaufsbericht (am 1. fuer den Vormonat) ───────────
create or replace function public.notify_monthly_sales_report()
returns void language plpgsql security definer set search_path = public as $$
declare
  rec record; v_monat text; v_title text; v_msg text;
begin
  v_monat := to_char(date_trunc('month', now()) - interval '1 month', 'MM.YYYY');
  for rec in
    select p.seller_id, count(*) as anzahl, sum(p.price) as umsatz
    from purchases p
    where p.status <> 'cancelled'
      and p.created_at >= date_trunc('month', now()) - interval '1 month'
      and p.created_at < date_trunc('month', now())
    group by p.seller_id
  loop
    insert into notify_once (user_id, kind, ref) values (rec.seller_id, 'sell_report', v_monat)
    on conflict do nothing;
    if found then
      v_title := 'Dein Verkaufsbericht ' || v_monat;
      v_msg := format('Im %s hast du %s %s mit CHF %s Umsatz gemacht. Weiter so.',
        v_monat, rec.anzahl, case when rec.anzahl = 1 then 'Verkauf' else 'Verkaeufe' end,
        to_char(coalesce(rec.umsatz, 0), 'FM999990.00'));
      insert into notifications (user_id, type, title, message, link, is_read)
      values (rec.seller_id, 'system', v_title, v_msg, '/sales', false);
      perform queue_notification_email(rec.seller_id, v_title, v_msg, '/sales', 'sell_report');
    end if;
  end loop;
end;
$$;

-- ── Favoriten-Trigger: Preisaenderung (Opt-in, Standard AUS) ────────
create or replace function public.trg_notify_fav_price()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  f record; v_prefs jsonb; v_title text; v_msg text; v_link text;
begin
  if new.status = 'active' and new.listing_type = 'sell'
     and old.price is not null and new.price is not null
     and new.price is distinct from old.price then
    for f in select user_id from favorites where listing_id = new.id and user_id <> new.user_id loop
      select notification_settings into v_prefs from profiles where id = f.user_id;
      if pref_enabled(v_prefs, 'fav_price_change', 'email', false)
         or pref_enabled(v_prefs, 'fav_price_change', 'push', false) then
        insert into notify_once (user_id, kind, ref)
        values (f.user_id, 'fav_price', new.id::text || ':' || to_char(new.price, 'FM999990.00'))
        on conflict do nothing;
        if found then
          v_title := case when new.price < old.price then 'Preis gesenkt' else 'Preis geaendert' end;
          v_msg := format('"%s": neu CHF %s (vorher CHF %s)', new.title,
            to_char(new.price, 'FM999990.00'), to_char(old.price, 'FM999990.00'));
          v_link := '/listing/' || new.id;
          insert into notifications (user_id, type, title, message, link, is_read)
          values (f.user_id, 'system', v_title, v_msg, v_link, false);
          perform queue_notification_email(f.user_id, v_title, v_msg, v_link, 'fav_price_change');
          perform queue_notification_push(f.user_id, v_title, v_msg, v_link, 'fav_price_change');
        end if;
      end if;
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_fav_price on public.listings;
create trigger notify_fav_price after update of price on public.listings
for each row execute function public.trg_notify_fav_price();

-- ── Favoriten-Trigger: verkauft (Opt-in, Standard AUS) ──────────────
create or replace function public.trg_notify_fav_sold()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  f record; v_prefs jsonb; v_title text; v_msg text; v_link text;
begin
  if new.status = 'sold' and old.status is distinct from new.status then
    for f in select user_id from favorites where listing_id = new.id and user_id <> new.user_id loop
      select notification_settings into v_prefs from profiles where id = f.user_id;
      if pref_enabled(v_prefs, 'fav_sold', 'email', false)
         or pref_enabled(v_prefs, 'fav_sold', 'push', false) then
        insert into notify_once (user_id, kind, ref) values (f.user_id, 'fav_sold', new.id::text)
        on conflict do nothing;
        if found then
          v_title := 'Dein Favorit ist weg';
          v_msg := format('"%s" wurde verkauft. Beim naechsten Mal schneller zuschlagen.', new.title);
          v_link := '/listing/' || new.id;
          insert into notifications (user_id, type, title, message, link, is_read)
          values (f.user_id, 'system', v_title, v_msg, v_link, false);
          perform queue_notification_email(f.user_id, v_title, v_msg, v_link, 'fav_sold');
          perform queue_notification_push(f.user_id, v_title, v_msg, v_link, 'fav_sold');
        end if;
      end if;
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_fav_sold on public.listings;
create trigger notify_fav_sold after update of status on public.listings
for each row execute function public.trg_notify_fav_sold();

-- ── Cron-Zeitplaene ─────────────────────────────────────────────────
do $$ begin perform cron.unschedule('notify-auction-ending'); exception when others then null; end $$;
do $$ begin perform cron.unschedule('notify-listing-expiring'); exception when others then null; end $$;
do $$ begin perform cron.unschedule('notify-review-reminder'); exception when others then null; end $$;
do $$ begin perform cron.unschedule('notify-monthly-report'); exception when others then null; end $$;
select cron.schedule('notify-auction-ending', '* * * * *', 'select public.notify_auction_ending()');
select cron.schedule('notify-listing-expiring', '10 * * * *', 'select public.notify_listing_expiring()');
select cron.schedule('notify-review-reminder', '30 6 * * *', 'select public.notify_review_reminder()');
select cron.schedule('notify-monthly-report', '15 7 1 * *', 'select public.notify_monthly_sales_report()');
