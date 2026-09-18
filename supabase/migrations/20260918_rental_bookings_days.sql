-- Miettage wurden nie gesetzt (Spalten-Default 1): 18.09. bis 21.09. zeigte "1 Tage".
-- Feedback Denis 18.09.2026. Die Datenbank rechnet die Tage jetzt selbst, gleich wie
-- die Preisberechnung auf dem Inserat (Enddatum minus Startdatum, mindestens 1).
create or replace function public.rental_bookings_set_days()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.days := greatest(1, coalesce(new.end_date - new.start_date, 1));
  return new;
end $$;

drop trigger if exists trg_rental_bookings_days on public.rental_bookings;
create trigger trg_rental_bookings_days
  before insert or update of start_date, end_date on public.rental_bookings
  for each row execute function public.rental_bookings_set_days();

-- Bestehende Buchungen nachziehen
update public.rental_bookings
   set days = greatest(1, coalesce(end_date - start_date, 1))
 where days is distinct from greatest(1, coalesce(end_date - start_date, 1));
