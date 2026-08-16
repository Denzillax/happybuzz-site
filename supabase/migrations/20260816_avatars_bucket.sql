-- Profilbild-Upload: der Code laedt seit jeher in den Bucket "avatars",
-- der nie angelegt wurde (daher der Upload-Fehler). Bucket + Policies:
-- oeffentlich lesbar, schreiben darf jeder Angemeldete NUR seine eigene
-- Datei (avatars/<eigene-uid>.<ext>).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name like 'avatars/' || auth.uid() || '.%');

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name like 'avatars/' || auth.uid() || '.%')
  with check (bucket_id = 'avatars' and name like 'avatars/' || auth.uid() || '.%');

drop policy if exists "avatars_own_delete" on storage.objects;
create policy "avatars_own_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name like 'avatars/' || auth.uid() || '.%');
