-- 30.08.2026 (Beta-Feedback Melani): Admin-Alarme (Inserat wartet auf
-- Freigabe, neue Meldung, Konto-Flag, Bewerbung) gingen hart nur an den
-- Owner. Mitarbeiter mit Rolle (staff_roles, z.B. Melani als Manager)
-- bekamen nichts und konnten Freigaben nicht zeitnah erledigen.
-- Jetzt: Owner + alle Eintraege in staff_roles erhalten Glocke/Mail/Push.
create or replace function public.admin_notify(p_bell boolean, p_title text, p_msg text, p_link text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid := '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0';
  v_uid uuid;
begin
  for v_uid in
    select v_owner
    union
    select user_id from staff_roles
  loop
    if p_bell then
      insert into notifications (user_id, type, title, message, link, is_read)
      values (v_uid, 'system', p_title, p_msg, p_link, false);
    end if;
    perform queue_notification_email(v_uid, p_title, p_msg, p_link, 'admin_alert');
    perform queue_notification_push(v_uid, p_title, p_msg, p_link, 'admin_alert');
  end loop;
end;
$$;
