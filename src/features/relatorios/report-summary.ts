import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { Report } from "@/api/reports"
import type { Transaction } from "@/api/transactions"
import { TRANSACTION_CATEGORY_LABELS } from "@/features/financeiro/constants"
import { AGGREGATED_CATEGORIES } from "@/config/church"

/** Uma linha de tabela do relatório (receita ou despesa). */
export interface ReportLine {
  // ISO yyyy-mm-dd. Em linhas agregadas, é a data do último lançamento do grupo.
  date: string
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

/** Nome do mês de referência, capitalizado (ex.: "Maio"). */
function monthLabel(iso: string): string {
  const name = format(parseISO(iso), "MMMM", { locale: ptBR })
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Transforma os lançamentos de um lado (entradas OU saídas) em linhas:
 * - categorias em AGGREGATED_CATEGORIES: agregadas por (mês, categoria),
 *   com data = último lançamento do grupo;
 * - demais categorias: uma linha por lançamento.
 * Resultado ordenado por data (desempate pelo rótulo).
 */
function buildLines(transactions: Transaction[]): ReportLine[] {
  // Pré-condição: `transactions` contém lançamentos de um único `type`
  // (todas entradas OU todas saídas) — o agrupamento não separa por tipo.
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
        // Linha agregada: "Categoria [Mês]" (ex.: "Dízimos [Maio]").
        const aggregatedLabel = `${label} [${monthLabel(t.occurred_at)}]`
        aggregated.set(key, {
          date: t.occurred_at,
          label: aggregatedLabel,
          amount: t.amount,
        })
      }
    } else {
      // Categorias não agregadas: mostra a observação do lançamento; sem
      // observação, cai no nome da categoria para não deixar a linha vazia.
      const obs = t.notes?.trim()
      single.push({
        date: t.occurred_at,
        label: obs || label,
        amount: t.amount,
      })
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
