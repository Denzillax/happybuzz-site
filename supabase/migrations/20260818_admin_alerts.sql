-- Admin-Alarme fuer den Owner: Sofort-Trigger (Meldung, Konto-Flag, Inserat
-- zur Freigabe, neue Bewerbung) + taeglicher Morgen-Digest um 08:00 CH-Zeit.
-- Empfaenger: Owner-Konto. Schluessel 'admin_alert' (nicht in den Nutzer-
-- Einstellungen, damit immer an).

create or replace function public.admin_notify(p_bell boolean, p_title text, p_msg text, p_link text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid := '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0';
begin
  if p_bell then
    insert into notifications (user_id, type, title, message, link, is_read)
    values (v_admin, 'system', p_title, p_msg, p_link, false);
  end if;
  perform queue_notification_email(v_admin, p_title, p_msg, p_link, 'admin_alert');
  perform queue_notification_push(v_admin, p_title, p_msg, p_link, 'admin_alert');
end;
$$;

-- 1) Neue Meldung
create or replace function public.trg_admin_new_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  select title into v_title from listings where id = new.listing_id;
  perform admin_notify(true, 'Neue Meldung',
    format('Grund: %s%s', coalesce(new.reason::text, new.report_type, 'unbekannt'),
      case when v_title is not null then format(' · Inserat "%s"', v_title) else '' end),
    '/admin');
  return new;
end;
$$;
drop trigger if exists admin_new_report on public.reports;
create trigger admin_new_report after insert on public.reports
for each row execute function public.trg_admin_new_report();

-- 2) Konto geflaggt (Kontaktversuch ausserhalb BEEDARO)
create or replace function public.trg_admin_user_flagged()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.contact_violations, 0) > coalesce(old.contact_violations, 0) then
    perform admin_notify(true, 'Konto geflaggt',
      format('%s hat jetzt %s Kontaktversuche ausserhalb BEEDARO.',
        coalesce(new.display_name, 'Ein Konto'), new.contact_violations),
      '/admin');
  end if;
  return new;
end;
$$;
drop trigger if exists admin_user_flagged on public.profiles;
create trigger admin_user_flagged after update of contact_violations on public.profiles
for each row execute function public.trg_admin_user_flagged();

-- 3) Inserat wartet auf Freigabe
create or replace function public.trg_admin_pending_listing()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending_review'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform admin_notify(true, 'Inserat wartet auf Freigabe',
      format('"%s" wartet auf deine Pruefung.', new.title), '/admin');
  end if;
  return new;
end;
$$;
drop trigger if exists admin_pending_listing on public.listings;
create trigger admin_pending_listing after insert or update of status on public.listings
for each row execute function public.trg_admin_pending_listing();

-- 4) Neue Bewerbung (Glocke kommt schon vom Client, hier nur Mail+Push)
create or replace function public.trg_admin_new_application()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform admin_notify(false, 'Neue Bewerbung',
    format('Jemand moechte mitarbeiten (%s).', coalesce(new.role, 'Rolle unbekannt')), '/admin');
  return new;
end;
$$;
drop trigger if exists admin_new_application on public.applications;
create trigger admin_new_application after insert on public.applications
for each row execute function public.trg_admin_new_application();

-- 5) Morgen-Digest: was in den letzten 24h passiert ist + was offen ist.
--    Nur senden, wenn es etwas zu berichten gibt. Nur E-Mail.
create or replace function public.notify_admin_daily_digest()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid := '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0';
  v_users int; v_listings int; v_sales int; v_gmv numeric; v_feedback int;
  v_open_reports int; v_pending int; v_open_inv int; v_msg text;
begin
  select count(*) into v_users from profiles where created_at > now() - interval '24 hours';
  select count(*) into v_listings from listings where created_at > now() - interval '24 hours';
  select count(*), coalesce(sum(price), 0) into v_sales, v_gmv
    from purchases where created_at > now() - interval '24 hours' and status <> 'cancelled';
  select count(*) into v_feedback from beta_feedback where created_at > now() - interval '24 hours';
  select count(*) into v_open_reports from reports where is_resolved is distinct from true;
  select count(*) into v_pending from listings where status = 'pending_review';
  select count(*) into v_open_inv from fee_invoices where status <> 'paid';

  if v_users + v_listings + v_sales + v_feedback + v_open_reports + v_pending + v_open_inv = 0 then
    return;
  end if;

  v_msg := format(
    'Letzte 24 Stunden: %s neue Nutzer, %s neue Inserate, %s Verkaeufe (CHF %s), %s Feedback-Meldungen. Offen: %s Meldungen, %s Inserate zur Freigabe, %s unbezahlte Gebuehren-Rechnungen.',
    v_users, v_listings, v_sales, to_char(v_gmv, 'FM999990.00'), v_feedback,
    v_open_reports, v_pending, v_open_inv);
  perform queue_notification_email(v_admin, 'Beedaro Morgenreport', v_msg, '/admin', 'admin_alert');
end;
$$;

do $$ begin perform cron.unschedule('admin-daily-digest'); exception when others then null; end $$;
select cron.schedule('admin-daily-digest', '0 6 * * *', 'select public.notify_admin_daily_digest()');
