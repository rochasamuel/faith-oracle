# Saldos iniciais + Doações não identificadas + Conciliação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir saldos iniciais reais por data (marcos), uma categoria de doação não identificada e conciliação do saldo do sistema com o saldo do banco — com todo valor monetário armazenado em centavos (inteiro).

**Architecture:** Camada de dados no Supabase (SQL idempotente) + funções de API finas em `src/api/*` que delegam a **helpers puros** em `src/features/*`; hooks React Query por entidade; UI em página própria (marcos) e dentro de Relatórios (conciliação). A migração para centavos é a primeira tarefa, pois muda a unidade de todo o domínio.

**Tech Stack:** React 19, React Router v7 (`createBrowserRouter` em `src/main.tsx`), TanStack Query v5, Supabase JS, zod, date-fns, lucide-react, sonner (toasts). **Sem framework de testes** — o gate de qualidade é `npx tsc -b` (consta na memória do projeto: `pnpm lint` tem 4 erros pré-existentes). **Valores em centavos (inteiro).** Datas ISO `yyyy-mm-dd`.

**Spec:** `docs/superpowers/specs/2026-05-31-saldos-iniciais-e-conciliacao-design.md`

---

## Convenções e gate

- Este diretório **não é um repositório git** ainda; os passos de commit assumem git inicializado (ver Prerequisites).
- Gate após cada task: `npx tsc -b` (sem erros). Não há `vitest`/testes.
- SQL aplicado manualmente no SQL Editor do Supabase (o projeto não usa migrações timestamped; tem `supabase/schema.sql` e `supabase/reports.sql`). **Sem dados a preservar** — pode dropar/recriar tabelas (confirmado pelo usuário).
- **Unidade monetária após este plano: centavos (inteiro) em TODO lugar** — banco, API, cálculos e o que `formatBRL` recebe.

### Prerequisites

- [ ] **Inicializar git (se necessário)**

Run:
```bash
cd /home/sams/projects/faith-oracle && (git rev-parse --is-inside-work-tree 2>/dev/null && echo "git ok" || git init)
```

- [ ] **Confirmar baseline de tipos**

Run: `npx tsc -b`
Expected: termina sem erros (estado atual do projeto).

---

## File Structure

> **Nota:** não há dados a preservar (o usuário confirmou que pode recriar as
> tabelas). Por isso o schema é **recriado já em centavos**, sem migração de
> dados. Os arquivos `schema.sql`/`reports.sql` são a fonte de
> verdade e ganham um novo arquivo `supabase/extras.sql` para as tabelas novas.

**Criar:**
- `supabase/extras.sql` — tabelas `balance_checkpoints` e `reconciliations` (idempotente).
- `src/api/balance-checkpoints.ts` — CRUD de marcos de saldo.
- `src/features/financeiro/balance.ts` — helpers puros de saldo.
- `src/features/financeiro/use-balance-checkpoints.ts` — hooks React Query.
- `src/features/financeiro/checkpoint-form.tsx` — formulário de marco.
- `src/pages/financeiro/saldos.tsx` — página "Saldos iniciais".
- `src/api/reconciliations.ts` — criação/listagem de conciliações.
- `src/features/relatorios/reconciliation.ts` — helper puro do ajuste.
- `src/features/relatorios/use-reconciliations.ts` — hooks React Query.
- `src/features/relatorios/reconciliation-dialog.tsx` — diálogo de conciliação.

**Modificar:**
- `supabase/schema.sql` + `supabase/reports.sql` — tipos de coluna para `integer` (fonte de verdade do schema).
- `src/lib/currency.ts` — `formatBRL` passa a receber centavos; remover `centsToReais`.
- `src/features/financeiro/transaction-form.tsx` — salvar `amount` em centavos; enum `doacoes`.
- `src/pages/financeiro/lancamentos.tsx` — filtros comparam centavos direto (remover `centsToReais`).
- `src/features/financeiro/constants.ts` — categoria `doacoes`.
- `src/config/church.ts` — `AGGREGATED_CATEGORIES += "doacoes"`; remover `SALDO_ABERTURA`.
- `src/api/transactions.ts` — reescrever `getBalanceBefore`; adicionar `getBalanceAsOf`.
- `src/main.tsx` — rota `/financeiro/saldos`.
- `src/components/app-sidebar.tsx` — item de menu "Saldos iniciais".
- `src/pages/relatorios/index.tsx` — botão de conciliação.

