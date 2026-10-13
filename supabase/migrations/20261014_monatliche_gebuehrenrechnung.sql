-- Monatliche Gebührenrechnungen für ALLE Verkäufer (Denis 13.10.2026: "Warum bin ich der einzige mit einer Gebührenrechnung?").
-- Bisher entstand die Rechnung erst, wenn der Verkäufer selbst die Seite /fees öffnete (dort ruft die App
-- create_monthly_fee_invoice auf). Wer die Seite nie öffnete, bekam keine Rechnung, seine Gebühren blieben "pending".
-- Jetzt läuft am 1. jedes Monats um 7:30 UTC ein Cron über alle Verkäufer mit offenen Ledger-Zeilen und ruft dieselbe
-- Funktion für den Vormonat auf. Die Regeln bleiben: unter CHF 10 keine Rechnung (Übertrag), pro Monat und Verkäufer nur eine.
-- Die Seite /fees darf die Funktion weiterhin aufrufen, sie ist idempotent.

create or replace function public.run_monthly_fee_invoices()
returns integer language plpgsql security definer set search_path = public as $$
declare
  rec record; v_monat integer; v_jahr integer; v_id uuid; v_anzahl integer := 0;
begin
  -- Vormonat
  v_monat := extract(month from (current_date - interval '1 month'))::integer;
  v_jahr := extract(year from (current_date - interval '1 month'))::integer;
  for rec in
    select distinct seller_id from fee_ledger where status = 'pending'
  loop
    v_id := public.create_monthly_fee_invoice(rec.seller_id, v_monat, v_jahr);
    if v_id is not null then v_anzahl := v_anzahl + 1; end if;
  end loop;
  return v_anzahl;
end;
$$;

select cron.schedule('fee-invoices-monthly', '30 7 1 * *', 'select public.run_monthly_fee_invoices()');
