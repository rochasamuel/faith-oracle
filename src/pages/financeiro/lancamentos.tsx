import * as React from "react"
import { Link } from "react-router"
import { endOfDay, isWithinInterval, parseISO, startOfDay } from "date-fns"
import { PlusIcon, SearchXIcon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { centsToReais, formatBRL } from "@/lib/currency"
import { useTransactions } from "@/features/financeiro/hooks"
import { TransactionTable } from "@/features/financeiro/transaction-table"
import { TransactionFilters } from "@/features/financeiro/transaction-filters"
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  type TransactionFiltersState,
} from "@/features/financeiro/filters"
import {
  DEFAULT_SORT,
  sortTransactions,
  toggleSort,
  type SortKey,
  type SortState,
} from "@/features/financeiro/sorting"
import type { Transaction } from "@/api/transactions"

function applyFilters(
  transactions: Transaction[],
  filters: TransactionFiltersState
): Transaction[] {
  const min = filters.minCents > 0 ? centsToReais(filters.minCents) : null
  const max = filters.maxCents > 0 ? centsToReais(filters.maxCents) : null
  const from = filters.dateRange?.from
  const to = filters.dateRange?.to

  return transactions.filter((t) => {
    if (filters.type !== "all" && t.type !== filters.type) return false
    if (filters.category !== "all" && t.category !== filters.category) {
      return false
    }
    if (min !== null && t.amount < min) return false
    if (max !== null && t.amount > max) return false

    if (from) {
      const date = parseISO(t.occurred_at)
      const interval = to
        ? { start: startOfDay(from), end: endOfDay(to) }
        : { start: startOfDay(from), end: endOfDay(from) }
      if (!isWithinInterval(date, interval)) return false
    }

    return true
  })
}

export default function LancamentosPage() {
  const { data, isLoading, isError, error } = useTransactions()

  const [filters, setFilters] =
    React.useState<TransactionFiltersState>(EMPTY_FILTERS)
  const [sort, setSort] = React.useState<SortState>(DEFAULT_SORT)

  const visible = React.useMemo(() => {
    const list = data ?? []
    return sortTransactions(applyFilters(list, filters), sort)
  }, [data, filters, sort])

  // Resumo sobre os lançamentos filtrados (acompanha os filtros ativos;
  // a ordenação é irrelevante para as somas).
  const totals = React.useMemo(() => {
    const list = applyFilters(data ?? [], filters)
    const entradas = list
      .filter((t) => t.type === "entrada")
      .reduce((sum, t) => sum + t.amount, 0)
    const saidas = list
      .filter((t) => t.type === "saida")
      .reduce((sum, t) => sum + t.amount, 0)
    return { entradas, saidas, saldo: entradas - saidas }
  }, [data, filters])

  function handleToggleSort(key: SortKey) {
    setSort((current) => toggleSort(current, key))
  }

  const isEmpty = !data || data.length === 0
  const filtersActive = hasActiveFilters(filters)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-lg font-medium">Lançamentos</h1>
          <p className="text-xs text-muted-foreground">
            Entradas e saídas financeiras registradas.
          </p>
        </div>
        <Button nativeButton={false} render={<Link to="/financeiro/novo" />}>
          <PlusIcon />
          Novo lançamento
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Entradas"
          value={totals.entradas}
          className="text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          label="Saídas"
          value={totals.saidas}
          className="text-rose-600 dark:text-rose-400"
        />
        <SummaryCard
          label="Saldo"
          value={totals.saldo}
          className={cn(
            totals.saldo >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          )}
        />
      </div>

      {!isEmpty && (
        <TransactionFilters value={filters} onChange={setFilters} />
      )}

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            Erro ao carregar lançamentos
            {error instanceof Error ? `: ${error.message}` : "."}
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <WalletIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nenhum lançamento ainda</p>
              <p className="text-xs text-muted-foreground">
                Comece registrando a primeira entrada ou saída.
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link to="/financeiro/novo" />}
              size="sm"
            >
              <PlusIcon />
              Novo lançamento
            </Button>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <SearchXIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nenhum resultado</p>
              <p className="text-xs text-muted-foreground">
                Nenhum lançamento corresponde aos filtros aplicados.
              </p>
            </div>
            {filtersActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <TransactionTable
          transactions={visible}
          sort={sort}
          onToggleSort={handleToggleSort}
        />
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn("text-xl tabular-nums", className)}>
          {formatBRL(value)}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