> Nota: `currency-input.tsx`, `report-summary.ts`, `report-pdf.tsx`, `transaction-table.tsx`, `delete-transaction-dialog.tsx`, `report-table.tsx` e `generate-report-dialog.tsx` **não mudam de código** — passam a operar sobre centavos automaticamente quando `formatBRL` for redefinida e os dados forem inteiros. Verificados no passo de tipos.

---

## Task 1: Schema do banco (centavos + doações + tabelas novas)

Sem dados a preservar: recriamos o schema já em centavos e dropamos/recriamos as
tabelas existentes. `schema.sql`/`reports.sql` são a fonte de verdade.

**Files:**
- Modify: `supabase/schema.sql` (tipo de `amount` → integer; enum `doacoes`)
- Modify: `supabase/reports.sql` (totais → integer)
- Create: `supabase/extras.sql` (tabelas `balance_checkpoints` e `reconciliations`)

- [ ] **Step 1: Atualizar `supabase/schema.sql`**

Na definição de `transactions.amount` (linhas ~52-53), trocar tipo e comentário:

De:
```sql
  -- Valor sempre positivo, em reais. O sinal é dado pela coluna `type`.
  amount      numeric(12, 2)        not null check (amount > 0),
```
Para:
```sql
  -- Valor sempre positivo, em CENTAVOS (inteiro). O sinal é dado pela coluna `type`.
  amount      integer               not null check (amount > 0),
```

Adicionar `'doacoes'` ao `create type transaction_category as enum (...)` (após `'ofertas'`):
```sql
      'dizimos',
      'ofertas',
      'doacoes',
      'ajuda_social',
```
Ajustar o comentário da coluna `amount` (linha ~63) de "em reais" para "em centavos".

- [ ] **Step 2: Atualizar `supabase/reports.sql`**

Trocar os três campos monetários (linhas ~58-60) de `numeric(12, 2)` para `integer`:
```sql
  total_entradas     integer             not null default 0,
  total_saidas       integer             not null default 0,
  balance            integer             not null default 0,
```
Ajustar o comentário de `balance` se mencionar reais.

- [ ] **Step 3: Criar `supabase/extras.sql`**

```sql
-- =============================================================================
-- Faith Oracle — Marcos de saldo e conciliações.
-- Depende de schema.sql (usa public.set_updated_at). Aplicar no SQL Editor.
-- =============================================================================

create extension if not exists "pgcrypto";

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
```

- [ ] **Step 4: Recriar o schema no Supabase**

Como as colunas de `transactions`/`reports` mudam de tipo e não há dados a manter,
dropar e recriar é o caminho limpo. No SQL Editor:

```sql
drop table if exists public.reconciliations cascade;
drop table if exists public.reports cascade;
drop table if exists public.transactions cascade;
drop type  if exists public.transaction_category cascade;
drop type  if exists public.transaction_type cascade;
drop type  if exists public.report_period_type cascade;
drop type  if exists public.report_status cascade;
```

Depois rodar, em ordem: `schema.sql`, `reports.sql`, `extras.sql`. Verificar:
```sql
select data_type from information_schema.columns
  where table_name = 'transactions' and column_name = 'amount';   -- integer
select unnest(enum_range(null::transaction_category));            -- inclui 'doacoes'
```
Expected: `integer` e a lista com `doacoes`.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql supabase/reports.sql supabase/extras.sql
git commit -m "feat(db): cents schema, doacoes category, checkpoints/reconciliations tables"
```

---

## Task 2: Moeda em centavos no front (currency.ts + call sites)

**Files:**
- Modify: `src/lib/currency.ts`
- Modify: `src/features/financeiro/transaction-form.tsx:24,97`
- Modify: `src/pages/financeiro/lancamentos.tsx:16,38-39,48-49`

- [ ] **Step 1: Reescrever `src/lib/currency.ts`**

`formatBRL` passa a receber **centavos**; `formatCentsToBRL` vira um alias; `centsToReais` é removido (não há mais persistência em reais). Substituir o arquivo por:

```typescript
/**
 * Helpers de moeda em Real (BRL). Tudo trabalha em CENTAVOS (inteiro) para
 * evitar erros de ponto flutuante — inclusive o que é persistido no banco.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

/** Formata centavos para exibição: 123450 -> "R$ 1.234,50". */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100)
}

