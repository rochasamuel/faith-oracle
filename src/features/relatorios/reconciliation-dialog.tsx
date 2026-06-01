import * as React from "react"
import { ScaleIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import { formatBRL } from "@/lib/currency"
import { dateToISO } from "@/lib/date"
import { useCreateReconciliation } from "@/features/relatorios/use-reconciliations"

interface ReconciliationDialogProps {
  /** Data inicial sugerida (ISO yyyy-mm-dd); padrão é hoje. */
  defaultDate?: string
}

/**
 * Conciliação: informa o saldo real do banco numa data; a diferença para o
 * saldo do sistema vira um lançamento de ajuste (doação em entrada / "outros"
 * em saída).
 */
export function ReconciliationDialog({ defaultDate }: ReconciliationDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState(defaultDate ?? dateToISO(new Date()))
  const [amountCents, setAmountCents] = React.useState(0)
  const create = useCreateReconciliation()

  function reset() {
    setDate(defaultDate ?? dateToISO(new Date()))
    setAmountCents(0)
  }

  async function handleConfirm() {
    try {
      const result = await create.mutateAsync({
        reconciled_at: date,
        informed_balance: amountCents,
      })
      const diff = result.difference
      toast.success(
        diff === 0
          ? "Conta já estava conciliada (sem diferença)."
          : `Conciliado: ${formatBRL(Math.abs(diff))} lançados como ${
              diff > 0 ? "doação (entrada)" : "ajuste (saída)"
            }.`
      )
      setOpen(false)
    } catch {
      // erro já exibido pelo hook (toast.error)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <ScaleIcon />
        Conciliar conta digital
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conciliar conta digital</DialogTitle>
          <DialogDescription>
            Informe o saldo real do banco. A diferença para o saldo do sistema
            vira um lançamento de ajuste automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-date">Data</Label>
            <Input
              id="rec-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-amount">Saldo real no banco</Label>
            <CurrencyInput
              id="rec-amount"
              valueCents={amountCents}
              onValueChange={setAmountCents}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={create.isPending}>
            {create.isPending ? "Conciliando..." : "Conciliar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
