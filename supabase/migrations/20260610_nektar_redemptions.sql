-- Nektar einloesen: Belohnungs-Buchungen + atomare Einloese-RPC.
create table if not exists public.nektar_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_type text not null,
  nektar_spent integer not null,
  listing_id uuid references public.listings(id) on delete set null,
  expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists nektar_redemptions_user_idx on public.nektar_redemptions (user_id, status, created_at desc);
create index if not exists nektar_redemptions_listing_idx on public.nektar_redemptions (listing_id, status);

alter table public.nektar_redemptions enable row level security;
drop policy if exists nektar_redemptions_select_own on public.nektar_redemptions;
create policy nektar_redemptions_select_own on public.nektar_redemptions for select using (auth.uid() = user_id);
drop policy if exists nektar_redemptions_select_active on public.nektar_redemptions;
create policy nektar_redemptions_select_active on public.nektar_redemptions for select using (status = 'active' and listing_id is not null);
grant select on public.nektar_redemptions to anon, authenticated;

create or replace function public.redeem_nektar(p_reward text, p_cost integer, p_listing_id uuid default null, p_duration_hours integer default 0)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); new_bal integer; rid uuid; exp timestamptz;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'auth'); end if;
  if coalesce(p_cost,0) <= 0 then return json_build_object('ok', false, 'error', 'cost'); end if;
  update public.profiles set nektar = nektar - p_cost
    where id = uid and nektar >= p_cost returning nektar into new_bal;
  if new_bal is null then return json_build_object('ok', false, 'error', 'insufficient'); end if;
  if coalesce(p_duration_hours,0) > 0 then exp := now() + (p_duration_hours || ' hours')::interval; end if;
  insert into public.nektar_redemptions (user_id, reward_type, nektar_spent, listing_id, expires_at)
    values (uid, p_reward, p_cost, p_listing_id, exp) returning id into rid;
  insert into public.nektar_log (user_id, amount, reason, reference_id, balance_after)
    values (uid, -p_cost, 'redeemed_'||p_reward, rid, new_bal);
  return json_build_object('ok', true, 'new_balance', new_bal, 'redemption_id', rid);
end; $$;
grant execute on function public.redeem_nektar(text, integer, uuid, integer) to authenticated;
