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
import { TRANSACTION_CATEGORY_LABELS } from "@/features/financeiro/constants"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"

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
          <DialogTitle>Remover lançamento</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O lançamento será removido
            permanentemente.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Categoria</span>
              <span className="font-medium">
                {TRANSACTION_CATEGORY_LABELS[transaction.category]}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium">
                {dateISOToBR(transaction.occurred_at)}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-medium">{formatBRL(transaction.amount)}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
