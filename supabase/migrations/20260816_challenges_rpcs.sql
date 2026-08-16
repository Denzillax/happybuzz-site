-- Wochen-Rotation: der erste Aufrufer der Woche instanziert alle aktiven
-- Vorlagen. Idempotent ueber den Unique-Index (template_id, starts_at).
-- Achtung: der Index ist PARTIELL, darum muss ON CONFLICT das Praedikat
-- (where template_id is not null) mitfuehren, sonst 42P10.
create or replace function public.ensure_weekly_challenges()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_monday timestamptz;
  v_created integer := 0;
  t record;
begin
  -- Montag 00:00 Europe/Zurich der laufenden Woche
  v_monday := date_trunc('week', (now() at time zone 'Europe/Zurich'))::timestamp
              at time zone 'Europe/Zurich';

  for t in select * from challenges where is_template and active loop
    insert into challenges (title, description, type, target_value, target_action,
                            xp_reward, starts_at, ends_at, active, is_template, template_id)
    values (t.title, t.description, 'weekly', t.target_value, t.target_action,
            t.xp_reward, v_monday, v_monday + interval '7 days' - interval '1 second',
            true, false, t.id)
    on conflict (template_id, starts_at) where template_id is not null do nothing;
    if found then v_created := v_created + 1; end if;
  end loop;
  return v_created;
end $$;

-- Claim: prueft den Fortschritt SERVERSEITIG nach, zahlt genau einmal aus
-- (Unique user_challenges), vergibt Pollen ueber den kanonischen Weg award_xp
-- und legt die Benachrichtigung an. Nachtraeglich einloesen: bis 7 Tage nach ends_at.
create or replace function public.claim_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  v_user uuid := auth.uid();
  v_progress integer := 0;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'reason', 'not_authenticated'); end if;

  select * into c from challenges
   where id = p_challenge_id and active and not is_template
     and starts_at <= now() and now() <= ends_at + interval '7 days';
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_claimable'); end if;

  if c.target_action = 'listing_created' then
    select count(*) into v_progress from listings
     where user_id = v_user and status <> 'deleted' and created_at >= c.starts_at;
  elsif c.target_action = 'sale_completed' then
    select count(*) into v_progress from purchases
     where seller_id = v_user and status = 'completed' and created_at >= c.starts_at;
  elsif c.target_action = 'five_star' then
    select count(*) into v_progress from ratings
     where rated_id = v_user and rating = 5 and created_at >= c.starts_at;
  else
    return jsonb_build_object('ok', false, 'reason', 'unknown_action');
  end if;

  if v_progress < c.target_value then
    return jsonb_build_object('ok', false, 'reason', 'incomplete', 'progress', v_progress);
  end if;

  insert into user_challenges (user_id, challenge_id, progress, completed, completed_at, claimed_at)
  values (v_user, p_challenge_id, v_progress, true, now(), now())
  on conflict (user_id, challenge_id) do nothing;
  if not found then return jsonb_build_object('ok', false, 'reason', 'already_claimed'); end if;

  if c.xp_reward > 0 then
    perform public.award_xp(v_user, c.xp_reward, 'challenge:' || c.title, c.id);
  end if;

  insert into notifications (user_id, type, title, message, link, is_read)
  values (v_user, 'gamification', 'Challenge geschafft',
          c.title || ': +' || c.xp_reward || ' Pollen', '/hive', false);

  return jsonb_build_object('ok', true, 'amount', c.xp_reward);
end $$;
