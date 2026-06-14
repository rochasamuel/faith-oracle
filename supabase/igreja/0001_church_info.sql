-- =============================================================================
-- Faith Oracle — Igreja · 0001 dados institucionais (editáveis no app)
-- Banco: PostgreSQL (Supabase)
--
-- Define a função public.set_updated_at() de forma idempotente (autossuficiência).
--
-- Como aplicar:
--   1. Abra o SQL Editor do projeto Supabase.
--   2. Cole e execute este arquivo (re-executável: usa "if not exists").
--   3. Em seguida, igreja/0002_membros.sql e igreja/0003_membros_foto.sql.
--   (para recriar do zero durante mudanças, rode igreja/reset.sql antes.)
-- =============================================================================

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

-- Tipo de imóvel onde a igreja funciona.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'igreja_tipo_imovel') then
    create type igreja_tipo_imovel as enum ('propria', 'alugada', 'cedida');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- Tabela: church_info (singleton hoje; org_id reservado para multi-tenant)
-- -----------------------------------------------------------------------------
create table if not exists public.church_info (
  id                  uuid                primary key default gen_random_uuid(),
  -- Reservado para um futuro SaaS multi-tenant. Hoje sempre null.
  org_id              uuid,
  nome                text                not null,
  cnpj                text,
  pastor_presidente   text,
  endereco            text,
  quantidade_membros  integer             not null default 0 check (quantidade_membros  >= 0),
  quantidade_obreiros integer             not null default 0 check (quantidade_obreiros >= 0),
  tipo_imovel         igreja_tipo_imovel  not null default 'alugada',
  created_at          timestamptz         not null default now(),
  updated_at          timestamptz         not null default now()
);

comment on table  public.church_info        is 'Dados institucionais da igreja (cabeçalho/rodapé do relatório).';
comment on column public.church_info.org_id is 'Reservado para tenancy futura; uma linha por organização.';

-- Uma linha por org. `nulls not distinct` garante UMA única linha enquanto org_id é null.
create unique index if not exists church_info_org_id_key
  on public.church_info (org_id) nulls not distinct;

-- Mantém updated_at sincronizado (função definida no topo deste arquivo).
drop trigger if exists church_info_set_updated_at on public.church_info;
create trigger church_info_set_updated_at
  before update on public.church_info
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — libera acesso total (sem auth ainda), igual às demais tabelas.
-- -----------------------------------------------------------------------------
alter table public.church_info enable row level security;

drop policy if exists "church_info_select_all" on public.church_info;
create policy "church_info_select_all" on public.church_info for select using (true);

drop policy if exists "church_info_insert_all" on public.church_info;
create policy "church_info_insert_all" on public.church_info for insert with check (true);

drop policy if exists "church_info_update_all" on public.church_info;
create policy "church_info_update_all" on public.church_info for update using (true) with check (true);

-- -----------------------------------------------------------------------------
-- Seed: cria a linha inicial com os valores atuais (idempotente).
-- -----------------------------------------------------------------------------
insert into public.church_info
  (org_id, nome, cnpj, pastor_presidente, endereco, quantidade_membros, quantidade_obreiros, tipo_imovel)
values
  (null,
   'ASSEMBLEIA DE DEUS MINISTÉRIO LIVRE',
   '59.498.194/0001-40',
   'Miguel de Jesus Rocha',
   'SCSV Quadra 01 Conjunto 02 Lote 02 (Setor Leste) – Cidade Estrutural – DF CEP: 71.262-110',
   0, 0, 'alugada')
on conflict (org_id) do nothing;
