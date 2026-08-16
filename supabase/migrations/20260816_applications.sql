-- Ein-Klick-Bewerbungen (z.B. als Beta-Tester-Rolle). Der Nutzer ist
-- angemeldet, Identitaet ist bekannt - kein Formular noetig.
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  role text not null,
  status text not null default 'neu' check (status in ('neu','erledigt')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.applications enable row level security;

drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own on public.applications
  for insert with check (auth.uid() = user_id);

drop policy if exists applications_select_own_or_staff on public.applications;
create policy applications_select_own_or_staff on public.applications
  for select using (auth.uid() = user_id or public.is_staff(auth.uid()));

drop policy if exists applications_admin_update on public.applications;
create policy applications_admin_update on public.applications
  for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
