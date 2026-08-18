-- 18.08.2026: Gespraeche pro Seite ausblendbar (kein echtes Loeschen)
-- (live eingespielt via MCP apply_migration "conversations_ausblenden")
-- Neue Nachricht blendet beim Empfaenger wieder ein (macht der Client in sendMessage).
alter table public.conversations add column if not exists hidden_by_buyer boolean not null default false;
alter table public.conversations add column if not exists hidden_by_seller boolean not null default false;
