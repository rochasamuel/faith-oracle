# Relatório Financeiro em PDF — Design

**Data:** 2026-05-31
**Status:** Aprovado para implementação

## Objetivo

Ao clicar em **download** na página de Relatórios, gerar um **PDF** do relatório
financeiro da igreja (Assembleia de Deus Ministério Livre), no lugar do CSV
atual. O PDF segue um modelo oficial: header com logo e dados da igreja, tabelas
de receitas e despesas em duas colunas, resumo de saldos, área de assinaturas e
rodapé de conferência.

## Decisões (definidas com o usuário)

1. **Biblioteca:** `@react-pdf/renderer` (última versão) — layout declarativo em
   componentes React, melhor para evoluir o design.
2. **Armazenamento:** **não** salvar no Supabase Storage. O PDF é montado no
   navegador a cada download, a partir do relatório + lançamentos do período.
   O registro em `reports` já é o snapshot financeiro (totais persistidos).
3. **Resumo:** uma única linha **Saldo final** (verde se ≥ 0, vermelho se < 0).
4. **Rodapé de conferência:** dados da igreja (membros, obreiros, tipo de imóvel)
   ficam **configuráveis em código**; "Conferido dia" usa a **data de geração**
   do PDF.
5. **Extras:** subtotais/agregação por categoria; **marca d'água `INVALIDADO`**
   quando o relatório está invalidado.
6. **Agregação seletiva (config em código):** apenas as categorias listadas em
   `AGGREGATED_CATEGORIES` (inicialmente `dizimos` e `ofertas`) são agregadas;
   as demais saem **lançamento por lançamento**.
7. **Diálogo de geração:** manter o tipo **Mensal / Anual**. No modo Mensal,
   selects de **Mês + Ano** por padrão e um checkbox **"Período personalizado"**
   que abre o date range picker. Internamente é **sempre um range de datas**.

## Arquitetura

### Dependências
- Adicionar `@react-pdf/renderer` (última versão) via pnpm.

### Assets
- Copiar o logo `/mnt/c/Users/sams/Downloads/unnamed.png` para
  `src/assets/logo-igreja.png` (build autocontido).

### Arquivos novos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/config/church.ts` | Constantes da igreja + config de exibição do relatório. |
| `src/features/relatorios/report-summary.ts` | Funções puras: agregação seletiva por categoria/mês e cálculo de linhas/totais. |
| `src/features/relatorios/report-pdf.tsx` | Componente `ReportDocument` (`@react-pdf/renderer`) com o layout. |
| `src/features/relatorios/report-title.ts` | `formatReportPdfTitle(report)` para o título do header. |
| `src/components/ui/checkbox.tsx` | Componente Checkbox (base-ui), seguindo o padrão dos demais `ui/`. |

### Arquivos alterados

| Arquivo | Mudança |
| --- | --- |
| `src/api/transactions.ts` | Nova função `getBalanceBefore(dateISO)`: saldo (entradas − saídas) de todos os lançamentos **antes** de `period_start` = **saldo inicial**. |
| `src/features/relatorios/report-table.tsx` | `handleDownload` gera **PDF** (`.pdf`) em vez de CSV; mantém spinner (`downloadingId`) e toast de erro. |
| `src/features/relatorios/report-download.ts` | Generalizar `downloadCsv` → `downloadBlob`; remover a montagem de CSV (download passa a ser só PDF). |
| `src/features/relatorios/generate-report-dialog.tsx` | No modo Mensal: selects Mês+Ano + checkbox "Período personalizado" (abre o range picker). Persistência conforme regra abaixo. |

## Configuração (`src/config/church.ts`)

```ts
import type { TransactionCategory } from "@/features/financeiro/constants"

export type IgrejaTipoImovel = "propria" | "alugada" | "cedida"

export const CHURCH_INFO = {
  nome: "ASSEMBLEIA DE DEUS MINISTÉRIO LIVRE",
  cnpj: "59.498.194/0001-40",
  pastorPresidente: "Miguel de Jesus Rocha",
  endereco:
    "SCSV Quadra 01 Conjunto 02 Lote 02 (Setor Leste) – Cidade Estrutural – DF CEP: 71.262-110",
  quantidadeMembros: 0, // editar conforme a igreja
  quantidadeObreiros: 0, // editar conforme a igreja
  tipoImovel: "alugada" as IgrejaTipoImovel,
} as const

/** Categorias agregadas (mês + categoria) no relatório; as demais saem lançamento a lançamento. */
export const AGGREGATED_CATEGORIES: TransactionCategory[] = ["dizimos", "ofertas"]
```

## Lógica de agregação (`report-summary.ts`)

Entrada: `transactions: Transaction[]` (do período), já dividido por `type`.

Para cada lado (Receitas = `entrada`, Despesas = `saida`):

1. **Categoria ∈ `AGGREGATED_CATEGORIES`** → agrupar por **(ano-mês, categoria)**.
   - `valor` = soma do grupo.
   - `data` = **maior `occurred_at`** do grupo (último lançamento do mês).
   - Num período de 1 mês ⇒ uma linha por categoria; em vários meses ⇒ uma
     linha por categoria por mês.
2. **Categoria ∉ `AGGREGATED_CATEGORIES`** → **uma linha por lançamento**
   (`data` = `occurred_at`, `categoria`, `valor`).
3. Unir as linhas (agregadas + avulsas) e **ordenar por `data` ascendente**
   (desempate por rótulo de categoria).

