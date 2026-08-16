-- Bewerben v3: Absage-Status + nur eine offene Bewerbung pro Person.
-- 'abgesagt' setzt der Owner; die Zeile bleibt (gleiche Stelle nicht nochmal),
-- der One-Open-Index gibt den Platz fuer eine ANDERE Stelle frei.
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('neu','erledigt','abgesagt'));

create unique index if not exists applications_one_open
  on public.applications (user_id) where status = 'neu';
