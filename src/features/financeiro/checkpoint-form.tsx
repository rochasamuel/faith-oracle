import * as React from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import { dateToISO } from "@/lib/date"
import type { NewBalanceCheckpoint } from "@/api/balance-checkpoints"

const schema = z.object({
  checkpoint_date: z.string().min(1, "Informe a data."),
  amountCents: z.number().int("Informe um valor."),
  notes: z.string().max(500, "Observação muito longa.").optional(),
})

type FieldErrors = Partial<Record<"checkpoint_date" | "amountCents" | "notes", string>>

interface CheckpointFormProps {
  onSubmit: (payload: NewBalanceCheckpoint) => Promise<void> | void
  isSubmitting?: boolean
}

export function CheckpointForm({ onSubmit, isSubmitting }: CheckpointFormProps) {
  const [date, setDate] = React.useState(dateToISO(new Date()))
  const [amountCents, setAmountCents] = React.useState(0)
  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<FieldErrors>({})

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schema.safeParse({
      checkpoint_date: date,
      amountCents,
      notes: notes.trim() || undefined,
    })
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    await onSubmit({
      checkpoint_date: result.data.checkpoint_date,
      amount: result.data.amountCents,
      notes: result.data.notes ?? null,
    })
    setAmountCents(0)
    setNotes("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkpoint_date">Data</Label>
        <Input
          id="checkpoint_date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={!!errors.checkpoint_date}
        />
        {errors.checkpoint_date && (
          <p className="text-xs text-destructive">{errors.checkpoint_date}</p>
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
