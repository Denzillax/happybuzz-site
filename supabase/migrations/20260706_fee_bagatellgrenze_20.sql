-- Bagatellgrenze: Verkaeufe unter CHF 20 sind komplett gebuehrenfrei.
-- Der Ledger-Eintrag wird trotzdem geschrieben (Betrag 0), damit Verkaeufer und
-- Admin den Verkauf lueckenlos sehen und die Monatsrechnung vollstaendig bleibt.
-- Grenze muss mit FEE_FREE_BELOW in src/lib/constants.js uebereinstimmen.
create or replace function public.create_fee_ledger_entry()
returns trigger
language plpgsql
security definer
as $function$
declare
  v_listing RECORD;
  v_pct numeric;
  v_fee numeric;
begin
  select title, fee_percentage into v_listing from listings where id = NEW.listing_id;

  v_pct := coalesce(v_listing.fee_percentage, 7);  -- Standard-Bee-Rate: Impact / 7%

  if coalesce(NEW.price, 0) < 20 then              -- Bagatellgrenze CHF 20
    v_fee := 0;
  else
    v_fee := NEW.price * v_pct / 100;
  end if;

  insert into fee_ledger (seller_id, purchase_id, listing_title, sale_price, shipping_cost, fee_percent, fee_amount, bee_impact)
  values (
    NEW.seller_id,
    NEW.id,
    v_listing.title,
    NEW.price,
    coalesce(NEW.shipping_cost, 0),
    v_pct,
    v_fee,
    v_fee * 0.20   -- Bee-Impact: 20% der Gebuehr
  );
  return NEW;
end;
$function$;
