-- 16.09.2026 (Denis): Pollenpfad ersetzt den Bienenflug ("zu simpel").
-- Ein Lauf pro Tag ueber 10 Felder. Pro Schritt waehlt man einen von drei
-- Wegen, der Ausgang wird serverseitig gezogen:
--   sicher    8 % Wespe, sonst +1 Feld und Stand +0.10
--   riskant  35 % Wespe, sonst +1 Feld und Stand +0.50
--   ereignis 30 % Wespe, 25 % Bluete (+1 Feld, Stand x1.6), 20 % Regen
--            (1 Feld zurueck), 25 % Schild (+1 Feld, schuetzt einmal vor
--            einer Wespe; hat man schon einen: Stand +0.20)
-- Ein Schild ueberlebt den Tag: wer den Lauf mit Schild beendet, startet
-- morgen damit. Ziel (Feld 10) gibt Stand +0.30 und zahlt automatisch aus.
-- Mitnehmen ab Feld 1. Wochenpunkte = erreichte Felder (+5 fuers Ziel),
-- unabhaengig vom Einsatz. Montag 00:10 Zuerich: Top 3 der Vorwoche
-- bekommen 50 / 30 / 20 Pollen (idempotent ueber pfad_wochenbonus).
--
-- Oekonomie: ein kompletter sicherer Lauf hat Erwartungswert ~1.0, die
-- ersten sicheren Schritte sind leicht positiv, riskant und Ereignis
-- liegen unter 1 (Ereignis 0.85, dafuer gibt es Schilde).

-- Bienenflug entfernen (war nur Stunden live, keine Laeufe von Nutzern)
drop function if exists public.flug_tipp(uuid, text);
drop function if exists public.flug_mitnehmen(uuid);
drop function if exists public.flug_start(int);
drop function if exists public.flug_heute();
drop function if exists public.flug_sicht(public.flug_spiele);
drop function if exists public.flug_multiplikator(int);
drop table if exists public.flug_spiele;

create table if not exists public.pfad_laeufe (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tag         date not null,
  einsatz     int  not null check (einsatz in (5, 10, 20)),
  feld        int  not null default 0,
  stand       numeric(6,2) not null default 1.0,
  schild      boolean not null default false,
  schritte    jsonb not null default '[]'::jsonb,   -- Verlauf: [{weg, ergebnis, feld, stand}]
  status      text not null default 'laeuft' check (status in ('laeuft','mitgenommen','verloren','ziel','verfallen')),
  gewinn      int  not null default 0,
  punkte      int  not null default 0,
  created_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create unique index if not exists pfad_laeufe_user_tag_uq on public.pfad_laeufe (user_id, tag);
create index if not exists pfad_laeufe_tag_idx on public.pfad_laeufe (tag);
alter table public.pfad_laeufe enable row level security;

create table if not exists public.pfad_wochenbonus (
  woche    date not null,          -- Montag der abgerechneten Woche
  user_id  uuid not null references public.profiles(id) on delete cascade,
  rang     int  not null,
  punkte   int  not null,
  pollen   int  not null,
  created_at timestamptz not null default now(),
  primary key (woche, user_id)
);
alter table public.pfad_wochenbonus enable row level security;

create or replace function public.pfad_heute_datum()
returns date language sql stable as $$ select (now() at time zone 'Europe/Zurich')::date $$;

create or replace function public.pfad_wochenstart(d date)
returns date language sql immutable as $$ select d - ((extract(isodow from d))::int - 1) $$;

create or replace function public.pfad_sicht(s public.pfad_laeufe)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', s.id, 'status', s.status, 'einsatz', s.einsatz, 'feld', s.feld,
    'stand', s.stand, 'aktuell', floor(s.einsatz * s.stand)::int,
    'schild', s.schild, 'schritte', s.schritte, 'gewinn', s.gewinn, 'punkte', s.punkte
  );
$$;

