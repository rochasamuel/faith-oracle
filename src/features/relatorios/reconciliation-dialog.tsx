import * as React from "react"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ScaleIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import { formatBRL } from "@/lib/currency"
import { dateToISO, formatDateBR } from "@/lib/date"
import { useCreateReconciliation } from "@/features/relatorios/use-reconciliations"

/**
 * Conciliação: informa o saldo real do banco numa data; a diferença para o
 * saldo do sistema vira um lançamento de ajuste (doação em entrada / "outros"
 * em saída).
 */
export function ReconciliationDialog() {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [dateOpen, setDateOpen] = React.useState(false)
  const [amountCents, setAmountCents] = React.useState(0)
  const [dateError, setDateError] = React.useState(false)
  const create = useCreateReconciliation()

  function reset() {
    setDate(new Date())
    setAmountCents(0)
    setDateError(false)
  }

  async function handleConfirm() {
    if (!date) {
      setDateError(true)
      return
    }
    setDateError(false)
    try {
      const result = await create.mutateAsync({
        reconciled_at: dateToISO(date),
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
            <Label>Data</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    aria-invalid={dateError}
                    className={cn(
                      "h-9 w-full justify-start gap-2 font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {date ? formatDateBR(date) : "Selecione uma data"}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(value) => {
                    setDate(value)
                    setDateOpen(false)
                  }}
                  locale={ptBR}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            {dateError && (
              <p className="text-xs text-destructive">Selecione uma data.</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-amount">Saldo real no banco</Label>
            <CurrencyInput
              id="rec-amount"
              className="h-9 text-sm"
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
