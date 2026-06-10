-- XP/Achievement, wenn ein Profil vollständig verifiziert ist (E-Mail, Telefon,
-- Adresse, ID). Trigger nur auf den Verifizierungs-Spalten (NICHT xp_total),
-- damit award_xp's profiles-Update keine Rekursion auslöst. grant_achievement
-- ist idempotent (Unique-Constraint), daher wird genau einmal vergeben.
create or replace function public.trg_award_profile_complete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.is_verified and NEW.id_verified
     and NEW.phone is not null and NEW.phone <> ''
     and NEW.street is not null and NEW.postal_code is not null and NEW.city is not null then
    perform public.grant_achievement(NEW.id, 'profile_complete', 30);
  end if;
  return NEW;
exception when others then return NEW;
end; $$;

drop trigger if exists award_profile_complete on public.profiles;
create trigger award_profile_complete
  after update of is_verified, id_verified, phone, street, postal_code, city on public.profiles
  for each row execute function public.trg_award_profile_complete();
