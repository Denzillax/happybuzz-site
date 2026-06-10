-- pg_cron aktivieren und expire_nektar_boosts() stuendlich planen.
-- (cron.schedule ist idempotent ueber den Jobnamen.)
create extension if not exists pg_cron;
grant usage on schema cron to postgres;

select cron.schedule('expire-nektar-boosts', '0 * * * *', $$select public.expire_nektar_boosts();$$);
