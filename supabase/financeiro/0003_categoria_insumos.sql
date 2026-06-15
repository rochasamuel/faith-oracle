-- =============================================================================
-- Faith Oracle — Financeiro · 0003 nova categoria de despesa "Insumos"
-- Banco de dados: PostgreSQL (Supabase)
--
-- Acrescenta o valor 'insumos' ao enum transaction_category (despesas: compra de
-- materiais/insumos). Em instalação nova o 0001 já cria o valor; aqui o
-- "if not exists" torna a migration um no-op seguro nesse caso.
--
-- Como aplicar: cole e execute no SQL Editor (re-executável).
-- Obs.: ALTER TYPE ... ADD VALUE roda em autocommit (fora de transação), que é o
-- comportamento padrão do SQL Editor.
-- =============================================================================

alter type transaction_category add value if not exists 'insumos' before 'outros';
