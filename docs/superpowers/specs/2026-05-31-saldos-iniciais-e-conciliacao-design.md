# Saldos iniciais por data + Doações não identificadas + Conciliação bancária

- **Data:** 2026-05-31
- **Status:** Aprovado para planejamento
- **Autor:** Tesouraria / Claude

## Problema

Irmãos enviam ofertas via PIX para a conta digital sem avisar. A tesouraria
descobre o dinheiro só ao olhar o extrato — e muitas vezes não sabe se foi
**dízimo** ou **oferta**. Hoje o sistema:

- Exige uma categoria em todo lançamento (não há "não identificado"), forçando um
  "chute" entre dízimo e oferta.
- Calcula o **saldo inicial** de um relatório como `0 + (entradas − saídas) de
  todos os lançamentos anteriores` (`SALDO_ABERTURA = 0` em `src/config/church.ts`,
  usado por `getBalanceBefore` em `src/api/transactions.ts`). Ou seja, só conhece
  o dinheiro digitado manualmente.

Consequências:

1. Quando um PIX não é lançado, o saldo do sistema fica **menor que o saldo real
   do banco**.
2. Não há como gerar relatórios de **meses passados** com o saldo inicial correto
   daquele mês (que é diferente do saldo de hoje), especialmente quando o
   histórico de lançamentos está incompleto.

## Objetivos

- Permitir informar o **saldo real da conta em datas específicas**, para que cada
  relatório (inclusive de meses passados) abra com o saldo inicial correto.
- Permitir registrar PIX cuja origem é desconhecida como uma categoria genérica
  de entrada, contando no saldo na hora e podendo ser reclassificado depois.
- Permitir **conciliar** o saldo do sistema com o saldo real do banco, lançando a
  diferença como doação não identificada.

## Não-objetivos

- Integração automática com banco / Open Finance. Tudo é entrada manual.
- Reescrever o cálculo de relatórios além do necessário para o saldo inicial.
- Alterar os cards de resumo da tela de Lançamentos.

## Visão geral

Três peças independentes, mas complementares:

| Intenção do usuário | Ferramenta |
|---|---|
| "A conta **tinha** R$ X nesta data" (abrir mês, corrigir base, meses passados) | **Peça 1 — Marco de saldo** (não cria receita) |
| "Recebi um PIX e não sei se é dízimo ou oferta" | **Peça 2 — Categoria *Doações (não identificado)*** |
| "Apareceu dinheiro a mais que **é doação**; quero contar como entrada" | **Peça 3 — Conciliação** (lança um ajuste em *Doações não identificado*) |

---

## Peça 1 — Marcos de saldo (saldos iniciais por data)

Substitui o `SALDO_ABERTURA` fixo por uma lista de **marcos**: pares
(data, saldo real). O saldo inicial de qualquer período passa a ser derivado do
marco mais recente.

### Semântica

Um marco com `checkpoint_date = D` e `balance = B` significa: **no início do dia
D (antes de qualquer lançamento de D), a conta tinha B**.

Novo cálculo de saldo no início de uma data `D`:

```
saldoInicial(D) =
  marco_mais_recente_com_data <= D  (B, na data M)
  + Σ (lançamentos com M <= occurred_at < D, com sinal por tipo)
```

- Se não existir nenhum marco com data ≤ D, usa `0` (fallback, como hoje).
- Se existir um marco exatamente em `D`, o somatório é vazio → `saldoInicial(D) = B`.
- O marco é **autoritativo**: ele "reseta" a base; lançamentos só acumulam a
  partir da data do marco. Isso corrige a deriva sem precisar de lançamentos
  antigos completos.

Isso mantém a fórmula do saldo final intacta em
`src/features/relatorios/report-summary.ts`:
`saldoFinal = saldoInicial + totalEntradas − totalSaidas`.

### Modelo de dados (Supabase)

Nova tabela `balance_checkpoints`:

| coluna | tipo | nota |
|---|---|---|
| `id` | uuid (pk) | |
| `checkpoint_date` | date | único |
| `amount` | bigint/int | saldo real **em centavos** (mesma unidade dos `transactions.amount`) |
| `notes` | text null | opcional |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Restrição: `checkpoint_date` único (um marco por data; novo valor na mesma data
substitui via upsert).

### API — `src/api/balance-checkpoints.ts` (novo)

