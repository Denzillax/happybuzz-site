-- Registrierung: Vor- und Nachname aus der User-Metadata ins Profil uebernehmen
-- (das Formular trennt die Felder neu wie in den Einstellungen).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, username, display_name, first_name, last_name, created_at)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
