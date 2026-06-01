import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ReportPeriodType, ReportStatus } from "@/api/reports"
import {
  REPORT_PERIOD_TYPE_LABELS,
  REPORT_STATUS_LABELS,
} from "@/features/relatorios/constants"
import {
  EMPTY_REPORT_FILTERS,
  hasActiveReportFilters,
  type ReportFiltersState,
} from "@/features/relatorios/filters"

const statusItems: Record<string, string> = {
  all: "Todos os status",
  ...REPORT_STATUS_LABELS,
}

const periodTypeItems: Record<string, string> = {
  all: "Todos os tipos",
  ...REPORT_PERIOD_TYPE_LABELS,
}

interface ReportFiltersProps {
  value: ReportFiltersState
  onChange: (next: ReportFiltersState) => void
  years: number[]
}

export function ReportFilters({ value, onChange, years }: ReportFiltersProps) {
  const yearItems: Record<string, string> = {
    all: "Todos os anos",
    ...Object.fromEntries(years.map((y) => [String(y), String(y)])),
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col gap-1.5">
        <Label>Status</Label>
        <Select
          items={statusItems}
          value={value.status}
          onValueChange={(next) =>
            onChange({ ...value, status: next as ReportStatus | "all" })
          }
        >
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {REPORT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tipo</Label>
        <Select
          items={periodTypeItems}
          value={value.periodType}
          onValueChange={(next) =>
            onChange({
              ...value,
              periodType: next as ReportPeriodType | "all",
            })
          }
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(Object.keys(REPORT_PERIOD_TYPE_LABELS) as ReportPeriodType[]).map(
              (t) => (
                <SelectItem key={t} value={t}>
                  {REPORT_PERIOD_TYPE_LABELS[t]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ano de referência</Label>
        <Select
          items={yearItems}
          value={value.year === "all" ? "all" : String(value.year)}
          onValueChange={(next) =>
            onChange({
              ...value,
              year: next === "all" ? "all" : Number(next),
            })
          }
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveReportFilters(value) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => onChange(EMPTY_REPORT_FILTERS)}
        >
          <XIcon />
          Limpar
        </Button>
      )}
    </div>
  )
}
