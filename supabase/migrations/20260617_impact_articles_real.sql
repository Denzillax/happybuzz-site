-- "Artikel gerettet" zählt nur echte Verkaufspositionen — die zur Daten-Reparatur
-- ergänzten Sammelpositionen ("Sammelposition (Altbestand)") sind keine geretteten
-- Artikel und werden aus der Zählung ausgenommen. impact/unterwegs unverändert.
CREATE OR REPLACE FUNCTION public.get_community_impact_stats()
 RETURNS json LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select json_build_object(
    'impact',    coalesce(sum(bee_impact) filter (where status = 'paid'), 0),
    'unterwegs', coalesce(sum(bee_impact) filter (where status <> 'paid' and status <> 'cancelled'), 0),
    'articles',  count(*) filter (where status <> 'cancelled' and coalesce(listing_title, '') <> 'Sammelposition (Altbestand)')
  ) from public.fee_ledger;
$function$;
