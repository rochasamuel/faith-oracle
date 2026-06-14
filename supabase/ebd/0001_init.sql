-- =============================================================================
-- Faith Oracle — Modelagem do módulo EBD (Escola Bíblica Dominical)
-- Banco de dados: PostgreSQL (Supabase)
--
-- Depende de supabase/schema.sql (função public.set_updated_at), recriada aqui de
-- forma idempotente para o arquivo ser autossuficiente.
--
-- Espinha dorsal:
--   ebd_turmas ─┐
--               ├─ ebd_turma_trimestres ─┬─ ebd_matriculas ─┐
--   ebd_trimestres                       │                  ├─ ebd_frequencias
--                                        └─ ebd_aulas ──────┘
--
-- Como aplicar:
--   1. Abra o SQL Editor do projeto Supabase.
--   2. Cole e execute este arquivo (re-executável: usa "if not exists").
--   3. Em seguida, ebd/0002_remove_tema.sql.
--   (para recriar do zero durante mudanças, rode ebd/reset.sql antes.)
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
-- Tipos enumerados
-- -----------------------------------------------------------------------------

-- Ciclo de vida do dia de aula / relatório diário.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ebd_aula_status') then
    create type ebd_aula_status as enum ('aberta', 'fechada');
  end if;
end$$;

-- Situação de presença do aluno numa aula.
-- 'nao_aplicavel' = matriculado depois desta aula; não conta como falta.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ebd_frequencia_status') then
    create type ebd_frequencia_status as enum ('presente', 'falta', 'nao_aplicavel');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- Tabela: ebd_turmas (turma persistente; hoje só a principal)