- `listCheckpoints(): Promise<BalanceCheckpoint[]>` — ordenado por data desc.
- `upsertCheckpoint(input): Promise<BalanceCheckpoint>`
- `deleteCheckpoint(id): Promise<void>`
- `getLatestCheckpointBefore(dateISO): Promise<BalanceCheckpoint | null>` —
  marco com `checkpoint_date <= dateISO`, mais recente.

### Mudança em `getBalanceBefore` (`src/api/transactions.ts`)

Reescrever para usar o marco:

```ts
export async function getBalanceBefore(dateISO: string): Promise<number> {
  const checkpoint = await getLatestCheckpointBefore(dateISO)
  const base = checkpoint?.amount ?? 0
  const sinceISO = checkpoint?.checkpoint_date ?? null

  let q = supabase.from(TABLE).select("type, amount").lt("occurred_at", dateISO)
  if (sinceISO) q = q.gte("occurred_at", sinceISO)
  const { data, error } = await q
  if (error) throw error

  return (data ?? []).reduce(
    (sum, t) => sum + (t.type === "entrada" ? t.amount : -t.amount),
    base
  )
}
```

`SALDO_ABERTURA` em `src/config/church.ts` deixa de ser usado (remover ou manter
como `0` legado; preferir remover).

### UI

**Tela própria "Saldos iniciais"** (separada de Relatórios): tabela de marcos
(data + valor), com adicionar/editar/excluir. Usa `date-fns` para datas (ver
memória do projeto). Valores em centavos no armazenamento, exibidos/digitados em
reais (mesma convenção do formulário de lançamento).

---

## Peça 2 — Categoria "Doações (não identificado)"

Nova categoria de **entrada**.

### Mudanças

- `src/api/transactions.ts`: adicionar `"doacoes"` ao union `TransactionCategory`.
- `src/features/financeiro/constants.ts`: adicionar label
  `doacoes: "Doações (não identificado)"` em `TRANSACTION_CATEGORY_LABELS`
  (entra automaticamente em `TRANSACTION_CATEGORY_OPTIONS` e no formulário).
- `src/config/church.ts`: adicionar `"doacoes"` a `AGGREGATED_CATEGORIES` para
  ser agrupada por mês no relatório/PDF (como dízimos e ofertas).
- `supabase/schema.sql`: o enum/constraint de `category` vive aqui (ver comentário
  em `constants.ts`: "os slugs precisam casar com os enums em supabase/schema.sql").
  Adicionar `doacoes` ao enum e gerar a migração correspondente.

### Reclassificação

Já suportada: editar o lançamento e trocar a categoria para `dizimos`/`ofertas`.
Nenhum trabalho novo.

---

## Peça 3 — Conciliação bancária

Ação para alinhar o saldo do sistema ao saldo real do banco, lançando a
diferença como doação não identificada. Disponível **a qualquer momento** e
**sugerida no fechamento** de um relatório.

### Fluxo

1. Usuário informa **saldo real do banco** e a **data** da conciliação.
2. Sistema calcula `saldoSistema(data)` (= `getBalanceBefore(data)` + lançamentos
   do próprio dia, ou seja, saldo ao fim da data) e mostra:
   `diferença = saldoInformado − saldoSistema`.
3. Ao confirmar:
   - `diferença > 0` → cria lançamento **entrada** categoria `doacoes`, valor =
     diferença, `occurred_at = data`, `notes = "Ajuste de conciliação"`.
   - `diferença < 0` → cria lançamento **saída** categoria `outros`, valor =
     |diferença|, `occurred_at = data`, `notes = "Ajuste de conciliação"`.
   - `diferença = 0` → nada a fazer.
4. Saldo do sistema passa a bater com o banco.

### Distinção em relação à Peça 1

- **Marco de saldo:** define a base, **não** cria receita. Use para abrir mês /
  corrigir / meses passados.
- **Conciliação:** cria um lançamento real de receita (doação). Use no mês
  corrente quando o "extra" é PIX de doação.

Não usar as duas para o mesmo dinheiro (evita dupla contagem): se o objetivo é só
ajustar a base sem gerar receita, use marco; se é registrar doação, use
conciliação.

### Modelo de dados (Supabase)

Nova tabela `reconciliations` (histórico/auditoria):

