-- =============================================================================
-- Faith Oracle — Igreja · RESET (derruba o módulo para recriar do zero)
-- Banco de dados: PostgreSQL (Supabase)
--
-- ATENÇÃO: isto APAGA os dados institucionais, o cadastro de membros e os cargos.
-- Use durante desenvolvimento, quando precisar mudar o schema e reaplicar
-- igreja/0001_church_info.sql → 0002_membros.sql → 0003_membros_foto.sql.
--
-- NÃO derruba public.set_updated_at(): ela é compartilhada com os demais módulos.
-- O bucket member-photos NÃO é removido aqui (apagaria as fotos enviadas); para
-- recriá-lo do zero, esvazie-o e remova-o manualmente no Storage antes.
--
-- Ordem: das tabelas dependentes para as raízes (cascade cobre o resto).
-- =============================================================================

drop table if exists public.members        cascade;
drop table if exists public.member_cargos  cascade;
drop table if exists public.church_info    cascade;

drop type if exists member_escolaridade;
drop type if exists member_estado_civil;
drop type if exists igreja_tipo_imovel;

-- Políticas do bucket member-photos (o bucket em si é preservado).
drop policy if exists "member_photos_select_all" on storage.objects;
drop policy if exists "member_photos_insert_all" on storage.objects;
drop policy if exists "member_photos_update_all" on storage.objects;
drop policy if exists "member_photos_delete_all" on storage.objects;
