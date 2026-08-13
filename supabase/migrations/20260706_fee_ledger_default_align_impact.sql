-- create_fee_ledger_entry ist der autoritative Pfad, der dem Verkaeufer die Gebuehr
-- verrechnet. Er hatte COALESCE(fee_percentage, 5) dreimal hartkodiert, waehrend die
-- Standard-Bee-Rate 7% (Tier impact) ist. Bei einem Inserat ohne Satz haette er also
-- zu wenig verrechnet und einen zu kleinen Bee-Impact gebucht.
-- Fallback zeigt jetzt auf denselben Wert wie listings.fee_percentage DEFAULT
-- und DEFAULT_FEE_PERCENT in src/lib/constants.js.
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
  v_fee := NEW.price * v_pct / 100;

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
