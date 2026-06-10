-- Aggregierte Verkaeufer-Statistiken (RLS-sicher: gibt nur Kennzahlen zurueck,
-- keine fremden Nachrichten/Daten). Antwortzeit aus conversations/messages.
create or replace function public.get_seller_stats(p_uid uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  completed_sales int;
  total_listed int;
  sold_listed int;
  avg_minutes numeric;
begin
  select count(*) into completed_sales from public.purchases
    where seller_id = p_uid and status = 'completed';

  select count(*) into total_listed from public.listings
    where user_id = p_uid and status in ('active','paused','sold','rented','expired');
  select count(*) into sold_listed from public.listings
    where user_id = p_uid and status in ('sold','rented');

  with conv as (
    select id from public.conversations where seller_id = p_uid
  ),
  first_buyer as (
    select m.conversation_id, min(m.created_at) as bt
    from public.messages m join conv on m.conversation_id = conv.id
    where m.sender_id is distinct from p_uid
    group by m.conversation_id
  ),
  first_reply as (
    select fb.conversation_id, fb.bt, min(m.created_at) as rt
    from public.messages m join first_buyer fb on m.conversation_id = fb.conversation_id
    where m.sender_id = p_uid and m.created_at >= fb.bt
    group by fb.conversation_id, fb.bt
  )
  select avg(extract(epoch from (rt - bt)) / 60.0) into avg_minutes from first_reply;

  return json_build_object(
    'completed_sales', coalesce(completed_sales, 0),
    'sales_rate', case when coalesce(total_listed,0) > 0 then round(sold_listed::numeric / total_listed * 100) else null end,
    'avg_response_minutes', case when avg_minutes is null then null else round(avg_minutes) end
  );
end; $$;

grant execute on function public.get_seller_stats(uuid) to anon, authenticated;
