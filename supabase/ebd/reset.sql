-- =============================================================================
-- Faith Oracle — EBD · RESET (derruba o módulo para recriar do zero)
-- Banco de dados: PostgreSQL (Supabase)
--
-- ATENÇÃO: isto APAGA todos os dados da EBD. Use durante desenvolvimento, quando
-- precisar mudar o schema e reaplicar supabase/ebd/0001_init.sql do zero.
--
-- NÃO derruba public.set_updated_at(): ela é compartilhada com os demais módulos.
--
-- Ordem: das tabelas dependentes para as raízes (cascade cobre o resto).
-- =============================================================================

drop table if exists public.ebd_frequencias      cascade;
drop table if exists public.ebd_aulas            cascade;
drop table if exists public.ebd_matriculas       cascade;
drop table if exists public.ebd_turma_trimestres cascade;
drop table if exists public.ebd_trimestres       cascade;
drop table if exists public.ebd_turmas           cascade;

drop type if exists ebd_frequencia_status;
drop type if exists ebd_aula_status;
