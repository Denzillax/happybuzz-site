-- Challenges: Vorlagen fuer Wochen-Rotation + Claim-Sperre + Admin-RLS.
alter table public.challenges
  add column if not exists is_template boolean not null default false,
  add column if not exists template_id uuid references public.challenges(id);

-- eine Instanz pro Vorlage und Woche
create unique index if not exists challenges_template_week_key
  on public.challenges (template_id, starts_at) where template_id is not null;

alter table public.user_challenges
  add column if not exists claimed_at timestamptz;

-- Doppel-Auszahlung ausschliessen
create unique index if not exists user_challenges_user_challenge_key
  on public.user_challenges (user_id, challenge_id);

-- Admin darf Challenges schreiben (Lesen ist/bleibt oeffentlich via bestehender Policy)
drop policy if exists challenges_admin_write on public.challenges;
create policy challenges_admin_write on public.challenges
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Seed: die drei bestehenden Wochen-Challenges als Vorlagen duplizieren.
-- Vorlagen sind nie selbst sichtbar (is_template=true), Zeitraum irrelevant.
insert into public.challenges (title, description, type, target_value, target_action, xp_reward, starts_at, ends_at, active, is_template)
select title, description, 'weekly', target_value, target_action, xp_reward, now(), now(), true, true
from public.challenges
where is_template = false and type = 'weekly'
  and title in ('Fleissige Biene', 'Deal-Maker', 'Glanzleistung')
  and not exists (select 1 from public.challenges t where t.is_template = true and t.title = public.challenges.title);
