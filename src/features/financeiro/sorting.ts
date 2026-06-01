import type { Transaction } from "@/api/transactions"
import { TRANSACTION_CATEGORY_LABELS } from "@/features/financeiro/constants"

export type SortKey = "occurred_at" | "category" | "amount"
export type SortDir = "asc" | "desc"

export interface SortState {
  key: SortKey
  dir: SortDir
}

export const DEFAULT_SORT: SortState = { key: "occurred_at", dir: "desc" }

/** Alterna a ordenação: mesma coluna inverte a direção, nova coluna começa desc. */
export function toggleSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" }
  }
  return { key, dir: "desc" }
}

/** Retorna uma nova lista ordenada conforme o estado de ordenação. */
export function sortTransactions(
  transactions: Transaction[],
  sort: SortState
): Transaction[] {
  const factor = sort.dir === "asc" ? 1 : -1

  return [...transactions].sort((a, b) => {
    let comparison = 0

    switch (sort.key) {
      case "occurred_at":
        comparison = a.occurred_at.localeCompare(b.occurred_at)
        if (comparison === 0) {
          comparison = a.created_at.localeCompare(b.created_at)
        }
        break
      case "amount":
        comparison = a.amount - b.amount
        break
      case "category":
        comparison = TRANSACTION_CATEGORY_LABELS[a.category].localeCompare(
          TRANSACTION_CATEGORY_LABELS[b.category],
          "pt-BR"
        )
        break
    }

    return comparison * factor
  })
}
