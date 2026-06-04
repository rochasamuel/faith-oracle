-- =============================================================================
-- Faith Oracle — Cadastro de membros da igreja
-- Banco: PostgreSQL (Supabase)
-- Como aplicar: cole e execute no SQL Editor do projeto Supabase.
-- Pré-requisito: schema.sql (função public.set_updated_at).
-- =============================================================================

-- Estado civil do membro.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_estado_civil') then
    create type member_estado_civil as enum
      ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel');
  end if;
end$$;

-- Escolaridade do membro.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_escolaridade') then
    create type member_escolaridade as enum
      ('fundamental_incompleto', 'fundamental_completo',
       'medio_incompleto', 'medio_completo',
       'superior_incompleto', 'superior_completo',
       'pos_graduacao');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- Tabela: member_cargos (cargos eclesiásticos, com CRUD próprio no app)
-- -----------------------------------------------------------------------------
create table if not exists public.member_cargos (
  id         uuid        primary key default gen_random_uuid(),
  -- Reservado para um futuro SaaS multi-tenant. Hoje sempre null.
  org_id     uuid,
  nome       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.member_cargos is 'Cargos eclesiásticos atribuíveis aos membros.';

-- Evita cargos duplicados dentro da mesma organização.
create unique index if not exists member_cargos_nome_key
  on public.member_cargos (org_id, nome) nulls not distinct;

drop trigger if exists member_cargos_set_updated_at on public.member_cargos;
create trigger member_cargos_set_updated_at
  before update on public.member_cargos
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabela: members (cadastro de membros; nome_completo é o único obrigatório)
-- -----------------------------------------------------------------------------
create table if not exists public.members (
  id                      uuid                primary key default gen_random_uuid(),
  -- Reservado para um futuro SaaS multi-tenant. Hoje sempre null.
  org_id                  uuid,

  -- Dados pessoais
  nome_completo           text                not null,
  -- Caminho da foto no bucket member-photos (ver members-foto.sql).
  foto_path               text,
  data_nascimento         date,
  naturalidade            text,
  estado_civil            member_estado_civil,
  nome_conjuge            text,

  -- Documentos
  rg                      text,
  orgao_emissor           text,
  rg_uf                   text,
  cpf                     text,

  -- Filiação
  nome_mae                text,
  nome_pai                text,

  -- Formação e profissão
  escolaridade            member_escolaridade,
  profissao               text,

  -- Endereço
  endereco                text,
  cidade                  text,
  uf                      text,
  cep                     text,

  -- Contato
  telefone                text,
  email                   text,

  -- Vida eclesiástica
  batizado_aguas          boolean             not null default false,
  batismo_aguas_data      date,
  batismo_aguas_igreja    text,
  batizado_espirito_santo boolean             not null default false,
  data_ingresso           date,
  cargo_id                uuid                references public.member_cargos (id) on delete set null,
  ativo                   boolean             not null default true,

  created_at              timestamptz         not null default now(),
  updated_at              timestamptz         not null default now()
);

comment on table  public.members          is 'Cadastro de membros da igreja; a contagem oficial de membros (relatório/configurações) vem daqui.';
comment on column public.members.ativo    is 'Membros inativos permanecem no cadastro, mas fora da contagem oficial.';
comment on column public.members.cargo_id is 'Cargo eclesiástico; ao excluir o cargo, o membro fica sem cargo (set null).';

-- A contagem oficial filtra por ativo; índice mantém o count barato.
create index if not exists members_ativo_idx on public.members (ativo);
create index if not exists members_cargo_id_idx on public.members (cargo_id);

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
  before update on public.members
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — libera acesso total (sem auth ainda), igual às demais tabelas.
-- -----------------------------------------------------------------------------
alter table public.member_cargos enable row level security;

drop policy if exists "member_cargos_select_all" on public.member_cargos;
create policy "member_cargos_select_all" on public.member_cargos for select using (true);

drop policy if exists "member_cargos_insert_all" on public.member_cargos;
create policy "member_cargos_insert_all" on public.member_cargos for insert with check (true);

drop policy if exists "member_cargos_update_all" on public.member_cargos;
create policy "member_cargos_update_all" on public.member_cargos for update using (true) with check (true);

drop policy if exists "member_cargos_delete_all" on public.member_cargos;
create policy "member_cargos_delete_all" on public.member_cargos for delete using (true);

alter table public.members enable row level security;

drop policy if exists "members_select_all" on public.members;
create policy "members_select_all" on public.members for select using (true);

drop policy if exists "members_insert_all" on public.members;
create policy "members_insert_all" on public.members for insert with check (true);

drop policy if exists "members_update_all" on public.members;
create policy "members_update_all" on public.members for update using (true) with check (true);

drop policy if exists "members_delete_all" on public.members;
create policy "members_delete_all" on public.members for delete using (true);

-- -----------------------------------------------------------------------------
-- Seed: cargos comuns (idempotente; editáveis/removíveis pelo app).
-- -----------------------------------------------------------------------------
insert into public.member_cargos (org_id, nome)
values
  (null, 'Membro'),
  (null, 'Auxiliar de Trabalho'),
  (null, 'Diácono'),
  (null, 'Diaconisa'),
  (null, 'Presbítero'),
  (null, 'Evangelista'),
  (null, 'Missionário(a)'),
  (null, 'Pastor(a)')
on conflict (org_id, nome) do nothing;
