-- Meldungen: Multi-Status-Workflow (offen → in_pruefung → erledigt/abgelehnt).
-- Die status-Spalte existierte bereits, war aber ungenutzt (nur is_resolved bool).
-- is_resolved bleibt als abgeleitetes Feld synchron (Badges/alte Filter).
ALTER TABLE public.reports ALTER COLUMN status SET DEFAULT 'offen';
UPDATE public.reports SET status = CASE WHEN is_resolved THEN 'erledigt' ELSE 'offen' END
WHERE status IS NULL OR status NOT IN ('offen','in_pruefung','erledigt','abgelehnt');
