-- Grosse Laufschrift (Ticker): eigenes Element neben dem Header-Banner.
-- Eine Zeile (id=1), Platzierung 'home' (Startseite unter Hero) oder
-- 'global' (alle Seiten unter dem Header). Gleiche Rechte wie der Banner.
create table if not exists public.site_ticker (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  message text not null default '',
  bg_color text not null default '#191615',
  text_color text not null default '#F4C03F',
  placement text not null default 'home' check (placement in ('home', 'global')),
  updated_at timestamptz not null default now()
);
insert into public.site_ticker (id) values (1) on conflict (id) do nothing;
alter table public.site_ticker enable row level security;
drop policy if exists ticker_select on public.site_ticker;
create policy ticker_select on public.site_ticker for select using (true);
drop policy if exists ticker_update on public.site_ticker;
create policy ticker_update on public.site_ticker for update
  using (is_staff(auth.uid())) with check (is_staff(auth.uid()));
