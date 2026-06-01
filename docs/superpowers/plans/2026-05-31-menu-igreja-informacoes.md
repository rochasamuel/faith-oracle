# Menu Igreja + Informações da igreja — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um menu **Igreja** (subitens **Informações** e **Membros**) onde os dados institucionais da igreja podem ser listados e editados na mesma página, persistidos no Supabase e refletidos no relatório em PDF.

**Architecture:** Os dados saem do `const CHURCH_INFO` e passam para uma tabela singleton `church_info` no Supabase (com `org_id` reservado para multi-tenant futuro). Lidos via React Query (`useChurchInfo`), normalizados para um `ChurchView` (camelCase, com fallback nos defaults), e injetados no `ReportDocument` como prop `church`. O `const` permanece como seed/fallback.

**Tech Stack:** React 19 + react-router 7, @tanstack/react-query, @supabase/supabase-js, zod, sonner, @base-ui/react (Select), @react-pdf/renderer, Tailwind.

> **Notas de ambiente (importante):**
> - **Não há framework de teste** no projeto. O gate de cada task é **`npx tsc -b`** (typecheck/build) e, onde indicado, verificação manual no navegador (`pnpm dev`). Não invente testes nem adicione um runner.
> - **O diretório não é um repositório git.** Ignore os passos de `git commit`; o "commit" de cada task é substituído por rodar `npx tsc -b` com sucesso.
> - `pnpm lint` tem **4 erros pré-existentes** (baseline). Não regredir; não tente zerá-los.

---

## File Structure

**Criar:**
- `supabase/church-info.sql` — DDL da tabela `church_info` (enum, tabela, índice singleton, RLS, seed).
- `src/api/church-info.ts` — acesso ao Supabase (`getChurchInfo`, `upsertChurchInfo`) + tipos `ChurchInfo`/`ChurchInfoInput`.
- `src/features/igreja/church-view.ts` — tipo `ChurchView` + `toChurchView()` (snake→camel + fallback).
- `src/features/igreja/use-church-info.ts` — hooks React Query.
- `src/features/igreja/church-info-form.tsx` — formulário controlado de edição.
- `src/pages/igreja/informacoes.tsx` — página listagem+edição.
- `src/pages/igreja/membros.tsx` — stub placeholder.

**Modificar:**
- `src/config/church.ts` — adicionar `TIPO_IMOVEL_LABEL` + `TIPO_IMOVEL_OPTIONS`.
- `src/features/relatorios/report-pdf.tsx` — consumir prop `church` em vez do `const`; importar label do config.
- `src/features/relatorios/report-pdf-blob.tsx` — sem mudança de código (tipo flui de `ReportDocumentProps`); confirmar build.
- `src/features/relatorios/report-table.tsx` — ler `useChurchInfo`, normalizar e passar `church`.
- `src/main.tsx` — rotas `igreja/informacoes` e `igreja/membros`.
- `src/components/app-sidebar.tsx` — entrada de menu "Igreja".

---

## Task 1: Migration SQL da tabela `church_info`

**Files:**
- Create: `supabase/church-info.sql`

- [ ] **Step 1: Criar o arquivo SQL**

Conteúdo completo de `supabase/church-info.sql`:

```sql
-- =============================================================================
-- Faith Oracle — Dados institucionais da igreja (editáveis no app)
-- Banco: PostgreSQL (Supabase)
-- Como aplicar: cole e execute no SQL Editor do projeto Supabase.
-- =============================================================================

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

-- Mantém updated_at sincronizado (reaproveita a função criada em schema.sql).
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
```

- [ ] **Step 2: Aplicar no Supabase (ação humana)**

Abra o SQL Editor do projeto Supabase, cole o arquivo e execute. Confirme que `select * from public.church_info;` retorna 1 linha.
Expected: 1 linha com os dados acima. (Não bloqueia o build do front; necessário só para o runtime.)

- [ ] **Step 3: Gate**

Run: `npx tsc -b`
Expected: sem novos erros (este arquivo é SQL, não afeta o typecheck).

---

## Task 2: Constantes de tipo de imóvel em `config/church.ts`

**Files:**
- Modify: `src/config/church.ts`

- [ ] **Step 1: Adicionar labels e options ao final do arquivo**

