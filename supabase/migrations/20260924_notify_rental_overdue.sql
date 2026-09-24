-- Mieten: Erinnerung vor der Rückgabe und Meldung bei Überfälligkeit (Denis 24.09.2026: drei Mieten waren
-- 3 bis 27 Tage überfällig, niemand hat etwas gemerkt). Bisher gab es für Buchungen nur die Meldungen
-- "angefragt / bestätigt / abgesagt" aus der App, keinen Cron-Job, der auf das Enddatum schaut.
--
-- Zwei Fälle, je einmal pro Buchung und Person (notify_once), an Vermieter UND Mieter:
--   rental_due      am Tag vor der Rückgabe (end_date = morgen)
--   rental_overdue  ab dem Tag nach der Rückgabe (end_date < heute), Miete noch nicht zurück
-- "Noch nicht zurück" heisst: Buchung nicht returned/cancelled und die Bestellung nicht completed/cancelled
-- und keine Rückgabe markiert (return_pending wartet auf den Vermieter, das ist keine Überfälligkeit).
-- Services (Wunschtermin vorbei, nicht abgeschlossen) bekommen keine Meldung: dort schliesst der Anbieter mit der Rechnung ab.
--
-- Die Schalter-Schlüssel rental_due / rental_overdue gibt es in den Einstellungen nicht, darum gehen Mail
-- und Push immer raus (transaktionskritisch, Architektur-Regel 7).

create or replace function public.notify_rental_reminders()
returns void language plpgsql security definer set search_path = public as $$
declare
  rec record; v_title text; v_msg text; v_link text; v_tage integer;
begin
  for rec in
    select b.id, b.end_date, b.owner_id, b.renter_id, b.purchase_id, l.title,
           p.status as p_status,
           unnest(array[b.owner_id, b.renter_id]) as empf
    from rental_bookings b
    join listings l on l.id = b.listing_id
    left join purchases p on p.id = b.purchase_id
    where l.listing_type = 'rent'
      and b.status in ('confirmed', 'active')
      and b.end_date is not null
      and b.end_date <= current_date + 1
      and (p.id is null or p.status not in ('completed', 'cancelled', 'return_pending', 'returned'))
  loop
    v_link := case when rec.purchase_id is not null then '/order/' || rec.purchase_id else '/bookings' end;

    if rec.end_date = current_date + 1 then
      -- Morgen ist Rückgabe
      insert into notify_once (user_id, kind, ref) values (rec.empf, 'rental_due', rec.id::text)
      on conflict do nothing;
      if found then
        v_title := 'Rückgabe morgen';
        v_msg := case when rec.empf = rec.renter_id
          then format('"%s" ist morgen zurückzugeben. Danach auf der Bestellseite die Rückgabe markieren.', rec.title)
          else format('"%s" kommt morgen zurück. Nach der Rückgabe auf der Bestellseite bestätigen.', rec.title) end;
        insert into notifications (user_id, type, title, message, link, is_read)
        values (rec.empf, 'rental', v_title, v_msg, v_link, false);
        perform queue_notification_email(rec.empf, v_title, v_msg, v_link, 'rental_due');
        perform queue_notification_push(rec.empf, v_title, v_msg, v_link, 'rental_due');
      end if;

    elsif rec.end_date < current_date then
      -- Überfällig
      v_tage := current_date - rec.end_date;
      insert into notify_once (user_id, kind, ref) values (rec.empf, 'rental_overdue', rec.id::text)
      on conflict do nothing;
      if found then
        v_title := 'Miete überfällig';
        v_msg := case when rec.empf = rec.renter_id
          then format('"%s" war am %s zurückzugeben (seit %s %s). Bitte zurückgeben und die Rückgabe markieren.',
                      rec.title, to_char(rec.end_date, 'DD.MM.YYYY'), v_tage, case when v_tage = 1 then 'Tag' else 'Tagen' end)
          else format('"%s" ist seit %s %s überfällig (Rückgabe war am %s). Falls die Sache zurück ist, auf der Bestellseite bestätigen, sonst den Mieter anschreiben.',
                      rec.title, v_tage, case when v_tage = 1 then 'Tag' else 'Tagen' end, to_char(rec.end_date, 'DD.MM.YYYY')) end;
        insert into notifications (user_id, type, title, message, link, is_read)
        values (rec.empf, 'rental', v_title, v_msg, v_link, false);
        perform queue_notification_email(rec.empf, v_title, v_msg, v_link, 'rental_overdue');
        perform queue_notification_push(rec.empf, v_title, v_msg, v_link, 'rental_overdue');
      end if;
    end if;
  end loop;
end;
$$;

-- Täglich um 8:05 Uhr (UTC, also 9:05 bzw. 10:05 Schweizer Zeit). cron.schedule ist idempotent über den Jobnamen.
select cron.schedule('notify-rental-reminders', '5 8 * * *', 'select public.notify_rental_reminders()');
