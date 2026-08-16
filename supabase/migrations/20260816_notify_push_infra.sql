-- Push-Benachrichtigungen + Versand-Worker-Infrastruktur.
-- Analog zur E-Mail-Warteschlange (queue_notification_email): der Client legt
-- via SECURITY-DEFINER-RPC einen push_queue-Eintrag an, ein Minuten-Worker
-- (Edge Function notify-worker) verschickt E-Mails (Resend) und Push (Web Push).
-- Geheimnisse (Resend-Key, VAPID-Schluessel, Worker-Token) liegen im Vault,
-- nie in dieser Datei.

create extension if not exists pg_net;

-- Geraete-Abos: ein Browser/Geraet = eine Zeile. Nutzer verwalten nur eigene.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
create policy push_subs_select_own on push_subscriptions for select using (auth.uid() = user_id);
create policy push_subs_insert_own on push_subscriptions for insert with check (auth.uid() = user_id);
create policy push_subs_update_own on push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy push_subs_delete_own on push_subscriptions for delete using (auth.uid() = user_id);

-- Warteschlange fuer den Worker. Kein direkter Client-Zugriff (RLS ohne
-- Policies): geschrieben nur ueber die RPC, gelesen vom Service-Role-Worker.
create table if not exists push_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  message text,
  link text,
  status text not null default 'pending',
  error text,
  created_at timestamptz not null default now()
);
alter table push_queue enable row level security;
create index if not exists push_queue_pending on push_queue (created_at) where status = 'pending';

-- Spiegel von queue_notification_email fuer den Push-Kanal: prueft das
-- Push-Haekchen in Einstellungen -> Benachrichtigungen serverseitig
-- (fehlender Schluessel = Standard AN) und drosselt auf 30/Stunde.
create or replace function public.queue_notification_push(
  p_recipient uuid,
  p_title text,
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
begin
  if p_recipient is null or p_title is null or p_settings_key is null then
    return false;
  end if;

  select notification_settings into v_prefs from profiles where id = p_recipient;
  if v_prefs is not null and (v_prefs -> p_settings_key ->> 'push') = 'false' then
    return false;
  end if;

  -- Ohne registriertes Geraet gibt es nichts zuzustellen
  if not exists (select 1 from push_subscriptions where user_id = p_recipient) then
    return false;
  end if;

  if (select count(*) from push_queue
      where user_id = p_recipient and created_at > now() - interval '1 hour') >= 30 then
    return false;
  end if;

  insert into push_queue (user_id, title, message, link)
  values (p_recipient, p_title, p_message, p_link);
  return true;
end $$;

-- Worker-Geheimnisse aus dem Vault: nur der Worker (service_role) darf lesen.
create or replace function public.worker_secret(p_name text) returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_name
$$;
revoke execute on function public.worker_secret(text) from public, anon, authenticated;
grant execute on function public.worker_secret(text) to service_role;

-- Minutentakt: Worker anstossen. Das Token kommt zur Laufzeit aus dem Vault,
-- hier steht kein Klartext-Geheimnis.
select cron.schedule(
  'notify-worker',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://ekfsehsmwzougrgqukgf.supabase.co/functions/v1/notify-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-token', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_worker_token')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
