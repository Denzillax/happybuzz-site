-- Bee-Impact app-weit auf EINE kanonische Quelle: bezahlte Gebühren (fee_ledger.status='paid').
-- Behebt: 3 widersprüchliche Quellen + Doppelzählung (recalc zählte Käufer UND Verkäufer).

-- Community-Stats: impact = bezahlt (geflossen), + unterwegs (unbezahlt, nicht storniert),
-- articles = nicht-stornierte Verkäufe (Wiederverwendung zählt unabhängig von der Bezahlung).
CREATE OR REPLACE FUNCTION public.get_community_impact_stats()
 RETURNS json LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select json_build_object(
    'impact',    coalesce(sum(bee_impact) filter (where status = 'paid'), 0),
    'unterwegs', coalesce(sum(bee_impact) filter (where status <> 'paid' and status <> 'cancelled'), 0),
    'articles',  count(*) filter (where status <> 'cancelled')
  ) from public.fee_ledger;
$function$;

-- profiles.bee_impact_total = nur Verkäuferseite + bezahlt (keine Doppelzählung mehr).
CREATE OR REPLACE FUNCTION public.recalc_bee_impact(p_user_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_total decimal;
begin
  select coalesce(sum(bee_impact), 0) into v_total
  from public.fee_ledger where seller_id = p_user_id and status = 'paid';
  update public.profiles set bee_impact_total = v_total where id = p_user_id;
end; $function$;

-- Backfill aller Profile auf die neue Basis.
update public.profiles p set bee_impact_total = coalesce(
  (select sum(bee_impact) from public.fee_ledger where seller_id = p.id and status = 'paid'), 0);
