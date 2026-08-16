-- Mindest-Rechnungsbetrag CHF 10 fuer FEE-Monatsrechnungen.
-- Neu: der Lauf fuer Monat M nimmt ALLE offenen Ledger-Zeilen bis Ende M mit
-- (aeltere Monate inklusive = automatischer Uebertrag). Unter CHF 10 wird
-- keine Rechnung gestellt, die Zeilen bleiben pending und rollen weiter.
-- Der Wert 10 entspricht MIN_INVOICE_CHF in src/lib/constants.js.
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
    'FEE-' || p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-' || UPPER(LEFT(p_seller_id::TEXT, 6)),
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