create or replace function public.pfad_verfallen(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.pfad_laeufe set status = 'verfallen', punkte = feld, ended_at = now()
   where user_id = p_user and status = 'laeuft' and tag < public.pfad_heute_datum();
end $$;

-- Wochenrangliste: Top 10 dieser Woche + eigener Rang
create or replace function public.pfad_rangliste()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_start date := public.pfad_wochenstart(public.pfad_heute_datum()); v_top jsonb; v_ich jsonb;
begin
  with w as (
    select l.user_id, sum(l.punkte)::int as punkte, count(*)::int as laeufe
      from public.pfad_laeufe l
     where l.tag >= v_start and l.tag < v_start + 7 and l.status <> 'laeuft'
     group by l.user_id
  ), r as (
    select w.*, rank() over (order by w.punkte desc, w.laeufe asc) as rang from w
  )
  select coalesce(jsonb_agg(jsonb_build_object('rang', r.rang, 'user_id', r.user_id, 'punkte', r.punkte,
           'name', coalesce(p.display_name, 'Biene'), 'avatar', p.avatar_url) order by r.rang), '[]'::jsonb)
    into v_top
    from r join public.profiles p on p.id = r.user_id
   where r.rang <= 10;
  with w as (
    select l.user_id, sum(l.punkte)::int as punkte, count(*)::int as laeufe
      from public.pfad_laeufe l
     where l.tag >= v_start and l.tag < v_start + 7 and l.status <> 'laeuft'
     group by l.user_id
  ), r as (
    select w.*, rank() over (order by w.punkte desc, w.laeufe asc) as rang from w
  )
  select jsonb_build_object('rang', r.rang, 'punkte', r.punkte) into v_ich from r where r.user_id = v_user;
  return jsonb_build_object('ok', true, 'woche', v_start, 'top', v_top, 'ich', v_ich);
end $$;

create or replace function public.pfad_heute()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.pfad_laeufe; v_schild boolean;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  perform public.pfad_verfallen(v_user);
  select * into s from public.pfad_laeufe where user_id = v_user and tag = public.pfad_heute_datum();
  if not found then
    -- Schild von gestern zeigen, damit man weiss, womit man startet
    select coalesce(bool_or(schild), false) into v_schild from public.pfad_laeufe
     where user_id = v_user and tag = public.pfad_heute_datum() - 1 and status <> 'laeuft';
    return jsonb_build_object('ok', true, 'lauf', null, 'schild', v_schild);
  end if;
  return jsonb_build_object('ok', true, 'lauf', public.pfad_sicht(s));
end $$;

create or replace function public.pfad_start(p_einsatz int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_tag date := public.pfad_heute_datum(); v_xp int; v_schild boolean; s public.pfad_laeufe;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_einsatz not in (5, 10, 20) then return jsonb_build_object('ok', false, 'error', 'einsatz'); end if;
  perform public.pfad_verfallen(v_user);
  if exists (select 1 from public.pfad_laeufe where user_id = v_user and tag = v_tag) then
    return jsonb_build_object('ok', false, 'error', 'heute_gespielt');
  end if;
  select coalesce(xp_total, 0) into v_xp from public.profiles where id = v_user for update;
  if v_xp < p_einsatz then return jsonb_build_object('ok', false, 'error', 'zu_wenig', 'pollen', v_xp); end if;
  select coalesce(bool_or(schild), false) into v_schild from public.pfad_laeufe
   where user_id = v_user and tag = v_tag - 1 and status <> 'laeuft';
  insert into public.pfad_laeufe (user_id, tag, einsatz, schild) values (v_user, v_tag, p_einsatz, v_schild) returning * into s;
  perform public.award_xp(v_user, -p_einsatz, 'pfad_einsatz', s.id);
  return jsonb_build_object('ok', true, 'lauf', public.pfad_sicht(s), 'pollen', v_xp - p_einsatz);
end $$;

create or replace function public.pfad_abschluss(s public.pfad_laeufe, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_gewinn int := 0; v_punkte int; v_xp int; r public.pfad_laeufe;
begin
  v_punkte := s.feld + case when p_status = 'ziel' then 5 else 0 end;
  if p_status in ('mitgenommen', 'ziel') then v_gewinn := floor(s.einsatz * s.stand)::int; end if;
  update public.pfad_laeufe set status = p_status, gewinn = v_gewinn, punkte = v_punkte, ended_at = now()
   where id = s.id returning * into r;
  if v_gewinn > 0 then v_xp := public.award_xp(r.user_id, v_gewinn, 'pfad_gewinn', r.id); end if;
  return jsonb_build_object('ok', true, 'lauf', public.pfad_sicht(r), 'pollen', v_xp);
end $$;

create or replace function public.pfad_mitnehmen(p_lauf uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.pfad_laeufe;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into s from public.pfad_laeufe where id = p_lauf and user_id = v_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_lauf'); end if;
  if s.status <> 'laeuft' then return jsonb_build_object('ok', false, 'error', 'beendet', 'lauf', public.pfad_sicht(s)); end if;
  if s.feld < 1 then return jsonb_build_object('ok', false, 'error', 'kein_feld'); end if;
  return public.pfad_abschluss(s, 'mitgenommen');
end $$;

create or replace function public.pfad_schritt(p_lauf uuid, p_weg text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.pfad_laeufe; z numeric := random(); v_erg text; v_feld int; v_stand numeric; v_schild boolean; v_eintrag jsonb; r jsonb;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_weg not in ('sicher', 'riskant', 'ereignis') then return jsonb_build_object('ok', false, 'error', 'weg'); end if;
  select * into s from public.pfad_laeufe where id = p_lauf and user_id = v_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_lauf'); end if;
  if s.status <> 'laeuft' then return jsonb_build_object('ok', false, 'error', 'beendet', 'lauf', public.pfad_sicht(s)); end if;
  if s.tag < public.pfad_heute_datum() then
    perform public.pfad_verfallen(v_user);
    select * into s from public.pfad_laeufe where id = p_lauf;
    return jsonb_build_object('ok', false, 'error', 'verfallen', 'lauf', public.pfad_sicht(s));
  end if;

  v_feld := s.feld; v_stand := s.stand; v_schild := s.schild;
  if p_weg = 'sicher' then
    if z < 0.08 then v_erg := 'wespe'; else v_erg := 'weiter'; v_feld := v_feld + 1; v_stand := v_stand + 0.10; end if;
  elsif p_weg = 'riskant' then
    if z < 0.35 then v_erg := 'wespe'; else v_erg := 'weiter'; v_feld := v_feld + 1; v_stand := v_stand + 0.50; end if;
  else
    if z < 0.30 then v_erg := 'wespe';
    elsif z < 0.55 then v_erg := 'bluete'; v_feld := v_feld + 1; v_stand := round(v_stand * 1.6, 2);
    elsif z < 0.75 then v_erg := 'regen'; v_feld := greatest(v_feld - 1, 0);
    else
      v_feld := v_feld + 1;
      if v_schild then v_erg := 'schild_doppelt'; v_stand := v_stand + 0.20; else v_erg := 'schild'; v_schild := true; end if;
    end if;
  end if;

  if v_erg = 'wespe' and s.schild then v_erg := 'schild_weg'; v_schild := false; end if;

  v_eintrag := jsonb_build_object('weg', p_weg, 'ergebnis', v_erg, 'feld', v_feld, 'stand', v_stand);
  update public.pfad_laeufe set feld = v_feld, stand = v_stand, schild = v_schild, schritte = schritte || v_eintrag
   where id = s.id returning * into s;

  if v_erg = 'wespe' then
    r := public.pfad_abschluss(s, 'verloren');
    return r || jsonb_build_object('ergebnis', v_erg);
  end if;
  if v_feld >= 10 then
    update public.pfad_laeufe set stand = stand + 0.30 where id = s.id returning * into s;
    r := public.pfad_abschluss(s, 'ziel');
    return r || jsonb_build_object('ergebnis', 'ziel');
  end if;
  return jsonb_build_object('ok', true, 'ergebnis', v_erg, 'lauf', public.pfad_sicht(s));
end $$;

-- Wochenabrechnung (Cron Montag 00:10 Zuerich = 22:10 UTC Sonntag im Sommer,
-- 23:10 im Winter; wir nehmen 23:15 UTC Sonntag, dann ist es in Zuerich sicher
-- schon Montag). Idempotent ueber pfad_wochenbonus.
create or replace function public.pfad_woche_abrechnen()
returns int language plpgsql security definer set search_path = public as $$
declare v_woche date := public.pfad_wochenstart(public.pfad_heute_datum() - 1); v_n int := 0; rec record;
begin
  if exists (select 1 from public.pfad_wochenbonus where woche = v_woche) then return 0; end if;
  for rec in
    with w as (
      select user_id, sum(punkte)::int as punkte, count(*)::int as laeufe
        from public.pfad_laeufe where tag >= v_woche and tag < v_woche + 7 and status <> 'laeuft'
       group by user_id
    )
    select user_id, punkte, rank() over (order by punkte desc, laeufe asc) as rang from w
  loop
    exit when rec.rang > 3 or rec.punkte <= 0;
    insert into public.pfad_wochenbonus (woche, user_id, rang, punkte, pollen)
    values (v_woche, rec.user_id, rec.rang, rec.punkte, case rec.rang when 1 then 50 when 2 then 30 else 20 end);
    perform public.award_xp(rec.user_id, case rec.rang when 1 then 50 when 2 then 30 else 20 end, 'pfad_wochenbonus', null);
    insert into public.notifications (user_id, type, title, message, link, is_read)
    values (rec.user_id, 'gamification', 'Pollenpfad: Platz ' || rec.rang,
      'Du warst diese Woche auf Platz ' || rec.rang || ' im Pollenpfad. +' || case rec.rang when 1 then 50 when 2 then 30 else 20 end || ' Pollen.',
      '/hive', false);
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

select cron.unschedule('pfad-woche-abrechnen') where exists (select 1 from cron.job where jobname = 'pfad-woche-abrechnen');
select cron.schedule('pfad-woche-abrechnen', '15 23 * * 0', $$select public.pfad_woche_abrechnen();$$);

revoke all on function public.pfad_heute() from public;
revoke all on function public.pfad_start(int) from public;
revoke all on function public.pfad_schritt(uuid, text) from public;
revoke all on function public.pfad_mitnehmen(uuid) from public;
revoke all on function public.pfad_rangliste() from public;
revoke all on function public.pfad_abschluss(public.pfad_laeufe, text) from public;
revoke all on function public.pfad_sicht(public.pfad_laeufe) from public;
revoke all on function public.pfad_verfallen(uuid) from public;
revoke all on function public.pfad_woche_abrechnen() from public;
grant execute on function public.pfad_heute() to authenticated;
grant execute on function public.pfad_start(int) to authenticated;
grant execute on function public.pfad_schritt(uuid, text) to authenticated;
grant execute on function public.pfad_mitnehmen(uuid) to authenticated;
grant execute on function public.pfad_rangliste() to authenticated;