Saída por lado: `ReportLine[]` (`{ date: string; label: string; amount: number }`)
e o total (= `report.total_entradas` / `report.total_saidas`).

**Resumo:**
- `saldoInicial` = `getBalanceBefore(period_start)`
- `totalEntradas`, `totalSaidas` (do relatório)
- `saldoFinal` = `saldoInicial + totalEntradas − totalSaidas`

> Nota: `getBalanceBefore` busca os lançamentos anteriores a `period_start` e soma
> no cliente. Volume pequeno (uma igreja) torna isso aceitável; se crescer, migrar
> para um RPC de agregação no Postgres.

## Título do PDF (`report-title.ts`)

```
anual                          -> "RELATÓRIO ANUAL/2026"
mensal (reference_month != null) -> "RELATÓRIO MAIO/2026"
mensal custom (reference_month == null) -> "RELATÓRIO 01/03/2026 – 15/04/2026"
```

Mês por extenso/maiúsculo via `date-fns` + locale `ptBR` (ver memória: usar date-fns).

## Layout do PDF (A4 retrato — `report-pdf.tsx`)

```
┌───────────────────────────────────────────────────────────┐
│ [LOGO]   RELATÓRIO MAIO/2026                                │
│          ASSEMBLEIA DE DEUS MINISTÉRIO LIVRE                │
│          CNPJ: … | Pastor Presidente: …                     │
│          SCSV Quadra 01 … CEP: 71.262-110                   │
├───────────────────────────────────────────────────────────┤
│  RECEITAS                    │  DESPESAS                    │
│  Data | Categoria | Valor    │  Data | Categoria | Valor    │
│  …                           │  …                           │
│  TOTAL            R$ …        │  TOTAL            R$ …        │
│                              │                              │
│                              │  RESUMO                      │
│                              │  Saldo inicial      R$ …      │
│                              │  Total de entradas  R$ …      │
│                              │  Total de saídas    R$ …      │
│                              │  Saldo final        R$ …      │
├───────────────────────────────────────────────────────────┤
│  ____________________        ____________________           │
│  Pastor Presidente           Tesoureiro                     │
├───────────────────────────────────────────────────────────┤
│  Conferido dia 31/05/2026        Ass: ____________________  │
│  Quantidade de membros: __    Quantidade de obreiros: __    │
│  Igreja própria [ ]   alugada [X]   cedida [ ]              │
└───────────────────────────────────────────────────────────┘
```

- **Header**: logo à esquerda; bloco de texto à direita alinhado à altura do logo.
- **Duas colunas**: Receitas (esquerda) | Despesas + Resumo (direita).
- **Saldo final** colorido (verde ≥ 0 / vermelho < 0).
- **Assinaturas**: duas linhas em branco (caneta ou assinatura eletrônica colada).
- **Rodapé de conferência**: "Conferido dia" = data de geração; membros/obreiros e
  o checkbox de tipo de imóvel vêm de `CHURCH_INFO`.
- **Marca d'água `INVALIDADO`**: texto diagonal, baixa opacidade, quando
  `report.status === "invalidado"`.
- **Uma página por mês**: fontes compactas + layout de 2 colunas mantêm um mês em
  uma página (≤ ~9 categorias/lado). Multi-mês pagina automaticamente.

## Fluxo de download

```
handleDownload(report)
  → listTransactionsInPeriod(period_start, period_end)
  → getBalanceBefore(period_start)
  → buildReportSummary(report, transactions, saldoInicial)   // report-summary.ts
  → pdf(<ReportDocument data=… />).toBlob()                   // @react-pdf/renderer
  → downloadBlob(`${slug(title)}.pdf`, blob)                  // report-download.ts
  (try/catch → toast.error; spinner via downloadingId)
```

## Diálogo de geração (`generate-report-dialog.tsx`)

- **Tipo**: Mensal / Anual (mantido).
- **Mensal**:
  - Estado novo: `customPeriod: boolean` (checkbox "Período personalizado").
  - `customPeriod === false` → selects **Mês** (1–12, rótulos pt-BR) + **Ano**.
    - `start` = 1º dia do mês; `end` = último dia do mês (`date-fns`).
    - `reference_month` = mês; `reference_year` = ano.
  - `customPeriod === true` → date range picker atual.
    - `start`/`end` = range; `reference_month` = **null** (marca "custom").
  - `period_type` = `"mensal"` nos dois casos.
- **Anual**: select de ano (mantido).
- **Sempre** resolve para um par `start`/`end` (ISO) antes de calcular totais.
- `title` persistido pode continuar como hoje; o **título do PDF** é derivado por
  `formatReportPdfTitle` (não depende do `title` salvo).

## Tratamento de erros
- Geração do PDF dentro de try/catch; falha → `toast.error` (padrão existente).
- Spinner por linha via `downloadingId` (já existe).

## Testes / verificação
- Não há runner de testes configurado no projeto. As funções de agregação
  (`report-summary.ts`) e de título (`report-title.ts`) ficam puras e isoláveis
  para teste futuro.
- Verificação manual: `pnpm dev`, gerar relatórios (mês único, multi-mês, anual,
  personalizado, invalidado) e abrir os PDFs conferindo layout, agregação,
  datas, saldo inicial e marca d'água.

## Fora de escopo
- Salvar PDF no Supabase Storage.
- RPC de agregação no Postgres (saldo inicial fica no cliente por ora).
- Assinatura eletrônica embutida/validada (apenas linhas em branco).
