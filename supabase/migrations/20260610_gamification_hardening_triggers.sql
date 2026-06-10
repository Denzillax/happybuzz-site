-- Gamification Hardening: XP-Vergabe serverseitig per Trigger statt Client-RPC.
-- Verhindert beliebige Client-Awards (award_xp/grant_achievement werden für
-- authenticated/anon gesperrt) und vergibt XP automatisch aus echten Events,
-- mit Caps (Listing-Tages-Cap) und Anti-Self-Dealing (buyer<>seller, rater<>rated).
-- Alle Trigger sind exception-safe: XP-Fehler dürfen die echte Aktion nie blockieren.

-- touch_streak: nur eigenen Streak (auth.uid()-gebunden)
create or replace function public.touch_streak(p_user_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare last_d date; cur integer; lon integer; today date := current_date; me uuid := auth.uid();
begin
  if me is null then return 0; end if;
  select last_active_date, current_streak, longest_streak into last_d, cur, lon from public.profiles where id = me;
  if last_d = today then return cur; end if;
  if last_d = today - 1 then cur := coalesce(cur,0) + 1; else cur := 1; end if;
  lon := greatest(coalesce(lon,0), cur);
  update public.profiles set current_streak = cur, longest_streak = lon, last_active_date = today where id = me;
  perform public.award_xp(me, 5, 'daily_streak', null);
  return cur;
exception when others then return coalesce(cur, 0);
end; $$;

create or replace function public.trg_award_listing_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare today_count integer; total integer;
begin
  if NEW.status = 'active'
     and (TG_OP = 'INSERT' or OLD.status is distinct from 'active')
     and not exists (select 1 from public.xp_log where reason = 'listing_created' and reference_id = NEW.id) then
    select count(*) into today_count from public.xp_log
      where user_id = NEW.user_id and reason = 'listing_created' and created_at >= current_date;
    if today_count < 5 then perform public.award_xp(NEW.user_id, 10, 'listing_created', NEW.id); end if;
    select count(*) into total from public.listings where user_id = NEW.user_id and status <> 'deleted';
    if total = 1 then perform public.grant_achievement(NEW.user_id, 'first_listing', 50); end if;
    if NEW.listing_type = 'rent' then perform public.grant_achievement(NEW.user_id, 'first_rental', 50); end if;
    if coalesce(NEW.fee_percentage,0) >= 10 then perform public.grant_achievement(NEW.user_id, 'bee_hero', 50); end if;
  end if;
  return NEW;
exception when others then return NEW;
end; $$;
drop trigger if exists award_listing_xp on public.listings;
create trigger award_listing_xp after insert or update of status on public.listings
  for each row execute function public.trg_award_listing_xp();

create or replace function public.trg_award_purchase_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare l record; base integer; mult numeric; sale_count integer; buy_count integer;
begin
  if NEW.status = 'completed' and OLD.status is distinct from 'completed'
     and NEW.buyer_id is not null and NEW.seller_id is not null and NEW.buyer_id <> NEW.seller_id
     and not exists (select 1 from public.xp_log where reason in ('sale_completed','rental_completed') and reference_id = NEW.id) then
    select listing_type, coalesce(fee_percentage,5) as fee into l from public.listings where id = NEW.listing_id;
    base := case when l.listing_type = 'rent' then 20 else 25 end;
    mult := case when l.fee >= 10 then 2.5 when l.fee >= 7 then 1.8 when l.fee >= 5 then 1.4 else 1 end;
    perform public.award_xp(NEW.seller_id, round(base * mult)::integer, case when l.listing_type='rent' then 'rental_completed' else 'sale_completed' end, NEW.id);
    select count(*) into sale_count from public.purchases where seller_id = NEW.seller_id and status = 'completed';
    if sale_count = 1 then perform public.grant_achievement(NEW.seller_id, 'first_sale', 100); end if;
    if sale_count >= 10 then perform public.grant_achievement(NEW.seller_id, 'ten_sales', 200); end if;
    if sale_count >= 50 then perform public.grant_achievement(NEW.seller_id, 'fifty_sales', 500); end if;
    perform public.award_xp(NEW.buyer_id, 15, 'purchase_completed', NEW.id);
    select count(*) into buy_count from public.purchases where buyer_id = NEW.buyer_id and status = 'completed';
    if buy_count = 1 then perform public.grant_achievement(NEW.buyer_id, 'first_purchase', 50); end if;
  end if;
  return NEW;
exception when others then return NEW;
end; $$;
drop trigger if exists award_purchase_xp on public.purchases;
create trigger award_purchase_xp after update of status on public.purchases
  for each row execute function public.trg_award_purchase_xp();

create or replace function public.trg_award_rating_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare rcount integer;
begin
  if NEW.rater_id is not null and NEW.rated_id is not null and NEW.rater_id <> NEW.rated_id then
    perform public.award_xp(NEW.rater_id, 10, 'rating_given', NEW.purchase_id);
    if NEW.rating >= 4 then perform public.award_xp(NEW.rated_id, 5, 'rating_received_positive', NEW.purchase_id); end if;
    if NEW.rating = 5 then perform public.grant_achievement(NEW.rated_id, 'five_star_rating', 25); end if;
    select count(*) into rcount from public.ratings where rated_id = NEW.rated_id;
    if rcount >= 10 then perform public.grant_achievement(NEW.rated_id, 'ten_ratings', 100); end if;
  end if;
  return NEW;
exception when others then return NEW;
end; $$;
drop trigger if exists award_rating_xp on public.ratings;
create trigger award_rating_xp after insert on public.ratings
  for each row execute function public.trg_award_rating_xp();

-- WICHTIG: auch von PUBLIC entziehen (create function grantet EXECUTE per Default an PUBLIC).
-- Trigger-interne perform-Aufrufe laufen als Owner (postgres) und bleiben erlaubt.
revoke execute on function public.award_xp(uuid, integer, text, uuid) from public, authenticated, anon;
revoke execute on function public.grant_achievement(uuid, text, integer) from public, authenticated, anon;

alter publication supabase_realtime add table public.xp_log;
