-- 19.08.2026: Shop-Banner fuer Unternehmenskonten (live via MCP "shop_banner_url")
-- Upload-Pfad avatars/{uid}.banner.jpg passt in die bestehende Storage-Policy
-- (avatars/{uid}.%), darum keine neue Policy noetig.
alter table public.profiles add column if not exists shop_banner_url text;
comment on column public.profiles.shop_banner_url is 'Shop-Banner fuer Unternehmenskonten (oeffentliches Profil)';
