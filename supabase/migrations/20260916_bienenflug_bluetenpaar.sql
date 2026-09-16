-- 16.09.2026 (Denis): zwei weitere Tagesspiele im Hive, gleiche Oekonomie wie
-- das Wabenspiel (Einsatz 5/10/20 Pollen, einmal pro Tag, serverseitig
-- entschieden, leichter Hausvorteil). Tabellen ohne Policies, Zugriff nur
-- ueber die RPCs.
--
-- A) Bienenflug (Hoeher oder Tiefer): Karte 1..12 liegt offen, Tipp "hoch"
--    oder "tief" auf die naechste Karte (gleich = verloren). Jeder Treffer
--    hebt den Multiplikator 1.3 / 1.7 / 2.3 / 3.2 / 4.5 / 6.5, nach 6 Treffern
--    wird automatisch mitgenommen. Optimales Tippen trifft im Mittel zu 71 %,
--    der Erwartungswert liegt je nach Ausstieg bei 0.80-0.92 des Einsatzes.
--
-- B) Bluetenpaar (Memory): 12 Karten, 6 Paare, 8 Zuege (ein Zug = zwei Karten).
--    Auszahlung nach gefundenen Paaren: 0-1 = Einsatz weg, 2 = 0.7x, 3 = 1x,
--    4 = 1.5x, 5 = 2x, 6 = 3x. Geschicklichkeit statt Glueck.

-- ─── A) Bienenflug ───────────────────────────────────────────
create table if not exists public.flug_spiele (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tag         date not null,
  einsatz     int  not null check (einsatz in (5, 10, 20)),
  aktuell     int  not null,                -- offene Karte 1..12
  verlauf     int[] not null default '{}',  -- alle gezogenen Karten in Reihenfolge
  treffer     int  not null default 0,
  status      text not null default 'laeuft' check (status in ('laeuft','mitgenommen','verloren','verfallen')),
  gewinn      int  not null default 0,
  created_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create unique index if not exists flug_spiele_user_tag_uq on public.flug_spiele (user_id, tag);
alter table public.flug_spiele enable row level security;

create or replace function public.flug_multiplikator(n int)
returns numeric language sql immutable as $$
  select case n when 0 then 0 when 1 then 1.3 when 2 then 1.7 when 3 then 2.3
                when 4 then 3.2 when 5 then 4.5 else 6.5 end;
$$;

create or replace function public.flug_sicht(s public.flug_spiele)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', s.id, 'status', s.status, 'einsatz', s.einsatz, 'aktuell', s.aktuell,
    'verlauf', to_jsonb(s.verlauf), 'treffer', s.treffer,
    'multiplikator', public.flug_multiplikator(s.treffer),
    'stand', floor(s.einsatz * public.flug_multiplikator(s.treffer))::int,
    'gewinn', s.gewinn
  );
$$;

create or replace function public.flug_heute()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.flug_spiele;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  update public.flug_spiele set status = 'verfallen', ended_at = now()
   where user_id = v_user and status = 'laeuft' and tag < (now() at time zone 'Europe/Zurich')::date;
  select * into s from public.flug_spiele where user_id = v_user and tag = (now() at time zone 'Europe/Zurich')::date;
  if not found then return jsonb_build_object('ok', true, 'spiel', null); end if;
  return jsonb_build_object('ok', true, 'spiel', public.flug_sicht(s));
end $$;

