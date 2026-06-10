-- Streaks + Wochen-Challenges für die Gamification.
-- Hinweis: touch_streak wird in 20260610_gamification_hardening_triggers.sql
-- später auf auth.uid() verschärft (spätere Migration gewinnt).

alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists last_active_date date;

create or replace function public.touch_streak(p_user_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare last_d date; cur integer; lon integer; today date := current_date;
begin
  select last_active_date, current_streak, longest_streak into last_d, cur, lon from public.profiles where id = p_user_id;
  if last_d = today then return cur; end if;
  if last_d = today - 1 then cur := coalesce(cur,0) + 1; else cur := 1; end if;
  lon := greatest(coalesce(lon,0), cur);
  update public.profiles set current_streak = cur, longest_streak = lon, last_active_date = today where id = p_user_id;
  perform public.award_xp(p_user_id, 5, 'daily_streak', null);
  return cur;
end; $$;
grant execute on function public.touch_streak(uuid) to authenticated;

-- laufende Wochen-Challenges (einmalig pro Woche)
insert into public.challenges (title, description, type, target_value, target_action, xp_reward, starts_at, ends_at, active)
select * from (values
 ('Fleissige Biene', '3 Inserate diese Woche erstellen', 'weekly', 3, 'listing_created', 50, date_trunc('week', now()), date_trunc('week', now()) + interval '7 days', true),
 ('Deal-Maker', '1 Verkauf diese Woche abschliessen', 'weekly', 1, 'sale_completed', 75, date_trunc('week', now()), date_trunc('week', now()) + interval '7 days', true),
 ('Glanzleistung', 'Eine 5-Sterne-Bewertung erhalten', 'weekly', 1, 'five_star', 40, date_trunc('week', now()), date_trunc('week', now()) + interval '7 days', true)
) as v(title, description, type, target_value, target_action, xp_reward, starts_at, ends_at, active)
where not exists (select 1 from public.challenges where type = 'weekly' and starts_at = date_trunc('week', now()));
