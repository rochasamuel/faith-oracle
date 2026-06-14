-- =============================================================================
-- Faith Oracle — Financeiro · 0002 marcos de saldo e conciliações
-- Banco de dados: PostgreSQL (Supabase)
--
-- Depende de financeiro/0001_init.sql (tabela transactions e função
-- public.set_updated_at, recriada aqui de forma idempotente para autossuficiência).
--
-- Como aplicar: cole e execute no SQL Editor (re-executável: usa "if not exists").
-- =============================================================================

create extension if not exists "pgcrypto";

-- Mantém updated_at sincronizado (compartilhada com os demais módulos).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tabela: balance_checkpoints (saldo REAL da conta em uma data, em centavos)
-- -----------------------------------------------------------------------------
create table if not exists public.balance_checkpoints (
  id              uuid        primary key default gen_random_uuid(),
  checkpoint_date date        not null unique,
  amount          integer     not null,   -- pode ser 0 ou negativo
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.balance_checkpoints is
  'Saldo real da conta em datas-chave; base do saldo inicial dos relatórios.';

create index if not exists balance_checkpoints_date_idx
  on public.balance_checkpoints (checkpoint_date desc);

drop trigger if exists balance_checkpoints_set_updated_at on public.balance_checkpoints;
create trigger balance_checkpoints_set_updated_at
  before update on public.balance_checkpoints
  for each row execute function public.set_updated_at();

alter table public.balance_checkpoints enable row level security;
drop policy if exists "balance_checkpoints_all" on public.balance_checkpoints;
create policy "balance_checkpoints_all" on public.balance_checkpoints
  for all using (true) with check (true);

-- -----------------------------------------------------------------------------
-- Tabela: reconciliations (histórico de alinhamento do saldo ao banco)
-- -----------------------------------------------------------------------------
create table if not exists public.reconciliations (
  id                        uuid        primary key default gen_random_uuid(),
  reconciled_at             date        not null,
  informed_balance          integer     not null,
  system_balance            integer     not null,
  difference                integer     not null,
  adjustment_transaction_id uuid        references public.transactions(id) on delete set null,
  created_at                timestamptz not null default now()
);

comment on table public.reconciliations is
  'Registro de conciliações: saldo informado x saldo do sistema + ajuste gerado.';

create index if not exists reconciliations_date_idx
  on public.reconciliations (reconciled_at desc);

alter table public.reconciliations enable row level security;
drop policy if exists "reconciliations_all" on public.reconciliations;
create policy "reconciliations_all" on public.reconciliations
  for all using (true) with check (true);
