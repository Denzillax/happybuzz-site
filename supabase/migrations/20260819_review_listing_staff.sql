-- 19.08.2026: Freigabe-RPC fuer Mitarbeiter oeffnen (live via MCP "review_listing_staff")
-- Der Owner-Check stammte aus der Vor-RBAC-Zeit und sperrte Mitarbeiter
-- (z.B. die Ferienvertretung mit Manager-Rolle) von der Inserat-Freigabe aus,
-- obwohl alle anderen Admin-Rechte laengst ueber is_staff laufen.
create or replace function public.admin_review_listing(p_listing_id uuid, p_decision text, p_reason text default null::text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_row public.listings;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'not authorized';
  end if;
  if p_decision = 'approve' then
    update public.listings
      set status = (case when publish_at is not null and publish_at > now() then 'scheduled' else 'active' end)::public.listing_status,
          published_at = case when publish_at is not null and publish_at > now() then null else now() end,
          reviewed_at = now(), review_reason = null,
          auction_end = case
            when listing_type = 'auction' and auction_end is null and (publish_at is null or publish_at <= now())
            then now() + make_interval(days => coalesce(nullif(auction_duration::text, '')::int, 7))
            else auction_end
          end
      where id = p_listing_id returning * into v_row;
  elsif p_decision = 'reject' then
    update public.listings
      set status='draft', review_reason=p_reason, reviewed_at=now()
      where id=p_listing_id returning * into v_row;
  else
    raise exception 'invalid decision: %', p_decision;
  end if;
  return json_build_object('id', v_row.id, 'status', v_row.status);
end; $function$;
