-- Serverseitige Rate-Limits gegen Spam/Missbrauch (nicht umgehbar, da BEFORE INSERT Trigger).
-- Staff/Owner sind ausgenommen. Grosszügige Limits, damit legitime Nutzung nicht blockiert wird.
-- Nachrichten: 30/60s je Absender · Meldungen: 10/Stunde je Melder · Gebote: 20/60s je Bieter (deckt proxy_bid ab).

create or replace function public.rl_messages() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff(auth.uid()) then return NEW; end if;
  if NEW.sender_id is not null and (
    select count(*) from public.messages
    where sender_id = NEW.sender_id and created_at > now() - interval '60 seconds'
  ) >= 30 then
    raise exception 'Zu viele Nachrichten in kurzer Zeit. Bitte warte einen Moment.' using errcode = 'P0001';
  end if;
  return NEW;
end $$;
drop trigger if exists trg_rl_messages on public.messages;
create trigger trg_rl_messages before insert on public.messages
  for each row execute function public.rl_messages();

create or replace function public.rl_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff(auth.uid()) then return NEW; end if;
  if NEW.reporter_id is not null and (
    select count(*) from public.reports
    where reporter_id = NEW.reporter_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Zu viele Meldungen in kurzer Zeit. Bitte versuche es später erneut.' using errcode = 'P0001';
  end if;
  return NEW;
end $$;
drop trigger if exists trg_rl_reports on public.reports;
create trigger trg_rl_reports before insert on public.reports
  for each row execute function public.rl_reports();

create or replace function public.rl_bids() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff(auth.uid()) then return NEW; end if;
  if NEW.bidder_id is not null and (
    select count(*) from public.bids
    where bidder_id = NEW.bidder_id and created_at > now() - interval '60 seconds'
  ) >= 20 then
    raise exception 'Zu viele Gebote in kurzer Zeit. Bitte warte einen Moment.' using errcode = 'P0001';
  end if;
  return NEW;
end $$;
drop trigger if exists trg_rl_bids on public.bids;
create trigger trg_rl_bids before insert on public.bids
  for each row execute function public.rl_bids();
