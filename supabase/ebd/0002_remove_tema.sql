-- =============================================================================
-- Faith Oracle — EBD · 0002 remove a coluna `tema` de ebd_turma_trimestres
-- Banco de dados: PostgreSQL (Supabase)
--
-- O tema do trimestre deixou de ser usado no app; a revista permanece. Esta
-- migration remove a coluna em bancos já criados pela 0001. Em uma instalação
-- nova (0001 já sem a coluna) o "drop ... if exists" é um no-op seguro.
--
-- Como aplicar: cole e execute no SQL Editor (re-executável).
-- =============================================================================

alter table public.ebd_turma_trimestres
  drop column if exists tema;
