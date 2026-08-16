-- Lieferadresse pro Bestellung: Schnappschuss der beim Kauf/Zuschlag gewaehlten
-- Adresse (name, company, street, postal_code, city). Bewusst KEIN FK auf
-- user_addresses: spaetere Aenderungen dort duerfen die Bestellung nicht anfassen.
alter table public.purchases add column if not exists delivery_address jsonb;
