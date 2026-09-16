-- 16.09.2026 (Beta-Feedback Denis): Zwei Luecken beim Pausieren.
-- 1) Inserate, die wegen Mahnstufe 3 pausiert wurden, konnte der Verkaeufer
--    unter "Meine Inserate" einfach wieder aktivieren.
-- 2) Auktionen mit Geboten liessen sich pausieren (Bieter haengen in der Luft).
-- Beides serverseitig per Trigger, unabhaengig vom Client. Staff und
-- Systemaufrufe (auth.uid() null, z.B. reactivate_seller_listings via Admin)
-- bleiben frei.
create or replace function public.guard_listing_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or coalesce(public.is_staff(v_uid), false) then return new; end if;
  if new.status is distinct from old.status then
    -- Reaktivieren gesperrt, solange eine Mahn-Pause offen ist
    if new.status = 'active' and old.status in ('paused', 'pending_pause')
       and exists (select 1 from fee_invoices f where f.seller_id = new.user_id and f.listings_paused = true and f.status = 'overdue') then
      raise exception 'Deine Inserate sind wegen einer offenen Gebührenrechnung pausiert. Bitte zuerst begleichen.';
    end if;
    -- Auktionen mit Geboten koennen nicht pausiert werden
    if new.status = 'paused' and old.status = 'active' and old.listing_type = 'auction'
       and exists (select 1 from bids b where b.listing_id = old.id) then
      raise exception 'Auktionen mit Geboten können nicht pausiert werden.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_listing_status on listings;
create trigger trg_guard_listing_status
  before update of status on listings
  for each row execute function public.guard_listing_status_change();
