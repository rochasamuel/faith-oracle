import * as React from "react"
import { endOfDay, isWithinInterval, parseISO, startOfDay } from "date-fns"
import { SearchXIcon, WalletIcon } from "lucide-react"

import {
  EmptyState,
  ErrorState,
  Ledger,
  Page,
  PageHeader,
  Section,
} from "@/components/page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBRL } from "@/lib/currency"
import { NewTransactionDialog } from "@/features/financeiro/new-transaction-dialog"
import { ImportCsvDialog } from "@/features/financeiro/import-csv-dialog"
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
  const min = filters.minCents > 0 ? filters.minCents : null
  const max = filters.maxCents > 0 ? filters.maxCents : null
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
  const total = data?.length ?? 0

  return (
    <Page width="wide">
      <PageHeader
        title="Lançamentos"
        folio={
          data
            ? `${total} ${total === 1 ? "lançamento registrado" : "lançamentos registrados"}`
            : undefined
        }
        description="O livro-caixa da igreja: cada entrada e saída, com data, categoria e valor."
        actions={
          <>
            <ImportCsvDialog />
            <NewTransactionDialog />
          </>
        }
      />

      {isLoading ? (
        <LedgerSkeleton />
      ) : isError ? (
        <ErrorState title="Não foi possível carregar os lançamentos." error={error} />
      ) : isEmpty ? (
        <EmptyState
          icon={WalletIcon}
          title="Nenhum lançamento ainda"
          description="Registre a primeira entrada ou saída. Se já tem tudo numa planilha, use “Importar CSV”."
          action={<NewTransactionDialog />}
        />
      ) : (
        <>
          {/* Resumo: Entradas · Saídas · Saldo, sobre o que está filtrado */}
          <section aria-label="Resumo dos lançamentos" className="flex flex-col gap-2">
            <Ledger
              className="max-w-xl"
              rows={[
                { label: "Entradas", value: `+ ${formatBRL(totals.entradas)}`, tone: "positive" },
                { label: "Saídas", value: `− ${formatBRL(totals.saidas)}`, tone: "negative" },
              ]}
              total={{
                label: "Saldo",
                value: `${totals.saldo < 0 ? "− " : ""}${formatBRL(Math.abs(totals.saldo))}`,
                tone: totals.saldo < 0 ? "negative" : "default",
                hint: totals.saldo < 0 ? "Saiu mais do que entrou" : "Entradas menos saídas",
              }}
            />
            <p className="text-sm text-muted-foreground">
              {filtersActive
                ? "Totais dos lançamentos que aparecem com os filtros abaixo."
                : "Totais de todos os lançamentos registrados."}
            </p>
          </section>

          <Section
            title="Registros"
            count={
              filtersActive ? `${visible.length} de ${total}` : `${total}`
            }
          >
            <TransactionFilters value={filters} onChange={setFilters} />

            {visible.length === 0 ? (
              <EmptyState
                icon={SearchXIcon}
                title="Nenhum lançamento com esses filtros"
                description="Mude o período, a categoria ou os valores, ou limpe os filtros para ver tudo."
                action={
                  filtersActive ? (
                    <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                      Limpar filtros
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <TransactionTable
                transactions={visible}
                sort={sort}
                onToggleSort={handleToggleSort}
              />
            )}
          </Section>
        </>
      )}
    </Page>
  )
}

function LedgerSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-xl flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-2 border-b border-rule py-3.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-36" />
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4 border-b border-rule py-4">
            <Skeleton className="h-6 w-48 max-w-[60%]" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
