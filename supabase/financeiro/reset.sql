-- =============================================================================
-- Faith Oracle — Financeiro · RESET (derruba o módulo para recriar do zero)
-- Banco de dados: PostgreSQL (Supabase)
--
-- ATENÇÃO: isto APAGA todos os dados financeiros (lançamentos, marcos de saldo e
-- conciliações). Use durante desenvolvimento, quando precisar mudar o schema e
-- reaplicar financeiro/0001_init.sql e financeiro/0002_marcos_conciliacoes.sql.
--
-- NÃO derruba public.set_updated_at(): ela é compartilhada com os demais módulos.
--
-- Ordem: das tabelas dependentes para as raízes (cascade cobre o resto).
-- =============================================================================

drop table if exists public.reconciliations      cascade;
drop table if exists public.balance_checkpoints  cascade;
drop table if exists public.transactions          cascade;

drop type if exists transaction_category;
drop type if exists transaction_type;
