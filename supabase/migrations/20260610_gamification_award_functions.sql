-- Gamification: serverseitige, RLS-sichere XP-Vergabe (auch user-übergreifend).
-- awardXP/grantAchievement laufen clientseitig in RLS-Wände (man darf fremde
-- profiles nicht updaten). Diese SECURITY DEFINER Funktionen kapseln das.

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_achievements_user_key_unique') then
    alter table public.user_achievements
      add constraint user_achievements_user_key_unique unique (user_id, achievement_key);
  end if;
end $$;

create or replace function public.award_xp(p_user_id uuid, p_amount integer, p_reason text, p_reference_id uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
declare new_xp integer; new_level text;
begin
  insert into public.xp_log (user_id, amount, reason, reference_id)
    values (p_user_id, p_amount, p_reason, p_reference_id);
  update public.profiles set xp_total = coalesce(xp_total,0) + p_amount
    where id = p_user_id returning xp_total into new_xp;
  if new_xp is null then return null; end if;
  new_level := case
    when new_xp >= 10000 then 'legend'
    when new_xp >= 2000  then 'queen'
    when new_xp >= 500   then 'hive_builder'
    when new_xp >= 100   then 'busy'
    else 'starter' end;
  update public.profiles set bee_level = new_level where id = p_user_id;
  return new_xp;
end; $$;

create or replace function public.grant_achievement(p_user_id uuid, p_key text, p_xp integer default 0)
returns boolean language plpgsql security definer set search_path = public as $$
declare inserted boolean := false;
begin
  insert into public.user_achievements (user_id, achievement_key)
    values (p_user_id, p_key) on conflict (user_id, achievement_key) do nothing;
  if found then
    inserted := true;
    if p_xp > 0 then perform public.award_xp(p_user_id, p_xp, 'achievement:'||p_key, null); end if;
  end if;
  return inserted;
end; $$;

grant execute on function public.award_xp(uuid, integer, text, uuid) to authenticated, anon;
grant execute on function public.grant_achievement(uuid, text, integer) to authenticated, anon;
