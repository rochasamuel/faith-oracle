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
            Informe o saldo real do banco numa data. Se for diferente do saldo
            do sistema, a diferença vira um lançamento de ajuste
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-date">Data do saldo</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id="rec-date"
                    variant="outline"
                    aria-invalid={dateError}
                    aria-describedby={dateError ? "rec-date-error" : undefined}
                    className={cn(
                      "w-full justify-start gap-2 font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon aria-hidden />
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
              <p id="rec-date-error" className="text-sm text-destructive">
                Escolha a data do saldo informado pelo banco.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-amount">Saldo real no banco</Label>
            <CurrencyInput
              id="rec-amount"
              aria-describedby="rec-amount-hint"
              valueCents={amountCents}
              onValueChange={setAmountCents}
            />
            <p id="rec-amount-hint" className="text-sm text-muted-foreground">
              O valor que aparece no extrato ou no aplicativo do banco nesta
              data.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={create.isPending}>
            <ScaleIcon />
            {create.isPending ? "Conciliando..." : "Conciliar saldo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
