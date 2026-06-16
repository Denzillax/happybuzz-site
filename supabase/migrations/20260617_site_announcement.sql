-- Ankündigungsbalken über dem Header: Singleton-Tabelle (id=1).
-- Öffentlich lesbar (auch anon, zum Anzeigen); nur das Admin-Konto darf schreiben.
CREATE TABLE IF NOT EXISTS public.site_announcement (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  message text NOT NULL DEFAULT '',
  bg_color text NOT NULL DEFAULT '#0E9493',
  text_color text NOT NULL DEFAULT '#FFFFFF',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.site_announcement (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.site_announcement ENABLE ROW LEVEL SECURITY;
CREATE POLICY ann_select ON public.site_announcement FOR SELECT USING (true);
CREATE POLICY ann_update ON public.site_announcement FOR UPDATE
  USING (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0')
  WITH CHECK (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