Acrescente ao fim de `src/config/church.ts`:

```ts
/** Rótulos exibidos para cada tipo de imóvel (relatório e formulário). */
export const TIPO_IMOVEL_LABEL: Record<IgrejaTipoImovel, string> = {
  propria: "Igreja própria",
  alugada: "Igreja alugada",
  cedida: "Igreja cedida",
}

/** Lista value/label para popular selects. */
export const TIPO_IMOVEL_OPTIONS = (
  Object.keys(TIPO_IMOVEL_LABEL) as IgrejaTipoImovel[]
).map((value) => ({ value, label: TIPO_IMOVEL_LABEL[value] }))
```

- [ ] **Step 2: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros.

---

## Task 3: API `church-info.ts`

**Files:**
- Create: `src/api/church-info.ts`

- [ ] **Step 1: Criar o módulo de acesso**

Conteúdo completo de `src/api/church-info.ts`:

```ts
import { supabase } from "@/lib/supabase"
import type { IgrejaTipoImovel } from "@/config/church"

const TABLE = "church_info"

/** Linha de church_info como retornada pelo Supabase. */
export interface ChurchInfo {
  id: string
  org_id: string | null
  nome: string
  cnpj: string | null
  pastor_presidente: string | null
  endereco: string | null
  quantidade_membros: number
  quantidade_obreiros: number
  tipo_imovel: IgrejaTipoImovel
  created_at: string
  updated_at: string
}

/** Campos editáveis (payload de upsert). */
export interface ChurchInfoInput {
  nome: string
  cnpj: string | null
  pastor_presidente: string | null
  endereco: string | null
  quantidade_membros: number
  quantidade_obreiros: number
  tipo_imovel: IgrejaTipoImovel
}

/** Lê a única linha de informações da igreja (ou null se ainda não houver). */
export async function getChurchInfo(): Promise<ChurchInfo | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

/** Cria ou atualiza a linha singleton (org_id null, conflito por org_id). */
export async function upsertChurchInfo(
  payload: ChurchInfoInput
): Promise<ChurchInfo> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ ...payload, org_id: null }, { onConflict: "org_id" })
    .select()
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros.

---

## Task 4: Normalizador `church-view.ts`

**Files:**
- Create: `src/features/igreja/church-view.ts`

- [ ] **Step 1: Criar o normalizador com fallback**

Conteúdo completo de `src/features/igreja/church-view.ts`:

```ts
import type { ChurchInfo } from "@/api/church-info"
import { CHURCH_INFO, type IgrejaTipoImovel } from "@/config/church"

/** Forma camelCase consumida pela página e pelo relatório. */
export interface ChurchView {
  nome: string
  cnpj: string
  pastorPresidente: string
  endereco: string
  quantidadeMembros: number
  quantidadeObreiros: number
  tipoImovel: IgrejaTipoImovel
}

/** Defaults usados como seed/fallback (a partir do const histórico). */
const DEFAULTS: ChurchView = {
  nome: CHURCH_INFO.nome,
  cnpj: CHURCH_INFO.cnpj,
  pastorPresidente: CHURCH_INFO.pastorPresidente,
  endereco: CHURCH_INFO.endereco,
  quantidadeMembros: CHURCH_INFO.quantidadeMembros,
  quantidadeObreiros: CHURCH_INFO.quantidadeObreiros,
  tipoImovel: CHURCH_INFO.tipoImovel,
}

/** Converte a linha do banco em ChurchView, caindo nos defaults quando vazio. */
export function toChurchView(db: ChurchInfo | null): ChurchView {
  if (!db) return DEFAULTS
  return {
    nome: db.nome || DEFAULTS.nome,
    cnpj: db.cnpj ?? DEFAULTS.cnpj,
    pastorPresidente: db.pastor_presidente ?? DEFAULTS.pastorPresidente,
    endereco: db.endereco ?? DEFAULTS.endereco,
    quantidadeMembros: db.quantidade_membros ?? DEFAULTS.quantidadeMembros,
    quantidadeObreiros: db.quantidade_obreiros ?? DEFAULTS.quantidadeObreiros,
    tipoImovel: db.tipo_imovel ?? DEFAULTS.tipoImovel,
  }
}
```

- [ ] **Step 2: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros.

---

## Task 5: Hooks `use-church-info.ts`

**Files:**
- Create: `src/features/igreja/use-church-info.ts`

- [ ] **Step 1: Criar os hooks React Query**

Conteúdo completo de `src/features/igreja/use-church-info.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getChurchInfo,
  upsertChurchInfo,
  type ChurchInfoInput,
} from "@/api/church-info"

