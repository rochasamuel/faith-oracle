# Relatório Financeiro em PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o download CSV da página de Relatórios por um PDF oficial da igreja, gerado no navegador a partir do relatório e seus lançamentos, com agregação seletiva por categoria.

**Architecture:** Geração 100% no cliente com `@react-pdf/renderer`. Funções puras de agregação (`report-summary.ts`) e de título (`report-title.ts`) alimentam um componente declarativo (`report-pdf.tsx`). Sem Supabase Storage. Config da igreja e categorias agregadas ficam em `src/config/church.ts`.

**Tech Stack:** React 19, TypeScript, Vite, `@react-pdf/renderer`, `@base-ui/react`, `date-fns`, Supabase.

> **Notas de ambiente:**
> - O projeto **não é um repositório git** e **não tem runner de testes**. Por isso, em vez de "commit" e testes unitários, cada task termina com um **gate de verificação**: `pnpm exec tsc -b` (type-check) e, quando indicado, `pnpm lint`. A verificação funcional final é manual (abrir PDFs gerados).
> - Comandos rodam a partir da raiz do projeto: `/home/sams/projects/faith-oracle`.

---

### Task 1: Instalar dependência e trazer o logo

**Files:**
- Modify: `package.json` (via gerenciador)
- Create: `src/assets/logo-igreja.png`

- [ ] **Step 1: Instalar `@react-pdf/renderer`**

Run: `pnpm add @react-pdf/renderer`
Expected: dependência adicionada ao `package.json` e `pnpm-lock.yaml` atualizado.

- [ ] **Step 2: Copiar o logo para dentro do repo**

Run: `cp /mnt/c/Users/sams/Downloads/unnamed.png src/assets/logo-igreja.png`
Expected: arquivo `src/assets/logo-igreja.png` existe.

- [ ] **Step 3: Verificar o arquivo**

Run: `file src/assets/logo-igreja.png`
Expected: `PNG image data, 1394 x 1600`.

---

### Task 2: Configuração da igreja e categorias agregadas

**Files:**
- Create: `src/config/church.ts`

- [ ] **Step 1: Criar o arquivo de config**

```ts
import type { TransactionCategory } from "@/features/financeiro/constants"

export type IgrejaTipoImovel = "propria" | "alugada" | "cedida"

/** Dados institucionais usados no cabeçalho e no rodapé do relatório em PDF. */
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

/**
 * Categorias agregadas (mês + categoria) no relatório.
 * As demais categorias saem lançamento por lançamento.
 */
export const AGGREGATED_CATEGORIES: TransactionCategory[] = ["dizimos", "ofertas"]
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc -b`
Expected: sem erros.

---

### Task 3: `getBalanceBefore` (saldo inicial) na API

**Files:**
- Modify: `src/api/transactions.ts`

- [ ] **Step 1: Adicionar a função ao final de `src/api/transactions.ts`**

```ts
/**
 * Saldo (entradas − saídas) de todos os lançamentos anteriores a `dateISO`.
 * Usado como "saldo inicial" do relatório (= saldo final do período anterior).
 */
export async function getBalanceBefore(dateISO: string): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("type, amount")
    .lt("occurred_at", dateISO)

  if (error) throw error
  return (data ?? []).reduce(
    (sum, t) => sum + (t.type === "entrada" ? t.amount : -t.amount),
    0
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc -b`
Expected: sem erros.

---

### Task 4: Agregação e resumo (funções puras)

**Files:**
- Create: `src/features/relatorios/report-summary.ts`

- [ ] **Step 1: Criar `report-summary.ts`**

