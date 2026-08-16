-- Kompakte FEE-Rechnungsnummer: FEE-<JJMM><KUERZEL>, z.B. FEE-260648FBDB
-- (vorher FEE-2026-06-48FBDB). Nur Anzeige/Zahlungszweck, nichts parst das
-- Format — daher gefahrlos. Bestehende Rechnungen werden mitmigriert, damit
-- nicht zwei Formate nebeneinander leben.
CREATE OR REPLACE FUNCTION public.create_monthly_fee_invoice(p_seller_id uuid, p_month integer, p_year integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_invoice_id UUID;
  v_total NUMERIC;
  v_impact NUMERIC;
  v_count INT;
  v_min CONSTANT NUMERIC := 10;  -- Mindest-Rechnungsbetrag CHF
  v_cutoff DATE := (make_date(p_year, p_month, 1) + INTERVAL '1 month')::DATE;
BEGIN
  SELECT id INTO v_invoice_id FROM fee_invoices
  WHERE seller_id = p_seller_id AND period_month = p_month AND period_year = p_year;
  IF v_invoice_id IS NOT NULL THEN RETURN v_invoice_id; END IF;

  SELECT COALESCE(SUM(fee_amount), 0), COALESCE(SUM(bee_impact), 0), COUNT(*)
  INTO v_total, v_impact, v_count
  FROM fee_ledger
  WHERE seller_id = p_seller_id AND status = 'pending'
    AND created_at < v_cutoff;

  IF v_count = 0 THEN RETURN NULL; END IF;
  IF v_total < v_min THEN RETURN NULL; END IF;  -- Uebertrag in den Folgemonat

  INSERT INTO fee_invoices (seller_id, invoice_ref, period_month, period_year, total_fees, total_bee_impact, item_count, due_date)
  VALUES (
    p_seller_id,
    'FEE-' || TO_CHAR(make_date(p_year, p_month, 1), 'YYMM') || UPPER(LEFT(p_seller_id::TEXT, 6)),
    p_month, p_year, v_total, v_impact, v_count,
    (make_date(p_year, p_month, 1) + INTERVAL '1 month' + INTERVAL '29 days')::DATE
  )
  RETURNING id INTO v_invoice_id;

  UPDATE fee_ledger SET fee_invoice_id = v_invoice_id, status = 'invoiced'
  WHERE seller_id = p_seller_id AND status = 'pending'
    AND created_at < v_cutoff;

  RETURN v_invoice_id;
END;
$function$;

-- Bestehende Rechnungen aufs neue Format umstellen
UPDATE fee_invoices
SET invoice_ref = 'FEE-' || TO_CHAR(make_date(period_year, period_month, 1), 'YYMM') || UPPER(LEFT(seller_id::TEXT, 6))
WHERE invoice_ref LIKE 'FEE-____-%';

-- Eine Rechnung pro Verkaeufer und Monat, Rechnungsnummern eindeutig.
-- Die Funktion prueft zwar vor dem Insert, aber ohne Index bleibt ein
-- Race-Fenster (belegt durch ein 30ms-Duplikat in den Testdaten, das bei
-- dieser Migration bereinigt wurde: gleiche Rechnung doppelt, eine ohne
-- verknuepfte Ledger-Zeilen).
create unique index if not exists fee_invoices_seller_period_uniq on fee_invoices (seller_id, period_year, period_month);
create unique index if not exists fee_invoices_ref_uniq on fee_invoices (invoice_ref);
