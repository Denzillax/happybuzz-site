-- Fix: Auktionen ohne auction_end blieben für immer "active" (finalizeAuction bricht ab).
-- Ursache: Das Inserat-Formular speichert auction_duration, berechnet aber nie auction_end.
-- Lösung: auction_end wird beim Live-Schalten (Admin-Freigabe) aus der Dauer abgeleitet.
CREATE OR REPLACE FUNCTION public.admin_review_listing(p_listing_id uuid, p_decision text, p_reason text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_row public.listings;
begin
  if auth.uid() <> '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid then
    raise exception 'not authorized';
  end if;
  if p_decision = 'approve' then
    update public.listings
      set status='active', published_at=now(), reviewed_at=now(), review_reason=null,
          auction_end = case
            when listing_type='auction' and auction_end is null
            then now() + make_interval(days => coalesce(nullif(auction_duration::text, '')::int, 7))
            else auction_end
          end
      where id=p_listing_id returning * into v_row;
  elsif p_decision = 'reject' then
    update public.listings
      set status='draft', review_reason=p_reason, reviewed_at=now()
      where id=p_listing_id returning * into v_row;
  else
    raise exception 'invalid decision: %', p_decision;
  end if;
  return json_build_object('id', v_row.id, 'status', v_row.status);
end; $function$;
