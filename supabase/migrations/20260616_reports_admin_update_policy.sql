-- Bugfix: Meldungen liessen sich nicht als erledigt markieren (Reload setzte sie zurueck),
-- weil auf reports nur SELECT/INSERT-Policies existierten und RLS das UPDATE still blockierte.
-- Erlaubt dem Admin-Konto, Meldungen zu aktualisieren (is_resolved/status).
CREATE POLICY admin_updates_reports ON public.reports
  FOR UPDATE
  USING (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0')
  WITH CHECK (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