```ts
import type { Report } from "@/api/reports"
import type { Transaction } from "@/api/transactions"
import { TRANSACTION_CATEGORY_LABELS } from "@/features/financeiro/constants"
import { AGGREGATED_CATEGORIES } from "@/config/church"

/** Uma linha de tabela do relatório (receita ou despesa). */
export interface ReportLine {
  date: string // ISO yyyy-mm-dd
  label: string // rótulo da categoria
  amount: number
}

/** Dados consolidados para renderizar o PDF. */
export interface ReportSummary {
  receitas: ReportLine[]
  despesas: ReportLine[]
  totalEntradas: number
  totalSaidas: number
  saldoInicial: number
  saldoFinal: number
}

/** Chave de mês (yyyy-mm) a partir de uma data ISO yyyy-mm-dd. */
function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

/**
 * Transforma os lançamentos de um lado (entradas OU saídas) em linhas:
 * - categorias em AGGREGATED_CATEGORIES: agregadas por (mês, categoria),
 *   com data = último lançamento do grupo;
 * - demais categorias: uma linha por lançamento.
 * Resultado ordenado por data (desempate pelo rótulo).
 */
function buildLines(transactions: Transaction[]): ReportLine[] {
  const aggregated = new Map<string, ReportLine>()
  const single: ReportLine[] = []

  for (const t of transactions) {
    const label = TRANSACTION_CATEGORY_LABELS[t.category]
    if (AGGREGATED_CATEGORIES.includes(t.category)) {
      const key = `${monthKey(t.occurred_at)}|${t.category}`
      const existing = aggregated.get(key)
      if (existing) {
        existing.amount += t.amount
        if (t.occurred_at > existing.date) existing.date = t.occurred_at
      } else {
        aggregated.set(key, { date: t.occurred_at, label, amount: t.amount })
      }
    } else {
      single.push({ date: t.occurred_at, label, amount: t.amount })
    }
  }

  const lines = [...aggregated.values(), ...single]
  lines.sort((a, b) =>
    a.date === b.date
      ? a.label.localeCompare(b.label, "pt-BR")
      : a.date.localeCompare(b.date)
  )
  return lines
}

/** Consolida o relatório + lançamentos + saldo inicial em dados para o PDF. */
export function buildReportSummary(
  report: Report,
  transactions: Transaction[],
  saldoInicial: number
): ReportSummary {
  const receitas = buildLines(transactions.filter((t) => t.type === "entrada"))
  const despesas = buildLines(transactions.filter((t) => t.type === "saida"))

  return {
    receitas,
    despesas,
    totalEntradas: report.total_entradas,
    totalSaidas: report.total_saidas,
    saldoInicial,
    saldoFinal: saldoInicial + report.total_entradas - report.total_saidas,
  }
}
```

> `occurred_at` é ISO `yyyy-mm-dd`, então comparação por string ordena por data corretamente.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc -b`
Expected: sem erros.

---

### Task 5: Título do PDF

**Files:**
- Create: `src/features/relatorios/report-title.ts`

- [ ] **Step 1: Criar `report-title.ts`**

```ts
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { Report } from "@/api/reports"
import { dateISOToBR } from "@/lib/date"

/**
 * Título exibido no cabeçalho do PDF:
 *   anual                                  -> "RELATÓRIO ANUAL/2026"
 *   mensal (reference_month != null)       -> "RELATÓRIO MAIO/2026"
 *   personalizado (reference_month == null)-> "RELATÓRIO 01/03/2026 – 15/04/2026"
 */
