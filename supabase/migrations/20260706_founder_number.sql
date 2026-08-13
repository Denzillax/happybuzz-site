-- Gruendungsmitglied: die ersten 500 Verkaeufer mit einem echten Verkauf bekommen
-- dauerhaft eine Nummer. Bewusst KEIN Rabatt: die Bee-Rate waehlt der Verkaeufer
-- ohnehin selbst, ein "Gruenderpreis" waere darum wertlos. Der Wert liegt in
-- Knappheit und sichtbarer Anerkennung.
alter table public.profiles
  add column if not exists founder_number integer;

create unique index if not exists profiles_founder_number_key
  on public.profiles (founder_number)
  where founder_number is not null;

create or replace function public.assign_founder_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  -- schon Gruendungsmitglied? nichts zu tun
  if exists (select 1 from profiles where id = NEW.seller_id and founder_number is not null) then
    return NEW;
  end if;

  select coalesce(max(founder_number), 0) + 1 into v_next from profiles;

  if v_next <= 500 then                      -- FOUNDER_LIMIT
    begin
      update profiles
         set founder_number = v_next
       where id = NEW.seller_id
         and founder_number is null;
    exception when unique_violation then
      -- Nummer wurde parallel vergeben. Kein Grund, den Kauf scheitern zu lassen:
      -- der naechste Verkauf dieses Verkaeufers vergibt sie erneut.
      null;
    end;
  end if;

  return NEW;
end $$;

drop trigger if exists trg_assign_founder_number on public.purchases;
create trigger trg_assign_founder_number
  after insert on public.purchases
  for each row execute function public.assign_founder_number();

-- Bestandsverkaeufer chronologisch nach ihrem ersten Verkauf nummerieren.
with erste_verkaeufe as (
  select seller_id, min(created_at) as erster_verkauf
  from public.purchases
  group by seller_id
), nummeriert as (
  select seller_id, row_number() over (order by erster_verkauf) as nr
  from erste_verkaeufe
)
update public.profiles p
   set founder_number = n.nr
  from nummeriert n
 where p.id = n.seller_id
   and p.founder_number is null
   and n.nr <= 500;
