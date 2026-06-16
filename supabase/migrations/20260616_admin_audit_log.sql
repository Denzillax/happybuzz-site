CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  target_type text,
  target_label text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_audit_insert ON public.admin_audit_log
  FOR INSERT WITH CHECK (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
CREATE POLICY admin_audit_select ON public.admin_audit_log
  FOR SELECT USING (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0');
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON public.admin_audit_log (created_at DESC);
