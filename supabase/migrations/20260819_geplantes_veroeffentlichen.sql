-- 19.08.2026: Geplantes Veroeffentlichen (Ricardo-Style)
-- (live eingespielt via MCP apply_migration "geplantes_veroeffentlichen")
-- Flow: Inserat mit publish_at geht normal in die Freigabe; Approve setzt
-- status 'scheduled' (statt active), ein Minuten-Cron schaltet zur Zielzeit
-- live (inkl. Auktions-Uhr, 60-Tage-Laufzeit ab Aktivierung, Benachrichtigung).

-- status ist ein ENUM (listing_status): 'scheduled' ergaenzen
-- (separat eingespielt als Migration "listing_status_scheduled", weil ein
-- neuer Enum-Wert nicht in derselben Transaktion benutzt werden darf)
alter type public.listing_status add value if not exists 'scheduled';

alter table public.listings add column if not exists publish_at timestamptz;
comment on column public.listings.publish_at is 'Geplanter Veroeffentlichungszeitpunkt; null = sofort';

-- Freigabe beruecksichtigt publish_at: in der Zukunft -> scheduled,
-- sonst wie bisher sofort active (Auktions-Uhr startet erst beim Live-Schalten)
create or replace function public.admin_review_listing(p_listing_id uuid, p_decision text, p_reason text default null::text)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_row public.listings;
begin
  if auth.uid() <> '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid then
    raise exception 'not authorized';
  end if;
  if p_decision = 'approve' then
    update public.listings
      set status = case when publish_at is not null and publish_at > now() then 'scheduled' else 'active' end,
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

-- Minuten-Cron: freigegebene geplante Inserate zur Zielzeit live schalten
create or replace function public.publish_scheduled_listings()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  rec record; v_title text; v_msg text; v_link text;
begin
  for rec in
    select id, title, user_id, listing_type, auction_duration
    from listings
    where status = 'scheduled' and publish_at is not null and publish_at <= now()
  loop
    update listings
      set status = 'active',
          published_at = now(),
          expires_at = now() + interval '60 days',
          auction_end = case
            when listing_type = 'auction' and auction_end is null
            then now() + make_interval(days => coalesce(nullif(auction_duration::text, '')::int, 7))
            else auction_end
          end
      where id = rec.id;

    v_title := 'Dein Inserat ist jetzt live';
    v_msg := format('"%s" wurde wie geplant veroeffentlicht.', rec.title);
    v_link := '/listing/' || rec.id;
    insert into notifications (user_id, type, title, message, link, is_read)
    values (rec.user_id, 'system', v_title, v_msg, v_link, false);
    perform queue_notification_email(rec.user_id, v_title, v_msg, v_link, 'sell_expiring');
    perform queue_notification_push(rec.user_id, v_title, v_msg, v_link, 'sell_expiring');
  end loop;
end;
$function$;

do $$ begin
  if not exists (select 1 from cron.job where jobname = 'publish-scheduled') then
    perform cron.schedule('publish-scheduled', '* * * * *', 'select public.publish_scheduled_listings()');
  end if;
end $$;
