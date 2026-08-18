-- 19.08.2026: Besuchs-Log fuer die Admin-Analytik
-- (live eingespielt via MCP apply_migration "page_visits_log")
-- Jeder Seitenaufruf (eingeloggt mit user_id, Gaeste anonym).
-- Nur Staff darf lesen; Eintraege verfallen nach 90 Tagen (Cron 03:45).
create table if not exists public.page_visits (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  path text not null,
  created_at timestamptz not null default now()
);
create index if not exists page_visits_created_idx on public.page_visits (created_at desc);

alter table public.page_visits enable row level security;
create policy page_visits_insert on public.page_visits
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy page_visits_select_staff on public.page_visits
  for select to authenticated
  using (public.is_staff(auth.uid()));

do $$ begin
  if not exists (select 1 from cron.job where jobname = 'purge-page-visits') then
    perform cron.schedule('purge-page-visits', '45 3 * * *',
      'delete from public.page_visits where created_at < now() - interval ''90 days''');
  end if;
end $$;
