-- Pollen: Legende-Schwelle von 10000 auf 5000 (lt. Pollen-Spec). Keys unveraendert.
-- award_xp berechnet profiles.bee_level serverseitig -> Schwelle hier nachziehen.
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
    when new_xp >= 5000  then 'legend'
    when new_xp >= 2000  then 'queen'
    when new_xp >= 500   then 'hive_builder'
    when new_xp >= 100   then 'busy'
    else 'starter' end;
  update public.profiles set bee_level = new_level where id = p_user_id;
  return new_xp;
end; $$;