const churchInfoKey = ["church-info"] as const

/** Lê as informações da igreja. */
export function useChurchInfo() {
  return useQuery({
    queryKey: churchInfoKey,
    queryFn: getChurchInfo,
  })
}

/** Salva as informações e revalida church-info + relatórios. */
export function useUpsertChurchInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChurchInfoInput) => upsertChurchInfo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchInfoKey })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Informações da igreja salvas.")
    },
    onError: (error) => {
      toast.error("Não foi possível salvar as informações.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
```

- [ ] **Step 2: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros.

---

## Task 6: Formulário `church-info-form.tsx`

**Files:**
- Create: `src/features/igreja/church-info-form.tsx`

- [ ] **Step 1: Criar o formulário controlado**

Conteúdo completo de `src/features/igreja/church-info-form.tsx`:

```tsx
import * as React from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TIPO_IMOVEL_LABEL,
  TIPO_IMOVEL_OPTIONS,
  type IgrejaTipoImovel,
} from "@/config/church"
import type { ChurchInfoInput } from "@/api/church-info"
import type { ChurchView } from "@/features/igreja/church-view"

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da igreja."),
  cnpj: z.string().trim().max(30, "CNPJ muito longo.").optional(),
  pastorPresidente: z.string().trim().max(120, "Nome muito longo.").optional(),
  endereco: z.string().trim().max(300, "Endereço muito longo.").optional(),
  quantidadeMembros: z
    .number({ message: "Informe um número." })
    .int("Use um número inteiro.")
    .min(0, "Não pode ser negativo."),
  quantidadeObreiros: z
    .number({ message: "Informe um número." })
    .int("Use um número inteiro.")
    .min(0, "Não pode ser negativo."),
  tipoImovel: z.enum(["propria", "alugada", "cedida"]),
})

type FieldErrors = Partial<Record<keyof ChurchView, string>>

interface ChurchInfoFormProps {
  defaultValues: ChurchView
  onSubmit: (payload: ChurchInfoInput) => Promise<void> | void
  isSubmitting?: boolean
}

