-- Community-Impact-Kennzahlen: Impact-Summe + Anzahl geretteter Artikel.
create or replace function public.get_community_impact_stats()
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'impact', coalesce(sum(bee_impact), 0),
    'articles', count(*)
  ) from fee_ledger where status != 'cancelled';
$$;
grant execute on function public.get_community_impact_stats() to anon, authenticated;
