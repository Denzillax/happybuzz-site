-- 16.09.2026 (Denis): Texas Hold'em mit Pollen, zeitversetzt. Der komplette
-- Dealer laeuft hier: Mischen, Blinds, Setzrunden, Side-Pots, Showdown.
-- Tabellen ohne Policies (RLS an), Zugriff nur ueber RPCs. Deck und fremde
-- Karten verlassen die Datenbank erst beim Showdown.
-- Karten 0..51: rang = c % 13 (0 = Zwei ... 12 = Ass), farbe = c / 13.

create table if not exists public.poker_tische (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  creator_id  uuid not null references public.profiles(id) on delete cascade,
  buy_in      int  not null check (buy_in in (20, 50, 100)),
  sb          int  not null,
  bb          int  not null,
  max_seats   int  not null check (max_seats between 2 and 6),
  status      text not null default 'offen' check (status in ('offen','laeuft','geschlossen')),
  hand_nr     int  not null default 0,
  dealer_seat int,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.poker_tische enable row level security;

create table if not exists public.poker_sitze (
  tisch_id   uuid not null references public.poker_tische(id) on delete cascade,
  seat       int  not null check (seat between 0 and 5),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  chips      int  not null default 0,
  status     text not null default 'aktiv' check (status in ('aktiv','geht')),  -- geht = steht nach der Hand auf
  joined_at  timestamptz not null default now(),
  primary key (tisch_id, seat),
  unique (tisch_id, user_id)
);
alter table public.poker_sitze enable row level security;

create table if not exists public.poker_haende (
  id            uuid primary key default gen_random_uuid(),
  tisch_id      uuid not null references public.poker_tische(id) on delete cascade,
  nr            int  not null,
  dealer_seat   int  not null,
  deck          int[] not null,
  deck_pos      int  not null default 0,
  board         int[] not null default '{}',
  phase         text not null default 'preflop' check (phase in ('preflop','flop','turn','river','fertig')),
  karten        jsonb not null default '{}'::jsonb,   -- {"seat": [c1, c2]}
  eingesetzt    jsonb not null default '{}'::jsonb,   -- diese Strasse
  gesamt        jsonb not null default '{}'::jsonb,   -- ganze Hand
  gefoldet      int[] not null default '{}',
  allin         int[] not null default '{}',
  gehandelt     int[] not null default '{}',
  spieler       int[] not null,                       -- Sitze, die in dieser Hand dabei sind
  aktueller_sitz int,
  aktueller_einsatz int not null default 0,
  min_raise     int  not null default 0,
  deadline      timestamptz,
  log           jsonb not null default '[]'::jsonb,
  ergebnis      jsonb,
  created_at    timestamptz not null default now(),
  ended_at      timestamptz
);
create index if not exists poker_haende_tisch_idx on public.poker_haende (tisch_id, nr desc);
create index if not exists poker_haende_deadline_idx on public.poker_haende (deadline) where phase <> 'fertig';
alter table public.poker_haende enable row level security;

-- ─── Hilfen ──────────────────────────────────────────────────
create or replace function public.poker_jget(j jsonb, s int) returns int language sql immutable as $$
  select coalesce((j ->> s::text)::int, 0) $$;
create or replace function public.poker_jset(j jsonb, s int, v int) returns jsonb language sql immutable as $$
  select jsonb_set(j, array[s::text], to_jsonb(v), true) $$;

create or replace function public.poker_kartenname(c int) returns text language sql immutable as $$
  select (array['2','3','4','5','6','7','8','9','10','J','Q','K','A'])[c % 13 + 1] || (array['♠','♥','♦','♣'])[c / 13 + 1] $$;

-- Bewertung von genau 5 Karten: Kategorie * 15^5 + Kicker (Rang+2 als Ziffern zur Basis 15)
create or replace function public.poker_bewerte5(k int[])
returns bigint language plpgsql immutable as $$
declare
  r int[] := '{}'; cnt int[] := array_fill(0, array[13]); i int; j int;
  flush boolean; straight boolean; hi int := -1;
  quads int := -1; trips int := -1; paare int[] := '{}'; kick int[] := '{}';
  cat int; t int[] := '{}'; score bigint;
begin
  for i in 1..5 loop cnt[k[i] % 13 + 1] := cnt[k[i] % 13 + 1] + 1; end loop;
  flush := (k[1]/13 = k[2]/13 and k[2]/13 = k[3]/13 and k[3]/13 = k[4]/13 and k[4]/13 = k[5]/13);
  -- Straight (Ass auch als Eins)
  straight := false;
  for i in reverse 12..4 loop
    if cnt[i+1] = 1 and cnt[i] = 1 and cnt[i-1] = 1 and cnt[i-2] = 1 and cnt[i-3] = 1 then straight := true; hi := i; exit; end if;
  end loop;
  if not straight and cnt[13] = 1 and cnt[1] = 1 and cnt[2] = 1 and cnt[3] = 1 and cnt[4] = 1 then straight := true; hi := 3; end if;
  for i in reverse 12..0 loop
    if cnt[i+1] = 4 then quads := i;
    elsif cnt[i+1] = 3 then trips := i;
    elsif cnt[i+1] = 2 then paare := paare || i;
    elsif cnt[i+1] = 1 then kick := kick || i;
    end if;
  end loop;
  if straight and flush then cat := 8; t := array[hi];
  elsif quads >= 0 then cat := 7; t := array[quads] || kick;
  elsif trips >= 0 and array_length(paare, 1) >= 1 then cat := 6; t := array[trips, paare[1]];
  elsif flush then cat := 5; t := kick;
  elsif straight then cat := 4; t := array[hi];
  elsif trips >= 0 then cat := 3; t := array[trips] || kick;
  elsif array_length(paare, 1) = 2 then cat := 2; t := paare || kick;
  elsif array_length(paare, 1) = 1 then cat := 1; t := paare || kick;
  else cat := 0; t := kick; end if;
  score := cat;
  for i in 1..5 loop score := score * 15 + coalesce(t[i], 0); end loop;
  return score;
end $$;

create or replace function public.poker_bewerte7(k int[])
returns bigint language plpgsql immutable as $$
declare best bigint := -1; s bigint; a int; b int; c int; d int; e int; n int := array_length(k, 1);
begin
  for a in 1..n-4 loop for b in a+1..n-3 loop for c in b+1..n-2 loop for d in c+1..n-1 loop for e in d+1..n loop
    s := public.poker_bewerte5(array[k[a], k[b], k[c], k[d], k[e]]);
    if s > best then best := s; end if;
  end loop; end loop; end loop; end loop; end loop;
  return best;
end $$;

create or replace function public.poker_blattname(score bigint) returns text language sql immutable as $$
  select (array['Hohe Karte','Ein Paar','Zwei Paare','Drilling','Strasse','Flush','Full House','Vierling','Straight Flush'])[(score / 759375)::int + 1] $$;

-- Naechster Sitz in s_liste nach s (zyklisch)
create or replace function public.poker_naechster(s_liste int[], s int) returns int language sql immutable as $$
  select coalesce((select min(x) from unnest(s_liste) x where x > s), (select min(x) from unnest(s_liste) x)) $$;

create or replace function public.poker_benachrichtigen(p_tisch uuid, p_user uuid, p_titel text, p_text text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, message, link, is_read)
  values (p_user, 'poker', p_titel, p_text, '/poker/' || p_tisch, false);
end $$;

-- ─── Neue Hand ───────────────────────────────────────────────
create or replace function public.poker_neue_hand(p_tisch uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.poker_tische; sp int[]; s int; deck int[]; h public.poker_haende;
  dealer int; sb_seat int; bb_seat int; erster int; k jsonb := '{}'::jsonb; e jsonb := '{}'::jsonb; g jsonb := '{}'::jsonb;
  allin int[] := '{}'; betrag int; pos int := 0; u uuid; n int; lg jsonb := '[]'::jsonb;
begin
  select * into t from public.poker_tische where id = p_tisch for update;
  -- Sitze aufraeumen: 0 Chips oder "geht" -> aufstehen (Chips zurueck als Pollen)
  for s, u, betrag in select seat, user_id, chips from public.poker_sitze where tisch_id = p_tisch and (chips <= 0 or status = 'geht') loop
    if betrag > 0 then perform public.award_xp(u, betrag, 'poker_cashout', p_tisch); end if;
    delete from public.poker_sitze where tisch_id = p_tisch and seat = s;
    perform public.poker_benachrichtigen(p_tisch, u, 'Poker: Tisch verlassen',
      case when betrag > 0 then 'Du hast ' || t.name || ' mit ' || betrag || ' Pollen verlassen.' else 'Deine Chips sind aufgebraucht, du hast ' || t.name || ' verlassen.' end);
  end loop;
  select array_agg(seat order by seat) into sp from public.poker_sitze where tisch_id = p_tisch and chips > 0;
  n := coalesce(array_length(sp, 1), 0);
  if n < 2 then
    update public.poker_tische set status = case when n = 0 then 'geschlossen' else 'offen' end, updated_at = now() where id = p_tisch;
    return;
  end if;
  dealer := case when t.dealer_seat is null then sp[1] else public.poker_naechster(sp, t.dealer_seat) end;
  if n = 2 then sb_seat := dealer; bb_seat := public.poker_naechster(sp, dealer);
  else sb_seat := public.poker_naechster(sp, dealer); bb_seat := public.poker_naechster(sp, sb_seat); end if;
  select array_agg(c order by random()) into deck from generate_series(0, 51) c;
  foreach s in array sp loop
    k := jsonb_set(k, array[s::text], to_jsonb(array[deck[pos + 1], deck[pos + 2]]), true); pos := pos + 2;
  end loop;
  -- Blinds
  foreach s in array array[sb_seat, bb_seat] loop
    betrag := least((select chips from public.poker_sitze where tisch_id = p_tisch and seat = s), case when s = sb_seat then t.sb else t.bb end);
    update public.poker_sitze set chips = chips - betrag where tisch_id = p_tisch and seat = s;
    e := public.poker_jset(e, s, betrag); g := public.poker_jset(g, s, betrag);
    if (select chips from public.poker_sitze where tisch_id = p_tisch and seat = s) = 0 then allin := allin || s; end if;
    lg := lg || jsonb_build_object('seat', s, 'aktion', case when s = sb_seat then 'small_blind' else 'big_blind' end, 'betrag', betrag, 'phase', 'preflop', 'zeit', now());
  end loop;
  erster := public.poker_naechster(sp, bb_seat);
  -- Wer allin ist, kann nicht handeln: weiter zum naechsten
  while erster = any(allin) loop erster := public.poker_naechster(sp, erster); exit when erster = bb_seat; end loop;
  insert into public.poker_haende (tisch_id, nr, dealer_seat, deck, deck_pos, karten, eingesetzt, gesamt, allin, spieler,
                                   aktueller_sitz, aktueller_einsatz, min_raise, deadline, log)
  values (p_tisch, t.hand_nr + 1, dealer, deck, pos, k, e, g, allin, sp, erster, t.bb, t.bb, now() + interval '12 hours', lg)
  returning * into h;
  update public.poker_tische set status = 'laeuft', hand_nr = hand_nr + 1, dealer_seat = dealer, updated_at = now() where id = p_tisch;
  select user_id into u from public.poker_sitze where tisch_id = p_tisch and seat = erster;
  perform public.poker_benachrichtigen(p_tisch, u, 'Poker: du bist am Zug', 'Neue Hand an ' || t.name || '. Du hast 12 Stunden.');
  -- Falls niemand mehr handeln kann (alle durch die Blinds allin): direkt durchspielen
  if (select count(*) from unnest(sp) x where not (x = any(allin))) = 0 then perform public.poker_pruefe_runde(h.id); end if;
end $$;

-- ─── Showdown / Hand beenden ─────────────────────────────────
create or replace function public.poker_hand_beenden(p_hand uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  h public.poker_haende; t public.poker_tische; kont int[]; s int; scores jsonb := '{}'::jsonb; sc bigint;
  gesamt_pot int := 0; rake int; levels int[]; lvl int; prev int := 0; pot_lvl int; berechtigt int[]; best bigint; gewinner int[];
  anteil int; rest int; verteilt jsonb := '{}'::jsonb; erg jsonb := '[]'::jsonb; u uuid; ks int[]; i int; erster_nach_dealer int;
begin
  select * into h from public.poker_haende where id = p_hand for update;
  select * into t from public.poker_tische where id = h.tisch_id;
  select coalesce(array_agg(x order by x), '{}') into kont from unnest(h.spieler) x where not (x = any(h.gefoldet));
  -- Board auffuellen, falls die Hand durch Allins vorzeitig zum Showdown kommt
  if array_length(kont, 1) >= 2 then
    while coalesce(array_length(h.board, 1), 0) < 5 loop
      h.board := h.board || h.deck[h.deck_pos + 1]; h.deck_pos := h.deck_pos + 1;
    end loop;
  end if;
  foreach s in array h.spieler loop gesamt_pot := gesamt_pot + public.poker_jget(h.gesamt, s); end loop;
  rake := floor(gesamt_pot * 0.02)::int;
  if array_length(kont, 1) = 1 then
    -- Alle anderen haben gepasst
    s := kont[1];
    verteilt := public.poker_jset(verteilt, s, gesamt_pot - rake);
    erg := erg || jsonb_build_object('seat', s, 'gewinn', gesamt_pot - rake, 'blatt', 'Alle anderen haben gepasst', 'karten', null);
  else
    foreach s in array kont loop
      ks := (select array_agg(v::int) from jsonb_array_elements_text(h.karten -> s::text) v) || h.board;
      sc := public.poker_bewerte7(ks);
      scores := jsonb_set(scores, array[s::text], to_jsonb(sc), true);
    end loop;
    -- Side-Pots ueber Einsatzstufen der Kontrahenten
    select array_agg(distinct public.poker_jget(h.gesamt, x) order by public.poker_jget(h.gesamt, x)) into levels from unnest(kont) x;
    erster_nach_dealer := public.poker_naechster(kont, h.dealer_seat);
    foreach lvl in array levels loop
      pot_lvl := 0;
      foreach s in array h.spieler loop pot_lvl := pot_lvl + greatest(least(public.poker_jget(h.gesamt, s), lvl) - prev, 0); end loop;
      if prev = 0 then pot_lvl := pot_lvl - rake; end if;
      prev := lvl;
      select array_agg(x) into berechtigt from unnest(kont) x where public.poker_jget(h.gesamt, x) >= lvl;
      select max((scores ->> x::text)::bigint) into best from unnest(berechtigt) x;
      select array_agg(x order by x) into gewinner from unnest(berechtigt) x where (scores ->> x::text)::bigint = best;
      anteil := pot_lvl / array_length(gewinner, 1); rest := pot_lvl - anteil * array_length(gewinner, 1);
      foreach s in array gewinner loop verteilt := public.poker_jset(verteilt, s, public.poker_jget(verteilt, s) + anteil); end loop;
      -- Rest an den ersten Gewinner links vom Dealer
      if rest > 0 then
        s := erster_nach_dealer;
        while not (s = any(gewinner)) loop s := public.poker_naechster(kont, s); end loop;
        verteilt := public.poker_jset(verteilt, s, public.poker_jget(verteilt, s) + rest);
      end if;
    end loop;
    foreach s in array kont loop
      erg := erg || jsonb_build_object('seat', s, 'gewinn', public.poker_jget(verteilt, s),
        'blatt', public.poker_blattname((scores ->> s::text)::bigint), 'karten', h.karten -> s::text);
    end loop;
  end if;
  foreach s in array h.spieler loop
    if public.poker_jget(verteilt, s) > 0 then
      update public.poker_sitze set chips = chips + public.poker_jget(verteilt, s) where tisch_id = h.tisch_id and seat = s;
    end if;
  end loop;
  update public.poker_haende set phase = 'fertig', board = h.board, deck_pos = h.deck_pos, ergebnis = erg, aktueller_sitz = null, deadline = null, ended_at = now(),
    log = log || jsonb_build_object('aktion', 'ende', 'rake', rake, 'zeit', now())
   where id = p_hand;
  -- Naechste Hand
  perform public.poker_neue_hand(h.tisch_id);
end $$;

-- ─── Runde pruefen: Strasse fertig? Naechster Spieler? ───────
create or replace function public.poker_pruefe_runde(p_hand uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h public.poker_haende; aktiv int[]; koennen int[]; s int; fertig boolean; naechste text; u uuid; t public.poker_tische; n int;
begin
  select * into h from public.poker_haende where id = p_hand for update;
  if h.phase = 'fertig' then return; end if;
  select * into t from public.poker_tische where id = h.tisch_id;
  select coalesce(array_agg(x order by x), '{}') into aktiv from unnest(h.spieler) x where not (x = any(h.gefoldet));
  if array_length(aktiv, 1) = 1 then perform public.poker_hand_beenden(p_hand); return; end if;
  select coalesce(array_agg(x order by x), '{}') into koennen from unnest(aktiv) x where not (x = any(h.allin));
  -- Strasse fertig, wenn alle handlungsfaehigen gehandelt haben und gleich hoch drin sind
  fertig := true;
  foreach s in array koennen loop
    if not (s = any(h.gehandelt)) or public.poker_jget(h.eingesetzt, s) < h.aktueller_einsatz then fertig := false; end if;
  end loop;
  if coalesce(array_length(koennen, 1), 0) <= 1 and fertig then
    -- hoechstens einer kann noch handeln und alles ist ausgeglichen: Rest austeilen
    perform public.poker_hand_beenden(p_hand); return;
  end if;
  if not fertig then
    -- naechster handlungsfaehiger Spieler
    s := h.aktueller_sitz;
    loop
      s := public.poker_naechster(aktiv, s);
      exit when s = any(koennen);
    end loop;
    update public.poker_haende set aktueller_sitz = s, deadline = now() + interval '12 hours' where id = p_hand;
    select user_id into u from public.poker_sitze where tisch_id = h.tisch_id and seat = s;
    perform public.poker_benachrichtigen(h.tisch_id, u, 'Poker: du bist am Zug', 'An ' || t.name || ' bist du dran. Du hast 12 Stunden.');
    return;
  end if;
  -- Naechste Strasse
  if h.phase = 'river' then perform public.poker_hand_beenden(p_hand); return; end if;
  naechste := case h.phase when 'preflop' then 'flop' when 'flop' then 'turn' else 'river' end;
  n := case when naechste = 'flop' then 3 else 1 end;
  h.deck_pos := h.deck_pos + 1;  -- eine Karte verbrennen
  for s in 1..n loop h.board := h.board || h.deck[h.deck_pos + 1]; h.deck_pos := h.deck_pos + 1; end loop;
  -- erster Spieler nach dem Dealer, der handeln kann
  s := h.dealer_seat;
  loop s := public.poker_naechster(aktiv, s); exit when s = any(koennen); end loop;
  update public.poker_haende set phase = naechste, board = h.board, deck_pos = h.deck_pos, eingesetzt = '{}'::jsonb, aktueller_einsatz = 0,
    min_raise = t.bb, gehandelt = '{}', aktueller_sitz = s, deadline = now() + interval '12 hours',
    log = log || jsonb_build_object('aktion', naechste, 'board', to_jsonb(h.board), 'zeit', now())
   where id = p_hand;
  select user_id into u from public.poker_sitze where tisch_id = h.tisch_id and seat = s;
  perform public.poker_benachrichtigen(h.tisch_id, u, 'Poker: du bist am Zug', case naechste when 'flop' then 'Der Flop liegt' when 'turn' then 'Der Turn liegt' else 'Der River liegt' end || ' an ' || t.name || '. Du hast 12 Stunden.');
end $$;

-- ─── Aktion eines Spielers (intern, ohne Auth-Pruefung) ──────
create or replace function public.poker_aktion_intern(p_hand uuid, p_seat int, p_aktion text, p_betrag int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h public.poker_haende; v_chips int; to_call int; zahl int; neu int; e int;
begin
  select * into h from public.poker_haende where id = p_hand for update;
  if h.phase = 'fertig' or h.aktueller_sitz <> p_seat then return jsonb_build_object('ok', false, 'error', 'nicht_dran'); end if;
  select ps.chips into v_chips from public.poker_sitze ps where ps.tisch_id = h.tisch_id and ps.seat = p_seat;
  e := public.poker_jget(h.eingesetzt, p_seat);
  to_call := h.aktueller_einsatz - e;
  if p_aktion = 'fold' then
    h.gefoldet := h.gefoldet || p_seat;
  elsif p_aktion = 'check' then
    if to_call > 0 then return jsonb_build_object('ok', false, 'error', 'check_nicht_moeglich'); end if;
  elsif p_aktion = 'call' then
    if to_call <= 0 then return jsonb_build_object('ok', false, 'error', 'nichts_zu_callen'); end if;
    zahl := least(to_call, v_chips);
    h.eingesetzt := public.poker_jset(h.eingesetzt, p_seat, e + zahl);
    h.gesamt := public.poker_jset(h.gesamt, p_seat, public.poker_jget(h.gesamt, p_seat) + zahl);
    v_chips := v_chips - zahl;
    if v_chips = 0 then h.allin := h.allin || p_seat; end if;
  elsif p_aktion in ('raise', 'allin') then
    neu := case when p_aktion = 'allin' then e + v_chips else p_betrag end;  -- Erhoehen AUF neu
    if neu > e + v_chips then return jsonb_build_object('ok', false, 'error', 'zu_wenig_chips'); end if;
    if neu < h.aktueller_einsatz + h.min_raise and neu < e + v_chips then
      return jsonb_build_object('ok', false, 'error', 'min_raise', 'min', h.aktueller_einsatz + h.min_raise);
    end if;
    zahl := neu - e;
    if zahl <= 0 then return jsonb_build_object('ok', false, 'error', 'betrag'); end if;
    h.eingesetzt := public.poker_jset(h.eingesetzt, p_seat, neu);
    h.gesamt := public.poker_jset(h.gesamt, p_seat, public.poker_jget(h.gesamt, p_seat) + zahl);
    v_chips := v_chips - zahl;
    if v_chips = 0 then h.allin := h.allin || p_seat; end if;
    if neu > h.aktueller_einsatz then
      if neu - h.aktueller_einsatz >= h.min_raise then h.min_raise := neu - h.aktueller_einsatz; end if;
      h.aktueller_einsatz := neu;
      h.gehandelt := '{}';  -- alle anderen muessen wieder reagieren
    end if;
  else
    return jsonb_build_object('ok', false, 'error', 'aktion');
  end if;
  update public.poker_sitze ps set chips = v_chips where ps.tisch_id = h.tisch_id and ps.seat = p_seat;
  h.gehandelt := (select coalesce(array_agg(distinct x), '{}') from unnest(h.gehandelt || p_seat) x);
  update public.poker_haende set eingesetzt = h.eingesetzt, gesamt = h.gesamt, gefoldet = h.gefoldet, allin = h.allin, gehandelt = h.gehandelt,
    aktueller_einsatz = h.aktueller_einsatz, min_raise = h.min_raise,
    log = log || jsonb_build_object('seat', p_seat, 'aktion', p_aktion, 'betrag', coalesce(zahl, 0), 'phase', h.phase, 'zeit', now())
   where id = p_hand;
  perform public.poker_pruefe_runde(p_hand);
  return jsonb_build_object('ok', true);
end $$;

-- ─── Oeffentliche RPCs ───────────────────────────────────────
create or replace function public.poker_tisch_erstellen(p_name text, p_buy_in int, p_max int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_sb int; v_id uuid;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_buy_in not in (20, 50, 100) or p_max not between 2 and 6 then return jsonb_build_object('ok', false, 'error', 'parameter'); end if;
  if coalesce(length(trim(p_name)), 0) < 2 then return jsonb_build_object('ok', false, 'error', 'name'); end if;
  if (select count(*) from public.poker_tische where creator_id = v_user and status <> 'geschlossen') >= 3 then
    return jsonb_build_object('ok', false, 'error', 'zu_viele_tische');
  end if;
  v_sb := greatest(1, round(p_buy_in / 20.0)::int);
  insert into public.poker_tische (name, creator_id, buy_in, sb, bb, max_seats)
  values (left(trim(p_name), 40), v_user, p_buy_in, v_sb, v_sb * 2, p_max) returning id into v_id;
  return public.poker_setzen(v_id);
end $$;

create or replace function public.poker_setzen(p_tisch uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); t public.poker_tische; v_xp int; v_seat int; n int;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into t from public.poker_tische where id = p_tisch for update;
  if not found or t.status = 'geschlossen' then return jsonb_build_object('ok', false, 'error', 'kein_tisch'); end if;
  if exists (select 1 from public.poker_sitze where tisch_id = p_tisch and user_id = v_user) then return jsonb_build_object('ok', false, 'error', 'sitzt_schon'); end if;
  select count(*) into n from public.poker_sitze where tisch_id = p_tisch;
  if n >= t.max_seats then return jsonb_build_object('ok', false, 'error', 'voll'); end if;
  select coalesce(xp_total, 0) into v_xp from public.profiles where id = v_user for update;
  if v_xp < t.buy_in then return jsonb_build_object('ok', false, 'error', 'zu_wenig', 'pollen', v_xp); end if;
  select min(s) into v_seat from generate_series(0, t.max_seats - 1) s where not exists (select 1 from public.poker_sitze where tisch_id = p_tisch and seat = s);
  insert into public.poker_sitze (tisch_id, seat, user_id, chips) values (p_tisch, v_seat, v_user, t.buy_in);
  perform public.award_xp(v_user, -t.buy_in, 'poker_buyin', p_tisch);
  update public.poker_tische set updated_at = now() where id = p_tisch;
  -- Voll: automatisch starten; sonst laeuft der Tisch schon -> naechste Hand nimmt den Spieler mit
  if t.status = 'offen' and n + 1 >= t.max_seats then perform public.poker_neue_hand(p_tisch); end if;
  return jsonb_build_object('ok', true, 'tisch', p_tisch, 'seat', v_seat, 'pollen', v_xp - t.buy_in);
end $$;

create or replace function public.poker_starten(p_tisch uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); t public.poker_tische; n int;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into t from public.poker_tische where id = p_tisch for update;
  if not found or t.creator_id <> v_user then return jsonb_build_object('ok', false, 'error', 'nicht_ersteller'); end if;
  if t.status <> 'offen' then return jsonb_build_object('ok', false, 'error', 'laeuft_schon'); end if;
  select count(*) into n from public.poker_sitze where tisch_id = p_tisch and chips > 0;
  if n < 2 then return jsonb_build_object('ok', false, 'error', 'zu_wenige'); end if;
  perform public.poker_neue_hand(p_tisch);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.poker_aufstehen(p_tisch uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); t public.poker_tische; ps public.poker_sitze; h public.poker_haende;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into t from public.poker_tische where id = p_tisch for update;
  select * into ps from public.poker_sitze where tisch_id = p_tisch and user_id = v_user;
  if not found then return jsonb_build_object('ok', false, 'error', 'sitzt_nicht'); end if;
  select * into h from public.poker_haende where tisch_id = p_tisch and phase <> 'fertig' order by nr desc limit 1;
  if found and ps.seat = any(h.spieler) and not (ps.seat = any(h.gefoldet)) then
    -- Mitten in der Hand: passen (wenn dran) bzw. beim naechsten Zug automatisch, danach aufstehen
    update public.poker_sitze set status = 'geht' where tisch_id = p_tisch and seat = ps.seat;
    if h.aktueller_sitz = ps.seat then perform public.poker_aktion_intern(h.id, ps.seat, 'fold', 0); end if;
    return jsonb_build_object('ok', true, 'sofort', false);
  end if;
  if ps.chips > 0 then perform public.award_xp(v_user, ps.chips, 'poker_cashout', p_tisch); end if;
  delete from public.poker_sitze where tisch_id = p_tisch and seat = ps.seat;
  if (select count(*) from public.poker_sitze where tisch_id = p_tisch) = 0 then
    update public.poker_tische set status = 'geschlossen', updated_at = now() where id = p_tisch;
  elsif t.status = 'laeuft' and (select count(*) from public.poker_sitze where tisch_id = p_tisch and chips > 0) < 2 then
    update public.poker_tische set status = 'offen', updated_at = now() where id = p_tisch;
  end if;
  return jsonb_build_object('ok', true, 'sofort', true, 'pollen', ps.chips);
end $$;

create or replace function public.poker_aktion(p_tisch uuid, p_aktion text, p_betrag int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_seat int; h public.poker_haende; r jsonb;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select seat into v_seat from public.poker_sitze where tisch_id = p_tisch and user_id = v_user;
  if v_seat is null then return jsonb_build_object('ok', false, 'error', 'sitzt_nicht'); end if;
  select * into h from public.poker_haende where tisch_id = p_tisch and phase <> 'fertig' order by nr desc limit 1;
  if not found then return jsonb_build_object('ok', false, 'error', 'keine_hand'); end if;
  r := public.poker_aktion_intern(h.id, v_seat, p_aktion, coalesce(p_betrag, 0));
  -- Wer "geht" markiert ist und gerade gepasst hat, steht nach der Hand auf (poker_neue_hand raeumt)
  return r;
end $$;

-- Frist abgelaufen: Check, sonst Fold (Cron alle 10 Minuten)
create or replace function public.poker_timeouts()
returns int language plpgsql security definer set search_path = public as $$
declare h record; n int := 0; e int; r jsonb;
begin
  for h in select * from public.poker_haende where phase <> 'fertig' and deadline < now() loop
    e := public.poker_jget(h.eingesetzt, h.aktueller_sitz);
    if h.aktueller_einsatz - e <= 0 then r := public.poker_aktion_intern(h.id, h.aktueller_sitz, 'check', 0);
    else r := public.poker_aktion_intern(h.id, h.aktueller_sitz, 'fold', 0); end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Sicht eines Spielers auf den Tisch
create or replace function public.poker_sicht(p_tisch uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); t public.poker_tische; h public.poker_haende; letzte public.poker_haende; v_seat int; sitze jsonb; e int; chips int; pot int := 0; s int;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into t from public.poker_tische where id = p_tisch;
  if not found then return jsonb_build_object('ok', false, 'error', 'kein_tisch'); end if;
  select seat into v_seat from public.poker_sitze where tisch_id = p_tisch and user_id = v_user;
  select * into h from public.poker_haende where tisch_id = p_tisch and phase <> 'fertig' order by nr desc limit 1;
  select * into letzte from public.poker_haende where tisch_id = p_tisch and phase = 'fertig' order by nr desc limit 1;
  if h.id is not null then foreach s in array h.spieler loop pot := pot + public.poker_jget(h.gesamt, s); end loop; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'seat', ps.seat, 'user_id', ps.user_id, 'name', coalesce(p.display_name, 'Biene'), 'avatar', p.avatar_url,
      'chips', ps.chips, 'status', ps.status, 'ich', ps.user_id = v_user,
      'eingesetzt', case when h.id is null then 0 else public.poker_jget(h.eingesetzt, ps.seat) end,
      'gesamt', case when h.id is null then 0 else public.poker_jget(h.gesamt, ps.seat) end,
      'dabei', h.id is not null and ps.seat = any(h.spieler),
      'gefoldet', h.id is not null and ps.seat = any(h.gefoldet),
      'allin', h.id is not null and ps.seat = any(h.allin),
      'dealer', h.id is not null and ps.seat = h.dealer_seat,
      'am_zug', h.id is not null and ps.seat = h.aktueller_sitz
    ) order by ps.seat), '[]'::jsonb) into sitze
    from public.poker_sitze ps join public.profiles p on p.id = ps.user_id where ps.tisch_id = p_tisch;
  if h.id is not null and v_seat is not null then
    e := public.poker_jget(h.eingesetzt, v_seat);
    select ps.chips into chips from public.poker_sitze ps where ps.tisch_id = p_tisch and ps.seat = v_seat;
  end if;
  return jsonb_build_object('ok', true,
    'tisch', jsonb_build_object('id', t.id, 'name', t.name, 'buy_in', t.buy_in, 'sb', t.sb, 'bb', t.bb, 'max_seats', t.max_seats, 'status', t.status, 'hand_nr', t.hand_nr, 'creator', t.creator_id = v_user),
    'mein_seat', v_seat, 'sitze', sitze,
    'hand', case when h.id is null then null else jsonb_build_object(
      'nr', h.nr, 'phase', h.phase, 'board', to_jsonb(h.board), 'pot', pot, 'aktueller_sitz', h.aktueller_sitz,
      'aktueller_einsatz', h.aktueller_einsatz, 'min_raise', h.min_raise, 'deadline', h.deadline,
      'meine_karten', case when v_seat is null then null else h.karten -> v_seat::text end,
      'to_call', case when v_seat is null then null else greatest(h.aktueller_einsatz - e, 0) end,
      'meine_chips', chips,
      'ich_dran', v_seat is not null and h.aktueller_sitz = v_seat,
      'log', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select x from jsonb_array_elements(h.log) x order by (x ->> 'zeit') desc limit 30) q)
    ) end,
    'letzte_hand', case when letzte.id is null then null else jsonb_build_object('nr', letzte.nr, 'board', to_jsonb(letzte.board), 'ergebnis', letzte.ergebnis, 'ended_at', letzte.ended_at) end
  );
end $$;

-- Tischliste: offene Tische + meine
create or replace function public.poker_tische()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_offen jsonb; v_meine jsonb;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'buy_in', t.buy_in, 'max_seats', t.max_seats, 'status', t.status,
      'belegt', (select count(*) from public.poker_sitze s where s.tisch_id = t.id),
      'ersteller', (select coalesce(p.display_name, 'Biene') from public.profiles p where p.id = t.creator_id),
      'created_at', t.created_at) order by t.created_at desc), '[]'::jsonb) into v_offen
    from public.poker_tische t
   where t.status <> 'geschlossen' and (select count(*) from public.poker_sitze s where s.tisch_id = t.id) < t.max_seats
     and not exists (select 1 from public.poker_sitze s where s.tisch_id = t.id and s.user_id = v_user);
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'buy_in', t.buy_in, 'max_seats', t.max_seats, 'status', t.status,
      'belegt', (select count(*) from public.poker_sitze s where s.tisch_id = t.id),
      'chips', s.chips, 'creator', t.creator_id = v_user,
      'ich_dran', exists (select 1 from public.poker_haende h where h.tisch_id = t.id and h.phase <> 'fertig' and h.aktueller_sitz = s.seat),
      'deadline', (select h.deadline from public.poker_haende h where h.tisch_id = t.id and h.phase <> 'fertig' and h.aktueller_sitz = s.seat limit 1)
    ) order by t.updated_at desc), '[]'::jsonb) into v_meine
    from public.poker_sitze s join public.poker_tische t on t.id = s.tisch_id
   where s.user_id = v_user and t.status <> 'geschlossen';
  return jsonb_build_object('ok', true, 'offen', v_offen, 'meine', v_meine);
