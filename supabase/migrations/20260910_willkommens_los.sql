-- 10.09.2026 (Beta-Feedback Tacocat 08.09.): "Gewinnspiel bei Anmeldung" -
-- umgesetzt als Willkommens-Los mit virtuellen Pollen (Tacocats eigene
-- Alternative), damit kein rechtliches Gewinnspiel mit Sachpreisen entsteht.
--
-- Wer sein ERSTES Inserat einreicht, zieht einmalig ein Los: 10 bis 100
-- Pollen in 5er-Schritten. Serverseitig und idempotent, damit der Betrag
-- nicht vom Client bestimmt werden kann und niemand doppelt zieht.
create or replace function welcome_los()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_amount int;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;
  if exists (select 1 from xp_log where user_id = v_user and reason = 'welcome_los') then
    return jsonb_build_object('ok', false, 'error', 'already');
  end if;
  if not exists (select 1 from listings where user_id = v_user and status <> 'deleted') then
    return jsonb_build_object('ok', false, 'error', 'no_listing');
  end if;
  v_amount := (2 + floor(random() * 19))::int * 5;  -- 10..100
  insert into xp_log (user_id, amount, reason) values (v_user, v_amount, 'welcome_los');
  update profiles set xp_total = coalesce(xp_total, 0) + v_amount where id = v_user;
  insert into notifications (user_id, type, title, message, link, is_read)
  values (v_user, 'gamification', 'Willkommens-Los gezogen',
    'Dein erstes Inserat ist ein Treffer: +' || v_amount || ' Pollen für dein Bee-Level.',
    '/hive', false);
  return jsonb_build_object('ok', true, 'amount', v_amount);
end $$;

revoke all on function welcome_los() from public;
grant execute on function welcome_los() to authenticated;
