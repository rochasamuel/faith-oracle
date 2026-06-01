import { supabase } from "@/lib/supabase"

export type ReportPeriodType = "mensal" | "anual"
export type ReportStatus = "processando" | "concluido" | "erro" | "invalidado"

/** Linha de relatório como retornada pelo Supabase. */
export interface Report {
  id: string
  title: string
  period_type: ReportPeriodType
  reference_month: number | null
  reference_year: number
  period_start: string // ISO yyyy-mm-dd
  period_end: string // ISO yyyy-mm-dd
  status: ReportStatus
  total_entradas: number
  total_saidas: number
  balance: number
  transactions_count: number
  notes: string | null
  conferred_at: string | null // ISO yyyy-mm-dd; dia da conferência (PDF). Nulo em relatórios antigos.
  invalidated_at: string | null
  invalidated_reason: string | null
  created_at: string
  updated_at: string
}

/** Payload para criação de um relatório. */
export interface NewReport {
  title: string
  period_type: ReportPeriodType
  reference_month: number | null
  reference_year: number
  period_start: string
  period_end: string
  status?: ReportStatus
  total_entradas: number
  total_saidas: number
  balance: number
  transactions_count: number
  notes?: string | null
  conferred_at?: string | null
}

const TABLE = "reports"

/** Lista todos os relatórios, mais recentes primeiro. */
export async function listReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

/** Cria um novo relatório e retorna a linha persistida. */
export async function createReport(payload: NewReport): Promise<Report> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Invalida um relatório (soft delete): marca status e registra data/motivo. */
export async function invalidateReport(
  id: string,
  reason?: string | null
): Promise<Report> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: "invalidado",
      invalidated_at: new Date().toISOString(),
      invalidated_reason: reason ?? null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}