-- -----------------------------------------------------------------------------
create table if not exists public.ebd_turmas (
  id         uuid        primary key default gen_random_uuid(),
  -- Reservado para um futuro SaaS multi-tenant. Hoje sempre null.
  org_id     uuid,
  nome       text        not null,
  descricao  text,
  ativo      boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ebd_turmas is 'Turmas da EBD; persistem entre trimestres. Preparado para múltiplas turmas.';

create unique index if not exists ebd_turmas_nome_key
  on public.ebd_turmas (org_id, nome) nulls not distinct;
create index if not exists ebd_turmas_ativo_idx on public.ebd_turmas (ativo);

drop trigger if exists ebd_turmas_set_updated_at on public.ebd_turmas;
create trigger ebd_turmas_set_updated_at
  before update on public.ebd_turmas
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabela: ebd_trimestres (período da igreja: ano + nº 1..4)
-- -----------------------------------------------------------------------------
create table if not exists public.ebd_trimestres (
  id          uuid        primary key default gen_random_uuid(),
  org_id      uuid,
  ano         int         not null,
  numero      int         not null check (numero between 1 and 4),
  data_inicio date        not null,
  data_fim    date        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint ebd_trimestres_periodo_ordem check (data_fim >= data_inicio)
);

comment on table public.ebd_trimestres is 'Trimestres da igreja (4 por ano). A revista fica por turma em ebd_turma_trimestres.';

create unique index if not exists ebd_trimestres_ano_numero_key
  on public.ebd_trimestres (org_id, ano, numero) nulls not distinct;
create index if not exists ebd_trimestres_ano_idx on public.ebd_trimestres (ano desc, numero desc);

drop trigger if exists ebd_trimestres_set_updated_at on public.ebd_trimestres;
create trigger ebd_trimestres_set_updated_at
  before update on public.ebd_trimestres
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabela: ebd_turma_trimestres (a turma rodando num trimestre = espinha dorsal)
-- É aqui que mora a revista daquela turma naquele trimestre.
-- -----------------------------------------------------------------------------
create table if not exists public.ebd_turma_trimestres (
  id                 uuid        primary key default gen_random_uuid(),
  org_id             uuid,
  turma_id           uuid        not null references public.ebd_turmas (id)     on delete cascade,
  trimestre_id       uuid        not null references public.ebd_trimestres (id) on delete cascade,
  revista_titulo     text,
  -- Quantidade de revistas compradas para a turma neste trimestre.
  revistas_compradas int         not null default 0 check (revistas_compradas >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint ebd_turma_trimestres_unica unique (turma_id, trimestre_id)
);

comment on table  public.ebd_turma_trimestres is 'Uma turma rodando num trimestre; carrega revista e revistas compradas. Matrículas e aulas penduram aqui.';

create index if not exists ebd_turma_trimestres_turma_idx     on public.ebd_turma_trimestres (turma_id);
create index if not exists ebd_turma_trimestres_trimestre_idx on public.ebd_turma_trimestres (trimestre_id);

drop trigger if exists ebd_turma_trimestres_set_updated_at on public.ebd_turma_trimestres;
create trigger ebd_turma_trimestres_set_updated_at
  before update on public.ebd_turma_trimestres
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabela: ebd_matriculas (membro inscrito numa turma/trimestre)
-- -----------------------------------------------------------------------------
create table if not exists public.ebd_matriculas (
  id                 uuid        primary key default gen_random_uuid(),
  org_id             uuid,
  turma_trimestre_id uuid        not null references public.ebd_turma_trimestres (id) on delete cascade,
  member_id          uuid        not null references public.members (id)             on delete cascade,
  -- Data da inscrição: permite à UI pré-marcar "não aplicável" em aulas anteriores.
  data_matricula     date        not null default current_date,
  -- Vira false se o aluno sai no meio do trimestre (sai da contagem, mas mantém histórico).
  ativa              boolean     not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint ebd_matriculas_unica unique (turma_trimestre_id, member_id)
);

comment on table  public.ebd_matriculas               is 'Membros matriculados numa turma/trimestre da EBD.';
comment on column public.ebd_matriculas.data_matricula is 'Data da inscrição; base para "não aplicável" em aulas anteriores.';
comment on column public.ebd_matriculas.ativa          is 'false = saiu no meio do trimestre; mantém histórico fora da contagem.';

create index if not exists ebd_matriculas_turma_tri_idx on public.ebd_matriculas (turma_trimestre_id);
create index if not exists ebd_matriculas_member_idx     on public.ebd_matriculas (member_id);

drop trigger if exists ebd_matriculas_set_updated_at on public.ebd_matriculas;
create trigger ebd_matriculas_set_updated_at
  before update on public.ebd_matriculas
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabela: ebd_aulas (o "dia" / relatório diário; abre em qualquer data)
-- -----------------------------------------------------------------------------
create table if not exists public.ebd_aulas (
  id                 uuid            primary key default gen_random_uuid(),
  org_id             uuid,
  turma_trimestre_id uuid            not null references public.ebd_turma_trimestres (id) on delete cascade,
  -- Data da aula (pode ser passada, para histórico).
  data               date            not null,

  -- Lição do dia
  numero_licao       int             check (numero_licao is null or numero_licao > 0),
  titulo_licao       text,
  professor          text,

  -- Métricas digitadas no dia
  oferta_centavos    int             not null default 0 check (oferta_centavos >= 0),
  visitantes         int             not null default 0 check (visitantes >= 0),
  total_biblias      int             not null default 0 check (total_biblias >= 0),
  total_revistas     int             not null default 0 check (total_revistas >= 0),
  notes              text,

  -- Ciclo de vida + snapshot (preenchido ao fechar; calculado ao vivo enquanto aberta)
  status             ebd_aula_status not null default 'aberta',
  total_matriculados   int           not null default 0 check (total_matriculados >= 0),
  total_presentes      int           not null default 0 check (total_presentes >= 0),
  total_faltas         int           not null default 0 check (total_faltas >= 0),
  total_nao_aplicavel  int           not null default 0 check (total_nao_aplicavel >= 0),
  total_assistencia    int           not null default 0 check (total_assistencia >= 0),
  closed_at          timestamptz,

  created_at         timestamptz     not null default now(),
  updated_at         timestamptz     not null default now(),

  -- Um dia por turma/trimestre.
  constraint ebd_aulas_dia_unico unique (turma_trimestre_id, data)
);

comment on table  public.ebd_aulas                   is 'Dia de aula / relatório diário da EBD. Abre em qualquer data; "fechar" grava o snapshot e trava a edição.';
comment on column public.ebd_aulas.oferta_centavos   is 'Oferta do dia em centavos (int).';
comment on column public.ebd_aulas.total_assistencia is 'Snapshot: presentes + visitantes. Calculado ao vivo enquanto a aula está aberta.';
comment on column public.ebd_aulas.closed_at         is 'Quando o dia foi fechado. Nulo enquanto status = aberta.';

create index if not exists ebd_aulas_turma_tri_data_idx on public.ebd_aulas (turma_trimestre_id, data desc);
create index if not exists ebd_aulas_data_idx           on public.ebd_aulas (data desc);
create index if not exists ebd_aulas_status_idx         on public.ebd_aulas (status);

drop trigger if exists ebd_aulas_set_updated_at on public.ebd_aulas;
create trigger ebd_aulas_set_updated_at
  before update on public.ebd_aulas
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabela: ebd_frequencias (presença de cada aluno numa aula)
-- -----------------------------------------------------------------------------
create table if not exists public.ebd_frequencias (
  id           uuid                  primary key default gen_random_uuid(),
  org_id       uuid,
  aula_id      uuid                  not null references public.ebd_aulas (id)      on delete cascade,
  matricula_id uuid                  not null references public.ebd_matriculas (id) on delete cascade,
  status       ebd_frequencia_status not null,
  created_at   timestamptz           not null default now(),
  updated_at   timestamptz           not null default now(),

  -- Uma marcação por aluno por aula.
  constraint ebd_frequencias_unica unique (aula_id, matricula_id)
);

comment on table public.ebd_frequencias is 'Presença/falta/não-aplicável de cada aluno em cada aula. Base de cálculo das métricas do dia.';

create index if not exists ebd_frequencias_aula_idx      on public.ebd_frequencias (aula_id);
create index if not exists ebd_frequencias_matricula_idx on public.ebd_frequencias (matricula_id);
create index if not exists ebd_frequencias_status_idx    on public.ebd_frequencias (status);

drop trigger if exists ebd_frequencias_set_updated_at on public.ebd_frequencias;
create trigger ebd_frequencias_set_updated_at
  before update on public.ebd_frequencias
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- ATENÇÃO: o gate de autenticação é feito no front (decisão do projeto). As
-- políticas abaixo liberam acesso total via chave pública, igual aos demais
-- módulos. Ajuste para auth.uid()/roles caso a estratégia mude.
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'ebd_turmas', 'ebd_trimestres', 'ebd_turma_trimestres',
    'ebd_matriculas', 'ebd_aulas', 'ebd_frequencias'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists %I on public.%I;', t || '_select_all', t);
    execute format('create policy %I on public.%I for select using (true);', t || '_select_all', t);

    execute format('drop policy if exists %I on public.%I;', t || '_insert_all', t);
    execute format('create policy %I on public.%I for insert with check (true);', t || '_insert_all', t);

    execute format('drop policy if exists %I on public.%I;', t || '_update_all', t);
    execute format('create policy %I on public.%I for update using (true) with check (true);', t || '_update_all', t);

    execute format('drop policy if exists %I on public.%I;', t || '_delete_all', t);
    execute format('create policy %I on public.%I for delete using (true);', t || '_delete_all', t);
  end loop;
end$$;

-- -----------------------------------------------------------------------------
-- Seed: turma principal (idempotente; editável/removível pelo app).
-- -----------------------------------------------------------------------------
insert into public.ebd_turmas (org_id, nome, descricao)
values (null, 'Turma Principal', 'Turma única da EBD.')
on conflict (org_id, nome) do nothing;
