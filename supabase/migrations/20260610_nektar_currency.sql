-- NEKTAR: zweite Waehrung (einloesbare Belohnung), verdient bei Meilensteinen.
-- Serverseitig per Trigger/RPC vergeben. Speicher: profiles.nektar + nektar_log.
-- award_nektar ist client-gesperrt (nur Trigger/Owner). Negative Betraege = Einloesen
-- (Floor bei 0). Trigger spiegeln die bestehende, gehaertete Pollen-/XP-Logik.

alter table public.profiles add column if not exists nektar integer not null default 0;

create table if not exists public.nektar_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  reference_id uuid,
  balance_after integer not null,
  created_at timestamptz not null default now()
);
create index if not exists nektar_log_user_idx on public.nektar_log (user_id, created_at desc);

alter table public.nektar_log enable row level security;
drop policy if exists nektar_log_select_own on public.nektar_log;
create policy nektar_log_select_own on public.nektar_log for select using (auth.uid() = user_id);

create or replace function public.award_nektar(p_user_id uuid, p_amount integer, p_reason text, p_reference_id uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
declare new_bal integer;
begin
  update public.profiles set nektar = greatest(0, coalesce(nektar,0) + p_amount)
    where id = p_user_id returning nektar into new_bal;
  if new_bal is null then return null; end if;
  insert into public.nektar_log (user_id, amount, reason, reference_id, balance_after)
    values (p_user_id, p_amount, p_reason, p_reference_id, new_bal);
  return new_bal;
end; $$;
revoke execute on function public.award_nektar(uuid, integer, text, uuid) from public, authenticated, anon;

-- award_xp erweitern: +25 Nektar bei echtem Level-Aufstieg (Schwelle ueberschritten).
create or replace function public.award_xp(p_user_id uuid, p_amount integer, p_reason text, p_reference_id uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
declare new_xp integer; old_xp integer; new_level text; old_rank int; new_rank int;
begin
  insert into public.xp_log (user_id, amount, reason, reference_id)
    values (p_user_id, p_amount, p_reason, p_reference_id);
  update public.profiles set xp_total = coalesce(xp_total,0) + p_amount
    where id = p_user_id returning xp_total into new_xp;
  if new_xp is null then return null; end if;
  old_xp := new_xp - p_amount;
  new_level := case
    when new_xp >= 5000  then 'legend'
    when new_xp >= 2000  then 'queen'
    when new_xp >= 500   then 'hive_builder'
    when new_xp >= 100   then 'busy'
    else 'starter' end;
  update public.profiles set bee_level = new_level where id = p_user_id;
  old_rank := case when old_xp >= 5000 then 5 when old_xp >= 2000 then 4 when old_xp >= 500 then 3 when old_xp >= 100 then 2 else 1 end;
  new_rank := case when new_xp >= 5000 then 5 when new_xp >= 2000 then 4 when new_xp >= 500 then 3 when new_xp >= 100 then 2 else 1 end;
  if new_rank > old_rank and p_amount > 0 then
    perform public.award_nektar(p_user_id, 25, 'level_up', null);
  end if;
  return new_xp;
end; $$;

-- Verkaufs-Trigger erweitern: Nektar fuer Bee-Rate-Bonus + Verkaufs-Meilensteine.
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
    if l.fee >= 10 then perform public.award_nektar(NEW.seller_id, 5, 'bee_rate_bonus', NEW.id);
    elsif l.fee >= 7 then perform public.award_nektar(NEW.seller_id, 3, 'bee_rate_bonus', NEW.id); end if;
    select count(*) into sale_count from public.purchases where seller_id = NEW.seller_id and status = 'completed';
    if sale_count = 1 then perform public.grant_achievement(NEW.seller_id, 'first_sale', 100); end if;
    if sale_count >= 10 then perform public.grant_achievement(NEW.seller_id, 'ten_sales', 200); end if;
    if sale_count >= 50 then perform public.grant_achievement(NEW.seller_id, 'fifty_sales', 500); end if;
    if sale_count = 10 then perform public.award_nektar(NEW.seller_id, 20, 'sales_milestone_10', NEW.id);
    elsif sale_count = 25 then perform public.award_nektar(NEW.seller_id, 50, 'sales_milestone_25', NEW.id);
    elsif sale_count = 50 then perform public.award_nektar(NEW.seller_id, 100, 'sales_milestone_50', NEW.id); end if;
    perform public.award_xp(NEW.buyer_id, 15, 'purchase_completed', NEW.id);
    select count(*) into buy_count from public.purchases where buyer_id = NEW.buyer_id and status = 'completed';
    if buy_count = 1 then perform public.grant_achievement(NEW.buyer_id, 'first_purchase', 50); end if;
  end if;
  return NEW;
exception when others then return NEW;
end; $$;

-- Bewertungs-Trigger erweitern: 5-Sterne erhalten -> +5 Nektar.
create or replace function public.trg_award_rating_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare rcount integer;
begin
  if NEW.rater_id is not null and NEW.rated_id is not null and NEW.rater_id <> NEW.rated_id then
    perform public.award_xp(NEW.rater_id, 10, 'rating_given', NEW.purchase_id);
    if NEW.rating >= 4 then perform public.award_xp(NEW.rated_id, 5, 'rating_received_positive', NEW.purchase_id); end if;
    if NEW.rating = 5 then
      perform public.grant_achievement(NEW.rated_id, 'five_star_rating', 25);
      perform public.award_nektar(NEW.rated_id, 5, 'five_star_nektar', NEW.purchase_id);
    end if;
    select count(*) into rcount from public.ratings where rated_id = NEW.rated_id;
    if rcount >= 10 then perform public.grant_achievement(NEW.rated_id, 'ten_ratings', 100); end if;
  end if;
  return NEW;
exception when others then return NEW;
end; $$;

alter publication supabase_realtime add table public.nektar_log;
