import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type {
  Report,
  ReportPeriodType,
  ReportStatus,
} from "@/api/reports"

export const REPORT_PERIOD_TYPE_LABELS: Record<ReportPeriodType, string> = {
  mensal: "Mensal",
  anual: "Anual",
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  processando: "Processando",
  concluido: "Conferido",
  erro: "Erro",
  invalidado: "Invalidado",
}

/** Rótulo do período de referência: "Maio de 2026" ou "Ano de 2026". */
export function formatReferenceLabel(report: Report): string {
  if (report.period_type === "anual" || report.reference_month === null) {
    return `Ano de ${report.reference_year}`
  }
  const date = new Date(report.reference_year, report.reference_month - 1, 1)
  const label = format(date, "MMMM 'de' yyyy", { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
