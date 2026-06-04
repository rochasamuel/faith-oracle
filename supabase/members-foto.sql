-- =============================================================================
-- Faith Oracle — Foto dos membros (avatar)
-- Banco: PostgreSQL (Supabase)
-- Como aplicar: cole e execute no SQL Editor do projeto Supabase.
-- Pré-requisito: members.sql.
-- =============================================================================

-- Caminho do arquivo da foto no bucket member-photos (null = sem foto).
alter table public.members
  add column if not exists foto_path text;

comment on column public.members.foto_path is
  'Caminho da foto no bucket member-photos (Storage); null quando o membro não tem foto.';

-- -----------------------------------------------------------------------------
-- Bucket: member-photos (público; a URL da foto é montada no app)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

-- Políticas do bucket — libera acesso total (sem auth ainda), igual às tabelas.
drop policy if exists "member_photos_select_all" on storage.objects;
create policy "member_photos_select_all" on storage.objects
  for select using (bucket_id = 'member-photos');

drop policy if exists "member_photos_insert_all" on storage.objects;
create policy "member_photos_insert_all" on storage.objects
  for insert with check (bucket_id = 'member-photos');

drop policy if exists "member_photos_update_all" on storage.objects;
create policy "member_photos_update_all" on storage.objects
  for update using (bucket_id = 'member-photos') with check (bucket_id = 'member-photos');

drop policy if exists "member_photos_delete_all" on storage.objects;
create policy "member_photos_delete_all" on storage.objects
  for delete using (bucket_id = 'member-photos');