export function formatReportPdfTitle(report: Report): string {
  if (report.period_type === "anual") {
    return `RELATÓRIO ANUAL/${report.reference_year}`
  }
  if (report.reference_month !== null) {
    const date = new Date(report.reference_year, report.reference_month - 1, 1)
    const month = format(date, "MMMM", { locale: ptBR }).toUpperCase()
    return `RELATÓRIO ${month}/${report.reference_year}`
  }
  return `RELATÓRIO ${dateISOToBR(report.period_start)} – ${dateISOToBR(
    report.period_end
  )}`
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc -b`
Expected: sem erros.

---

### Task 6: Componente `ui/checkbox.tsx`

**Files:**
- Create: `src/components/ui/checkbox.tsx`

- [ ] **Step 1: Criar o componente (base-ui)**

```tsx
"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc -b`
Expected: sem erros.

> Verificação visual do estado marcado acontece na Task 9 (ao usar no diálogo). Se a classe `data-[checked]:*` não pintar o checkbox marcado, confira o atributo de estado real do base-ui (`data-checked`) inspecionando o elemento e ajuste o seletor.

---

### Task 7: Documento PDF (`report-pdf.tsx`)

**Files:**
- Create: `src/features/relatorios/report-pdf.tsx`

- [ ] **Step 1: Criar `report-pdf.tsx`**

```tsx
import {
  Document,
  Image,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import logoIgreja from "@/assets/logo-igreja.png"
import type { Report } from "@/api/reports"
import { CHURCH_INFO, type IgrejaTipoImovel } from "@/config/church"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR, formatDateBR } from "@/lib/date"
import type { ReportLine, ReportSummary } from "./report-summary"
import { formatReportPdfTitle } from "./report-title"

const COLORS = {
  text: "#1f2937",
  muted: "#6b7280",
  border: "#d1d5db",
  headerBg: "#f3f4f6",
  positive: "#047857",
  negative: "#be123c",
  watermark: "#be123c",
}

const styles = StyleSheet.create({
  page: {
    paddingVertical: 28,
    paddingHorizontal: 32,
    fontSize: 8,
    color: COLORS.text,
    fontFamily: "Helvetica",
    lineHeight: 1.3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  logo: { width: 56, height: 64, objectFit: "contain" },
  headerText: { flex: 1 },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  churchName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 2 },
  churchLine: { fontSize: 7.5, color: COLORS.muted },
  columns: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  table: { borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  trLast: { flexDirection: "row" },
  th: {
    backgroundColor: COLORS.headerBg,
    fontFamily: "Helvetica-Bold",
    padding: 4,
  },
  td: { padding: 4 },
  colDate: { width: 52 },
  colCat: { flex: 1 },
  colVal: { width: 64, textAlign: "right" },
  totalRow: { flexDirection: "row", backgroundColor: COLORS.headerBg },
  totalLabel: { flex: 1, padding: 4, fontFamily: "Helvetica-Bold" },
  totalVal: {
    width: 64,
    padding: 4,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: { flex: 1, padding: 4 },
  summaryVal: { width: 80, padding: 4, textAlign: "right" },
  signatures: { flexDirection: "row", gap: 32, marginTop: 24 },
  signatureBox: { flex: 1, alignItems: "center" },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: COLORS.text,
    width: "100%",
    marginBottom: 4,
  },
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    gap: 4,
  },
  footerLine: { flexDirection: "row", gap: 16 },
  watermark: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 90,
    fontFamily: "Helvetica-Bold",
    color: COLORS.watermark,
    opacity: 0.12,
    transform: "rotate(-30deg)",
  },
})

const TIPO_IMOVEL_LABEL: Record<IgrejaTipoImovel, string> = {
  propria: "própria",
  alugada: "alugada",
  cedida: "cedida",
}

function checkbox(tipo: IgrejaTipoImovel, current: IgrejaTipoImovel): string {
  return `Igreja ${TIPO_IMOVEL_LABEL[tipo]} [${tipo === current ? "X" : " "}]`
}

function LinesTable({
  title,
  lines,
  total,
}: {
  title: string
  lines: ReportLine[]
  total: number
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, styles.colDate]}>Data</Text>
          <Text style={[styles.th, styles.colCat]}>Categoria</Text>
          <Text style={[styles.th, styles.colVal]}>Valor</Text>
        </View>
        {lines.map((line, i) => (
          <View key={i} style={i === lines.length - 1 ? styles.trLast : styles.tr}>
            <Text style={[styles.td, styles.colDate]}>
              {dateISOToBR(line.date)}
            </Text>
            <Text style={[styles.td, styles.colCat]}>{line.label}</Text>
            <Text style={[styles.td, styles.colVal]}>
              {formatBRL(line.amount)}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalVal}>{formatBRL(total)}</Text>
      </View>
    </View>
  )
}

interface ReportDocumentProps {
  report: Report
  summary: ReportSummary
  generatedAt: Date
}

export function ReportDocument({
  report,
  summary,
  generatedAt,
}: ReportDocumentProps) {
  const invalidated = report.status === "invalidado"
  const saldoColor =
    summary.saldoFinal >= 0 ? COLORS.positive : COLORS.negative

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {invalidated && <Text style={styles.watermark}>INVALIDADO</Text>}

        <View style={styles.header}>
          <Image style={styles.logo} src={logoIgreja} />
          <View style={styles.headerText}>
            <Text style={styles.title}>{formatReportPdfTitle(report)}</Text>
            <Text style={styles.churchName}>{CHURCH_INFO.nome}</Text>
            <Text style={styles.churchLine}>
              CNPJ: {CHURCH_INFO.cnpj} | Pastor Presidente:{" "}
              {CHURCH_INFO.pastorPresidente}
            </Text>
            <Text style={styles.churchLine}>{CHURCH_INFO.endereco}</Text>
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.column}>
            <LinesTable
              title="Receitas"
              lines={summary.receitas}
              total={summary.totalEntradas}
            />
          </View>
          <View style={styles.column}>
            <LinesTable
              title="Despesas"
              lines={summary.despesas}
              total={summary.totalSaidas}
            />
            <Text style={styles.sectionTitle}>Resumo</Text>
            <View style={styles.table}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Saldo inicial</Text>
                <Text style={styles.summaryVal}>
                  {formatBRL(summary.saldoInicial)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total de entradas</Text>
                <Text style={styles.summaryVal}>
                  {formatBRL(summary.totalEntradas)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total de saídas</Text>
                <Text style={styles.summaryVal}>
                  {formatBRL(summary.totalSaidas)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.summaryLabel, { fontFamily: "Helvetica-Bold" }]}>
                  Saldo final
                </Text>
                <Text
                  style={[
                    styles.summaryVal,
                    { fontFamily: "Helvetica-Bold", color: saldoColor },
                  ]}
                >
                  {formatBRL(summary.saldoFinal)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>Pastor Presidente</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>Tesoureiro</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine}>
            <Text>Conferido dia {formatDateBR(generatedAt)}</Text>
            <Text>Ass: ______________________________________</Text>
          </View>
          <View style={styles.footerLine}>
            <Text>Quantidade de membros: {CHURCH_INFO.quantidadeMembros}</Text>
            <Text>Quantidade de obreiros: {CHURCH_INFO.quantidadeObreiros}</Text>
          </View>
          <View style={styles.footerLine}>
            <Text>{checkbox("propria", CHURCH_INFO.tipoImovel)}</Text>
            <Text>{checkbox("alugada", CHURCH_INFO.tipoImovel)}</Text>
            <Text>{checkbox("cedida", CHURCH_INFO.tipoImovel)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

/** Renderiza o documento e devolve o Blob do PDF para download. */
export function reportPdfBlob(props: ReportDocumentProps): Promise<Blob> {
  return pdf(<ReportDocument {...props} />).toBlob()
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc -b`
Expected: sem erros. (Se o Vite reclamar do import de `.png`, confirme que `src/vite-env.d.ts` referencia os tipos do Vite — o template padrão já cobre imports de assets.)

---

### Task 8: Generalizar o helper de download (remover CSV)

**Files:**
- Modify (rewrite): `src/features/relatorios/report-download.ts`

- [ ] **Step 1: Substituir todo o conteúdo de `report-download.ts`**

```ts
/** Gera um slug de arquivo a partir de um texto (remove acentos e símbolos). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

/** Dispara o download de um Blob no navegador. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

> Remove `buildReportCsv` e `downloadCsv` (o download passa a ser só PDF). A Task 9 troca os imports em `report-table.tsx`.

- [ ] **Step 2: Type-check (vai falhar até a Task 9)**

Run: `pnpm exec tsc -b`
Expected: ERRO em `report-table.tsx` (`buildReportCsv`/`downloadCsv` não existem). Isso é esperado e some na Task 9.

---

### Task 9: Ligar o download de PDF na tabela

**Files:**
- Modify: `src/features/relatorios/report-table.tsx`

- [ ] **Step 1: Trocar os imports**

Remover:
```tsx
import { buildReportCsv, downloadCsv } from "@/features/relatorios/report-download"
```
Adicionar (junto aos demais imports):
```tsx
import { listTransactionsInPeriod, getBalanceBefore } from "@/api/transactions"
import { downloadBlob, slugify } from "@/features/relatorios/report-download"
import { buildReportSummary } from "@/features/relatorios/report-summary"
import { reportPdfBlob } from "@/features/relatorios/report-pdf"
import { formatReportPdfTitle } from "@/features/relatorios/report-title"
```

> A linha existente `import { listTransactionsInPeriod } from "@/api/transactions"` deve ser unificada com a nova (que também importa `getBalanceBefore`). Não deixe import duplicado.

- [ ] **Step 2: Reescrever `handleDownload`**

Substituir o corpo da função `handleDownload` por:
```tsx
  async function handleDownload(report: Report) {
    setDownloadingId(report.id)
    try {
      const [transactions, saldoInicial] = await Promise.all([
        listTransactionsInPeriod(report.period_start, report.period_end),
        getBalanceBefore(report.period_start),
      ])
      const summary = buildReportSummary(report, transactions, saldoInicial)
      const blob = await reportPdfBlob({
        report,
        summary,
        generatedAt: new Date(),
      })
      downloadBlob(`${slugify(formatReportPdfTitle(report))}.pdf`, blob)
    } catch (error) {
      toast.error("Não foi possível gerar o arquivo.", {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setDownloadingId(null)
    }
  }
```

- [ ] **Step 3: Type-check + lint**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: sem erros.

---

### Task 10: Diálogo — Mês+Ano + checkbox "Período personalizado"

**Files:**
- Modify: `src/features/relatorios/generate-report-dialog.tsx`

- [ ] **Step 1: Imports e estado**

Adicionar imports:
```tsx
import { endOfMonth } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
```

Adicionar estados (junto aos demais `useState`):
```tsx
  const [month, setMonth] = React.useState<number | null>(null)
  const [customPeriod, setCustomPeriod] = React.useState(false)
```

Adicionar lista de meses (perto de `yearOptions`):
```tsx
  const monthOptions = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const label = format(new Date(2000, i, 1), "MMMM", { locale: ptBR })
        return { value: i + 1, label: label.charAt(0).toUpperCase() + label.slice(1) }
      }),
    []
  )
