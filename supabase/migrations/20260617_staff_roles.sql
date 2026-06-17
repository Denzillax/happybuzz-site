-- Mitarbeiter + Rollen (RBAC): staff_roles + is_staff() Helfer + owner-only RPC.
create table if not exists public.staff_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint staff_roles_role_check check (role in ('support','finance','moderation','manager'))
);
alter table public.staff_roles enable row level security;

create or replace function public.is_staff(uid uuid)
returns boolean language sql security definer stable set search_path to 'public' as $$
  select uid = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid
      or exists (select 1 from public.staff_roles s where s.user_id = uid);
$$;

drop policy if exists staff_roles_read on public.staff_roles;
drop policy if exists staff_roles_owner_write on public.staff_roles;
create policy staff_roles_read on public.staff_roles for select
  using (public.is_staff(auth.uid()) or user_id = auth.uid());
create policy staff_roles_owner_write on public.staff_roles for all
  using (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid)
  with check (auth.uid() = '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid);

create or replace function public.set_staff_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() <> '48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0'::uuid then
    raise exception 'not authorized';
  end if;
  if p_role is null or p_role = '' then
    delete from public.staff_roles where user_id = p_user_id;
  elsif p_role in ('support','finance','moderation','manager') then
    insert into public.staff_roles (user_id, role) values (p_user_id, p_role)
      on conflict (user_id) do update set role = excluded.role;
  else
    raise exception 'invalid role: %', p_role;
  end if;
end; $$;
