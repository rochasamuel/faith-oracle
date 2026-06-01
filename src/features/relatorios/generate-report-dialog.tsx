import * as React from "react"
import { type DateRange } from "react-day-picker"
import { endOfMonth, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, FilePlus2Icon, Loader2Icon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { dateToISO, formatDateBR } from "@/lib/date"
import { listTransactionsInPeriod } from "@/api/transactions"
import type { ReportPeriodType } from "@/api/reports"
import { REPORT_PERIOD_TYPE_LABELS } from "@/features/relatorios/constants"
import { useCreateReport } from "@/features/relatorios/hooks"

const periodTypeItems: Record<string, string> = REPORT_PERIOD_TYPE_LABELS

interface ReportPeriod {
  title: string
  referenceMonth: number | null
  referenceYear: number
  start: string
  end: string
}

/** Lista de anos para o seletor anual: do próximo ano até 10 anos atrás. */
function buildYearOptions(): number[] {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let y = current + 1; y >= current - 10; y--) {
    years.push(y)
  }
  return years
}

export function GenerateReportDialog() {
  const createReport = useCreateReport()

  const [open, setOpen] = React.useState(false)
  const [periodType, setPeriodType] =
    React.useState<ReportPeriodType>("mensal")
  const [range, setRange] = React.useState<DateRange | undefined>(undefined)
  const [year, setYear] = React.useState<number | null>(null)
  const [dateOpen, setDateOpen] = React.useState(false)
  const [notes, setNotes] = React.useState("")
  const [periodError, setPeriodError] = React.useState<string | null>(null)
  const [month, setMonth] = React.useState<number | null>(null)
  const [customPeriod, setCustomPeriod] = React.useState(false)
  const [computing, setComputing] = React.useState(false)
  const [conferredAt, setConferredAt] = React.useState<Date | undefined>(
    new Date()
  )
  const [conferredAtOpen, setConferredAtOpen] = React.useState(false)

  const yearOptions = React.useMemo(() => buildYearOptions(), [])
  const monthOptions = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const label = format(new Date(2000, i, 1), "MMMM", { locale: ptBR })
        return { value: i + 1, label: label.charAt(0).toUpperCase() + label.slice(1) }
      }),
    []
  )
  const isBusy = computing || createReport.isPending

  function reset() {
    setPeriodType("mensal")
    setRange(undefined)
    setYear(null)
    setMonth(null)
    setCustomPeriod(false)
    setNotes("")
    setPeriodError(null)
    setConferredAt(new Date())
  }

  /** Valida e resolve o período conforme o tipo de relatório. */
  function resolvePeriod(): ReportPeriod | null {
    if (periodType === "anual") {
      if (year === null) {
        setPeriodError("Selecione o ano.")
        return null
      }
      return {
        title: `Relatório Anual — ${year}`,
        referenceMonth: null,
        referenceYear: year,
        start: `${year}-01-01`,
        end: `${year}-12-31`,
      }
    }

    if (customPeriod) {
      if (!range?.from || !range?.to) {
        setPeriodError("Selecione o período (início e fim).")
        return null
      }
      return {
        title: `Relatório ${formatDateBR(range.from)} – ${formatDateBR(range.to)}`,
        referenceMonth: null,
        referenceYear: range.from.getFullYear(),
        start: dateToISO(range.from),
        end: dateToISO(range.to),
      }
    }

    if (month === null || year === null) {
      setPeriodError("Selecione o mês e o ano.")
      return null
    }
    const monthStart = new Date(year, month - 1, 1)
    const monthLabel = format(monthStart, "MMMM 'de' yyyy", { locale: ptBR })
    return {
      title: `Relatório Mensal — ${
        monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)
      }`,
      referenceMonth: month,
      referenceYear: year,
      start: dateToISO(monthStart),
      end: dateToISO(endOfMonth(monthStart)),
    }
  }

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault()

    const period = resolvePeriod()
    if (!period) return
    if (!conferredAt) {
      setPeriodError("Selecione a data de conferência.")
      return
    }
    setPeriodError(null)

    setComputing(true)
    try {
      const transactions = await listTransactionsInPeriod(
        period.start,
        period.end
      )
      const totalEntradas = transactions
        .filter((t) => t.type === "entrada")
        .reduce((sum, t) => sum + t.amount, 0)
      const totalSaidas = transactions
        .filter((t) => t.type === "saida")
        .reduce((sum, t) => sum + t.amount, 0)

      createReport.mutate(
        {
          title: period.title,
          period_type: periodType,
          reference_month: period.referenceMonth,
          reference_year: period.referenceYear,
          period_start: period.start,
          period_end: period.end,
          status: "concluido",
          total_entradas: totalEntradas,
          total_saidas: totalSaidas,
          balance: totalEntradas - totalSaidas,
          transactions_count: transactions.length,
          notes: notes.trim() || null,
          conferred_at: dateToISO(conferredAt),
        },
        {
          onSuccess: () => {
            reset()
            setOpen(false)
          },
        }
      )
    } finally {
      setComputing(false)
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
      <DialogTrigger render={<Button />}>
        <FilePlus2Icon />
        Gerar relatório
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar relatório</DialogTitle>
          <DialogDescription>
            Escolha o período a ser apurado. O resumo financeiro é calculado a
            partir dos lançamentos do intervalo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerate} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label>Tipo de relatório</Label>
            <Select
              items={periodTypeItems}
              value={periodType}
              onValueChange={(value) => {
                setPeriodType(value as ReportPeriodType)
                setPeriodError(null)
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {periodType === "anual" ? (
            <div className="flex flex-col gap-2">
              <Label>Ano de referência</Label>
              <Select
                items={Object.fromEntries(
                  yearOptions.map((y) => [String(y), String(y)])
                )}
                value={year === null ? "" : String(year)}
                onValueChange={(value) => {
                  setYear(Number(value))
                  setPeriodError(null)
                }}
              >
                <SelectTrigger
                  className="h-9 w-full"
                  aria-invalid={!!periodError}
                >
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {periodError && (
                <p className="text-xs text-destructive">{periodError}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={customPeriod}
                  onCheckedChange={(checked) => {
                    setCustomPeriod(checked)
                    setPeriodError(null)
                  }}
                />
                Período personalizado
              </Label>

              {customPeriod ? (
                <div className="flex flex-col gap-2">
                  <Label>Período de apuração</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          aria-invalid={!!periodError}
                          className={cn(
                            "h-9 w-full justify-start gap-2 font-normal",
                            !range?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="size-4" />
                          {range?.from ? (
                            range.to ? (
                              <>
                                {formatDateBR(range.from)} – {formatDateBR(range.to)}
                              </>
                            ) : (
                              formatDateBR(range.from)
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
                        defaultMonth={range?.from}
                        selected={range}
                        onSelect={setRange}
                        locale={ptBR}
                        numberOfMonths={2}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Mês</Label>
                    <Select
                      items={Object.fromEntries(
                        monthOptions.map((m) => [String(m.value), m.label])
                      )}
                      value={month === null ? "" : String(month)}
                      onValueChange={(value) => {
                        setMonth(Number(value))
                        setPeriodError(null)
                      }}
                    >
                      <SelectTrigger className="h-9 w-full" aria-invalid={!!periodError}>
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>Ano</Label>
                    <Select
                      items={Object.fromEntries(
                        yearOptions.map((y) => [String(y), String(y)])
                      )}
                      value={year === null ? "" : String(year)}
                      onValueChange={(value) => {
                        setYear(Number(value))
                        setPeriodError(null)
                      }}
                    >
                      <SelectTrigger className="h-9 w-full" aria-invalid={!!periodError}>
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {periodError && (
                <p className="text-xs text-destructive">{periodError}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Data de conferência</Label>
            <Popover open={conferredAtOpen} onOpenChange={setConferredAtOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    aria-invalid={!conferredAt && !!periodError}
                    className={cn(
                      "h-9 w-full justify-start gap-2 font-normal",
                      !conferredAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {conferredAt
                      ? formatDateBR(conferredAt)
                      : "Selecione uma data"}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={conferredAt}
                  onSelect={(value) => {
                    setConferredAt(value)
                    setConferredAtOpen(false)
                    setPeriodError(null)
                  }}
                  locale={ptBR}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            {!conferredAt && periodError && (
              <p className="text-xs text-destructive">{periodError}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="report-notes">Observação (opcional)</Label>
            <Textarea
              id="report-notes"
              placeholder="Anotações sobre este relatório..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isBusy}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy && <Loader2Icon className="animate-spin" />}
              {isBusy ? "Gerando..." : "Gerar relatório"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
