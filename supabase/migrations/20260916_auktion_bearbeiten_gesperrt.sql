-- 16.09.2026 (Denis): Auktionen mit Geboten liessen sich frei bearbeiten
-- (Titel, Preise, Typ, Kategorie, Fotos). Bieter haben aber auf genau dieses
-- Angebot geboten. Ab dem ersten Gebot sind die Kernfelder eingefroren,
-- die Beschreibung darf nur ergaenzt werden (Nachtrag am Ende, Original
-- bleibt), Fotos duerfen dazukommen, aber nicht entfernt werden.
-- Staff und Systemaufrufe (auth.uid() null, Cron, RPCs mit eigener Logik
-- wie place_bid/finalize) bleiben frei; die laufen ohne Nutzer-JWT oder
-- aendern nur Spalten, die hier nicht gesperrt sind (auction_end, price, status).

create or replace function public.guard_auction_edit_with_bids()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  -- Staff nur bei FREMDEN Inseraten frei (Admin-Eingriff); die eigene Auktion mit Geboten ist auch fuer Staff gesperrt
  if v_uid is null or (coalesce(public.is_staff(v_uid), false) and v_uid <> old.user_id) then return new; end if;
  if old.listing_type <> 'auction' then return new; end if;
  if not exists (select 1 from bids b where b.listing_id = old.id) then return new; end if;

  if new.title is distinct from old.title
     or new.listing_type is distinct from old.listing_type
     or new.category_id is distinct from old.category_id
     or new.condition is distinct from old.condition
     or new.start_price is distinct from old.start_price
     or new.buy_now_price is distinct from old.buy_now_price
     or new.min_price is distinct from old.min_price
     or new.bid_step is distinct from old.bid_step
     or new.auction_duration is distinct from old.auction_duration then
    raise exception 'Diese Auktion hat Gebote. Titel, Preise, Typ, Kategorie und Zustand sind gesperrt.';
  end if;
  -- Beschreibung: nur anhaengen, der bisherige Text muss unveraendert vorne stehen
  if new.description is distinct from old.description
     and (new.description is null or old.description is null or position(old.description in new.description) <> 1) then
    raise exception 'Diese Auktion hat Gebote. Die Beschreibung kann nur ergänzt werden.';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_auction_edit on listings;
create trigger trg_guard_auction_edit
  before update on listings
  for each row execute function public.guard_auction_edit_with_bids();

-- Fotos: bei Auktionen mit Geboten kein Loeschen
create or replace function public.guard_auction_image_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_owner uuid; v_typ text;
begin
  select user_id, listing_type into v_owner, v_typ from listings where id = old.listing_id;
  if v_uid is null or (coalesce(public.is_staff(v_uid), false) and v_uid <> v_owner) then return old; end if;
  if v_typ = 'auction' and exists (select 1 from bids b where b.listing_id = old.listing_id) then
    raise exception 'Diese Auktion hat Gebote. Fotos können nicht entfernt werden.';
  end if;
  return old;
end $$;

drop trigger if exists trg_guard_auction_image_delete on listing_images;
create trigger trg_guard_auction_image_delete
  before delete on listing_images
  for each row execute function public.guard_auction_image_delete();
