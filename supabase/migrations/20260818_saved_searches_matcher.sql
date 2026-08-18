-- Gespeicherte Suchen + stuendlicher Treffer-Matcher (Schalter search_new_match).
-- Aggregiert pro Suche (eine Meldung mit Trefferzahl), merkt sich last_notified_at.
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query text,
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_notified_at timestamptz,
  constraint saved_searches_not_empty check (
    coalesce(nullif(trim(query), ''), null) is not null or category_id is not null
  )
);
alter table public.saved_searches enable row level security;
drop policy if exists saved_searches_own on public.saved_searches;
create policy saved_searches_own on public.saved_searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.notify_search_matches()
returns void language plpgsql security definer set search_path = public as $$
declare
  s record; v_since timestamptz; v_cnt int; v_label text; v_link text; v_title text; v_msg text;
begin
  for s in
    select ss.id, ss.user_id, ss.query, ss.category_id, ss.created_at, ss.last_notified_at,
           c.slug as cat_slug, c.name as cat_name
    from saved_searches ss
    left join categories c on c.id = ss.category_id
  loop
    v_since := coalesce(s.last_notified_at, s.created_at);
    select count(*) into v_cnt
    from listings l
    where l.status = 'active'
      and l.created_at > v_since
      and l.user_id <> s.user_id
      and (s.query is null or trim(s.query) = ''
           or l.title ilike '%' || s.query || '%'
           or coalesce(l.description, '') ilike '%' || s.query || '%')
      and (s.category_id is null
           or l.category_id in (select category_tree_ids(s.category_id)));
    if v_cnt > 0 then
      v_label := coalesce(nullif(trim(s.query), ''), s.cat_name, 'deine Suche');
      v_link := '/search';
      if nullif(trim(s.query), '') is not null then
        v_link := v_link || '?q=' || replace(trim(s.query), ' ', '+');
        if s.cat_slug is not null then v_link := v_link || '&category=' || s.cat_slug; end if;
      elsif s.cat_slug is not null then
        v_link := v_link || '?category=' || s.cat_slug;
      end if;
      v_title := 'Neue Treffer für deine Suche';
      v_msg := format('%s %s für "%s".', v_cnt,
        case when v_cnt = 1 then 'neuer Treffer' else 'neue Treffer' end, v_label);
      insert into notifications (user_id, type, title, message, link, is_read)
      values (s.user_id, 'system', v_title, v_msg, v_link, false);
      perform queue_notification_email(s.user_id, v_title, v_msg, v_link, 'search_new_match');
      perform queue_notification_push(s.user_id, v_title, v_msg, v_link, 'search_new_match');
      update saved_searches set last_notified_at = now() where id = s.id;
    end if;
  end loop;
end;
$$;

do $$ begin perform cron.unschedule('notify-search-matches'); exception when others then null; end $$;
select cron.schedule('notify-search-matches', '20 * * * *', 'select public.notify_search_matches()');
