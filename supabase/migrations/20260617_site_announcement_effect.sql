-- Optionaler Effekt für den Ankündigungsbalken (none/marquee/slide/pulse).
ALTER TABLE public.site_announcement ADD COLUMN IF NOT EXISTS effect text NOT NULL DEFAULT 'none';
