-- Firmeninfo / Platform-Creditor: Singleton mit Firmendaten für die FEE-QR-Rechnungen.
create table if not exists public.company_settings (
  id int primary key default 1,
  name text not null default 'BEEDARO',
  street text not null default '',
  postal_code text not null default '',
  city text not null default '',
  country text not null default 'CH',
  iban text not null default '',
  uid text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id = 1)
);
alter table public.company_settings enable row level security;
drop policy if exists company_settings_read on public.company_settings;
drop policy if exists company_settings_admin_write on public.company_settings;
create policy company_settings_read on public.company_settings for select using (true);
create policy company_settings_admin_write on public.company_settings for all
  using (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid)
  with check (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid);
insert into public.company_settings (id, name, street, postal_code, city, iban)
  values (1, 'BEEDARO', 'Gemeindehausstrasse 11B', '6010', 'Kriens', 'CH1234567890123456789')
  on conflict (id) do nothing;
