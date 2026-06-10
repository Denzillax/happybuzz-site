-- Setzt abgelaufene Boosts auf 'expired'. Anzeige filtert abgelaufene ohnehin
-- clientseitig; diese Funktion ist fuer die saubere DB-Status-Pflege.
-- AUSLOESER: per pg_cron stuendlich planen (manuell zu aktivieren):
--   select cron.schedule('expire-nektar-boosts','0 * * * *', $$select public.expire_nektar_boosts();$$);
create or replace function public.expire_nektar_boosts()
returns integer language sql security definer set search_path = public as $$
  with upd as (
    update public.nektar_redemptions set status = 'expired'
    where status = 'active' and expires_at is not null and expires_at < now()
    returning 1
  ) select coalesce(count(*), 0)::int from upd;
$$;
