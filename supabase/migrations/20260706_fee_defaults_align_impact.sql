-- Standard-Bee-Rate vereinheitlichen: Impact / 7%.
-- Vorher: fee_tier DEFAULT 'supporter' (5%), fee_percentage OHNE Default (NULL).
-- Ein Insert ohne die Spalten erzeugte damit ein widerspruechliches Paar
-- (tier=supporter, percentage=NULL). Beide Defaults zeigen jetzt auf denselben Tarif
-- und stimmen mit DEFAULT_FEE_TIER / DEFAULT_FEE_PERCENT in src/lib/constants.js ueberein.
alter table public.listings
  alter column fee_tier set default 'impact',
  alter column fee_percentage set default 7;
