import * as React from "react"
import {
  ArrowDownCircleIcon,
  ArrowDownIcon,
  ArrowUpCircleIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  Trash2Icon,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"
import type { Transaction } from "@/api/transactions"
import { useDeleteTransaction } from "@/features/financeiro/hooks"
import { TRANSACTION_CATEGORY_LABELS } from "@/features/financeiro/constants"
import { DeleteTransactionDialog } from "@/features/financeiro/delete-transaction-dialog"
import type { SortKey, SortState } from "@/features/financeiro/sorting"

interface TransactionTableProps {
  transactions: Transaction[]
  sort: SortState
  onToggleSort: (key: SortKey) => void
}

function SortableHead({
  label,
  sortKey,
  sort,
  onToggleSort,
  className,
}: {
  label: string
  sortKey: SortKey
  sort: SortState
  onToggleSort: (key: SortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ChevronsUpDownIcon : sort.dir === "asc" ? ArrowUpIcon : ArrowDownIcon

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className={cn("-mx-2 gap-1", active && "text-foreground")}
        onClick={() => onToggleSort(sortKey)}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <Icon className={cn("size-3.5", active ? "opacity-100" : "opacity-50")} />
      </Button>
    </TableHead>
  )
}

export function TransactionTable({
  transactions,
  sort,
  onToggleSort,
}: TransactionTableProps) {
  const deleteTransaction = useDeleteTransaction()
  const [pending, setPending] = React.useState<Transaction | null>(null)

  function handleConfirmDelete() {
    if (!pending) return
    deleteTransaction.mutate(pending.id, {
      onSuccess: () => setPending(null),
    })
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Data"
                sortKey="occurred_at"
                sort={sort}
                onToggleSort={onToggleSort}
                className="w-28"
              />
              <SortableHead
                label="Categoria"
                sortKey="category"
                sort={sort}
                onToggleSort={onToggleSort}
              />
              <TableHead>Observação</TableHead>
              <SortableHead
                label="Valor"
                sortKey="amount"
                sort={sort}
                onToggleSort={onToggleSort}
                className="text-right [&>button]:ml-auto"
              />
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const isEntrada = transaction.type === "entrada"
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {dateISOToBR(transaction.occurred_at)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border",
                        isEntrada
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {isEntrada ? (
                        <ArrowUpCircleIcon />
                      ) : (
                        <ArrowDownCircleIcon />
                      )}
                      {TRANSACTION_CATEGORY_LABELS[transaction.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {transaction.notes || "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      isEntrada
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {isEntrada ? "+" : "−"} {formatBRL(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remover lançamento"
                      onClick={() => setPending(transaction)}
                    >
                      <Trash2Icon className="text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <DeleteTransactionDialog
        transaction={pending}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteTransaction.isPending}
      />
    </>
  )
}
