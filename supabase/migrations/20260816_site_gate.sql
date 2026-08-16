-- Betriebsmodus der Seite: live (alle) / beta (nur freigegebene Konten) /
-- wartung (nur Staff). Gesteuert im Admin, gelesen vom SiteGate im Layout.
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  mode text not null default 'live' check (mode in ('live','beta','wartung')),
  message text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict do nothing;

alter table public.site_settings enable row level security;
drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings for select using (true);
drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Beta-Freigabe pro Konto. Staff + Owner sind immer freigegeben (Seed),
-- damit sie sich im Beta-/Wartungsmodus nicht selbst aussperren.
alter table public.profiles add column if not exists beta_access boolean not null default false;
update public.profiles set beta_access = true
 where id = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'
    or id in (select user_id from public.staff_roles);
