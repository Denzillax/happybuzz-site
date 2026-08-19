-- 19.08.2026: Lieferfrist "Versandbereit innert" (live via MCP "lieferfrist_handling_days")
-- 2 = 1-2 Tage (Standard, bisheriges Verhalten), 5 = 3-5 Tage, 7 = 1 Woche, 14 = 2 Wochen.
-- Gedacht fuer Neuware (Print-on-Demand, Lieferantenbestellung) und Ferien.
alter table public.listings add column if not exists handling_days int not null default 2;
alter table public.listings drop constraint if exists listings_handling_days_check;
alter table public.listings add constraint listings_handling_days_check check (handling_days in (2, 5, 7, 14));
comment on column public.listings.handling_days is 'Versandbereit innert X Tagen: 2 (1-2 Tage), 5 (3-5 Tage), 7 (1 Woche), 14 (2 Wochen)';
