-- Laufzeit: Inserate laufen befristet. Auktion = auction_end bzw. Dauer,
-- alle anderen Typen = 60 Tage ab Veroeffentlichung. Wird serverseitig beim
-- Statuswechsel auf 'active' gesetzt (nur wenn noch leer -> Edits setzen nicht zurueck).
alter table public.listings add column if not exists expires_at timestamptz;

create or replace function public.trg_set_listing_expiry()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'active' and NEW.expires_at is null then
    if NEW.listing_type = 'auction' then
      NEW.expires_at := coalesce(
        NEW.auction_end,
        now() + ((coalesce(nullif(NEW.auction_duration::text, ''), '7'))::int || ' days')::interval
      );
    else
      NEW.expires_at := now() + interval '60 days';
    end if;
  end if;
  return NEW;
end; $$;

drop trigger if exists set_listing_expiry on public.listings;
create trigger set_listing_expiry
  before insert or update on public.listings
  for each row execute function public.trg_set_listing_expiry();
