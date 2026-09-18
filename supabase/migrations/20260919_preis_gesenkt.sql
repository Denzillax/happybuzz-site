-- "Preis gesenkt" (Denis 19.09.2026, Idee von marko.ch): Senkt ein Verkäufer den
-- Festpreis eines aktiven Inserats, merkt sich die Datenbank den früheren Preis.
-- Karte und Inseratseite zeigen ihn durchgestrichen mit Prozentangabe.
-- Regeln:
--  * nur Festpreis (listing_type = 'sell'), Auktionen und Miete sind ausgenommen
--  * price_before hält den HÖCHSTEN früheren Preis seit der letzten Erhöhung,
--    mehrere Senkungen hintereinander zeigen also die ganze Ersparnis
--  * steigt der Preis wieder auf oder über diesen Wert, wird price_before gelöscht
--  * kein Trick möglich: Wer den Preis erst hochsetzt und dann senkt, löscht mit dem
--    Hochsetzen den alten Vergleichswert. Als Vergleich zählt danach der hohe Preis,
--    aber erst, wenn er mindestens 24 Stunden gestanden hat (price_changed_at).
alter table public.listings add column if not exists price_before numeric;
alter table public.listings add column if not exists price_changed_at timestamptz;

create or replace function public.listings_preis_gesenkt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.listing_type <> 'sell' or new.price is null then
    new.price_before := null;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.price is distinct from old.price and old.price is not null then
    if new.price < old.price then
      -- Senkung: alten Vergleichswert behalten, sonst den bisherigen Preis nehmen,
      -- sofern der mindestens 24 Stunden gestanden hat
      if old.price_before is not null and old.price_before > new.price then
        new.price_before := old.price_before;
      elsif coalesce(old.price_changed_at, old.created_at) <= now() - interval '24 hours' then
        new.price_before := old.price;
      else
        new.price_before := null;
      end if;
    else
      -- Erhöhung: Vergleichswert verfällt
      new.price_before := null;
    end if;
    new.price_changed_at := now();
  elsif tg_op = 'UPDATE' then
    -- Preis unverändert: die beiden Spalten gehören dem Trigger, Schreibversuche
    -- vom Client (erfundener Rabatt) werden verworfen
    new.price_before := old.price_before;
    new.price_changed_at := old.price_changed_at;
  else
    new.price_before := null; -- neues Inserat startet ohne Vergleichspreis
  end if;
  return new;
end $$;

drop trigger if exists trg_listings_preis_gesenkt on public.listings;
create trigger trg_listings_preis_gesenkt
  before insert or update on public.listings
  for each row execute function public.listings_preis_gesenkt();
