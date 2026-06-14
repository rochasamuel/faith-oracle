-- =============================================================================
-- Faith Oracle — Relatórios · RESET (derruba o módulo para recriar do zero)
-- Banco de dados: PostgreSQL (Supabase)
--
-- ATENÇÃO: isto APAGA todos os relatórios gerados. Use durante desenvolvimento,
-- quando precisar mudar o schema e reaplicar relatorios/0001_init.sql do zero.
--
-- NÃO derruba public.set_updated_at(): ela é compartilhada com os demais módulos.
-- =============================================================================

drop table if exists public.reports cascade;

drop type if exists report_status;
drop type if exists report_period_type;
