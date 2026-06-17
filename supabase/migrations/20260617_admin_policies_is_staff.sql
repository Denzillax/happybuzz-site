-- RBAC: admin-gegatete Policies auf is_staff() erweitern (Eigenzugriff erhalten).
-- company_settings_admin_write bleibt ABSICHTLICH owner-only (Firma owner-only).

drop policy if exists admin_audit_insert on public.admin_audit_log;
create policy admin_audit_insert on public.admin_audit_log for insert with check (public.is_staff(auth.uid()));
drop policy if exists admin_audit_select on public.admin_audit_log;
create policy admin_audit_select on public.admin_audit_log for select using (public.is_staff(auth.uid()));

drop policy if exists admin_all on public.beta_feedback;
create policy admin_all on public.beta_feedback for all using (public.is_staff(auth.uid()));

drop policy if exists invoices_select on public.fee_invoices;
create policy invoices_select on public.fee_invoices for select using ((seller_id = auth.uid()) or public.is_staff(auth.uid()));
drop policy if exists invoices_admin_update on public.fee_invoices;
create policy invoices_admin_update on public.fee_invoices for update using ((seller_id = auth.uid()) or public.is_staff(auth.uid()));

drop policy if exists fees_select on public.fee_ledger;
create policy fees_select on public.fee_ledger for select using ((seller_id = auth.uid()) or public.is_staff(auth.uid()));
drop policy if exists fees_admin_update on public.fee_ledger;
create policy fees_admin_update on public.fee_ledger for update using ((seller_id = auth.uid()) or public.is_staff(auth.uid()));

drop policy if exists listings_admin_select on public.listings;
create policy listings_admin_select on public.listings for select using (public.is_staff(auth.uid()));

drop policy if exists admin_purchases on public.purchases;
create policy admin_purchases on public.purchases for all using ((buyer_id = auth.uid()) or (seller_id = auth.uid()) or public.is_staff(auth.uid()));

drop policy if exists admin_updates_reports on public.reports;
create policy admin_updates_reports on public.reports for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists ann_update on public.site_announcement;
create policy ann_update on public.site_announcement for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
