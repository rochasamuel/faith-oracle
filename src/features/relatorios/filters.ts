import type { Report, ReportPeriodType, ReportStatus } from "@/api/reports"

export interface ReportFiltersState {
  status: ReportStatus | "all"
  periodType: ReportPeriodType | "all"
  year: number | "all"
}

export const EMPTY_REPORT_FILTERS: ReportFiltersState = {
  status: "all",
  periodType: "all",
  year: "all",
}

export function hasActiveReportFilters(filters: ReportFiltersState): boolean {
  return (
    filters.status !== "all" ||
    filters.periodType !== "all" ||
    filters.year !== "all"
  )
}

export function applyReportFilters(
  reports: Report[],
  filters: ReportFiltersState
): Report[] {
  return reports.filter((report) => {
    if (filters.status !== "all" && report.status !== filters.status) {
      return false
    }
    if (
      filters.periodType !== "all" &&
      report.period_type !== filters.periodType
    ) {
      return false
    }
    if (filters.year !== "all" && report.reference_year !== filters.year) {
      return false
    }
    return true
  })
}

/** Anos de referência distintos presentes nos relatórios, em ordem decrescente. */
export function availableYears(reports: Report[]): number[] {
  const years = new Set(reports.map((r) => r.reference_year))
  return [...years].sort((a, b) => b - a)
}
