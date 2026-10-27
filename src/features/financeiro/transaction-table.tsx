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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"
import type { Transaction } from "@/api/transactions"
import { useDeleteTransaction } from "@/features/financeiro/hooks"
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/features/financeiro/constants"
import { DeleteTransactionDialog } from "@/features/financeiro/delete-transaction-dialog"
import type { SortDir, SortKey, SortState } from "@/features/financeiro/sorting"

interface TransactionTableProps {
  transactions: Transaction[]
  sort: SortState
  onToggleSort: (key: SortKey) => void
}

// Ordenações oferecidas no celular (onde não há cabeçalho de coluna).
const MOBILE_SORTS: Record<string, { key: SortKey; dir: SortDir; label: string }> = {
  "occurred_at:desc": { key: "occurred_at", dir: "desc", label: "Mais recentes primeiro" },
  "occurred_at:asc": { key: "occurred_at", dir: "asc", label: "Mais antigos primeiro" },
  "amount:desc": { key: "amount", dir: "desc", label: "Maior valor primeiro" },
  "amount:asc": { key: "amount", dir: "asc", label: "Menor valor primeiro" },
  "category:asc": { key: "category", dir: "asc", label: "Categoria (A–Z)" },
  "category:desc": { key: "category", dir: "desc", label: "Categoria (Z–A)" },
}
const mobileSortItems = Object.fromEntries(
  Object.entries(MOBILE_SORTS).map(([k, v]) => [k, v.label])
)

/** Valor com sinal e cor: "+ R$ 100,00" (entrada) / "− R$ 50,00" (saída). */
function SignedAmount({
  transaction,
  className,
}: {
  transaction: Transaction
  className?: string
}) {
  const isEntrada = transaction.type === "entrada"
  return (
    <span
      className={cn(
        "num font-type font-bold whitespace-nowrap",
        isEntrada ? "text-success" : "text-destructive",
        className
      )}
    >
      <span className="sr-only">{TRANSACTION_TYPE_LABELS[transaction.type]}: </span>
      <span aria-hidden>{isEntrada ? "+" : "−"} </span>
      {formatBRL(transaction.amount)}
    </span>
  )
}

function TypeBadge({ transaction }: { transaction: Transaction }) {
  const isEntrada = transaction.type === "entrada"
  return (
    <Badge variant={isEntrada ? "success" : "destructive"}>
      {isEntrada ? (
        <ArrowUpCircleIcon aria-hidden />
      ) : (
        <ArrowDownCircleIcon aria-hidden />
      )}
      {TRANSACTION_TYPE_LABELS[transaction.type]}
    </Badge>
  )
}

function SortableHead({
  label,
  sortKey,
  sort,
  onToggleSort,
  className,
  align = "left",
}: {
  label: string
  sortKey: SortKey
  sort: SortState
  onToggleSort: (key: SortKey) => void
  className?: string
  align?: "left" | "right"
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ChevronsUpDownIcon : sort.dir === "asc" ? ArrowUpIcon : ArrowDownIcon

  return (
    <TableHead
      className={cn(align === "right" && "text-right", className)}
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
      }
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "-mx-3.5 h-11 text-sm text-muted-foreground",
          active && "text-foreground",
          align === "right" && "ml-auto flex"
        )}
        onClick={() => onToggleSort(sortKey)}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <Icon className={cn("size-4", active ? "opacity-100" : "opacity-50")} aria-hidden />
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

  // Leva a ordenação até (key, dir) usando apenas o toggle exposto pela página.
  function setSortTo(key: SortKey, dir: SortDir) {
    if (sort.key === key && sort.dir === dir) return
    if (sort.key === key) {
      onToggleSort(key)
      return
    }
    onToggleSort(key) // nova coluna começa em desc
    if (dir === "asc") onToggleSort(key)
  }

  const sortValue = `${sort.key}:${sort.dir}`

  return (
    <>
      {/* Computador: tabela do livro-caixa */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead
                label="Data"
                sortKey="occurred_at"
                sort={sort}
                onToggleSort={onToggleSort}
                className="w-32"
              />
              <TableHead className="w-32">Tipo</TableHead>
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
                align="right"
                className="w-44"
              />
              <TableHead className="w-28">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="num font-type text-muted-foreground">
                  {dateISOToBR(transaction.occurred_at)}
                </TableCell>
                <TableCell>
                  <TypeBadge transaction={transaction} />
                </TableCell>
                <TableCell className="font-semibold">
                  {TRANSACTION_CATEGORY_LABELS[transaction.category]}
                </TableCell>
                <TableCell
                  className="max-w-[18rem] truncate text-muted-foreground"
                  title={transaction.notes ?? undefined}
                >
                  {transaction.notes || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <SignedAmount transaction={transaction} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 text-muted-foreground hover:text-destructive"
                    aria-label={`Excluir lançamento de ${TRANSACTION_CATEGORY_LABELS[transaction.category]} em ${dateISOToBR(transaction.occurred_at)}`}
                    onClick={() => setPending(transaction)}
                  >
                    <Trash2Icon aria-hidden />
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Celular: uma linha pautada por lançamento */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex flex-col gap-2">
          <Label>Ordenar</Label>
          <Select
            items={mobileSortItems}
            value={sortValue in MOBILE_SORTS ? sortValue : null}
            onValueChange={(next) => {
              const opt = next ? MOBILE_SORTS[next as string] : undefined
              if (opt) setSortTo(opt.key, opt.dir)
            }}
          >
            <SelectTrigger className="w-full data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {Object.entries(MOBILE_SORTS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ul className="flex flex-col border-t border-rule">
          {transactions.map((transaction) => {
            const isEntrada = transaction.type === "entrada"
            return (
              <li
                key={transaction.id}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-rule py-3"
              >
                <p className="min-w-0 text-[1.125rem] leading-snug font-semibold">
                  {TRANSACTION_CATEGORY_LABELS[transaction.category]}
                </p>
                <SignedAmount
                  transaction={transaction}
                  className="text-right text-[1.125rem] leading-snug"
                />
                <div className="flex min-w-0 flex-col gap-0.5 text-base text-muted-foreground">
                  <p>
                    <span className="num font-type">{dateISOToBR(transaction.occurred_at)}</span>
                    {" · "}
                    <span
                      className={cn(
                        "font-semibold",
                        isEntrada ? "text-success" : "text-destructive"
                      )}
                    >
                      {TRANSACTION_TYPE_LABELS[transaction.type]}
                    </span>
                  </p>
                  {transaction.notes && (
                    <p className="break-words">{transaction.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-3 h-11 justify-self-end text-muted-foreground hover:text-destructive"
                  aria-label={`Excluir lançamento de ${TRANSACTION_CATEGORY_LABELS[transaction.category]} em ${dateISOToBR(transaction.occurred_at)}`}
                  onClick={() => setPending(transaction)}
                >
                  <Trash2Icon aria-hidden />
                  Excluir
                </Button>
              </li>
            )
          })}
        </ul>
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
