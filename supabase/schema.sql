-- =============================================================================
-- Faith Oracle — Modelagem do módulo Financeiro
-- Banco de dados: PostgreSQL (Supabase)
--
-- Como aplicar:
--   1. Abra o SQL Editor do seu projeto Supabase.
--   2. Cole e execute este arquivo.
--   (ou) supabase db push / supabase migration, caso use a CLI.
-- =============================================================================

-- Extensão para gerar UUIDs (já habilitada por padrão no Supabase, mas garantimos).
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------

-- Natureza do lançamento: dinheiro que entra ou que sai do caixa.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type transaction_type as enum ('entrada', 'saida');
  end if;
end$$;

-- Categorias de classificação dos lançamentos.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_category') then
    create type transaction_category as enum (
      'dizimos',
      'ofertas',
      'doacoes',
      'ajuda_social',
      'eventos',
      'despesas_fixas',
      'missoes',
      'manutencao',
      'construcao',
      'outros'
    );
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- Tabela: transactions (lançamentos financeiros)
-- -----------------------------------------------------------------------------

create table if not exists public.transactions (
  id          uuid                  primary key default gen_random_uuid(),
  type        transaction_type      not null,
  category    transaction_category  not null,
  -- Valor sempre positivo, em CENTAVOS (inteiro). O sinal é dado pela coluna `type`.
  amount      integer               not null check (amount > 0),
  -- Data do fato gerador (o que o usuário informa em dd/mm/yyyy).
  occurred_at date                  not null,
  notes       text,
  created_at  timestamptz           not null default now(),
  updated_at  timestamptz           not null default now()
);

comment on table  public.transactions             is 'Lançamentos financeiros da igreja (entradas e saídas).';
comment on column public.transactions.type        is 'entrada = receita; saida = despesa.';
comment on column public.transactions.amount      is 'Valor absoluto em centavos (sempre > 0). O sinal vem de `type`.';
comment on column public.transactions.occurred_at is 'Data do lançamento informada pelo usuário.';

-- Índices para a listagem (ordenada por data) e filtros futuros.
create index if not exists transactions_occurred_at_idx on public.transactions (occurred_at desc);
create index if not exists transactions_type_idx        on public.transactions (type);
create index if not exists transactions_category_idx    on public.transactions (category);

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

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- ATENÇÃO: ainda não há autenticação no app. As políticas abaixo liberam acesso
-- total para deixar o módulo funcional usando a chave anônima. Assim que o login
-- for implementado, troque `using (true)` por regras baseadas em auth.uid()/roles.
-- -----------------------------------------------------------------------------

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_all" on public.transactions;
create policy "transactions_select_all"
  on public.transactions for select
  using (true);

drop policy if exists "transactions_insert_all" on public.transactions;
create policy "transactions_insert_all"
  on public.transactions for insert
  with check (true);

drop policy if exists "transactions_update_all" on public.transactions;
create policy "transactions_update_all"
  on public.transactions for update
  using (true)
  with check (true);

drop policy if exists "transactions_delete_all" on public.transactions;
create policy "transactions_delete_all"
  on public.transactions for delete
  using (true);
