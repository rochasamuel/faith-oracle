/**
 * Tipos, rótulos e cálculos do módulo EBD.
 * Espelha os enums do banco (supabase/ebd/0001_init.sql).
 */

export type EbdAulaStatus = "aberta" | "fechada"
export type EbdFrequenciaStatus = "presente" | "falta" | "nao_aplicavel"

/** Ordem fixa dos botões do controle de frequência. */
export const FREQUENCIA_STATUSES: EbdFrequenciaStatus[] = [
  "presente",
  "falta",
  "nao_aplicavel",
]

/** Rótulo curto para o botão segmentado (mobile). */
export const FREQUENCIA_LABELS_CURTO: Record<EbdFrequenciaStatus, string> = {
  presente: "Pres.",
  falta: "Falta",
  nao_aplicavel: "N/A",
}

/** Nome legível do trimestre, ex.: "1º trimestre / 2026". */
export function trimestreLabel(numero: number, ano: number): string {
  return `${numero}º trimestre / ${ano}`
}

/** Totais do dia, calculados ao vivo e gravados como snapshot ao fechar. */
export interface DayTotals {
  matriculados: number // aplicáveis na data (matriculados até o dia, ativos)
  presentes: number
  faltas: number
  naoAplicavel: number
  assistencia: number // presentes + visitantes
}

/**
 * Ao FECHAR o dia, todo aplicável sem marcação vira "falta" (não veio).
 * Usado para persistir a frequência final e calcular o snapshot.
 */
export function statusFinal(
  marcado: EbdFrequenciaStatus | undefined,
  dataMatriculaISO: string,
  dataAulaISO: string
): EbdFrequenciaStatus {
  if (dataMatriculaISO > dataAulaISO) return "nao_aplicavel"
  return marcado ?? "falta"
}

/** Conta os totais a partir de uma lista de status já resolvidos. */
export function contarTotais(
  statuses: EbdFrequenciaStatus[],
  visitantes: number
): DayTotals {
  let presentes = 0
  let faltas = 0
  let naoAplicavel = 0
  for (const s of statuses) {
    if (s === "presente") presentes++
    else if (s === "falta") faltas++
    else naoAplicavel++
  }
  return {
    matriculados: presentes + faltas,
    presentes,
    faltas,
    naoAplicavel,
    assistencia: presentes + visitantes,
  }
}
