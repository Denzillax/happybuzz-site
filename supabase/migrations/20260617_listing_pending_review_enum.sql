-- Neuer Status für die Inserat-Freigabe-Queue (Welle 3, Teil 1).
-- Muss allein laufen: ADD VALUE darf nicht in derselben Transaktion wie eine Nutzung stehen.
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'pending_review';