end $$;

select cron.unschedule('poker-timeouts') where exists (select 1 from cron.job where jobname = 'poker-timeouts');
select cron.schedule('poker-timeouts', '*/10 * * * *', $$select public.poker_timeouts();$$);

revoke all on function public.poker_neue_hand(uuid) from public;
revoke all on function public.poker_hand_beenden(uuid) from public;
revoke all on function public.poker_pruefe_runde(uuid) from public;
revoke all on function public.poker_aktion_intern(uuid, int, text, int) from public;
revoke all on function public.poker_timeouts() from public;
revoke all on function public.poker_benachrichtigen(uuid, uuid, text, text) from public;
revoke all on function public.poker_tisch_erstellen(text, int, int) from public;
revoke all on function public.poker_setzen(uuid) from public;
revoke all on function public.poker_starten(uuid) from public;
revoke all on function public.poker_aufstehen(uuid) from public;
revoke all on function public.poker_aktion(uuid, text, int) from public;
revoke all on function public.poker_sicht(uuid) from public;
revoke all on function public.poker_tische() from public;
grant execute on function public.poker_tisch_erstellen(text, int, int) to authenticated;
grant execute on function public.poker_setzen(uuid) to authenticated;
grant execute on function public.poker_starten(uuid) to authenticated;
grant execute on function public.poker_aufstehen(uuid) to authenticated;
grant execute on function public.poker_aktion(uuid, text, int) to authenticated;
grant execute on function public.poker_sicht(uuid) to authenticated;
grant execute on function public.poker_tische() to authenticated;
grant execute on function public.poker_bewerte5(int[]) to authenticated;
grant execute on function public.poker_bewerte7(int[]) to authenticated;
