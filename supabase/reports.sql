-- =============================================================================
-- Faith Oracle — Modelagem do módulo Relatórios
-- Banco de dados: PostgreSQL (Supabase)
--
-- Depende de supabase/schema.sql (usa a função public.set_updated_at, recriada
-- aqui de forma idempotente para que este arquivo seja autossuficiente).
--
-- Como aplicar:
--   1. Abra o SQL Editor do seu projeto Supabase.
--   2. Cole e execute este arquivo.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------

-- Periodicidade do relatório.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_period_type') then
    create type report_period_type as enum ('mensal', 'anual');
  end if;
end$$;

-- Situação do relatório no seu ciclo de vida.
-- 'invalidado' é o estado de soft delete (o registro permanece para auditoria).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type report_status as enum (
      'processando',
      'concluido',
      'erro',
      'invalidado'
    );
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- Tabela: reports (relatórios financeiros)
-- -----------------------------------------------------------------------------

create table if not exists public.reports (
  id                 uuid                primary key default gen_random_uuid(),
  -- Rótulo legível, ex.: "Relatório Mensal — Maio de 2026".
  title              text                not null,
  period_type        report_period_type  not null,
  -- Mês de referência (1-12); nulo quando o relatório é anual.
  reference_month    int                 check (reference_month between 1 and 12),
  reference_year     int                 not null,
  -- Intervalo de datas usado para apurar o relatório.
  period_start       date                not null,
  period_end         date                not null,
  status             report_status       not null default 'concluido',
  -- Snapshot financeiro apurado no momento da geração.
  total_entradas     integer             not null default 0,
  total_saidas       integer             not null default 0,
  balance            integer             not null default 0,
  transactions_count int                 not null default 0,
  notes              text,
  -- Soft delete: preenchidos ao invalidar o relatório.
  invalidated_at     timestamptz,
  invalidated_reason text,
  created_at         timestamptz         not null default now(),
  updated_at         timestamptz         not null default now(),

  constraint reports_period_order check (period_end >= period_start),
  -- Relatório mensal exige o mês de referência.
  constraint reports_month_required
    check (period_type <> 'mensal' or reference_month is not null)
);

-- Dia da conferência informado na geração (manual para relatórios retroativos).
-- Adicionada após a criação inicial da tabela; nula em relatórios antigos.
alter table public.reports add column if not exists conferred_at date;

comment on table  public.reports                is 'Relatórios financeiros gerados (mensais ou anuais).';
comment on column public.reports.status         is 'processando | concluido | erro | invalidado (soft delete).';
comment on column public.reports.invalidated_at is 'Data da invalidação (soft delete). Nulo enquanto válido.';
comment on column public.reports.balance        is 'Saldo apurado em centavos (total_entradas - total_saidas) no período.';
comment on column public.reports.conferred_at   is 'Dia da conferência informado na geração; usado no PDF ("Conferido dia"). Nulo em relatórios antigos.';

create index if not exists reports_reference_idx  on public.reports (reference_year desc, reference_month desc);
create index if not exists reports_status_idx      on public.reports (status);
create index if not exists reports_created_at_idx  on public.reports (created_at desc);

-- -----------------------------------------------------------------------------
-- Trigger: mantém updated_at sincronizado
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- ATENÇÃO: ainda não há autenticação. As políticas liberam acesso total usando
-- a chave pública. Ajuste para auth.uid()/roles quando o login existir.
-- -----------------------------------------------------------------------------

alter table public.reports enable row level security;

drop policy if exists "reports_select_all" on public.reports;
create policy "reports_select_all"
  on public.reports for select
  using (true);

drop policy if exists "reports_insert_all" on public.reports;
create policy "reports_insert_all"
  on public.reports for insert
  with check (true);

drop policy if exists "reports_update_all" on public.reports;
create policy "reports_update_all"
  on public.reports for update
  using (true)
  with check (true);

drop policy if exists "reports_delete_all" on public.reports;
create policy "reports_delete_all"
  on public.reports for delete
  using (true);
