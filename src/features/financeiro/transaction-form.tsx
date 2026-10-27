import * as React from "react"
import { useNavigate } from "react-router"
import { z } from "zod"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  AlertTriangleIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  CalendarIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DialogFooter } from "@/components/ui/dialog"
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
import { formatBRL } from "@/lib/currency"
import { dateToISO, formatDateBR } from "@/lib/date"
import {
  findDuplicateTransactions,
  type NewTransaction,
  type Transaction,
} from "@/api/transactions"
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
  const [isChecking, setIsChecking] = React.useState(false)
  // Aviso de duplicidade atrelado aos campos que o geraram: se o usuário
  // alterar tipo, categoria, valor ou data, o aviso deixa de valer.
  const [duplicateWarning, setDuplicateWarning] = React.useState<{
    key: string
    matches: Transaction[]
  } | null>(null)

  const currentKey = [
    type,
    category,
    amountCents,
    date ? dateToISO(date) : "",
  ].join("|")
  const duplicates =
    duplicateWarning?.key === currentKey ? duplicateWarning.matches : null

  function save(payload: NewTransaction) {
    createTransaction.mutate(payload, {
      onSuccess: () => handleDone(),
    })
  }

  async function handleSubmit(event: React.FormEvent) {
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
    const payload: NewTransaction = {
      type: result.data!.type,
      category: result.data!.category,
      amount: result.data!.amountCents,
      occurred_at: dateToISO(date!),
      notes: result.data!.notes ?? null,
    }

    // Já avisado sobre duplicidade para estes mesmos campos: confirma o envio.
    if (duplicates) {
      save(payload)
      return
    }

    setIsChecking(true)
    try {
      const matches = await findDuplicateTransactions(payload)
      if (matches.length > 0) {
        setDuplicateWarning({ key: currentKey, matches })
        return
      }
    } catch (error) {
      toast.error("Não foi possível verificar duplicidade.", {
        description: error instanceof Error ? error.message : undefined,
      })
      return
    } finally {
      setIsChecking(false)
    }

    save(payload)
  }

  const typeOptions: {
    value: TransactionType
    label: string
    icon: typeof ArrowUpCircleIcon
    activeClass: string
  }[] = [
    {
      value: "entrada",
      label: "Entrada",
      icon: ArrowUpCircleIcon,
      activeClass: "border-success bg-success-soft text-success",
    },
    {
      value: "saida",
      label: "Saída",
      icon: ArrowDownCircleIcon,
      activeClass: "border-destructive bg-danger-soft text-destructive",
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* Tipo: entrada ou saída */}
      <div className="flex flex-col gap-2">
        <Label id="tipo-label">Tipo de lançamento</Label>
        <div
          role="group"
          aria-labelledby="tipo-label"
          className="grid grid-cols-2 gap-2"
        >
          {typeOptions.map((opt) => {
            const active = type === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                aria-pressed={active}
                className={cn(
                  "flex h-14 items-center justify-center gap-2 rounded-lg border-2 px-3 text-lg font-semibold transition-[background-color,border-color,color] duration-150 ease-out",
                  active
                    ? opt.activeClass
                    : "border-input bg-page text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} aria-hidden />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Valor com máscara monetária */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Valor</Label>
        <CurrencyInput
          id="amount"
          className="h-14 text-xl font-semibold"
          valueCents={amountCents}
          onValueChange={setAmountCents}
          aria-invalid={!!errors.amountCents}
          aria-describedby={errors.amountCents ? "amount-error" : undefined}
        />
        {errors.amountCents && (
          <p id="amount-error" className="text-sm font-semibold text-destructive">
            {errors.amountCents}
          </p>
        )}
      </div>

      {/* Data e categoria lado a lado */}
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        <div className="flex flex-col gap-2">
          <Label id="date-label">Data</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  aria-labelledby="date-label date-value"
                  aria-invalid={!!errors.date}
                  className={cn(
                    "w-full justify-start font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon aria-hidden />
                  <span id="date-value" className="num">
                    {date ? formatDateBR(date) : "Escolha o dia"}
                  </span>
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
            <p className="text-sm font-semibold text-destructive">
              {errors.date}
            </p>
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
            <SelectTrigger
              className="w-full data-[size=default]:h-12"
              aria-invalid={!!errors.category}
            >
              <SelectValue placeholder="Escolha a categoria" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {TRANSACTION_CATEGORIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm font-semibold text-destructive">
              Escolha a categoria do lançamento.
            </p>
          )}
        </div>
      </div>

      {/* Observação */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observação (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Ex.: conta de luz de outubro, oferta do culto de domingo"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && (
          <p className="text-sm font-semibold text-destructive">
            {errors.notes} Use no máximo 500 caracteres.
          </p>
        )}
      </div>

      {duplicates && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg bg-warning-soft px-4 py-3.5 text-base text-foreground"
        >
          <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-warning">
              Possível lançamento duplicado
            </p>
            <p>
              {duplicates.length === 1
                ? "Já existe um lançamento"
                : `Já existem ${duplicates.length} lançamentos`}{" "}
              de {type === "entrada" ? "entrada" : "saída"} em{" "}
              {TRANSACTION_CATEGORY_LABELS[category!]} no valor de{" "}
              <span className="num font-semibold">{formatBRL(amountCents)}</span>{" "}
              em <span className="num">{formatDateBR(date!)}</span>. Confira
              antes de continuar ou toque em "Registrar mesmo assim".
            </p>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleCancel()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant={duplicates ? "destructive" : "default"}
          disabled={isChecking || createTransaction.isPending}
        >
          {createTransaction.isPending
            ? "Salvando..."
            : isChecking
              ? "Verificando..."
              : duplicates
                ? "Registrar mesmo assim"
                : "Registrar lançamento"}
        </Button>
      </DialogFooter>
    </form>
  )
}