| coluna | tipo | nota |
|---|---|---|
| `id` | uuid (pk) | |
| `reconciled_at` | date | data da conciliação |
| `informed_balance` | bigint/int | saldo real informado (centavos) |
| `system_balance` | bigint/int | saldo do sistema no momento |
| `difference` | bigint/int | `informed − system` |
| `adjustment_transaction_id` | uuid null | FK para `transactions` |
| `created_at` | timestamptz | |

### API — `src/api/reconciliations.ts` (novo)

- `listReconciliations()`
- `createReconciliation(input)` — calcula a diferença, cria a transação de
  ajuste (quando ≠ 0) e grava o registro.

### UI

Mora **dentro de Relatórios** (não tem tela própria):

- **Integrada ao fluxo de criar relatório:** ao gerar o relatório do mês, oferecer
  um passo "Conciliar conta digital" (data + saldo informado → mostra diferença →
  confirma) antes de finalizar. O ajuste entra no período do relatório.
- Ação avulsa de conciliação também acessível na área de Relatórios, para
  conferir a conta a qualquer momento.
- Lista do histórico de conciliações em Relatórios.

---

## Fluxo de uso (dia a dia)

1. **Mês passado:** cadastrar um **marco** com o saldo real do 1º dia do mês →
   gerar o relatório com o saldo inicial correto.
2. **Mês corrente:** lançar PIX desconhecidos em *Doações (não identificado)*;
   reclassificar quando o irmão avisar.
3. **Fechamento:** **conciliar** contra o extrato para capturar o que escapou; a
   diferença vira doação.

## Casos de borda

- Sem nenhum marco antes da data → base `0` (comportamento atual preservado).
- Marco na mesma data do início do período → saldo inicial = valor do marco.
- Conciliação com diferença negativa → ver Questões em aberto.
- Reclassificar um lançamento de ajuste de conciliação: permitido (é um
  lançamento normal).

## Testes

- `getBalanceBefore`: com/sem marco; marco no meio do período; marco exatamente na
  data; múltiplos marcos (usa o mais recente ≤ data).
- `buildReportSummary`: saldo inicial vindo de marco reflete no saldo final.
- Agrupamento de `doacoes` por mês em `buildReportSummary`.
- `createReconciliation`: diferença positiva cria entrada `doacoes`; zero não cria
  nada; negativa conforme decisão.

## Arquivos afetados (estimativa)

- `src/api/transactions.ts` — categoria `doacoes`; reescrever `getBalanceBefore`.
- `src/api/balance-checkpoints.ts` — **novo**.
- `src/api/reconciliations.ts` — **novo**.
- `src/config/church.ts` — `AGGREGATED_CATEGORIES += doacoes`; remover
  `SALDO_ABERTURA`.
- `src/features/financeiro/constants.ts` — label `doacoes`.
- `src/features/relatorios/*` — UI de marcos, conciliação, e passo no fechamento.
- `supabase/schema.sql` + migrações — tabelas `balance_checkpoints`,
  `reconciliations`; adicionar `doacoes` ao enum de `category`.

## Decisões

1. **Diferença negativa na conciliação** (saldo do sistema > banco): lançar como
   **saída** na categoria `outros`, observação "Ajuste de conciliação".
2. **Telas:** marcos de saldo em **tela própria**; conciliação **dentro de
   Relatórios**, integrada ao fluxo de criação do relatório (mais acesso avulso).
3. **Unidade monetária:** **todo o domínio em centavos (inteiro)**. Hoje o banco
   guarda em reais (`numeric(12,2)`: `transactions.amount`,
   `reports.total_entradas/total_saidas/balance`) e a UI converte com
   `centsToReais` antes de salvar. Como **não há dados a preservar** (o usuário
   confirmou que pode recriar as tabelas), o schema é **recriado já em `integer`
   (centavos)** — sem migração de dados. `formatBRL` é redefinida para receber
   centavos e `centsToReais` é removida. Isso simplifica os filtros (já em
   centavos) e o formulário (deixa de converter).
4. **Testes:** o projeto **não tem framework de testes** (sem vitest/jest). O gate
   de qualidade é `npx tsc -b` (memória do projeto: `pnpm lint` tem 4 erros
   pré-existentes). A lógica de cálculo fica isolada em funções puras para
   verificação fácil, mas não há suíte automatizada — validação por `tsc -b` +
   smoke manual no app.
