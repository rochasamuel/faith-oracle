-- =============================================================================
-- Faith Oracle — EBD · 0003 conteúdo da lição (markdown) em ebd_aulas
-- Banco de dados: PostgreSQL (Supabase)
--
-- Guarda o conteúdo da lição (markdown) buscado do site da CPAD, por dia.
-- null = ainda não buscado. O título da lição usa a coluna titulo_licao existente.
--
-- Como aplicar: cole e execute no SQL Editor (re-executável).
-- =============================================================================

alter table public.ebd_aulas
  add column if not exists conteudo_licao text;

comment on column public.ebd_aulas.conteudo_licao is
  'Conteúdo da lição em markdown, importado do site da CPAD; null quando não buscado.';
