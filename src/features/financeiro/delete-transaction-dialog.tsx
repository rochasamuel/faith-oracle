import type { ReactNode } from "react"
import { Trash2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/api/transactions"
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/features/financeiro/constants"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"
import { cn } from "@/lib/utils"

interface DeleteTransactionDialogProps {
  transaction: Transaction | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteTransactionDialog({
  transaction,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteTransactionDialogProps) {
  return (
    <Dialog open={transaction !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir este lançamento?</DialogTitle>
          <DialogDescription>
            O lançamento abaixo será apagado de vez e sai dos totais e dos
            relatórios. Não dá para desfazer.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <dl className="flex flex-col border-t border-rule">
            <Row label="Tipo">
              <span
                className={cn(
                  "font-semibold",
                  transaction.type === "entrada" ? "text-success" : "text-destructive"
                )}
              >
                {TRANSACTION_TYPE_LABELS[transaction.type]}
              </span>
            </Row>
            <Row label="Categoria">
              {TRANSACTION_CATEGORY_LABELS[transaction.category]}
            </Row>
            <Row label="Data">
              <span className="num font-type">{dateISOToBR(transaction.occurred_at)}</span>
            </Row>
            <Row label="Valor">
              <span className="num font-type font-bold">
                {formatBRL(transaction.amount)}
              </span>
            </Row>
            {transaction.notes && (
              <Row label="Observação">{transaction.notes}</Row>
            )}
          </dl>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Voltar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            <Trash2Icon aria-hidden />
            {isDeleting ? "Excluindo..." : "Sim, excluir lançamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-base">{children}</dd>
    </div>
  )
}
