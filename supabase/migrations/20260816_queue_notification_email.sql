-- E-Mail-Warteschlange fuer Benachrichtigungen, gesteuert durch die Haekchen in
-- Einstellungen -> Benachrichtigungen (profiles.notification_settings).
-- SECURITY DEFINER aus zwei Gruenden: die Empfaenger-Adresse liegt nur in
-- auth.users, und die Praeferenz-Pruefung soll dem Server gehoeren, nicht dem
-- Client. Versand: ein Go-Live-Worker verarbeitet email_log (status pending),
-- dieselbe Tabelle nutzt bereits das Mahnwesen.
create or replace function public.queue_notification_email(
  p_recipient uuid,
  p_subject text,
  p_message text,
  p_link text,
  p_settings_key text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefs jsonb;
  v_email text;
begin
  if p_recipient is null or p_subject is null or p_settings_key is null then
    return false;
  end if;

  -- Haekchen pruefen: fehlender Schluessel = Standard AN
  -- (deckt Konten, die nie gespeichert haben; Defaults der Settings-Seite sind
  -- fuer transaktionskritische Typen ebenfalls AN)
  select notification_settings into v_prefs from profiles where id = p_recipient;
  if v_prefs is not null and (v_prefs -> p_settings_key ->> 'email') = 'false' then
    return false;
  end if;

  select email into v_email from auth.users where id = p_recipient;
  if v_email is null then return false; end if;

  -- Schutz gegen Schleifen/Spam: max 30 E-Mails pro Empfaenger und Stunde
  if (select count(*) from email_log
      where recipient_id = p_recipient and created_at > now() - interval '1 hour') >= 30 then
    return false;
  end if;

  insert into email_log (recipient_id, recipient_email, subject, template, context, status)
  values (
    p_recipient, v_email, p_subject, 'notification',
    jsonb_build_object('message', p_message, 'link', p_link, 'settings_key', p_settings_key),
    'pending'
  );
  return true;
end $$;