/** Alias histórico: idêntico a formatBRL (recebe centavos). */
export function formatCentsToBRL(cents: number): string {
  return formatBRL(cents)
}

/** Extrai apenas os dígitos de uma string e os interpreta como centavos. */
export function digitsToCents(value: string): number {
  const digits = value.replace(/\D/g, "")
  if (!digits) return 0
  return Number.parseInt(digits, 10)
}
```

- [ ] **Step 2: Ajustar `transaction-form.tsx`**

Remover o import e o uso de `centsToReais` — salvar o valor já em centavos.

Linha 24, remover:
```typescript
import { centsToReais } from "@/lib/currency"
```
Linha ~97, trocar:
```typescript
        amount: centsToReais(result.data!.amountCents),
```
por:
```typescript
        amount: result.data!.amountCents,
```

- [ ] **Step 3: Ajustar filtros em `lancamentos.tsx`**

Os filtros já estão em centavos (`minCents`/`maxCents`) e agora `t.amount` também está — remover a conversão.

Linha 16, trocar:
```typescript
import { centsToReais, formatBRL } from "@/lib/currency"
```
por:
```typescript
import { formatBRL } from "@/lib/currency"
```
Linhas ~38-39, trocar:
```typescript
  const min = filters.minCents > 0 ? centsToReais(filters.minCents) : null
  const max = filters.maxCents > 0 ? centsToReais(filters.maxCents) : null
```
por:
```typescript
  const min = filters.minCents > 0 ? filters.minCents : null
  const max = filters.maxCents > 0 ? filters.maxCents : null
```
(As linhas 48-49 que comparam `t.amount < min` / `t.amount > max` permanecem — agora ambos em centavos.)

- [ ] **Step 4: Verificar tipos (pega qualquer call site esquecido de `centsToReais`)**

Run: `npx tsc -b`
Expected: sem erros. Se acusar `centsToReais` em algum arquivo, corrigir lá (não deve haver outros — só form e lancamentos importavam).

- [ ] **Step 5: Commit**

```bash
git add src/lib/currency.ts src/features/financeiro/transaction-form.tsx src/pages/financeiro/lancamentos.tsx
git commit -m "refactor: store and compute money in cents end-to-end"
```

---

## Task 3: Categoria "Doações (não identificado)" no TypeScript

**Files:**
- Modify: `src/features/financeiro/constants.ts`
- Modify: `src/config/church.ts`
- Modify: `src/features/financeiro/transaction-form.tsx:37-47`

- [ ] **Step 1: Adicionar `doacoes` em `constants.ts`**

No union `TransactionCategory` (após `"ofertas"`):
```typescript
export type TransactionCategory =
  | "dizimos"
  | "ofertas"
  | "doacoes"
  | "ajuda_social"
  | "eventos"
  | "despesas_fixas"
  | "missoes"
  | "manutencao"
  | "construcao"
  | "outros"
```
No `TRANSACTION_CATEGORY_LABELS` (após `ofertas`):
```typescript
  ofertas: "Ofertas",
  doacoes: "Doações (não identificado)",
  ajuda_social: "Ajuda social",
