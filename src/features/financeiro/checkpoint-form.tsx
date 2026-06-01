import * as React from "react"
import { z } from "zod"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import { dateToISO, formatDateBR } from "@/lib/date"
import type { NewBalanceCheckpoint } from "@/api/balance-checkpoints"

const schema = z.object({
  amountCents: z.number().int("Informe um valor."),
  notes: z.string().max(500, "Observação muito longa.").optional(),
})

type FieldErrors = Partial<Record<"date" | "amountCents" | "notes", string>>

interface CheckpointFormProps {
  onSubmit: (payload: NewBalanceCheckpoint) => Promise<void> | void
  isSubmitting?: boolean
}

export function CheckpointForm({ onSubmit, isSubmitting }: CheckpointFormProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [dateOpen, setDateOpen] = React.useState(false)
  const [amountCents, setAmountCents] = React.useState(0)
  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<FieldErrors>({})

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schema.safeParse({
      amountCents,
      notes: notes.trim() || undefined,
    })

    const fieldErrors: FieldErrors = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
    }
    if (!date) fieldErrors.date = "Selecione uma data."

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    await onSubmit({
      checkpoint_date: dateToISO(date!),
      amount: result.data!.amountCents,
      notes: result.data!.notes ?? null,
    })
    setAmountCents(0)
    setNotes("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label>Data</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                aria-invalid={!!errors.date}
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
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Saldo real da conta</Label>
        <CurrencyInput
          id="amount"
          valueCents={amountCents}
          onValueChange={setAmountCents}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observação (opcional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar marco"}
      </Button>
    </form>
  )
}
