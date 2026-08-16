-- Registrierung reparieren: der Trigger machte aus der E-Mail den Benutzernamen
-- (denis_m@gmx.ch -> denis_m). Existierte der Name schon, platzte der Insert an
-- profiles_username_key und Supabase meldete "Database error saving new user".
-- Neu: Sonderzeichen bereinigen und bei Kollision _2, _3, ... anhaengen.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_base text;
  v_name text;
  v_i int := 1;
begin
  v_base := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), ''), '[^a-zA-Z0-9_]', '_', 'g'));
  if v_base = '' then
    v_base := 'user_' || substr(new.id::text, 1, 8);
  end if;
  v_name := v_base;
  while exists (select 1 from public.profiles where username = v_name) loop
    v_i := v_i + 1;
    v_name := v_base || '_' || v_i;
  end loop;

  insert into public.profiles (id, username, display_name, first_name, last_name, created_at)
  values (
    new.id,
    v_name,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
