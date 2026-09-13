-- KARMA avatars bucket — player-uploaded profile pictures.
-- Run once in the Supabase SQL editor (or psql $DATABASE_URL -f sql/003_avatars_bucket.sql).
-- Public read (avatars render everywhere, incl. shared Character Cards);
-- writes restricted to the signed-in owner's own folder.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Owner-only writes: path must start with "<auth.uid()>/"
drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');
