/**
 * Importação de lançamentos a partir de texto CSV colado pelo usuário.
 * Separador: ponto e vírgula (;) ou tabulação (colar direto de planilha).
 * A vírgula fica livre para o decimal do valor em pt-BR.
 */
import { isValid, parse } from "date-fns"

import type { NewTransaction } from "@/api/transactions"
import { dateToISO } from "@/lib/date"
import {
  TRANSACTION_CATEGORY_LABELS,
  type TransactionCategory,
  type TransactionType,
} from "@/features/financeiro/constants"

/** Modelo exibido no placeholder do campo de colagem. */
export const CSV_TEMPLATE = [
  "data;tipo;categoria;valor;observacao",
  "05/10/2026;entrada;dizimos;1.250,00;Culto de domingo",
  "06/10/2026;saida;despesas_fixas;320,50;Conta de luz",
].join("\n")

export interface CsvLineError {
  line: number
  message: string
}

export interface CsvParseResult {
  rows: NewTransaction[]
  errors: CsvLineError[]
}

/** Minúsculas, sem acentos e com espaços viram "_" — para comparar rótulos. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
}

// Aceita tanto o slug ("despesas_fixas") quanto o rótulo ("Despesas fixas").
const CATEGORY_LOOKUP = new Map<string, TransactionCategory>()
for (const [slug, label] of Object.entries(TRANSACTION_CATEGORY_LABELS)) {
  CATEGORY_LOOKUP.set(normalize(slug), slug as TransactionCategory)
  CATEGORY_LOOKUP.set(normalize(label), slug as TransactionCategory)
}

const TYPE_LOOKUP: Record<string, TransactionType> = {
  entrada: "entrada",
  saida: "saida",
}

function parseDate(value: string): string | null {
  for (const pattern of ["dd/MM/yyyy", "yyyy-MM-dd"]) {
    const date = parse(value.trim(), pattern, new Date())
    if (isValid(date)) return dateToISO(date)
  }
  return null
}

/**
 * Converte um valor monetário em texto para centavos, sem passar por float.
 * Aceita "1.250,00", "320,5", "150", "R$ 99,90" e "150.00".
 */
function parseAmountCents(value: string): number | null {
  let text = value.replace(/R\$/i, "").replace(/\s/g, "")
  if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".")
  } else if (!/^\d+\.\d{1,2}$/.test(text)) {
    text = text.replace(/\./g, "") // pontos como separador de milhar
  }

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text)
  if (!match) return null
  const cents =
    Number.parseInt(match[1], 10) * 100 +
    Number.parseInt((match[2] ?? "0").padEnd(2, "0"), 10)
  return cents > 0 ? cents : null
}

/** Interpreta o texto colado. Linhas vazias e o cabeçalho são ignorados. */
export function parseTransactionsCsv(text: string): CsvParseResult {
  const rows: NewTransaction[] = []
  const errors: CsvLineError[] = []

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1
    if (!raw.trim()) return

    const separator = raw.includes("\t") ? "\t" : ";"
    const [dateRaw = "", typeRaw = "", categoryRaw = "", amountRaw = "", ...rest] =
      raw.split(separator)

    if (index === 0 && normalize(dateRaw) === "data") return

    const occurred_at = parseDate(dateRaw)
    if (!occurred_at) {
      errors.push({ line, message: `Data inválida: "${dateRaw.trim()}".` })
      return
    }

    const type = TYPE_LOOKUP[normalize(typeRaw)]
    if (!type) {
      errors.push({
        line,
        message: `Tipo inválido: "${typeRaw.trim()}" (use entrada ou saida).`,
      })
      return
    }

    const category = CATEGORY_LOOKUP.get(normalize(categoryRaw))
    if (!category) {
      errors.push({
        line,
        message: `Categoria inválida: "${categoryRaw.trim()}".`,
      })
      return
    }

    const amount = parseAmountCents(amountRaw)
    if (amount === null) {
      errors.push({ line, message: `Valor inválido: "${amountRaw.trim()}".` })
      return
    }

    const notes = rest.join(separator).trim()
    if (notes.length > 500) {
      errors.push({ line, message: "Observação muito longa." })
      return
    }

    rows.push({ type, category, amount, occurred_at, notes: notes || null })
  })

  return { rows, errors }
}

/** Chave usada para detectar duplicidade (tipo, categoria, valor e data). */
export function duplicateKey(
  t: Pick<NewTransaction, "type" | "category" | "amount" | "occurred_at">
): string {
  return [t.type, t.category, t.amount, t.occurred_at].join("|")
}