create or replace function public.flug_start(p_einsatz int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_tag date := (now() at time zone 'Europe/Zurich')::date;
        v_xp int; v_karte int; s public.flug_spiele;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_einsatz not in (5, 10, 20) then return jsonb_build_object('ok', false, 'error', 'einsatz'); end if;
  update public.flug_spiele set status = 'verfallen', ended_at = now()
   where user_id = v_user and status = 'laeuft' and tag < v_tag;
  if exists (select 1 from public.flug_spiele where user_id = v_user and tag = v_tag) then
    return jsonb_build_object('ok', false, 'error', 'heute_gespielt');
  end if;
  select coalesce(xp_total, 0) into v_xp from public.profiles where id = v_user for update;
  if v_xp < p_einsatz then return jsonb_build_object('ok', false, 'error', 'zu_wenig', 'pollen', v_xp); end if;
  v_karte := 1 + floor(random() * 12)::int;
  insert into public.flug_spiele (user_id, tag, einsatz, aktuell, verlauf)
  values (v_user, v_tag, p_einsatz, v_karte, array[v_karte]) returning * into s;
  perform public.award_xp(v_user, -p_einsatz, 'flug_einsatz', s.id);
  return jsonb_build_object('ok', true, 'spiel', public.flug_sicht(s), 'pollen', v_xp - p_einsatz);
end $$;

create or replace function public.flug_mitnehmen(p_spiel uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.flug_spiele; v_gewinn int; v_xp int;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into s from public.flug_spiele where id = p_spiel and user_id = v_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_spiel'); end if;
  if s.status <> 'laeuft' then return jsonb_build_object('ok', false, 'error', 'beendet', 'spiel', public.flug_sicht(s)); end if;
  if s.treffer = 0 then return jsonb_build_object('ok', false, 'error', 'kein_treffer'); end if;
  v_gewinn := floor(s.einsatz * public.flug_multiplikator(s.treffer))::int;
  update public.flug_spiele set status = 'mitgenommen', gewinn = v_gewinn, ended_at = now() where id = s.id returning * into s;
  v_xp := public.award_xp(v_user, v_gewinn, 'flug_gewinn', s.id);
  return jsonb_build_object('ok', true, 'spiel', public.flug_sicht(s), 'pollen', v_xp);
end $$;

create or replace function public.flug_tipp(p_spiel uuid, p_tipp text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.flug_spiele; v_next int; v_richtig boolean;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_tipp not in ('hoch', 'tief') then return jsonb_build_object('ok', false, 'error', 'tipp'); end if;
  select * into s from public.flug_spiele where id = p_spiel and user_id = v_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_spiel'); end if;
  if s.status <> 'laeuft' then return jsonb_build_object('ok', false, 'error', 'beendet', 'spiel', public.flug_sicht(s)); end if;
  if s.tag < (now() at time zone 'Europe/Zurich')::date then
    update public.flug_spiele set status = 'verfallen', ended_at = now() where id = s.id returning * into s;
    return jsonb_build_object('ok', false, 'error', 'verfallen', 'spiel', public.flug_sicht(s));
  end if;
  v_next := 1 + floor(random() * 12)::int;
  v_richtig := (p_tipp = 'hoch' and v_next > s.aktuell) or (p_tipp = 'tief' and v_next < s.aktuell);
  if not v_richtig then
    update public.flug_spiele set status = 'verloren', aktuell = v_next, verlauf = verlauf || v_next, ended_at = now()
     where id = s.id returning * into s;
    return jsonb_build_object('ok', true, 'richtig', false, 'spiel', public.flug_sicht(s));
  end if;
  update public.flug_spiele set aktuell = v_next, verlauf = verlauf || v_next, treffer = treffer + 1
   where id = s.id returning * into s;
  if s.treffer >= 6 then return public.flug_mitnehmen(s.id); end if;
  return jsonb_build_object('ok', true, 'richtig', true, 'spiel', public.flug_sicht(s));
end $$;

-- ─── B) Bluetenpaar ──────────────────────────────────────────
create table if not exists public.paar_spiele (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tag         date not null,
  einsatz     int  not null check (einsatz in (5, 10, 20)),
  karten      int[] not null,               -- 12 Werte 0..5, jeder doppelt, gemischt
  gefunden    int[] not null default '{}',  -- Indizes gefundener Karten
  erste       int,                          -- erste Karte des laufenden Zugs
  zuege       int  not null default 0,
  status      text not null default 'laeuft' check (status in ('laeuft','fertig','verfallen')),
  paare       int  not null default 0,
  gewinn      int  not null default 0,
  created_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create unique index if not exists paar_spiele_user_tag_uq on public.paar_spiele (user_id, tag);
alter table public.paar_spiele enable row level security;

create or replace function public.paar_multiplikator(n int)
returns numeric language sql immutable as $$
  select case n when 2 then 0.7 when 3 then 1 when 4 then 1.5 when 5 then 2 when 6 then 3 else 0 end;
$$;

-- Sicht: Werte nur fuer gefundene Karten und die offene erste Karte;
-- nach Spielende alle Werte.
create or replace function public.paar_sicht(s public.paar_spiele)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', s.id, 'status', s.status, 'einsatz', s.einsatz, 'zuege', s.zuege, 'paare', s.paare,
    'gefunden', to_jsonb(s.gefunden), 'erste', s.erste,
    'werte', (select jsonb_agg(case when s.status <> 'laeuft' or i - 1 = any(s.gefunden) or i - 1 = s.erste
                                    then to_jsonb(s.karten[i]) else 'null'::jsonb end order by i)
              from generate_series(1, 12) as i),
    'multiplikator', public.paar_multiplikator(s.paare),
    'stand', floor(s.einsatz * public.paar_multiplikator(s.paare))::int,
    'gewinn', s.gewinn
  );
$$;

create or replace function public.paar_heute()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.paar_spiele;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  update public.paar_spiele set status = 'verfallen', ended_at = now()
   where user_id = v_user and status = 'laeuft' and tag < (now() at time zone 'Europe/Zurich')::date;
  select * into s from public.paar_spiele where user_id = v_user and tag = (now() at time zone 'Europe/Zurich')::date;
  if not found then return jsonb_build_object('ok', true, 'spiel', null); end if;
  return jsonb_build_object('ok', true, 'spiel', public.paar_sicht(s));
end $$;

create or replace function public.paar_start(p_einsatz int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_tag date := (now() at time zone 'Europe/Zurich')::date;
        v_xp int; v_karten int[]; s public.paar_spiele;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_einsatz not in (5, 10, 20) then return jsonb_build_object('ok', false, 'error', 'einsatz'); end if;
  update public.paar_spiele set status = 'verfallen', ended_at = now()
   where user_id = v_user and status = 'laeuft' and tag < v_tag;
  if exists (select 1 from public.paar_spiele where user_id = v_user and tag = v_tag) then
    return jsonb_build_object('ok', false, 'error', 'heute_gespielt');
  end if;
  select coalesce(xp_total, 0) into v_xp from public.profiles where id = v_user for update;
  if v_xp < p_einsatz then return jsonb_build_object('ok', false, 'error', 'zu_wenig', 'pollen', v_xp); end if;
  select array_agg(w order by random()) into v_karten from unnest(array[0,0,1,1,2,2,3,3,4,4,5,5]) as w;
  insert into public.paar_spiele (user_id, tag, einsatz, karten)
  values (v_user, v_tag, p_einsatz, v_karten) returning * into s;
  perform public.award_xp(v_user, -p_einsatz, 'paar_einsatz', s.id);
  return jsonb_build_object('ok', true, 'spiel', public.paar_sicht(s), 'pollen', v_xp - p_einsatz);
end $$;

-- Eine Karte umdrehen. Erste Karte des Zugs: nur merken. Zweite Karte:
-- vergleichen, Zug zaehlen; bei 8 Zuegen oder 6 Paaren auszahlen.
create or replace function public.paar_aufdecken(p_spiel uuid, p_karte int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); s public.paar_spiele; v_treffer boolean; v_gewinn int; v_xp int; v_erste int;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_karte < 0 or p_karte > 11 then return jsonb_build_object('ok', false, 'error', 'karte'); end if;
  select * into s from public.paar_spiele where id = p_spiel and user_id = v_user for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_spiel'); end if;
  if s.status <> 'laeuft' then return jsonb_build_object('ok', false, 'error', 'beendet', 'spiel', public.paar_sicht(s)); end if;
  if s.tag < (now() at time zone 'Europe/Zurich')::date then
    update public.paar_spiele set status = 'verfallen', ended_at = now() where id = s.id returning * into s;
    return jsonb_build_object('ok', false, 'error', 'verfallen', 'spiel', public.paar_sicht(s));
  end if;
  if p_karte = any(s.gefunden) or p_karte = s.erste then
    return jsonb_build_object('ok', true, 'spiel', public.paar_sicht(s));
  end if;

  if s.erste is null then
    update public.paar_spiele set erste = p_karte where id = s.id returning * into s;
    return jsonb_build_object('ok', true, 'phase', 'erste', 'spiel', public.paar_sicht(s));
  end if;

  v_erste := s.erste;
  v_treffer := s.karten[v_erste + 1] = s.karten[p_karte + 1];
  if v_treffer then
    update public.paar_spiele set gefunden = gefunden || array[v_erste, p_karte], paare = paare + 1, zuege = zuege + 1, erste = null
     where id = s.id returning * into s;
  else
    update public.paar_spiele set zuege = zuege + 1, erste = null where id = s.id returning * into s;
  end if;

  if s.zuege >= 8 or s.paare >= 6 then
    v_gewinn := floor(s.einsatz * public.paar_multiplikator(s.paare))::int;
    update public.paar_spiele set status = 'fertig', gewinn = v_gewinn, ended_at = now() where id = s.id returning * into s;
    if v_gewinn > 0 then v_xp := public.award_xp(v_user, v_gewinn, 'paar_gewinn', s.id); end if;
    return jsonb_build_object('ok', true, 'phase', 'fertig', 'treffer', v_treffer,
      'zweite', jsonb_build_object('a', v_erste, 'b', p_karte, 'wa', s.karten[v_erste + 1], 'wb', s.karten[p_karte + 1]),
      'spiel', public.paar_sicht(s), 'pollen', v_xp);
  end if;
  -- Beide Werte des Zugs mitgeben, damit der Browser sie kurz zeigen kann
  return jsonb_build_object('ok', true, 'phase', 'zweite', 'treffer', v_treffer,
    'zweite', jsonb_build_object('a', v_erste, 'b', p_karte, 'wa', s.karten[v_erste + 1], 'wb', s.karten[p_karte + 1]),
    'spiel', public.paar_sicht(s));
end $$;

revoke all on function public.flug_heute() from public;
revoke all on function public.flug_start(int) from public;
revoke all on function public.flug_tipp(uuid, text) from public;
revoke all on function public.flug_mitnehmen(uuid) from public;
revoke all on function public.flug_sicht(public.flug_spiele) from public;
revoke all on function public.paar_heute() from public;
revoke all on function public.paar_start(int) from public;
revoke all on function public.paar_aufdecken(uuid, int) from public;
revoke all on function public.paar_sicht(public.paar_spiele) from public;
grant execute on function public.flug_heute() to authenticated;
grant execute on function public.flug_start(int) to authenticated;
grant execute on function public.flug_tipp(uuid, text) to authenticated;
grant execute on function public.flug_mitnehmen(uuid) to authenticated;
grant execute on function public.paar_heute() to authenticated;
grant execute on function public.paar_start(int) to authenticated;
grant execute on function public.paar_aufdecken(uuid, int) to authenticated;
