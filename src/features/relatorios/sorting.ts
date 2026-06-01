import type { Report } from "@/api/reports"
import { REPORT_STATUS_LABELS } from "@/features/relatorios/constants"

export type ReportSortKey = "reference" | "balance" | "status" | "created_at"
export type SortDir = "asc" | "desc"

export interface ReportSortState {
  key: ReportSortKey
  dir: SortDir
}

export const DEFAULT_REPORT_SORT: ReportSortState = {
  key: "created_at",
  dir: "desc",
}

export function toggleReportSort(
  current: ReportSortState,
  key: ReportSortKey
): ReportSortState {
  if (current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" }
  }
  return { key, dir: "desc" }
}

/** Valor numérico comparável da referência (ano + mês). */
function referenceValue(report: Report): number {
  return report.reference_year * 100 + (report.reference_month ?? 0)
}

export function sortReports(
  reports: Report[],
  sort: ReportSortState
): Report[] {
  const factor = sort.dir === "asc" ? 1 : -1

  return [...reports].sort((a, b) => {
    let comparison = 0

    switch (sort.key) {
      case "reference":
        comparison = referenceValue(a) - referenceValue(b)
        break
      case "balance":
        comparison = a.balance - b.balance
        break
      case "status":
        comparison = REPORT_STATUS_LABELS[a.status].localeCompare(
          REPORT_STATUS_LABELS[b.status],
          "pt-BR"
        )
        break
      case "created_at":
        comparison = a.created_at.localeCompare(b.created_at)
        break
    }

    return comparison * factor
  })
}