```

- [ ] **Step 2: Atualizar `reset()`**

```tsx
  function reset() {
    setPeriodType("mensal")
    setRange(undefined)
    setYear(null)
    setMonth(null)
    setCustomPeriod(false)
    setNotes("")
    setPeriodError(null)
  }
```

- [ ] **Step 3: Atualizar o ramo mensal de `resolvePeriod()`**

Substituir o trecho mensal (do `if (!range?.from ...)` até o `return { ... }`) por:
```tsx
    if (customPeriod) {
      if (!range?.from || !range?.to) {
        setPeriodError("Selecione o período (início e fim).")
        return null
      }
      return {
        title: `Relatório ${formatDateBR(range.from)} – ${formatDateBR(range.to)}`,
        referenceMonth: null,
        referenceYear: range.from.getFullYear(),
        start: dateToISO(range.from),
        end: dateToISO(range.to),
      }
    }

    if (month === null || year === null) {
      setPeriodError("Selecione o mês e o ano.")
      return null
    }
    const monthStart = new Date(year, month - 1, 1)
    const monthLabel = format(monthStart, "MMMM 'de' yyyy", { locale: ptBR })
    return {
      title: `Relatório Mensal — ${
        monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
      }`,
      referenceMonth: month,
      referenceYear: year,
      start: dateToISO(monthStart),
      end: dateToISO(endOfMonth(monthStart)),
    }
