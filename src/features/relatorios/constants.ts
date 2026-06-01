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
  concluido: "Concluído",
  erro: "Erro",
  invalidado: "Invalidado",
}

/** Classes de cor (tom claro) por status, para badges. */
export const REPORT_STATUS_CLASSES: Record<ReportStatus, string> = {
  processando:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  concluido:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  erro: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  invalidado: "border-border bg-muted text-muted-foreground",
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
