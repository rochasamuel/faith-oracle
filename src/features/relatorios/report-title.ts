import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { Report } from "@/api/reports"
import { dateISOToBR } from "@/lib/date"

/**
 * Título exibido no cabeçalho do PDF:
 *   anual                                  -> "RELATÓRIO ANUAL/2026"
 *   mensal (reference_month != null)       -> "RELATÓRIO MAIO/2026"
 *   personalizado (reference_month == null)-> "RELATÓRIO 01/03/2026 – 15/04/2026"
 *
 * Não há um `period_type` "personalizado": um período personalizado é gravado
 * como `period_type: "mensal"` com `reference_month: null`. Por isso o segundo
 * ramo discrimina por `reference_month`, e não por `period_type`.
 */
export function formatReportPdfTitle(report: Report): string {
  if (report.period_type === "anual") {
    return `RELATÓRIO ANUAL/${report.reference_year}`
  }
  // mensal com mês definido -> "RELATÓRIO MAIO/2026"; mensal sem mês (custom) -> range.
  if (report.reference_month !== null) {
    const date = new Date(report.reference_year, report.reference_month - 1, 1)
    const month = format(date, "MMMM", { locale: ptBR }).toUpperCase()
    return `RELATÓRIO ${month}/${report.reference_year}`
  }
  return `RELATÓRIO ${dateISOToBR(report.period_start)} – ${dateISOToBR(
    report.period_end
  )}`
}
