import * as React from "react"
import { useNavigate } from "react-router"
import { z } from "zod"
import { ptBR } from "date-fns/locale"
import { ArrowDownCircleIcon, ArrowUpCircleIcon, CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { dateToISO, formatDateBR } from "@/lib/date"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
  type TransactionCategory,
  type TransactionType,
} from "@/features/financeiro/constants"
import { useCreateTransaction } from "@/features/financeiro/hooks"

const schema = z.object({
  type: z.enum(["entrada", "saida"]),
  category: z.enum([
    "dizimos",
    "ofertas",
    "doacoes",
    "ajuda_social",
    "eventos",
    "despesas_fixas",
    "missoes",
    "manutencao",
    "construcao",
    "insumos",
    "outros",
  ]),
  amountCents: z.number().int().positive("Informe um valor maior que zero."),
  notes: z.string().max(500, "Observação muito longa.").optional(),
})

type FieldErrors = Partial<
  Record<keyof z.infer<typeof schema> | "date", string>
>

interface TransactionFormProps {
  /** Chamado após salvar com sucesso. Padrão: navega para os lançamentos. */
  onSuccess?: () => void
  /** Chamado ao cancelar. Padrão: navega para os lançamentos. */
  onCancel?: () => void
}

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps = {}) {
  const navigate = useNavigate()
  const createTransaction = useCreateTransaction()

  const handleDone = onSuccess ?? (() => navigate("/financeiro/lancamentos"))
  const handleCancel = onCancel ?? (() => navigate("/financeiro/lancamentos"))

  const [type, setType] = React.useState<TransactionType>("entrada")
  const [category, setCategory] = React.useState<TransactionCategory | null>(null)
  const [amountCents, setAmountCents] = React.useState(0)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [dateOpen, setDateOpen] = React.useState(false)
  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<FieldErrors>({})

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const result = schema.safeParse({
      type,
      category,
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
    createTransaction.mutate(
      {
        type: result.data!.type,
        category: result.data!.category,
        amount: result.data!.amountCents,
        occurred_at: dateToISO(date!),
        notes: result.data!.notes ?? null,
      },
      {
        onSuccess: () => handleDone(),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Tipo: entrada ou saída */}
      <div className="flex flex-col gap-2">
        <Label>Tipo de lançamento</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("entrada")}
            aria-pressed={type === "entrada"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              type === "entrada"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-input text-muted-foreground hover:bg-accent"
            )}
          >
            <ArrowUpCircleIcon className="size-4" />
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setType("saida")}
            aria-pressed={type === "saida"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              type === "saida"
                ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "border-input text-muted-foreground hover:bg-accent"
            )}
          >
            <ArrowDownCircleIcon className="size-4" />
            Saída
          </button>
        </div>
      </div>

      {/* Valor com máscara monetária */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Valor</Label>
        <CurrencyInput
          id="amount"
          className="h-9 text-sm"
          valueCents={amountCents}
          onValueChange={setAmountCents}
          aria-invalid={!!errors.amountCents}
        />
        {errors.amountCents && (
          <p className="text-xs text-destructive">{errors.amountCents}</p>
        )}
      </div>

      {/* Data e categoria lado a lado */}
      <div className="grid gap-5 sm:grid-cols-2">
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
          <Label>Categoria</Label>
          <Select
            items={TRANSACTION_CATEGORY_LABELS}
            value={category}
            onValueChange={(value) =>
              setCategory(value as TransactionCategory)
            }
          >
            <SelectTrigger className="h-9 w-full" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_CATEGORIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category}</p>
          )}
        </div>
      </div>

      {/* Observação */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observação (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Detalhes do lançamento..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleCancel()}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={createTransaction.isPending}>
          {createTransaction.isPending ? "Salvando..." : "Registrar lançamento"}
        </Button>
      </div>
    </form>
  )
}
