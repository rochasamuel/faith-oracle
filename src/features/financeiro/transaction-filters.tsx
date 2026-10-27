import * as React from "react"
import { ptBR } from "date-fns/locale"
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  CalendarIcon,
  ChevronDownIcon,
  ListFilterIcon,
  XIcon,
} from "lucide-react"

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
import { useIsMobile } from "@/hooks/use-mobile"
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

// Filtro rápido por tipo: controle segmentado, sempre visível.
const typeOptions: {
  value: TransactionType | "all"
  label: string
  icon?: typeof ArrowUpCircleIcon
  activeClass: string
}[] = [
  {
    value: "all",
    label: "Todos",
    activeClass: "border-primary bg-accent text-foreground",
  },
  {
    value: "entrada",
    label: "Entradas",
    icon: ArrowUpCircleIcon,
    activeClass: "border-success bg-success-soft text-success",
  },
  {
    value: "saida",
    label: "Saídas",
    icon: ArrowDownCircleIcon,
    activeClass: "border-destructive bg-danger-soft text-destructive",
  },
]

/** Quantos filtros além do tipo estão ativos (período, categoria, valores). */
function countAdvanced(filters: TransactionFiltersState): number {
  let n = 0
  if (filters.dateRange?.from) n++
  if (filters.category !== "all") n++
  if (filters.minCents > 0) n++
  if (filters.maxCents > 0) n++
  return n
}

interface TransactionFiltersProps {
  value: TransactionFiltersState
  onChange: (next: TransactionFiltersState) => void
}

export function TransactionFilters({
  value,
  onChange,
}: TransactionFiltersProps) {
  const { dateRange } = value
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const advancedCount = countAdvanced(value)
  const panelId = React.useId()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Tipo: Todos · Entradas · Saídas */}
        <div
          role="group"
          aria-label="Mostrar lançamentos do tipo"
          className="grid grid-cols-3 gap-1.5 sm:w-[26rem]"
        >
          {typeOptions.map((opt) => {
            const active = value.type === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, type: opt.value })}
                className={cn(
                  "flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg border-2 px-2 text-base font-semibold transition-[background-color,border-color,color] duration-150 ease-out",
                  active
                    ? opt.activeClass
                    : "border-input bg-page text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-foreground"
                )}
              >
                {Icon && <Icon className="size-5 shrink-0" aria-hidden />}
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2.5">
          {/* No celular, os demais filtros ficam recolhidos atrás deste botão. */}
          <Button
            variant="outline"
            className="flex-1 md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            <ListFilterIcon />
            Filtros
            {advancedCount > 0 && (
              <span className="num inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primary px-1.5 text-sm text-primary-foreground">
                {advancedCount}
                <span className="sr-only">
                  {advancedCount === 1 ? " filtro ativo" : " filtros ativos"}
                </span>
              </span>
            )}
            <ChevronDownIcon
              className={cn(
                "transition-transform duration-150",
                open && "rotate-180"
              )}
              aria-hidden
            />
          </Button>

          {hasActiveFilters(value) && (
            <Button
              variant="ghost"
              className="flex-1 sm:flex-none"
              onClick={() => onChange(EMPTY_FILTERS)}
            >
              <XIcon />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <div
        id={panelId}
        className={cn(
          "gap-4 sm:grid-cols-2 md:grid lg:grid-cols-[1.3fr_1.2fr_1fr_1fr]",
          open ? "grid" : "hidden"
        )}
      >
        {/* Faixa de datas */}
        <div className="flex flex-col gap-2">
          <Label>Período</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon />
                  <span className="num truncate">
                    {dateRange?.from
                      ? dateRange.to
                        ? `${formatDateBR(dateRange.from)} – ${formatDateBR(dateRange.to)}`
                        : formatDateBR(dateRange.from)
                      : "Qualquer data"}
                  </span>
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
                numberOfMonths={isMobile ? 1 : 2}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-2">
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
            <SelectTrigger className="w-full data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-valor-min">Valor mínimo</Label>
          <CurrencyInput
            id="filtro-valor-min"
            valueCents={value.minCents}
            onValueChange={(cents) => onChange({ ...value, minCents: cents })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-valor-max">Valor máximo</Label>
          <CurrencyInput
            id="filtro-valor-max"
            valueCents={value.maxCents}
            onValueChange={(cents) => onChange({ ...value, maxCents: cents })}
          />
        </div>
      </div>
    </div>
  )
}
