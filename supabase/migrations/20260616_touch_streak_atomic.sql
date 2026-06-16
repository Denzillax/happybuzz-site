-- Fix: doppelter "Täglicher Streak" beim Login.
-- Ursache: touch_streak las (SELECT) und schrieb (UPDATE) in getrennten Schritten;
-- zwei quasi-gleichzeitige Aufrufe (z.B. doppelt gefeuerter React-Effekt) vergaben beide +5.
-- Fix: Zeilensperre (FOR UPDATE) serialisiert gleichzeitige Aufrufe + bedingter UPDATE,
-- award_xp nur wenn der UPDATE den Tag tatsächlich gesetzt hat -> max. 1x pro Tag.
CREATE OR REPLACE FUNCTION public.touch_streak(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare last_d date; cur integer; lon integer; today date := current_date; me uuid := auth.uid();
begin
  if me is null then return 0; end if;
  select last_active_date, current_streak, longest_streak into last_d, cur, lon
    from public.profiles where id = me for update;
  if last_d = today then return cur; end if;
  if last_d = today - 1 then cur := coalesce(cur,0) + 1; else cur := 1; end if;
  lon := greatest(coalesce(lon,0), cur);
  update public.profiles set current_streak = cur, longest_streak = lon, last_active_date = today
    where id = me and last_active_date is distinct from today;
  if found then
    perform public.award_xp(me, 5, 'daily_streak', null);
  end if;
  return cur;
exception when others then return coalesce(cur, 0);
end; $function$;
