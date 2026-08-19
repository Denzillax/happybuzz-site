-- 19.08.2026: Nutzer blockieren (Kontakt + Kaufen/Bieten) + Preisvorschlags-Band 70-99%
-- (live eingespielt via MCP "user_blocks_und_offer_band")
-- Sperre: user_blocks + Trigger auf messages/conversations (beide Richtungen),
-- bids (Verkaeufer sperrt Bieter) und purchases (nur kaeuferinitiiert, damit
-- Auktionsabschluss per Cron und Vermieter-Bestaetigung unberuehrt bleiben).
-- Band: Offer-Nachrichten muessen bei sell-Inseraten in [70%, 99%] des Preises
-- liegen -- serverseitig, weil Annehmen eine echte Bestellung erzeugt.
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_selbst check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists user_blocks_own on public.user_blocks;
create policy user_blocks_own on public.user_blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create or replace function public.user_blocked(p_blocker uuid, p_blocked uuid)
returns boolean language sql security definer stable set search_path to 'public' as $$
  select exists (select 1 from public.user_blocks where blocker_id = p_blocker and blocked_id = p_blocked);
$$;

create or replace function public.check_message_insert()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_conv record; v_other uuid; v_listing record; v_min numeric; v_max numeric;
begin
  select buyer_id, seller_id, listing_id into v_conv from conversations where id = new.conversation_id;
  if not found then return new; end if;
  v_other := case when new.sender_id = v_conv.buyer_id then v_conv.seller_id else v_conv.buyer_id end;
  if public.user_blocked(v_other, new.sender_id) or public.user_blocked(new.sender_id, v_other) then
    raise exception 'Du kannst diesem Nutzer nicht schreiben (blockiert).';
  end if;
  if new.message_type = 'offer' and new.offer_amount is not null then
    select price, listing_type into v_listing from listings where id = v_conv.listing_id;
    if found and v_listing.listing_type = 'sell' and coalesce(v_listing.price, 0) > 0 then
      v_min := round(v_listing.price * 0.7, 2);
      v_max := round(v_listing.price * 0.99, 2);
      if new.offer_amount < v_min or new.offer_amount > v_max then
        raise exception 'Preisvorschlag muss zwischen CHF % und CHF % liegen (70–99%% des Preises).',
          to_char(v_min, 'FM999999990.00'), to_char(v_max, 'FM999999990.00');
      end if;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_check_message_insert on public.messages;
create trigger trg_check_message_insert before insert on public.messages
  for each row execute function public.check_message_insert();

create or replace function public.check_conversation_insert()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if public.user_blocked(new.seller_id, new.buyer_id) or public.user_blocked(new.buyer_id, new.seller_id) then
    raise exception 'Du kannst diesem Nutzer nicht schreiben (blockiert).';
  end if;
  return new;
end; $$;
drop trigger if exists trg_check_conversation_insert on public.conversations;
create trigger trg_check_conversation_insert before insert on public.conversations
  for each row execute function public.check_conversation_insert();

create or replace function public.check_bid_insert()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_seller uuid;
begin
  select user_id into v_seller from listings where id = new.listing_id;
  if v_seller is not null and public.user_blocked(v_seller, new.bidder_id) then
    raise exception 'Der Verkäufer nimmt von dir keine Gebote an.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_check_bid_insert on public.bids;
create trigger trg_check_bid_insert before insert on public.bids
  for each row execute function public.check_bid_insert();

create or replace function public.check_purchase_insert()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is not null and auth.uid() = new.buyer_id
     and public.user_blocked(new.seller_id, new.buyer_id) then
    raise exception 'Der Verkäufer nimmt von dir keine Bestellungen an.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_check_purchase_insert on public.purchases;
create trigger trg_check_purchase_insert before insert on public.purchases
  for each row execute function public.check_purchase_insert();
