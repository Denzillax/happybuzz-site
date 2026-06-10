-- Private Notizen ueber andere Nutzer (nur fuer den Verfasser sichtbar).
create table if not exists public.user_notes (
  noter_id uuid not null references public.profiles(id) on delete cascade,
  noted_id uuid not null references public.profiles(id) on delete cascade,
  text text not null default '',
  updated_at timestamptz not null default now(),
  primary key (noter_id, noted_id)
);

alter table public.user_notes enable row level security;
drop policy if exists user_notes_select_own on public.user_notes;
drop policy if exists user_notes_modify_own on public.user_notes;
create policy user_notes_select_own on public.user_notes for select using (auth.uid() = noter_id);
create policy user_notes_modify_own on public.user_notes for all using (auth.uid() = noter_id) with check (auth.uid() = noter_id);

grant select, insert, update, delete on public.user_notes to authenticated;
