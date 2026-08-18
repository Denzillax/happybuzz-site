-- 18.08.2026: Anzeigename bei Registrierung + waehlbare Abholadresse pro Inserat
-- (live eingespielt via MCP apply_migration "anzeigename_und_abholadresse")

-- 1) Registrierung: gewaehlter Anzeigename (metadata display_name) hat Vorrang,
--    sonst wie bisher der volle Name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
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
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- 2) Abholadresse pro Inserat: Schnappschuss der gewaehlten Adresse
--    (null = Hauptadresse aus dem Profil, wie bisher).
alter table public.listings add column if not exists pickup_address jsonb;
comment on column public.listings.pickup_address is 'Schnappschuss der gewaehlten Abholadresse {label, street, postal_code, city}; null = Profil-Hauptadresse';
