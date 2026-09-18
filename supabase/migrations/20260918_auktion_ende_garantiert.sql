-- Aktive Auktion ohne Enddatum (18.09.2026): Ein aktives Festpreis-Inserat wurde beim
-- Bearbeiten zur Auktion. updateListing setzt auction_end nur, wenn das Formular eines
-- mitgibt, also blieb es leer: keine Restzeit auf der Seite, und die Auktion wäre nie
-- beendet worden. Die Freigabewege (admin_review_listing, Auto-Freigabe) setzen das
-- Ende korrekt, der Bearbeiten-Weg nicht. Darum garantiert es jetzt die Datenbank:
-- Eine aktive Auktion hat immer ein Ende (Auktionsdauer ab jetzt, Standard 7 Tage).
create or replace function public.listings_auktion_ende_garantieren()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.listing_type = 'auction' and new.status = 'active' and new.auction_end is null then
    new.auction_end := now() + make_interval(days => coalesce(nullif(regexp_replace(coalesce(new.auction_duration::text, ''), '\D', '', 'g'), '')::int, 7));
  end if;
  return new;
end $$;

drop trigger if exists trg_listings_auktion_ende on public.listings;
create trigger trg_listings_auktion_ende
  before insert or update on public.listings
  for each row execute function public.listings_auktion_ende_garantieren();

-- Bestand: Ende ab Veröffentlichung rechnen, aber nie in der Vergangenheit
update public.listings
   set auction_end = greatest(
         coalesce(published_at, now()) + make_interval(days => coalesce(nullif(regexp_replace(coalesce(auction_duration::text, ''), '\D', '', 'g'), '')::int, 7)),
         now() + interval '1 day')
 where listing_type = 'auction' and status = 'active' and auction_end is null;
