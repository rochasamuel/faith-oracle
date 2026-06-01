import { ptBR } from "date-fns/locale"
import { CalendarIcon, XIcon } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { formatDateBR } from "@/lib/date"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
  type TransactionCategory,
  type TransactionType,
} from "@/features/financeiro/constants"
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  type TransactionFiltersState,
} from "@/features/financeiro/filters"

const categoryItems: Record<string, string> = {
  all: "Todas as categorias",
  ...TRANSACTION_CATEGORY_LABELS,
}

// Fast filter por tipo: chips selecionáveis (toggle) com a cor semântica do app.
const typeOptions: {
  value: TransactionType
  label: string
  activeClass: string
}[] = [
  {
    value: "entrada",
    label: "Entradas",
    activeClass:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "saida",
    label: "Saídas",
    activeClass:
      "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
]

interface TransactionFiltersProps {
  value: TransactionFiltersState
  onChange: (next: TransactionFiltersState) => void
}

export function TransactionFilters({
  value,
  onChange,
}: TransactionFiltersProps) {
  const { dateRange } = value

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
      {/* Faixa de datas */}
      <div className="flex flex-col gap-1.5">
        <Label>Período</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-60 justify-start gap-2 font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="size-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {formatDateBR(dateRange.from)} – {formatDateBR(dateRange.to)}
                    </>
                  ) : (
                    formatDateBR(dateRange.from)
                  )
                ) : (
                  "Selecione um período"
                )}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => onChange({ ...value, dateRange: range })}
              locale={ptBR}
              numberOfMonths={2}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Categoria */}
      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <Select
          items={categoryItems}
          value={value.category}
          onValueChange={(next) =>
            onChange({
              ...value,
              category: next as TransactionCategory | "all",
            })
          }
        >
          <SelectTrigger className="h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {TRANSACTION_CATEGORIES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Faixa de valor */}
      <div className="flex flex-col gap-1.5">
        <Label>Valor mínimo</Label>
        <CurrencyInput
          className="h-9 w-32 text-sm"
          valueCents={value.minCents}
          onValueChange={(cents) => onChange({ ...value, minCents: cents })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Valor máximo</Label>
        <CurrencyInput
          className="h-9 w-32 text-sm"
          valueCents={value.maxCents}
          onValueChange={(cents) => onChange({ ...value, maxCents: cents })}
        />
      </div>

      {/* Tipo: fast filter (chips toggle) — clicar no ativo desmarca */}
      <div className="flex flex-col gap-1.5">
        <Label>Tipo</Label>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((opt) => {
            const active = value.type === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({ ...value, type: active ? "all" : opt.value })
                }
                className={cn(
                  "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  active
                    ? opt.activeClass
                    : "border-input text-muted-foreground hover:bg-accent"
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {hasActiveFilters(value) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <XIcon />
          Limpar
        </Button>
      )}
    </div>
  )
}
