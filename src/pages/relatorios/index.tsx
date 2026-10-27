import * as React from "react"
import { FileBarChartIcon, SearchXIcon, XIcon } from "lucide-react"

import {
  EmptyState,
  ErrorState,
  Page,
  PageHeader,
  Section,
} from "@/components/page"
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
  DEFAULT_REPORT_FILTERS,
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
  const { data, isLoading, isError, error, refetch } = useReports()

  const [filters, setFilters] =
    React.useState<ReportFiltersState>(DEFAULT_REPORT_FILTERS)
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
    <Page width="wide">
      <PageHeader
        title="Relatórios"
        description="Relatórios financeiros gerados por período, prontos para baixar em PDF."
        actions={
          <>
            <ReconciliationDialog />
            <GenerateReportDialog />
          </>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar os relatórios."
          error={error}
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          }
        />
      ) : isEmpty ? (
        <EmptyState
          icon={FileBarChartIcon}
          title="Nenhum relatório ainda"
          description="Escolha um mês (ou um ano) e gere o primeiro relatório financeiro. O resumo é calculado a partir dos lançamentos do período."
          action={<GenerateReportDialog />}
        />
      ) : (
        <Section
          title="Relatórios gerados"
          count={
            filtersActive
              ? `${visible.length} de ${data.length}`
              : String(data.length)
          }
        >
          <ReportFilters value={filters} onChange={setFilters} years={years} />

          {visible.length === 0 ? (
            <EmptyState
              icon={SearchXIcon}
              title="Nenhum relatório com esses filtros"
              description="Mude o status, o tipo ou o ano, ou limpe os filtros para ver todos os relatórios."
              action={
                <Button
                  variant="outline"
                  onClick={() => setFilters(EMPTY_REPORT_FILTERS)}
                >
                  <XIcon />
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <ReportTable
              reports={visible}
              sort={sort}
              onToggleSort={handleToggleSort}
            />
          )}
        </Section>
      )}
    </Page>
  )
}
