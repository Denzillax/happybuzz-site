-- 16.09.2026 (Denis): Wabenspiel im Hive. Taeglich ein Spiel mit Einsatz
-- (5/10/20 Pollen). 9 Waben, 2 Wespen, 7 Honig. Jede Honigwabe hebt den
-- Multiplikator, aussteigen jederzeit ("Mitnehmen"), Wespe = Einsatz weg.
--
-- Alles Entscheidende laeuft hier: das Raster wird serverseitig gemischt
-- und geht erst nach Spielende an den Browser. Die Tabelle hat KEINE
-- Policies (RLS an, kein Zugriff), alle Zugriffe laufen ueber die RPCs.
--
-- Multiplikatoren nach Anzahl Honig: 1.2 / 1.5 / 2 / 3 / 5 / 10 / 25.
-- Fairer Wert waere 1/P(ueberleben) = 1.29 / 1.71 / 2.4 / 3.6 / 6 / 12 / 36;
-- der Erwartungswert liegt damit bei jedem Ausstieg um 0.83-0.93 des
-- Einsatzes, also leichter Hausvorteil ohne Pollen-Inflation.

create table if not exists public.waben_spiele (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tag         date not null,
  einsatz     int  not null check (einsatz in (5, 10, 20)),
  felder      int[] not null,              -- 9 Werte: 0 = Honig, 1 = Wespe
  aufgedeckt  int[] not null default '{}', -- Indizes 0..8
  status      text not null default 'laeuft' check (status in ('laeuft','mitgenommen','verloren','verfallen')),
  gewinn      int  not null default 0,
  created_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create unique index if not exists waben_spiele_user_tag_uq on public.waben_spiele (user_id, tag);
alter table public.waben_spiele enable row level security;

-- Multiplikator fuer n aufgedeckte Honigwaben (n = 0..7)
create or replace function public.waben_multiplikator(n int)
returns numeric language sql immutable as $$
  select case n
    when 0 then 0 when 1 then 1.2 when 2 then 1.5 when 3 then 2
    when 4 then 3 when 5 then 5 when 6 then 10 else 25 end;
$$;

-- Ein laufendes Spiel von einem frueheren Tag verfaellt (wie eine Wespe).
create or replace function public.waben_verfallen_pruefen(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.waben_spiele
     set status = 'verfallen', ended_at = now()
   where user_id = p_user and status = 'laeuft'
     and tag < (now() at time zone 'Europe/Zurich')::date;
end $$;

-- Honig = aufgedeckte Waben ohne die Wespe (beim Verlieren steckt die Wespe im aufgedeckt-Array)
create or replace function public.waben_honig(s public.waben_spiele)
returns int language sql immutable as $$
  select count(*)::int from unnest(s.aufgedeckt) as i where s.felder[i + 1] = 0;
$$;

-- Sicht auf ein Spiel fuer den Browser: das Raster nur nach Spielende.
create or replace function public.waben_sicht(s public.waben_spiele)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', s.id, 'status', s.status, 'einsatz', s.einsatz,
    'aufgedeckt', to_jsonb(s.aufgedeckt),
    'honig', public.waben_honig(s),
    'multiplikator', public.waben_multiplikator(public.waben_honig(s)),
    'aktuell', floor(s.einsatz * public.waben_multiplikator(public.waben_honig(s)))::int,
    'gewinn', s.gewinn,
    'felder', case when s.status = 'laeuft' then null else to_jsonb(s.felder) end
  );
$$;

create or replace function public.waben_heute()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.waben_spiele;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  perform public.waben_verfallen_pruefen(v_user);
  select * into s from public.waben_spiele
   where user_id = v_user and tag = (now() at time zone 'Europe/Zurich')::date;
  if not found then return jsonb_build_object('ok', true, 'spiel', null); end if;
  return jsonb_build_object('ok', true, 'spiel', public.waben_sicht(s));
end $$;

create or replace function public.waben_start(p_einsatz int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_tag date := (now() at time zone 'Europe/Zurich')::date;
  v_xp int; v_felder int[]; s public.waben_spiele;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_einsatz not in (5, 10, 20) then return jsonb_build_object('ok', false, 'error', 'einsatz'); end if;
  perform public.waben_verfallen_pruefen(v_user);
  if exists (select 1 from public.waben_spiele where user_id = v_user and tag = v_tag) then
    return jsonb_build_object('ok', false, 'error', 'heute_gespielt');
  end if;
  select coalesce(xp_total, 0) into v_xp from public.profiles where id = v_user for update;
  if v_xp < p_einsatz then return jsonb_build_object('ok', false, 'error', 'zu_wenig', 'pollen', v_xp); end if;

  -- 7 Honig + 2 Wespen zufaellig mischen
  select array_agg(w order by random()) into v_felder
    from unnest(array[0,0,0,0,0,0,0,1,1]) as w;

  insert into public.waben_spiele (user_id, tag, einsatz, felder)
  values (v_user, v_tag, p_einsatz, v_felder) returning * into s;
  perform public.award_xp(v_user, -p_einsatz, 'waben_einsatz', s.id);
  return jsonb_build_object('ok', true, 'spiel', public.waben_sicht(s), 'pollen', v_xp - p_einsatz);
end $$;

create or replace function public.waben_mitnehmen(p_spiel uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.waben_spiele; v_gewinn int; v_xp int;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into s from public.waben_spiele where id = p_spiel and user_id = v_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_spiel'); end if;
  if s.status <> 'laeuft' then return jsonb_build_object('ok', false, 'error', 'beendet', 'spiel', public.waben_sicht(s)); end if;
  if coalesce(array_length(s.aufgedeckt, 1), 0) = 0 then return jsonb_build_object('ok', false, 'error', 'kein_honig'); end if;
  v_gewinn := floor(s.einsatz * public.waben_multiplikator(array_length(s.aufgedeckt, 1)))::int;
  update public.waben_spiele set status = 'mitgenommen', gewinn = v_gewinn, ended_at = now()
   where id = s.id returning * into s;
  v_xp := public.award_xp(v_user, v_gewinn, 'waben_gewinn', s.id);
  return jsonb_build_object('ok', true, 'spiel', public.waben_sicht(s), 'pollen', v_xp);
end $$;

create or replace function public.waben_aufdecken(p_spiel uuid, p_feld int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.waben_spiele;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_feld < 0 or p_feld > 8 then return jsonb_build_object('ok', false, 'error', 'feld'); end if;
  select * into s from public.waben_spiele where id = p_spiel and user_id = v_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_spiel'); end if;
  if s.status <> 'laeuft' then return jsonb_build_object('ok', false, 'error', 'beendet', 'spiel', public.waben_sicht(s)); end if;
  if s.tag < (now() at time zone 'Europe/Zurich')::date then
    perform public.waben_verfallen_pruefen(v_user);
    select * into s from public.waben_spiele where id = p_spiel;
    return jsonb_build_object('ok', false, 'error', 'verfallen', 'spiel', public.waben_sicht(s));
  end if;
  if p_feld = any (s.aufgedeckt) then return jsonb_build_object('ok', true, 'spiel', public.waben_sicht(s)); end if;

  if s.felder[p_feld + 1] = 1 then
    update public.waben_spiele set status = 'verloren', aufgedeckt = aufgedeckt || p_feld, ended_at = now()
     where id = s.id returning * into s;
    return jsonb_build_object('ok', true, 'wespe', true, 'spiel', public.waben_sicht(s));
  end if;

  update public.waben_spiele set aufgedeckt = aufgedeckt || p_feld where id = s.id returning * into s;
  -- Alle 7 Honigwaben gefunden: automatisch mitnehmen
  if array_length(s.aufgedeckt, 1) >= 7 then
    return public.waben_mitnehmen(s.id);
  end if;
  return jsonb_build_object('ok', true, 'wespe', false, 'spiel', public.waben_sicht(s));
end $$;

revoke all on function public.waben_heute() from public;
revoke all on function public.waben_start(int) from public;
revoke all on function public.waben_aufdecken(uuid, int) from public;
revoke all on function public.waben_mitnehmen(uuid) from public;
revoke all on function public.waben_verfallen_pruefen(uuid) from public;
revoke all on function public.waben_sicht(public.waben_spiele) from public;
revoke all on function public.waben_honig(public.waben_spiele) from public;
grant execute on function public.waben_heute() to authenticated;
grant execute on function public.waben_start(int) to authenticated;
grant execute on function public.waben_aufdecken(uuid, int) to authenticated;
grant execute on function public.waben_mitnehmen(uuid) to authenticated;
