import { type DateRange } from "react-day-picker"

import type {
  TransactionCategory,
  TransactionType,
} from "@/features/financeiro/constants"

export interface TransactionFiltersState {
  type: TransactionType | "all"
  dateRange: DateRange | undefined
  category: TransactionCategory | "all"
  minCents: number
  maxCents: number
}

export const EMPTY_FILTERS: TransactionFiltersState = {
  type: "all",
  dateRange: undefined,
  category: "all",
  minCents: 0,
  maxCents: 0,
}

/** Indica se algum filtro está ativo (para exibir o botão de limpar). */
export function hasActiveFilters(filters: TransactionFiltersState): boolean {
  return (
    filters.type !== "all" ||
    !!filters.dateRange?.from ||
    filters.category !== "all" ||
    filters.minCents > 0 ||
    filters.maxCents > 0
  )
}
