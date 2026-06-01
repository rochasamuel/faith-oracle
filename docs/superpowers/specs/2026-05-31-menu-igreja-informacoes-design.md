# Menu Igreja + Informações da igreja (editáveis)

Data: 2026-05-31

## Objetivo

Criar um menu **Igreja** com os subitens **Informações** e **Membros**. A página
de Informações permite **listar e editar na mesma tela** os dados institucionais
da igreja. Esses dados devem **refletir no relatório em PDF** (cabeçalho e
rodapé), que hoje lê um `const` fixo.

## Decisões

- **Persistência: Supabase**, com a tabela modelada já pensando em um SaaS
  multi-tenant futuro (coluna `org_id` reservada).
- **Membros: página placeholder** ("em breve") — sem implementação real agora.
- **Fora de escopo:** itens sample do menu (Playground/Models/Documentation/
  Settings/projects) e a implementação real de Membros.

## Abordagem geral

`CHURCH_INFO` (em `src/config/church.ts`) deixa de ser consumido diretamente no
PDF. Passa a ser:

1. O conjunto de **valores-padrão / seed** da tabela e o **fallback** usado
   quando ainda não há registro ou a query falha (o PDF continua gerando).
2. A fonte de verdade em runtime vira a **tabela `church_info` no Supabase**,
   lida via React Query e **injetada no relatório como prop**.

## Componentes

### 1. Banco — `supabase/church-info.sql` (novo)

Tabela singleton, preparada para multi-tenant:

- `id uuid primary key default gen_random_uuid()`
- `org_id uuid` (nullable) — reservado para tenancy futura
- `nome text not null`
- `cnpj text`
- `pastor_presidente text`
- `endereco text`
- `quantidade_membros integer not null default 0 check (>= 0)`
- `quantidade_obreiros integer not null default 0 check (>= 0)`
- `tipo_imovel` — enum `igreja_tipo_imovel ('propria','alugada','cedida')`,
  `not null default 'alugada'`
- `created_at / updated_at timestamptz` + trigger reaproveitando
  `public.set_updated_at()`
- **Singleton/tenant:** `unique nulls not distinct (org_id)` → uma linha por
  organização; hoje, exatamente uma linha com `org_id = null`.
- **RLS:** `using (true)` (select/insert/update) seguindo o padrão atual sem
  autenticação.
- **Seed:** `insert ... on conflict do nothing` com os valores atuais de
  `CHURCH_INFO`.

### 2. API — `src/api/church-info.ts` (novo)

- `interface ChurchInfo` — shape do banco (snake_case).
- `interface ChurchInfoInput` — campos editáveis.
- `getChurchInfo(): Promise<ChurchInfo | null>` — `select * limit 1`
  (`maybeSingle`).
- `upsertChurchInfo(payload): Promise<ChurchInfo>` — `upsert` com
  `onConflict: "org_id"`.

### 3. Hooks — `src/features/igreja/use-church-info.ts` (novo)

- `useChurchInfo()` — query key `["church-info"]`.
- `useUpsertChurchInfo()` — mutation; `onSuccess` invalida `["church-info"]` **e
  `["reports"]`** + `toast.success`; `onError` + `toast.error`. Espelha
  `use-balance-checkpoints.ts`.

### 4. Normalização — `src/features/igreja/church-view.ts` (novo)

- `interface ChurchView` — camelCase, mesmos nomes de campo de `CHURCH_INFO`
  (`nome`, `cnpj`, `pastorPresidente`, `endereco`, `quantidadeMembros`,
  `quantidadeObreiros`, `tipoImovel`).
- `toChurchView(db: ChurchInfo | null): ChurchView` — converte snake→camel e
  aplica fallback nos defaults de `config/church.ts`.

### 5. Relatório (reflete a edição)

- `report-pdf.tsx`: `ReportDocumentProps` ganha `church: ChurchView`; substitui
  todos os `CHURCH_INFO.x` por `church.x`. `TIPO_IMOVEL_LABEL` permanece.
- `report-pdf-blob.tsx`: repassa a prop (tipo já vem de `ReportDocumentProps`).
- `report-table.tsx`: usa `useChurchInfo()`, normaliza com `toChurchView(...)` e
  passa `church` em `reportPdfBlob({ report, summary, generatedAt, church })`.

### 6. Páginas e rotas

- `src/pages/igreja/informacoes.tsx` (novo) — **listagem + edição na mesma
  página**: Card com o formulário pré-preenchido com os dados atuais; salvar
  persiste. Estados de loading (Skeleton) / erro, no estilo de `saldos.tsx`.
- `src/features/igreja/church-info-form.tsx` (novo) — formulário controlado,
  validação com `zod`; `select` de tipo de imóvel; campos numéricos para
  membros/obreiros. Pré-preenche a partir dos dados carregados.
- `src/pages/igreja/membros.tsx` (novo) — stub "em breve".
- `src/main.tsx` — rotas `igreja/informacoes` e `igreja/membros`.

### 7. Menu — `src/components/app-sidebar.tsx`

Nova entrada `navMain` **Igreja** (ícone `ChurchIcon` do lucide-react) com
subitens **Informações** → `/igreja/informacoes` e **Membros** →
`/igreja/membros`.

## Fluxo de dados

`church_info` (Supabase) → `getChurchInfo` → `useChurchInfo` → `toChurchView`
→ (a) formulário de edição em Informações; (b) prop `church` do `ReportDocument`.
Salvar no formulário → `upsertChurchInfo` → invalida `["church-info"]` e
`["reports"]` → próxima geração de PDF já usa os novos valores.

## Tratamento de erros

- Query falha ou sem registro → `toChurchView(null)` devolve os defaults; o PDF
  e a página continuam funcionando.
- Validação do formulário via `zod` (mensagens por campo).
- Mutation com `toast` de sucesso/erro.

## Verificação

- Projeto sem framework de teste → gate de tipos/build: **`tsc -b`**.
- `pnpm lint` tem 4 erros pré-existentes (baseline) — não regredir.
- Verificação manual: editar dados em Informações → baixar relatório → conferir
  cabeçalho (nome/CNPJ/pastor/endereço) e rodapé (membros/obreiros/tipo imóvel).

## Notas

- Repositório não é git (`git init` ausente) → spec não será commitado; fica
  apenas em disco.