```
(`TRANSACTION_CATEGORIES` é derivado das chaves de labels — entra no `<Select>` automaticamente.)

- [ ] **Step 2: Agregar `doacoes` por mês em `church.ts`**

Em `src/config/church.ts`:
```typescript
export const AGGREGATED_CATEGORIES: TransactionCategory[] = [
  "dizimos",
  "ofertas",
  "doacoes",
]
```

- [ ] **Step 3: Adicionar `doacoes` ao enum do zod no formulário**

Em `src/features/financeiro/transaction-form.tsx`, no `z.enum([...])` (após `"ofertas"`):
```typescript
  category: z.enum([
    "dizimos",
    "ofertas",
    "doacoes",
    "ajuda_social",
    "eventos",
    "despesas_fixas",
    "missoes",
    "manutencao",
    "construcao",
    "outros",
  ]),
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc -b`
Expected: sem erros. O `Record<TransactionCategory, string>` de labels obriga a cobrir `doacoes` (garante consistência).

- [ ] **Step 5: Commit**

```bash
git add src/features/financeiro/constants.ts src/config/church.ts src/features/financeiro/transaction-form.tsx
git commit -m "feat: add 'doacoes' (unidentified donation) category"
```

---

## Task 4: Helpers puros de saldo

**Files:**
- Create: `src/features/financeiro/balance.ts`

- [ ] **Step 1: Implementar `balance.ts`**

```typescript
/** Lançamento mínimo para cálculo de saldo (valores em centavos). */
export interface SignedEntry {
  type: "entrada" | "saida"
  amount: number
}

/** Soma com sinal: entradas positivas, saídas negativas (centavos). */
export function signedTotal(entries: SignedEntry[]): number {
  return entries.reduce(
    (sum, e) => sum + (e.type === "entrada" ? e.amount : -e.amount),
    0
  )
}

