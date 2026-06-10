-- Bewertungs-Tags: vordefinierte Schlagworte zusaetzlich zu Sternen.
alter table public.ratings add column if not exists tags text[] not null default '{}';
