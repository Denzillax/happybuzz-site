-- 28.08.2026: Artikelbild fuer ALLE artikelbezogenen Mails + echte Umlaute.
--
-- 1) Bild zentral: queue_notification_email leitet Bild und Titel selbst aus
--    dem Link ab ('/listing/<id>' bzw. '/order/<id>'), wenn der Aufrufer keins
--    mitgibt. Damit bekommen alle 8 bestehenden Ausloeser (Gebote, endet bald,
--    laeuft ab, Favoriten, Suchtreffer, Bewertung, geplante Inserate) und alle
--    kuenftigen automatisch die Artikel-Karte, ohne jede Funktion anzufassen.
-- 2) Umlaute: mehrere Mail-/Notification-Texte waren in Ausweich-Schreibweise
--    verfasst ("pruefen", "laeuft", "fuehrst") - Denis meldete das als
--    "Umlaute fehlen". Die Texte werden direkt in den Live-Definitionen
--    ersetzt (pg_get_functiondef + gezielte Wortpaare), Logik unveraendert.

-- ── 1) Zentraler Bild/Titel-Lookup ──────────────────────────────────
create or replace function public.queue_notification_email(
  p_recipient uuid,
  p_subject text,
  p_message text,
  p_link text,
  p_settings_key text,
  p_image text default null,
  p_item_title text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefs jsonb;
  v_email text;
  v_listing_id uuid;
begin
  if p_recipient is null or p_subject is null or p_settings_key is null then
    return false;
  end if;

  select notification_settings into v_prefs from profiles where id = p_recipient;
  if v_prefs is not null and (v_prefs -> p_settings_key ->> 'email') = 'false' then
    return false;
  end if;

  select email into v_email from auth.users where id = p_recipient;
  if v_email is null then return false; end if;

  if (select count(*) from email_log
      where recipient_id = p_recipient and created_at > now() - interval '1 hour') >= 30 then
    return false;
  end if;

  -- Artikelbild aus dem Link ableiten, wenn keins mitgegeben wurde.
  -- Fehlertolerant: ein Slug statt UUID darf den Versand nie verhindern.
  if p_image is null and p_link is not null then
    begin
      if p_link like '/listing/%' then
        v_listing_id := split_part(p_link, '/', 3)::uuid;
      elsif p_link like '/order/%' then
        select listing_id into v_listing_id from purchases
        where id = split_part(p_link, '/', 3)::uuid;
      end if;
    exception when others then
      v_listing_id := null;
    end;
    if v_listing_id is not null then
      select url into p_image from listing_images
      where listing_id = v_listing_id order by sort_order asc limit 1;
      if p_item_title is null then
        select title into p_item_title from listings where id = v_listing_id;
      end if;
    end if;
  end if;

  insert into email_log (recipient_id, recipient_email, subject, template, context, status)
  values (
    p_recipient, v_email, p_subject, 'notification',
    jsonb_strip_nulls(jsonb_build_object(
      'message', p_message, 'link', p_link, 'settings_key', p_settings_key,
      'image', p_image, 'item_title', p_item_title
    )),
    'pending'
  );
  return true;
end $$;

revoke all on function public.queue_notification_email(uuid, text, text, text, text, text, text) from public, anon, authenticated;

-- ── 2) Umlaute in den Textfunktionen reparieren ─────────────────────
do $umlaute$
declare
  fn text;
  v_sql text;
begin
  foreach fn in array array['notify_auction_ending','notify_listing_expiring','trg_notify_fav_price','trg_notify_fav_sold','proxy_bid']
  loop
    select pg_get_functiondef(p.oid) into v_sql
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.proname = fn and n.nspname = 'public';
    if v_sql is null then continue; end if;

    v_sql := replace(v_sql, 'pruefen', 'prüfen');
    v_sql := replace(v_sql, 'laeuft', 'läuft');
    v_sql := replace(v_sql, 'verlaengern', 'verlängern');
    v_sql := replace(v_sql, 'geaendert', 'geändert');
    v_sql := replace(v_sql, 'naechsten', 'nächsten');
    v_sql := replace(v_sql, 'Ungueltiger', 'Ungültiger');
    v_sql := replace(v_sql, 'hoeheres', 'höheres');
    v_sql := replace(v_sql, 'fuehrst', 'führst');
    v_sql := replace(v_sql, 'ueberboten', 'überboten');
    v_sql := replace(v_sql, 'erhoeht', 'erhöht');

    execute v_sql;
  end loop;
end $umlaute$;