```

> O ramo `anual` de `resolvePeriod` permanece inalterado.

- [ ] **Step 4: Atualizar a UI do modo mensal**

Substituir o bloco `) : (` … `)}` que hoje renderiza o "Período de apuração" (o `Popover` com o range) por:
```tsx
          ) : (
            <div className="flex flex-col gap-4">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={customPeriod}
                  onCheckedChange={(checked) => {
                    setCustomPeriod(checked)
                    setPeriodError(null)
                  }}
                />
                Período personalizado
              </Label>

              {customPeriod ? (
                <div className="flex flex-col gap-2">
                  <Label>Período de apuração</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          aria-invalid={!!periodError}
                          className={cn(
                            "h-9 w-full justify-start gap-2 font-normal",
                            !range?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="size-4" />
                          {range?.from ? (
                            range.to ? (
                              <>
                                {formatDateBR(range.from)} – {formatDateBR(range.to)}
                              </>
                            ) : (
                              formatDateBR(range.from)
                            )
                          ) : (
                            "Selecione um período"
                          )}
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={range?.from}
                        selected={range}
                        onSelect={setRange}
                        locale={ptBR}
                        numberOfMonths={2}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Mês</Label>
                    <Select
                      items={Object.fromEntries(
                        monthOptions.map((m) => [String(m.value), m.label])
                      )}
                      value={month === null ? "" : String(month)}
                      onValueChange={(value) => {
                        setMonth(Number(value))
                        setPeriodError(null)
                      }}
                    >
                      <SelectTrigger className="h-9 w-full" aria-invalid={!!periodError}>
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Ano</Label>
                    <Select
                      items={Object.fromEntries(
                        yearOptions.map((y) => [String(y), String(y)])
                      )}
                      value={year === null ? "" : String(year)}
                      onValueChange={(value) => {
                        setYear(Number(value))
                        setPeriodError(null)
                      }}
                    >
                      <SelectTrigger className="h-9 w-full" aria-invalid={!!periodError}>
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {periodError && (
                <p className="text-xs text-destructive">{periodError}</p>
              )}
            </div>
          )}
```

> `onCheckedChange` do base-ui entrega `(checked: boolean, details)`; aqui só usamos o primeiro argumento.

- [ ] **Step 5: Type-check + lint**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: sem erros.

---

### Task 11: Build e verificação manual

**Files:** nenhum (verificação)

- [ ] **Step 1: Build completo**

Run: `pnpm build`
Expected: `tsc -b && vite build` concluem sem erros.

- [ ] **Step 2: Rodar o app**

Run: `pnpm dev`
Expected: app sobe; abrir a página de Relatórios.

- [ ] **Step 3: Matriz de verificação manual**

Gerar e baixar o PDF em cada caso, abrindo o arquivo e conferindo:

- [ ] **Mês único**: cabe em 1 página; dízimos e ofertas aparecem como **1 linha por categoria** (data = último lançamento do mês); demais categorias **lançamento a lançamento**; título `RELATÓRIO <MÊS>/<ANO>`.
- [ ] **Período personalizado** (checkbox marcado): título `RELATÓRIO dd/mm/aaaa – dd/mm/aaaa`; dízimos/ofertas agregados **por mês** quando o range cruza mais de um mês.
- [ ] **Anual**: título `RELATÓRIO ANUAL/<ANO>`; agregação por mês.
- [ ] **Invalidado**: marca d'água `INVALIDADO` visível.
- [ ] **Cabeçalho**: logo à esquerda, dados da igreja à direita (CNPJ, pastor, endereço) dentro da altura do logo.
- [ ] **Resumo**: Saldo inicial = soma de tudo antes do período; Saldo final colorido (verde/vermelho); confere com `total_entradas`/`total_saidas`.
- [ ] **Rodapé**: "Conferido dia <hoje>"; membros/obreiros vindos da config; checkbox do tipo de imóvel marcando `[X]` no valor de `CHURCH_INFO.tipoImovel`.

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** dependência+logo (T1), config+categorias agregadas (T2), saldo inicial (T3), agregação seletiva (T4), título por tipo (T5), checkbox UI (T6), layout PDF + marca d'água + assinaturas + rodapé (T7), download só-PDF (T8/T9), diálogo Mês+Ano+custom mantendo Mensal/Anual (T10), verificação 1-página e matriz de casos (T11). Sem lacunas.
- **Placeholders:** nenhum — todo passo tem código/comando concretos.
- **Consistência de tipos:** `ReportLine`/`ReportSummary` (T4) usados em T7; `buildReportSummary` (T4) e `getBalanceBefore` (T3) chamados em T9; `reportPdfBlob`/`ReportDocument` (T7) usados em T9; `slugify`/`downloadBlob` (T8) usados em T9; `formatReportPdfTitle` (T5) usado em T7 e T9; `CHURCH_INFO`/`AGGREGATED_CATEGORIES` (T2) usados em T4/T7. Assinaturas conferem.
