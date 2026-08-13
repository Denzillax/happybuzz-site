-- Gebuehren-Ranking: die Bee-Rate wirkt wie ein Frischevorsprung.
-- Ein Inserat wird sortiert, als waere es um X Tage neuer erstellt worden.
-- Bewusst KEINE harte Rangfolge (vorher: rein nach fee_percentage DESC), sonst
-- steht jedes 10%-Inserat dauerhaft vor jedem frischen 3%-Inserat und der
-- Fair-Tarif wird wertlos.
--   3% -> +0 Tage · 5% -> +3 Tage · 7% -> +7 Tage · 10% -> +14 Tage
-- Muss mit FEE_RANK_BONUS_DAYS in src/lib/constants.js uebereinstimmen.
--
-- timezone('UTC', created_at) ist IMMUTABLE (im Gegensatz zu timestamptz +
-- interval, das wegen der TimeZone-Einstellung nur STABLE ist) und darum in
-- einer generierten Spalte zulaessig.
alter table public.listings
  add column if not exists rank_at timestamp
  generated always as (
    timezone('UTC', created_at) + (
      case
        when fee_percentage >= 10 then interval '14 days'
        when fee_percentage >= 7  then interval '7 days'
        when fee_percentage >= 5  then interval '3 days'
        else interval '0 days'
      end
    )
  ) stored;

create index if not exists listings_rank_at_idx on public.listings (rank_at desc);
