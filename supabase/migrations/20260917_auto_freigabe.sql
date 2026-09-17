-- 17.09.2026 (Denis): Automatische Inserat-Freigabe. Die KI prueft Text und
-- Bilder (Route /api/ai-review), die Entscheidung faellt hier in der RPC
-- auto_review_listing nach festem Regelsatz. Nie automatisch ablehnen:
-- Blocker und auffaellige Inserate neuer Verkaeufer bleiben in der
-- manuellen Warteschlange. Spec: docs/superpowers/specs/2026-09-17-auto-freigabe-design.md

alter table public.listings
  add column if not exists review_ai jsonb,
  add column if not exists review_hold_reason text,
  add column if not exists review_source text check (review_source in ('manual','auto'));
alter table public.site_settings add column if not exists auto_review_enabled boolean not null default true;

-- Vertrauensstufe: mindestens drei freigegebene Inserate und keine Ablehnung in 90 Tagen
create or replace function public.seller_ist_bewaehrt(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (select count(*) from public.listings l
           where l.user_id = p_user and l.reviewed_at is not null and l.review_reason is null
             and l.status::text in ('active','scheduled','sold','rented','expired','paused','archived')) >= 3
     and not exists (select 1 from public.listings l
           where l.user_id = p_user and l.review_reason is not null and l.reviewed_at > now() - interval '90 days');
$$;
revoke execute on function public.seller_ist_bewaehrt(uuid) from public, anon, authenticated;
grant execute on function public.seller_ist_bewaehrt(uuid) to service_role;

-- Entscheidung nach Regelsatz. Wird nur von der Route (service_role) aufgerufen.
create or replace function public.auto_review_listing(p_listing uuid, p_ergebnis jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v public.listings; v_blocker int; v_hinweise int; v_bewaehrt boolean; v_grund text; v_live boolean;
  v_tipps text; v_ergebnis jsonb; v_neu_status text;
begin
  select * into v from public.listings where id = p_listing for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_inserat'); end if;
  v_ergebnis := coalesce(p_ergebnis, '{}'::jsonb) || jsonb_build_object('geprueft_am', now(),
                  'versuche', coalesce((v.review_ai ->> 'versuche')::int, 0) + 1);
  if v.status::text <> 'pending_review' then
    -- Doppelaufruf (Client und Cron) oder Denis war schneller: nur Ergebnis merken
    update public.listings set review_ai = v_ergebnis where id = p_listing;
    return jsonb_build_object('ok', true, 'entscheidung', 'ignoriert', 'status', v.status);
  end if;
  v_blocker := coalesce(jsonb_array_length(v_ergebnis -> 'blocker'), 0);
  v_hinweise := coalesce(jsonb_array_length(v_ergebnis -> 'hinweise'), 0);
  v_bewaehrt := public.seller_ist_bewaehrt(v.user_id);
  v_ergebnis := v_ergebnis || jsonb_build_object('vertrauen', case when v_bewaehrt then 'bewaehrt' else 'neu' end);

  if v_blocker > 0 then
    v_live := false;
    select string_agg(coalesce(b ->> 'grund', b ->> 'code'), ' · ') into v_grund from jsonb_array_elements(v_ergebnis -> 'blocker') b;
  elsif v_bewaehrt or v_hinweise <= 2 then
    v_live := true;
  else
    v_live := false; v_grund := 'Neues Konto, mehrere Hinweise';
  end if;

  if v_live then
    v_neu_status := case when v.publish_at is not null and v.publish_at > now() then 'scheduled' else 'active' end;
    update public.listings
      set status = v_neu_status::public.listing_status,
          published_at = case when v_neu_status = 'scheduled' then null else now() end,
          reviewed_at = now(), review_reason = null, review_hold_reason = null,
          review_source = 'auto', review_ai = v_ergebnis,
          auction_end = case
            when listing_type = 'auction' and auction_end is null and (publish_at is null or publish_at <= now())
            then now() + make_interval(days => coalesce(nullif(auction_duration::text, '')::int, 7))
            else auction_end end
      where id = p_listing;
    select string_agg(h ->> 'tipp', ' ') into v_tipps from jsonb_array_elements(v_ergebnis -> 'hinweise') h where h ->> 'tipp' is not null;
    insert into public.notifications (user_id, type, title, message, link, is_read)
    values (v.user_id, 'listing_approved',
      case when v_neu_status = 'scheduled' then 'Inserat freigegeben, geht zur geplanten Zeit live' else 'Dein Inserat ist live' end,
      left(coalesce('„' || v.title || '“' || case when v_tipps is not null then ' Tipp: ' || v_tipps else '' end, ''), 400),
      '/listing/' || v.id, false);
    insert into public.admin_audit_log (admin_id, action, target_type, target_label, detail)
    values (null, 'listing_auto_approve', 'listing', v.title, jsonb_build_object('listing_id', v.id, 'hinweise', v_hinweise, 'vertrauen', v_ergebnis ->> 'vertrauen'));
    return jsonb_build_object('ok', true, 'entscheidung', 'live', 'status', v_neu_status);
  end if;

  update public.listings set review_hold_reason = v_grund, review_ai = v_ergebnis where id = p_listing;
  insert into public.admin_audit_log (admin_id, action, target_type, target_label, detail)
  values (null, 'listing_auto_hold', 'listing', v.title, jsonb_build_object('listing_id', v.id, 'grund', v_grund, 'blocker', v_blocker, 'hinweise', v_hinweise));
  return jsonb_build_object('ok', true, 'entscheidung', 'warteschlange', 'grund', v_grund);
end $$;
revoke execute on function public.auto_review_listing(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.auto_review_listing(uuid, jsonb) to service_role;

-- KI-Aufruf fehlgeschlagen: Versuch zaehlen, damit der Cron hoechstens zweimal nachholt
create or replace function public.auto_review_versuch(p_listing uuid)
returns void language sql security definer set search_path = public as $$
  update public.listings
     set review_ai = coalesce(review_ai, '{}'::jsonb) || jsonb_build_object('versuche', coalesce((review_ai ->> 'versuche')::int, 0) + 1, 'letzter_fehler', now())
   where id = p_listing;
$$;
revoke execute on function public.auto_review_versuch(uuid) from public, anon, authenticated;
grant execute on function public.auto_review_versuch(uuid) to service_role;

-- Faellige Nachholer fuer den Cron: noch ohne Ergebnis, aelter als 5 Minuten, weniger als 2 Versuche
create or replace function public.auto_review_faellig()
returns setof uuid language sql security definer set search_path = public as $$
  select l.id from public.listings l
   where l.status::text = 'pending_review'
     and coalesce(l.submitted_at, l.created_at) < now() - interval '5 minutes'
     and (l.review_ai is null or l.review_ai -> 'blocker' is null)
     and coalesce((l.review_ai ->> 'versuche')::int, 0) < 2
     and (select auto_review_enabled from public.site_settings where id = 1)
   order by coalesce(l.submitted_at, l.created_at)
   limit 10;
$$;
revoke execute on function public.auto_review_faellig() from public, anon, authenticated;
grant execute on function public.auto_review_faellig() to service_role;

-- Manuelle Freigabe markiert die Quelle (fuer den Admin-Reiter "Automatisch freigegeben")
create or replace function public.admin_review_listing(p_listing_id uuid, p_decision text, p_reason text default null::text)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare v_row public.listings;
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  if p_decision = 'approve' then
    update public.listings
      set status = (case when publish_at is not null and publish_at > now() then 'scheduled' else 'active' end)::public.listing_status,
          published_at = case when publish_at is not null and publish_at > now() then null else now() end,
          reviewed_at = now(), review_reason = null, review_hold_reason = null, review_source = 'manual',
          auction_end = case
            when listing_type = 'auction' and auction_end is null and (publish_at is null or publish_at <= now())
            then now() + make_interval(days => coalesce(nullif(auction_duration::text, '')::int, 7))
            else auction_end end
      where id = p_listing_id returning * into v_row;
  elsif p_decision = 'reject' then
    update public.listings
      set status='draft', review_reason=p_reason, reviewed_at=now(), review_hold_reason = null
      where id=p_listing_id returning * into v_row;
  else
    raise exception 'invalid decision: %', p_decision;
  end if;
  return json_build_object('id', v_row.id, 'status', v_row.status);
end; $function$;

-- Token fuer den Cron-Aufruf der Route (die Route prueft es ueber worker_secret)
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'ai_review_token') then
    perform vault.create_secret(encode(gen_random_bytes(24), 'hex'), 'ai_review_token');
  end if;
end $$;

-- Alle 5 Minuten: haengengebliebene Inserate nachholen
select cron.unschedule('ai-review-nachholen') where exists (select 1 from cron.job where jobname = 'ai-review-nachholen');
select cron.schedule('ai-review-nachholen', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://beedaro.ch/api/ai-review',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-review-token', (select decrypted_secret from vault.decrypted_secrets where name = 'ai_review_token')),
    body := jsonb_build_object('listing_id', f.id)
  ) from public.auto_review_faellig() f(id);
$cron$);
