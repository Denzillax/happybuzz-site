-- 19.08.2026: Lauftempo der grossen Laufschrift (live eingespielt via MCP "ticker_speed")
-- Frontend uebersetzt die Stufe in Pixel pro Sekunde (slow 45 / normal 90 / fast 150)
-- und berechnet daraus die Animationsdauer aus der echten Textbreite; damit ist
-- das Tempo konstant, egal wie lang der Text ist.
alter table public.site_ticker
  add column if not exists speed text not null default 'normal'
  check (speed in ('slow','normal','fast'));
comment on column public.site_ticker.speed is 'Lauftempo der Laufschrift: slow/normal/fast (px/s im Frontend)';