export function ChurchInfoForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: ChurchInfoFormProps) {
  const [nome, setNome] = React.useState(defaultValues.nome)
  const [cnpj, setCnpj] = React.useState(defaultValues.cnpj)
  const [pastorPresidente, setPastorPresidente] = React.useState(
    defaultValues.pastorPresidente
  )
  const [endereco, setEndereco] = React.useState(defaultValues.endereco)
  const [quantidadeMembros, setQuantidadeMembros] = React.useState(
    String(defaultValues.quantidadeMembros)
  )
  const [quantidadeObreiros, setQuantidadeObreiros] = React.useState(
    String(defaultValues.quantidadeObreiros)
  )
  const [tipoImovel, setTipoImovel] = React.useState<IgrejaTipoImovel>(
    defaultValues.tipoImovel
  )
  const [errors, setErrors] = React.useState<FieldErrors>({})

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schema.safeParse({
      nome,
      cnpj: cnpj.trim() || undefined,
      pastorPresidente: pastorPresidente.trim() || undefined,
      endereco: endereco.trim() || undefined,
      quantidadeMembros: Number(quantidadeMembros),
      quantidadeObreiros: Number(quantidadeObreiros),
      tipoImovel,
    })

    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    await onSubmit({
      nome: result.data.nome,
      cnpj: result.data.cnpj ?? null,
      pastor_presidente: result.data.pastorPresidente ?? null,
      endereco: result.data.endereco ?? null,
      quantidade_membros: result.data.quantidadeMembros,
      quantidade_obreiros: result.data.quantidadeObreiros,
      tipo_imovel: result.data.tipoImovel,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome da igreja</Label>
        <Input
          id="nome"
          className="h-9 text-sm"
          value={nome}
          aria-invalid={!!errors.nome}
          onChange={(e) => setNome(e.target.value)}
        />
        {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          className="h-9 text-sm"
          value={cnpj}
          aria-invalid={!!errors.cnpj}
          onChange={(e) => setCnpj(e.target.value)}
        />
        {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pastor">Pastor presidente</Label>
        <Input
          id="pastor"
          className="h-9 text-sm"
          value={pastorPresidente}
          aria-invalid={!!errors.pastorPresidente}
          onChange={(e) => setPastorPresidente(e.target.value)}
        />
        {errors.pastorPresidente && (
          <p className="text-xs text-destructive">{errors.pastorPresidente}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Textarea
          id="endereco"
          className="text-sm"
          value={endereco}
          aria-invalid={!!errors.endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />
        {errors.endereco && (
          <p className="text-xs text-destructive">{errors.endereco}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="membros">Quantidade de membros</Label>
          <Input
            id="membros"
            type="number"
            min={0}
            className="h-9 text-sm"
            value={quantidadeMembros}
            aria-invalid={!!errors.quantidadeMembros}
            onChange={(e) => setQuantidadeMembros(e.target.value)}
          />
          {errors.quantidadeMembros && (
            <p className="text-xs text-destructive">{errors.quantidadeMembros}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="obreiros">Quantidade de obreiros</Label>
          <Input
            id="obreiros"
            type="number"
            min={0}
            className="h-9 text-sm"
            value={quantidadeObreiros}
            aria-invalid={!!errors.quantidadeObreiros}
            onChange={(e) => setQuantidadeObreiros(e.target.value)}
          />
          {errors.quantidadeObreiros && (
            <p className="text-xs text-destructive">
              {errors.quantidadeObreiros}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tipo de imóvel</Label>
        <Select
          items={TIPO_IMOVEL_LABEL}
          value={tipoImovel}
          onValueChange={(value) => setTipoImovel(value as IgrejaTipoImovel)}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Selecione o tipo de imóvel" />
          </SelectTrigger>
          <SelectContent>
            {TIPO_IMOVEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar informações"}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros. (Confirma que `Textarea`, `Select` e os imports de `config/church` resolvem.)

---

## Task 7: Página `informacoes.tsx`

**Files:**
- Create: `src/pages/igreja/informacoes.tsx`

- [ ] **Step 1: Criar a página listagem + edição**

Conteúdo completo de `src/pages/igreja/informacoes.tsx`:

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChurchInfoForm } from "@/features/igreja/church-info-form"
import { toChurchView } from "@/features/igreja/church-view"
import {
  useChurchInfo,
  useUpsertChurchInfo,
} from "@/features/igreja/use-church-info"

export default function InformacoesPage() {
  const { data, isLoading, isError } = useChurchInfo()
  const upsert = useUpsertChurchInfo()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-lg font-medium">
          Informações da igreja
        </h1>
        <p className="text-xs text-muted-foreground">
          Dados institucionais usados no cabeçalho e no rodapé do relatório em
          PDF. Alterações aqui passam a valer nos próximos relatórios gerados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da igreja</CardTitle>
          <CardDescription>
            Edite e salve. Os campos já vêm preenchidos com os dados atuais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <>
              {isError && (
                <p className="mb-4 text-xs text-destructive">
                  Não foi possível carregar do servidor; exibindo os valores
                  padrão.
                </p>
              )}
              <ChurchInfoForm
                defaultValues={toChurchView(data ?? null)}
                isSubmitting={upsert.isPending}
                onSubmit={async (payload) => {
                  await upsert.mutateAsync(payload)
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

> **Nota de design:** o form recebe `defaultValues` e inicializa seu estado interno com `useState`. Como o componente só monta após `isLoading` virar false (o ramo de loading mostra o Skeleton, não o form), os defaults já chegam preenchidos. Não é necessário `key` nem `useEffect` de sincronização.

- [ ] **Step 2: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros.

---

## Task 8: Página stub `membros.tsx`

**Files:**
- Create: `src/pages/igreja/membros.tsx`

- [ ] **Step 1: Criar o placeholder**

Conteúdo completo de `src/pages/igreja/membros.tsx`:

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function MembrosPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-lg font-medium">Membros</h1>
        <p className="text-xs text-muted-foreground">
          Cadastro de membros da igreja.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
          <CardDescription>
            A gestão de membros ainda será implementada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta seção está reservada para o cadastro e a listagem de membros.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros.

---

## Task 9: Rotas em `main.tsx`

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Importar as páginas novas**

Após a linha `import RelatoriosPage from './pages/relatorios/index.tsx'`, adicione:

```tsx
import InformacoesPage from './pages/igreja/informacoes.tsx'
import MembrosPage from './pages/igreja/membros.tsx'
```

- [ ] **Step 2: Registrar as rotas filhas**

No array `children`, após a linha `{ path: 'relatorios', element: <RelatoriosPage /> },`, adicione:

```tsx
      { path: 'igreja/informacoes', element: <InformacoesPage /> },
      { path: 'igreja/membros', element: <MembrosPage /> },
```

- [ ] **Step 3: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros.

---

## Task 10: Menu "Igreja" na sidebar

**Files:**
- Modify: `src/components/app-sidebar.tsx`

- [ ] **Step 1: Adicionar `ChurchIcon` ao import de lucide**

Na linha de import de `lucide-react` (que termina em `... MapIcon, WalletIcon } from "lucide-react"`), inclua `ChurchIcon`:

```tsx
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon, WalletIcon, ChurchIcon } from "lucide-react"
```

- [ ] **Step 2: Inserir a entrada "Igreja" no `navMain`**

Em `src/components/app-sidebar.tsx`, no array `navMain`, logo após o objeto do item "Financeiro" (depois do `]` que fecha seus `items` e do `},`), insira:

```tsx
    {
      title: "Igreja",
      url: "/igreja/informacoes",
      icon: (
        <ChurchIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Informações",
          url: "/igreja/informacoes",
        },
        {
          title: "Membros",
          url: "/igreja/membros",
        },
      ],
    },
```

- [ ] **Step 3: Gate**

Run: `npx tsc -b`
Expected: PASS sem novos erros.

- [ ] **Step 4: Verificação manual (navegador)**

Run: `pnpm dev` e abra o app.
Expected: menu "Igreja" aparece com subitens "Informações" e "Membros"; ambos navegam para as páginas; a rota ativa fica destacada.

---

## Task 11: Relatório consome a prop `church`

**Files:**
- Modify: `src/features/relatorios/report-pdf.tsx`
- Modify: `src/features/relatorios/report-table.tsx`

- [ ] **Step 1: Em `report-pdf.tsx`, trocar o import do label e do const**

Localize (perto do topo):

```tsx
import { CHURCH_INFO, type IgrejaTipoImovel } from "@/config/church"
```

Substitua por:

```tsx
import { TIPO_IMOVEL_LABEL } from "@/config/church"
import type { ChurchView } from "@/features/igreja/church-view"
```

- [ ] **Step 2: Remover a definição local de `TIPO_IMOVEL_LABEL`**

Localize e **remova** este bloco em `report-pdf.tsx` (por volta da linha 205), pois agora vem do config:

```tsx
const TIPO_IMOVEL_LABEL: Record<IgrejaTipoImovel, string> = {
  propria: "Igreja própria",
  alugada: "Igreja alugada",
  cedida: "Igreja cedida",
}
```

- [ ] **Step 3: Adicionar `church` às props do documento**

Localize:

```tsx
export interface ReportDocumentProps {
  report: Report
  summary: ReportSummary
  generatedAt: Date
}

export function ReportDocument({
  report,
  summary,
  generatedAt,
}: ReportDocumentProps) {
```

Substitua por:

```tsx
export interface ReportDocumentProps {
  report: Report
  summary: ReportSummary
  generatedAt: Date
  church: ChurchView
}

export function ReportDocument({
  report,
  summary,
  generatedAt,
  church,
}: ReportDocumentProps) {
```

- [ ] **Step 4: Trocar todas as referências `CHURCH_INFO.` por `church.`**

Ainda em `report-pdf.tsx`, no corpo do JSX, substitua cada ocorrência:

- `{CHURCH_INFO.nome}` → `{church.nome}`
- `CNPJ: {CHURCH_INFO.cnpj} | Pastor Presidente:{" "}` → `CNPJ: {church.cnpj} | Pastor Presidente:{" "}`
- `{CHURCH_INFO.pastorPresidente}` → `{church.pastorPresidente}`
- `{CHURCH_INFO.endereco}` → `{church.endereco}`
- `Quantidade de membros: {CHURCH_INFO.quantidadeMembros}` → `Quantidade de membros: {church.quantidadeMembros}`
- `Quantidade de obreiros: {CHURCH_INFO.quantidadeObreiros}` → `Quantidade de obreiros: {church.quantidadeObreiros}`
- `checked={CHURCH_INFO.tipoImovel === "propria"}` → `checked={church.tipoImovel === "propria"}`
- `checked={CHURCH_INFO.tipoImovel === "alugada"}` → `checked={church.tipoImovel === "alugada"}`
- `checked={CHURCH_INFO.tipoImovel === "cedida"}` → `checked={church.tipoImovel === "cedida"}`

Verificação: `grep -n "CHURCH_INFO" src/features/relatorios/report-pdf.tsx` deve retornar **vazio**.

- [ ] **Step 5: Em `report-table.tsx`, importar hook e normalizador**

No bloco de imports de `report-table.tsx`, adicione:

```tsx
import { useChurchInfo } from "@/features/igreja/use-church-info"
import { toChurchView } from "@/features/igreja/church-view"
```

- [ ] **Step 6: Ler church info no componente e passar ao PDF**

Em `report-table.tsx`, dentro do componente `ReportTable` (onde já existem `const [pending, ...]` e `const [downloadingId, ...]`), adicione perto do topo do corpo do componente:

```tsx
  const { data: churchData } = useChurchInfo()
```

Depois, em `handleDownload`, localize:

```tsx
      const summary = buildReportSummary(report, transactions, saldoInicial)
      const blob = await reportPdfBlob({
        report,
        summary,
        generatedAt: new Date(),
      })
```

Substitua por:

```tsx
      const summary = buildReportSummary(report, transactions, saldoInicial)
      const blob = await reportPdfBlob({
        report,
        summary,
        generatedAt: new Date(),
        church: toChurchView(churchData ?? null),
      })
```

> **Nota:** `useChurchInfo()` é chamado no nível do componente (regra dos hooks). `handleDownload` apenas lê a variável `churchData` capturada no closure. Se ainda não carregou, `toChurchView(null)` devolve os defaults — o PDF continua válido.

- [ ] **Step 7: Gate**

Run: `npx tsc -b`
Expected: PASS. `report-pdf-blob.tsx` não precisa de mudança: `reportPdfBlob(props: ReportDocumentProps)` já exige `church` automaticamente; se algum chamador faltar com a prop, o build acusa aqui.

- [ ] **Step 8: Verificação manual (fluxo completo)**

Run: `pnpm dev`
1. Em **Igreja → Informações**, altere "Quantidade de membros" para um valor visível (ex.: 123) e salve (toast de sucesso).
2. Vá em **Relatórios**, baixe um relatório existente.
Expected: o PDF mostra os novos valores no cabeçalho/rodapé (ex.: "Quantidade de membros: 123").

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** tabela/seed (T1), defaults/labels (T2), API (T3), normalizador (T4), hooks (T5), form (T6), página informações (T7), stub membros (T8), rotas (T9), menu (T10), integração no relatório (T11). Todos os itens do spec têm task.
- **Placeholders:** nenhum "TODO/TBD"; todo passo de código traz o código completo.
- **Consistência de tipos:** `ChurchInfo`/`ChurchInfoInput` (snake_case) definidos em T3 e usados em T4–T6; `ChurchView` (camelCase) definido em T4 e usado em T6/T7/T11; `ChurchInfoInput` é o payload de `onSubmit`→`useUpsertChurchInfo`→`upsertChurchInfo` (mesma forma). `TIPO_IMOVEL_LABEL`/`TIPO_IMOVEL_OPTIONS` definidos em T2 e consumidos em T6/T11. `church` adicionado a `ReportDocumentProps` em T11 e fornecido pelo único chamador (`report-table.tsx`).
- **Risco conhecido:** o upsert por `org_id` depende do índice `nulls not distinct` (T1). Se o Supabase do projeto for Postgres < 15, ajustar para upsert por `id` fixo. Supabase atual é PG ≥ 15.
```
