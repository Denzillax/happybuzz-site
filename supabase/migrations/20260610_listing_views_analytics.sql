-- Event-Tracking fuer Inserat-Aufrufe (Zeitstempel + Quelle) + Owner-Auswertung.
create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  viewer_id uuid,
  source text not null default 'direct',
  created_at timestamptz not null default now()
);
create index if not exists listing_views_idx on public.listing_views (listing_id, created_at);

alter table public.listing_views enable row level security;
drop policy if exists listing_views_insert on public.listing_views;
create policy listing_views_insert on public.listing_views for insert with check (true);
grant insert on public.listing_views to anon, authenticated;

create or replace function public.get_listing_analytics(p_listing_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_views int; v_favs int;
begin
  select user_id, coalesce(view_count,0), coalesce(favorite_count,0) into v_owner, v_views, v_favs
    from public.listings where id = p_listing_id;
  if v_owner is null or v_owner is distinct from auth.uid() then return null; end if;
  return json_build_object(
    'total_views', v_views,
    'favorites', v_favs,
    'chat_requests', (select count(*) from public.conversations where listing_id = p_listing_id),
    'sources', (select coalesce(json_object_agg(source, c), '{}'::json)
                from (select source, count(*) c from public.listing_views where listing_id = p_listing_id group by source) s),
    'daily', (select coalesce(json_agg(json_build_object('day', to_char(d, 'DD.MM'), 'count', coalesce(x.cnt, 0)) order by d), '[]'::json)
              from generate_series(current_date - 6, current_date, interval '1 day') d
              left join (select created_at::date dd, count(*) cnt from public.listing_views
                         where listing_id = p_listing_id and created_at >= current_date - 6 group by created_at::date) x
                on x.dd = d::date)
  );
end; $$;
grant execute on function public.get_listing_analytics(uuid) to authenticated;
