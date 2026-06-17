-- Admin darf ALLE Inserate lesen (sonst versteckt listings_select_public fremde
-- pending_review/draft/paused-Inserate vor dem Admin → Freigabe-Queue wäre leer).
create policy listings_admin_select on public.listings
  for select using (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid);
