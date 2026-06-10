-- Usertyp Privat / Unternehmen
-- Fügt account_type + Firmenfelder zu profiles hinzu.
-- Idempotent: kann gefahrlos erneut ausgeführt werden.

alter table public.profiles
  add column if not exists account_type text not null default 'private',
  add column if not exists company_name text,
  add column if not exists company_uid text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_type_check
      check (account_type in ('private', 'business'));
  end if;
end $$;
