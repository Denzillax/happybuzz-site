-- Inserat-Freigabe-Queue (Welle 3, Teil 1): Metadaten, Guard-Trigger, Admin-RPC.

-- 1) Metadaten-Spalten
alter table public.listings add column if not exists submitted_at timestamptz;
alter table public.listings add column if not exists review_reason text;
alter table public.listings add column if not exists reviewed_at timestamptz;

-- 2) Guard-Trigger: nur Admin darf draft|pending_review -> active schalten.
create or replace function public.enforce_listing_publish_gate()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'active'
     and OLD.status in ('draft','pending_review')
     and auth.uid() is not null
     and auth.uid() <> '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid then
    raise exception 'Inserate werden erst nach Admin-Freigabe aktiv';
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_listing_publish_gate on public.listings;
create trigger trg_listing_publish_gate
  before update on public.listings
  for each row execute function public.enforce_listing_publish_gate();

-- 3) Admin-RPC für Freigeben/Ablehnen (umgeht owner-RLS sauber).
create or replace function public.admin_review_listing(
  p_listing_id uuid, p_decision text, p_reason text default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_row public.listings;
begin
  if auth.uid() <> '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid then
    raise exception 'not authorized';
  end if;
  if p_decision = 'approve' then
    update public.listings
      set status='active', published_at=now(), reviewed_at=now(), review_reason=null
      where id=p_listing_id returning * into v_row;
  elsif p_decision = 'reject' then
    update public.listings
      set status='draft', review_reason=p_reason, reviewed_at=now()
      where id=p_listing_id returning * into v_row;
  else
    raise exception 'invalid decision: %', p_decision;
  end if;
  return json_build_object('id', v_row.id, 'status', v_row.status);
end; $$;
