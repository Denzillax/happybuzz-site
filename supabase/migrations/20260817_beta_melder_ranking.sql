-- Top-Melder-Ranking fuer den Reparatur-Log auf /beta.
-- SECURITY DEFINER, weil beta_feedback per RLS nur eigene Zeilen zeigt;
-- gibt bewusst NUR Aggregat (Anzeigename + Anzahl) heraus, keine Inhalte.
CREATE OR REPLACE FUNCTION public.beta_melder_ranking()
RETURNS TABLE (melder TEXT, meldungen BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(NULLIF(TRIM(display_name), ''), 'Anonym') AS melder,
         COUNT(*) AS meldungen
  FROM beta_feedback
  GROUP BY 1
  ORDER BY meldungen DESC, melder ASC
  LIMIT 10;
$$;

REVOKE ALL ON FUNCTION public.beta_melder_ranking() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.beta_melder_ranking() TO anon, authenticated;
