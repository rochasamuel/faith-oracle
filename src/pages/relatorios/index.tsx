import * as React from "react"
import { FileBarChartIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useReports } from "@/features/relatorios/hooks"
import { GenerateReportDialog } from "@/features/relatorios/generate-report-dialog"
import { ReconciliationDialog } from "@/features/relatorios/reconciliation-dialog"
import { ReportTable } from "@/features/relatorios/report-table"
import { ReportFilters } from "@/features/relatorios/report-filters"
import {
  applyReportFilters,
  availableYears,
  EMPTY_REPORT_FILTERS,
  hasActiveReportFilters,
  type ReportFiltersState,
} from "@/features/relatorios/filters"
import {
  DEFAULT_REPORT_SORT,
  sortReports,
  toggleReportSort,
  type ReportSortKey,
  type ReportSortState,
} from "@/features/relatorios/sorting"

export default function RelatoriosPage() {
  const { data, isLoading, isError, error } = useReports()

  const [filters, setFilters] =
    React.useState<ReportFiltersState>(EMPTY_REPORT_FILTERS)
  const [sort, setSort] = React.useState<ReportSortState>(DEFAULT_REPORT_SORT)

  const years = React.useMemo(() => availableYears(data ?? []), [data])

  const visible = React.useMemo(() => {
    const list = data ?? []
    return sortReports(applyReportFilters(list, filters), sort)
  }, [data, filters, sort])

  function handleToggleSort(key: ReportSortKey) {
    setSort((current) => toggleReportSort(current, key))
  }

  const isEmpty = !data || data.length === 0
  const filtersActive = hasActiveReportFilters(filters)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-lg font-medium">Relatórios</h1>
          <p className="text-xs text-muted-foreground">
            Relatórios financeiros gerados por período.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReconciliationDialog />
          <GenerateReportDialog />
        </div>
      </div>

      {!isEmpty && (
        <ReportFilters value={filters} onChange={setFilters} years={years} />
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            Erro ao carregar relatórios
            {error instanceof Error ? `: ${error.message}` : "."}
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileBarChartIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nenhum relatório ainda</p>
              <p className="text-xs text-muted-foreground">
                Gere o primeiro relatório financeiro a partir de um período.
              </p>
            </div>
            <GenerateReportDialog />
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileBarChartIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nenhum resultado</p>
              <p className="text-xs text-muted-foreground">
                Nenhum relatório corresponde aos filtros aplicados.
              </p>
            </div>
            {filtersActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(EMPTY_REPORT_FILTERS)}
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ReportTable
          reports={visible}
          sort={sort}
          onToggleSort={handleToggleSort}
        />
      )}
    </div>
  )
}