/** Saldo de aplicar `entries` sobre uma `base` (centavos). */
export function balanceFrom(base: number, entries: SignedEntry[]): number {
  return base + signedTotal(entries)
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/features/financeiro/balance.ts
git commit -m "feat: add pure balance helpers"
```

---

## Task 5: API de marcos de saldo

**Files:**
- Create: `src/api/balance-checkpoints.ts`

- [ ] **Step 1: Implementar a API** (espelha o estilo de `src/api/transactions.ts`)

```typescript
import { supabase } from "@/lib/supabase"

const TABLE = "balance_checkpoints"

/** Marco de saldo como retornado pelo Supabase. */
export interface BalanceCheckpoint {
  id: string
  checkpoint_date: string // ISO yyyy-mm-dd
  amount: number // centavos
  notes: string | null
  created_at: string
  updated_at: string
}

/** Payload de criação/edição (upsert por data). */
export interface NewBalanceCheckpoint {
  checkpoint_date: string
  amount: number
  notes?: string | null
}

/** Lista os marcos, mais recentes primeiro. */
export async function listCheckpoints(): Promise<BalanceCheckpoint[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("checkpoint_date", { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Cria ou atualiza o marco da data (checkpoint_date é único). */
export async function upsertCheckpoint(
  payload: NewBalanceCheckpoint
): Promise<BalanceCheckpoint> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "checkpoint_date" })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Remove um marco pelo id. */
export async function deleteCheckpoint(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}

/** Marco mais recente com data <= dateISO, ou null. */
export async function getLatestCheckpointAsOf(
  dateISO: string
): Promise<BalanceCheckpoint | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .lte("checkpoint_date", dateISO)
    .order("checkpoint_date", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/api/balance-checkpoints.ts
git commit -m "feat: add balance-checkpoints API"
```

---

## Task 6: Saldo inicial derivado do marco

**Files:**
- Modify: `src/api/transactions.ts:1-6,79-95`
- Modify: `src/config/church.ts` (remover `SALDO_ABERTURA`)

- [ ] **Step 1: Trocar imports no topo de `transactions.ts`**

Remover:
```typescript
import { SALDO_ABERTURA } from "@/config/church"
```
Adicionar:
```typescript
import { getLatestCheckpointAsOf } from "@/api/balance-checkpoints"
import { balanceFrom } from "@/features/financeiro/balance"
```

- [ ] **Step 2: Substituir `getBalanceBefore` e adicionar `getBalanceAsOf`**

Trocar toda a função `getBalanceBefore` (linhas ~79-95) por:

```typescript
/**
 * Saldo no INÍCIO de `dateISO` (exclusivo): base do marco mais recente
 * (<= data) + lançamentos da data do marco até `dateISO` (exclusivo).
 * Sem marco anterior, base = 0. É o "saldo inicial" do relatório.
 */
export async function getBalanceBefore(dateISO: string): Promise<number> {
  return balanceUpTo(dateISO, false)
}

/**
 * Saldo ao FIM de `dateISO` (inclusive): inclui os lançamentos do próprio dia.
 * Usado na conciliação (comparar com o saldo informado do banco na data).
 */
export async function getBalanceAsOf(dateISO: string): Promise<number> {
  return balanceUpTo(dateISO, true)
}

/** Núcleo: base do marco + soma dos lançamentos até `dateISO` (centavos). */
async function balanceUpTo(dateISO: string, inclusive: boolean): Promise<number> {
  const checkpoint = await getLatestCheckpointAsOf(dateISO)
  const base = checkpoint?.amount ?? 0

  let q = supabase.from(TABLE).select("type, amount")
  if (checkpoint) q = q.gte("occurred_at", checkpoint.checkpoint_date)
  q = inclusive ? q.lte("occurred_at", dateISO) : q.lt("occurred_at", dateISO)

  const { data, error } = await q
  if (error) throw error
  return balanceFrom(base, data ?? [])
}
```

- [ ] **Step 3: Remover `SALDO_ABERTURA` de `church.ts`**

Apagar a constante `SALDO_ABERTURA` e o bloco de comentário acima dela (linhas ~23-29 do arquivo). Confirmar que ninguém mais a usa:

Run: `grep -rn "SALDO_ABERTURA" src`
Expected: nenhum resultado.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/api/transactions.ts src/config/church.ts
git commit -m "feat: derive report opening balance from balance checkpoints"
```

---

## Task 7: Hooks de marcos de saldo

**Files:**
- Create: `src/features/financeiro/use-balance-checkpoints.ts`

- [ ] **Step 1: Implementar os hooks** (espelha `src/features/financeiro/hooks.ts`)

Marcos afetam o saldo inicial dos relatórios → invalidar também `["reports"]`.

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  deleteCheckpoint,
  listCheckpoints,
  upsertCheckpoint,
  type NewBalanceCheckpoint,
} from "@/api/balance-checkpoints"

const checkpointsKey = ["balance-checkpoints"] as const

/** Lê todos os marcos de saldo. */
export function useBalanceCheckpoints() {
  return useQuery({
    queryKey: checkpointsKey,
    queryFn: listCheckpoints,
  })
}

/** Cria/atualiza um marco e revalida marcos + relatórios. */
export function useUpsertCheckpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewBalanceCheckpoint) => upsertCheckpoint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkpointsKey })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Marco de saldo salvo.")
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o marco.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/** Remove um marco e revalida marcos + relatórios. */
export function useDeleteCheckpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCheckpoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkpointsKey })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Marco removido.")
    },
    onError: (error) => {
      toast.error("Não foi possível remover o marco.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/features/financeiro/use-balance-checkpoints.ts
git commit -m "feat: add balance-checkpoints query hooks"
```

---

## Task 8: Formulário e página "Saldos iniciais" + rota + menu

**Files:**
- Create: `src/features/financeiro/checkpoint-form.tsx`
- Create: `src/pages/financeiro/saldos.tsx`
- Modify: `src/main.tsx`
- Modify: `src/components/app-sidebar.tsx`

- [ ] **Step 1: Implementar `checkpoint-form.tsx`**

Reaproveita `CurrencyInput` (centavos) e um `<Input type="date">` nativo (ISO direto). Não usa o `<Select>`.

```typescript
import * as React from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import { dateToISO } from "@/lib/date"
import type { NewBalanceCheckpoint } from "@/api/balance-checkpoints"

const schema = z.object({
  checkpoint_date: z.string().min(1, "Informe a data."),
  amountCents: z.number().int("Informe um valor."),
  notes: z.string().max(500, "Observação muito longa.").optional(),
})

type FieldErrors = Partial<Record<"checkpoint_date" | "amountCents" | "notes", string>>

interface CheckpointFormProps {
  onSubmit: (payload: NewBalanceCheckpoint) => Promise<void> | void
  isSubmitting?: boolean
}

export function CheckpointForm({ onSubmit, isSubmitting }: CheckpointFormProps) {
  const [date, setDate] = React.useState(dateToISO(new Date()))
  const [amountCents, setAmountCents] = React.useState(0)
  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<FieldErrors>({})

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schema.safeParse({
      checkpoint_date: date,
      amountCents,
      notes: notes.trim() || undefined,
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
      checkpoint_date: result.data.checkpoint_date,
      amount: result.data.amountCents,
      notes: result.data.notes ?? null,
    })
    setAmountCents(0)
    setNotes("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkpoint_date">Data</Label>
        <Input
          id="checkpoint_date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={!!errors.checkpoint_date}
        />
        {errors.checkpoint_date && (
          <p className="text-xs text-destructive">{errors.checkpoint_date}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Saldo real da conta</Label>
        <CurrencyInput
          id="amount"
          valueCents={amountCents}
          onValueChange={setAmountCents}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observação (opcional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar marco"}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Verificar tipos do formulário**

Run: `npx tsc -b`
Expected: sem erros. (Confere que `Input`/`Label`/`Button`/`CurrencyInput` resolvem nesses caminhos.)

- [ ] **Step 3: Implementar a página `saldos.tsx`** (espelha `lancamentos.tsx`)

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckpointForm } from "@/features/financeiro/checkpoint-form"
import {
  useBalanceCheckpoints,
  useDeleteCheckpoint,
  useUpsertCheckpoint,
} from "@/features/financeiro/use-balance-checkpoints"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"

export default function SaldosPage() {
  const { data, isLoading, isError } = useBalanceCheckpoints()
  const upsert = useUpsertCheckpoint()
  const remove = useDeleteCheckpoint()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-lg font-medium">Saldos iniciais</h1>
        <p className="text-xs text-muted-foreground">
          Saldo real da conta em datas-chave. Cada relatório usa o marco mais
          recente como ponto de partida.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo marco</CardTitle>
          <CardDescription>Informe a data e o saldo real da conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <CheckpointForm
            isSubmitting={upsert.isPending}
            onSubmit={(payload) => upsert.mutateAsync(payload)}
          />
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-24 w-full" />}
      {isError && <p className="text-sm text-destructive">Erro ao carregar marcos.</p>}

      <ul className="flex flex-col gap-2">
        {(data ?? []).map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-md border p-3 text-sm"
          >
            <span>
              {dateISOToBR(c.checkpoint_date)} —{" "}
              <strong>{formatBRL(c.amount)}</strong>
              {c.notes ? (
                <span className="text-muted-foreground"> · {c.notes}</span>
              ) : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate(c.id)}
            >
              Excluir
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Registrar a rota em `src/main.tsx`**

Adicionar o import (junto aos outros de página):
```typescript
import SaldosPage from './pages/financeiro/saldos.tsx'
```
E a rota dentro de `children` (após a de lançamentos):
```typescript
      { path: 'financeiro/saldos', element: <SaldosPage /> },
```

- [ ] **Step 5: Adicionar item de menu em `src/components/app-sidebar.tsx`**

No array `items` do bloco "Financeiro" (após "Novo lançamento"):
```typescript
        {
          title: "Saldos iniciais",
          url: "/financeiro/saldos",
        },
```

- [ ] **Step 6: Verificar tipos + build**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/features/financeiro/checkpoint-form.tsx src/pages/financeiro/saldos.tsx src/main.tsx src/components/app-sidebar.tsx
git commit -m "feat: add 'Saldos iniciais' page, route and nav entry"
```

---

## Task 9: Helper puro do ajuste de conciliação

**Files:**
- Create: `src/features/relatorios/reconciliation.ts`

- [ ] **Step 1: Implementar `reconciliation.ts`**

```typescript
import type { NewTransaction } from "@/api/transactions"

const NOTE = "Ajuste de conciliação"

/**
 * Lançamento de ajuste para a diferença (saldoInformado - saldoSistema), em centavos:
 * - positiva → entrada em "doacoes" (PIX/doação não lançado);
 * - negativa → saída em "outros";
 * - zero → null (nada a lançar).
 */
export function reconciliationAdjustment(
  difference: number,
  occurredAt: string
): NewTransaction | null {
  if (difference === 0) return null
  if (difference > 0) {
    return {
      type: "entrada",
      category: "doacoes",
      amount: difference,
      occurred_at: occurredAt,
      notes: NOTE,
    }
  }
  return {
    type: "saida",
    category: "outros",
    amount: -difference,
    occurred_at: occurredAt,
    notes: NOTE,
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/features/relatorios/reconciliation.ts
git commit -m "feat: add pure reconciliation adjustment helper"
```

---

## Task 10: API de conciliação

**Files:**
- Create: `src/api/reconciliations.ts`

- [ ] **Step 1: Implementar a API**

```typescript
import { supabase } from "@/lib/supabase"
import { createTransaction, getBalanceAsOf } from "@/api/transactions"
import { reconciliationAdjustment } from "@/features/relatorios/reconciliation"

const TABLE = "reconciliations"

export interface Reconciliation {
  id: string
  reconciled_at: string // ISO yyyy-mm-dd
  informed_balance: number // centavos
  system_balance: number
  difference: number
  adjustment_transaction_id: string | null
  created_at: string
}

export interface NewReconciliation {
  reconciled_at: string
  informed_balance: number // centavos
}

/** Lista as conciliações, mais recentes primeiro. */
export async function listReconciliations(): Promise<Reconciliation[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("reconciled_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Concilia: compara saldo informado x saldo do sistema na data, cria o
 * lançamento de ajuste (quando ≠ 0) e grava o registro de conciliação.
 */
export async function createReconciliation(
  input: NewReconciliation
): Promise<Reconciliation> {
  const systemBalance = await getBalanceAsOf(input.reconciled_at)
  const difference = input.informed_balance - systemBalance

  const adjustment = reconciliationAdjustment(difference, input.reconciled_at)
  let adjustmentId: string | null = null
  if (adjustment) {
    const tx = await createTransaction(adjustment)
    adjustmentId = tx.id
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      reconciled_at: input.reconciled_at,
      informed_balance: input.informed_balance,
      system_balance: systemBalance,
      difference,
      adjustment_transaction_id: adjustmentId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/api/reconciliations.ts
git commit -m "feat: add reconciliations API"
```

---

## Task 11: Hooks de conciliação

**Files:**
- Create: `src/features/relatorios/use-reconciliations.ts`

- [ ] **Step 1: Implementar os hooks**

A conciliação cria um lançamento → invalidar `transactions`, `reports` e `reconciliations`.

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createReconciliation,
  listReconciliations,
  type NewReconciliation,
} from "@/api/reconciliations"

const reconciliationsKey = ["reconciliations"] as const

/** Lê o histórico de conciliações. */
export function useReconciliations() {
  return useQuery({
    queryKey: reconciliationsKey,
    queryFn: listReconciliations,
  })
}

/** Cria uma conciliação e revalida conciliações + lançamentos + relatórios. */
export function useCreateReconciliation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewReconciliation) => createReconciliation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reconciliationsKey })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
    onError: (error) => {
      toast.error("Não foi possível conciliar.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/features/relatorios/use-reconciliations.ts
git commit -m "feat: add reconciliations query hooks"
```

---

## Task 12: Diálogo de conciliação + integração em Relatórios

**Files:**
- Create: `src/features/relatorios/reconciliation-dialog.tsx`
- Modify: `src/pages/relatorios/index.tsx`

> Antes de editar, abra `src/pages/relatorios/index.tsx` e confira o cabeçalho da página e os componentes de Dialog disponíveis em `src/components/ui/` (use o Dialog já usado em `report-table.tsx` para invalidar relatório como referência de import/uso).

- [ ] **Step 1: Implementar o diálogo**

```typescript
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import { formatBRL } from "@/lib/currency"
import { dateToISO } from "@/lib/date"
import { useCreateReconciliation } from "./use-reconciliations"

interface ReconciliationDialogProps {
  trigger: React.ReactNode
  defaultDate?: string
}

export function ReconciliationDialog({
  trigger,
  defaultDate,
}: ReconciliationDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState(defaultDate ?? dateToISO(new Date()))
  const [amountCents, setAmountCents] = React.useState(0)
  const create = useCreateReconciliation()

  async function handleConfirm() {
    const result = await create.mutateAsync({
      reconciled_at: date,
      informed_balance: amountCents,
    })
    const diff = result.difference
    toast.success(
      diff === 0
        ? "Conta já estava conciliada (sem diferença)."
        : `Conciliado: ${formatBRL(Math.abs(diff))} lançados como ${
            diff > 0 ? "doação (entrada)" : "ajuste (saída)"
          }.`
    )
    setOpen(false)
    setAmountCents(0)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conciliar conta digital</DialogTitle>
          <DialogDescription>
            Informe o saldo real do banco. A diferença vira um lançamento de
            ajuste automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-date">Data</Label>
            <Input
              id="rec-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-amount">Saldo real no banco</Label>
            <CurrencyInput
              id="rec-amount"
              valueCents={amountCents}
              onValueChange={setAmountCents}
            />
          </div>
          <Button onClick={handleConfirm} disabled={create.isPending}>
            {create.isPending ? "Conciliando..." : "Conciliar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

> **Importante:** confirme a API do `DialogTrigger` no projeto. `report-table.tsx` já usa este Dialog — copie exatamente o padrão de `DialogTrigger` de lá (pode ser `<DialogTrigger asChild>{trigger}</DialogTrigger>` em vez de `render={...}`). Ajuste esta linha para casar com o componente real antes de seguir.

- [ ] **Step 2: Adicionar o gatilho na página de Relatórios**

Em `src/pages/relatorios/index.tsx`, importar e colocar o botão no cabeçalho da página (junto ao título/ação de gerar relatório):

```typescript
import { ReconciliationDialog } from "@/features/relatorios/reconciliation-dialog"
import { Button } from "@/components/ui/button"
```
```tsx
<ReconciliationDialog
  trigger={<Button variant="outline">Conciliar conta digital</Button>}
/>
```

- [ ] **Step 3: Oferecer conciliação ao gerar relatório**

Em `src/features/relatorios/generate-report-dialog.tsx`, após o trecho que monta o período, expor o mesmo `ReconciliationDialog` com `defaultDate` = fim do período (a variável de `period_end` já calculada nesse fluxo). Mínimo viável: renderizar o gatilho dentro do diálogo de geração:

```tsx
<ReconciliationDialog
  trigger={<Button variant="ghost" size="sm">Conciliar antes de gerar</Button>}
  defaultDate={periodEnd}
/>
```

> `periodEnd` deve ser a string ISO `yyyy-mm-dd` do fim do período. Use a variável existente nesse arquivo; se o fim do período estiver como `Date`, formate com `dateToISO(...)` de `@/lib/date`. Se a integração aqui ficar complexa, deixe apenas o botão da página de Relatórios (Step 2) — a conciliação avulsa já cobre o fluxo; registre isso no commit.

- [ ] **Step 4: Verificar tipos + build**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/relatorios/reconciliation-dialog.tsx src/pages/relatorios/index.tsx src/features/relatorios/generate-report-dialog.tsx
git commit -m "feat: add reconciliation dialog in reports flow"
```

---

## Verificação final

- [ ] **Tipos/build**

Run: `npx tsc -b`
Expected: sem erros.

- [ ] **Smoke manual (com Supabase recriado)**
  1. Criar um lançamento novo (ex.: R$ 1.234,50) e conferir que exibe "R$ 1.234,50" (armazenado como 123450 no banco).
  2. Criar um marco em `/financeiro/saldos` (ex.: 01/02/2026 → R$ 1.200,00).
  3. Gerar relatório de fevereiro e conferir o **saldo inicial** = R$ 1.200,00 + lançamentos do mês.
  4. Lançar uma entrada em "Doações (não identificado)" e ver no saldo + agregada no PDF.
  5. Conciliar com saldo maior que o do sistema → entrada de ajuste em `doacoes`; conciliar com saldo menor → saída em `outros`.

---

## Cobertura (spec → tasks)

- **Schema em centavos (recriado, sem migração de dados):** Tasks 1, 2.
- **Peça 1 (marcos):** Tasks 1, 4, 5, 6, 7, 8.
- **Peça 2 (categoria doações):** Tasks 1, 3.
- **Peça 3 (conciliação):** Tasks 1, 9, 10, 11, 12.
- **Decisões:** diferença negativa → saída em `outros` (Task 9); marcos em tela própria (Task 8); conciliação em Relatórios + fluxo de geração (Task 12); tudo em centavos (Tasks 1, 2 e adiante); sem testes, gate `tsc -b` (todas as tasks).
```
