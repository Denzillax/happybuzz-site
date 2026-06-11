-- ════════════════════════════════════════════════════════════
-- Währungs-System v2: Blüten (Transaktions-Punkte)
-- Trichter: Transaktion -> Blüten -> (manuell 100:1) -> Pollen -> Level -> Nektar
-- Interaktion -> Pollen direkt.
-- ════════════════════════════════════════════════════════════

-- 1. Blüten-Guthaben + Log
alter table public.profiles add column if not exists blueten integer not null default 0;

create table if not exists public.blueten_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  reference_id uuid,
  balance_after integer not null,
  created_at timestamptz not null default now()
);
alter table public.blueten_log enable row level security;
drop policy if exists blueten_log_select_own on public.blueten_log;
create policy blueten_log_select_own on public.blueten_log for select using (auth.uid() = user_id);

-- 2. award_blueten (nur serverseitig via Trigger/RPC)
create or replace function public.award_blueten(p_user_id uuid, p_amount integer, p_reason text, p_reference_id uuid default null)
returns integer language plpgsql security definer set search_path to 'public' as $function$
declare new_bal integer;
begin
  update public.profiles set blueten = greatest(0, coalesce(blueten,0) + p_amount)
    where id = p_user_id returning blueten into new_bal;
  if new_bal is null then return null; end if;
  insert into public.blueten_log (user_id, amount, reason, reference_id, balance_after)
    values (p_user_id, p_amount, p_reason, p_reference_id, new_bal);
  return new_bal;
end; $function$;
revoke all on function public.award_blueten(uuid,integer,text,uuid) from public, anon, authenticated;

-- 3. convert_blueten_to_pollen (manuell vom User; 100 Blüten = 1 Pollen)
create or replace function public.convert_blueten_to_pollen(p_amount integer)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare uid uuid; bal integer; pollen_gain integer; new_blueten integer; new_xp integer;
begin
  uid := auth.uid();
  if uid is null then return json_build_object('ok', false, 'error', 'auth'); end if;
  if p_amount is null or p_amount < 100 or (p_amount % 100) <> 0 then
    return json_build_object('ok', false, 'error', 'amount'); end if;
  select coalesce(blueten,0) into bal from public.profiles where id = uid for update;
  if bal < p_amount then return json_build_object('ok', false, 'error', 'insufficient', 'blueten', bal); end if;
  pollen_gain := p_amount / 100;
  update public.profiles set blueten = blueten - p_amount where id = uid returning blueten into new_blueten;
  insert into public.blueten_log (user_id, amount, reason, reference_id, balance_after)
    values (uid, -p_amount, 'converted_to_pollen', null, new_blueten);
  new_xp := public.award_xp(uid, pollen_gain, 'blueten_converted', null);
  return json_build_object('ok', true, 'blueten', new_blueten, 'pollen_gained', pollen_gain, 'xp_total', new_xp);
end; $function$;
revoke all on function public.convert_blueten_to_pollen(integer) from public, anon;
grant execute on function public.convert_blueten_to_pollen(integer) to authenticated;

-- 4. Transaktion vergibt Blüten (Käufer + Verkäufer) statt Pollen-Drip.
--    Achievements/Nektar-Boni bleiben (Meilensteine, nicht Routine).
create or replace function public.trg_award_purchase_xp()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare l record; sale_count integer; buy_count integer; impact_blueten integer;
begin
  if NEW.status = 'completed' and OLD.status is distinct from 'completed'
     and NEW.buyer_id is not null and NEW.seller_id is not null and NEW.buyer_id <> NEW.seller_id
     and not exists (select 1 from public.blueten_log where reason = 'transaction' and reference_id = NEW.id) then
    select listing_type, coalesce(fee_percentage,5) as fee into l from public.listings where id = NEW.listing_id;
    -- Blüten = Bee-Impact-CHF × 100, an beide Seiten (Transaktions-Belohnung)
    impact_blueten := round(coalesce(NEW.bee_impact, 0) * 100)::integer;
    if impact_blueten > 0 then
      perform public.award_blueten(NEW.seller_id, impact_blueten, 'transaction', NEW.id);
      perform public.award_blueten(NEW.buyer_id, impact_blueten, 'transaction', NEW.id);
    end if;
    -- Nektar: Bee-Rate-Bonus pro Verkauf (bleibt)
    if l.fee >= 10 then perform public.award_nektar(NEW.seller_id, 5, 'bee_rate_bonus', NEW.id);
    elsif l.fee >= 7 then perform public.award_nektar(NEW.seller_id, 3, 'bee_rate_bonus', NEW.id); end if;
    -- Verkaufs-Achievements (Pollen-Meilensteine, bleiben)
    select count(*) into sale_count from public.purchases where seller_id = NEW.seller_id and status = 'completed';
    if sale_count = 1 then perform public.grant_achievement(NEW.seller_id, 'first_sale', 100); end if;
    if sale_count >= 10 then perform public.grant_achievement(NEW.seller_id, 'ten_sales', 200); end if;
    if sale_count >= 50 then perform public.grant_achievement(NEW.seller_id, 'fifty_sales', 500); end if;
    if sale_count = 10 then perform public.award_nektar(NEW.seller_id, 20, 'sales_milestone_10', NEW.id);
    elsif sale_count = 25 then perform public.award_nektar(NEW.seller_id, 50, 'sales_milestone_25', NEW.id);
    elsif sale_count = 50 then perform public.award_nektar(NEW.seller_id, 100, 'sales_milestone_50', NEW.id); end if;
    -- Käufer-Achievement (Pollen)
    select count(*) into buy_count from public.purchases where buyer_id = NEW.buyer_id and status = 'completed';
    if buy_count = 1 then perform public.grant_achievement(NEW.buyer_id, 'first_purchase', 50); end if;
  end if;
  return NEW;
exception when others then return NEW;
end; $function$;

-- 5. Level-Konflikt auflösen: recalc_bee_impact setzt NICHT mehr bee_level
--    (bee_level kommt jetzt ausschliesslich aus award_xp / Pollen).
create or replace function public.recalc_bee_impact(p_user_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare v_total decimal;
begin
  select coalesce(sum(bee_impact),0) into v_total
  from public.purchases where buyer_id = p_user_id or seller_id = p_user_id;
  update public.profiles set bee_impact_total = v_total where id = p_user_id;
end; $function$;

-- 6. Bestandsdaten: bisheriges bee_impact_total (CHF) als Start-Blüten ×100
update public.profiles set blueten = round(coalesce(bee_impact_total,0) * 100)::integer
  where coalesce(bee_impact_total,0) > 0;

-- 7. bee_level konsistent aus xp_total neu setzen (award_xp-Schwellen)
update public.profiles set bee_level = case
  when coalesce(xp_total,0) >= 5000 then 'legend'
  when coalesce(xp_total,0) >= 2000 then 'queen'
  when coalesce(xp_total,0) >= 500  then 'hive_builder'
  when coalesce(xp_total,0) >= 100  then 'busy'
  else 'starter' end;
