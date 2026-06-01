/**
 * Helpers de data baseados em date-fns, com locale pt-BR.
 * O banco (Postgres/Supabase) armazena datas como ISO (yyyy-mm-dd).
 */
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

/** Converte uma string ISO yyyy-mm-dd (vinda do banco) para dd/mm/yyyy. */
export function dateISOToBR(value: string): string {
  return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR })
}

/** Formata um objeto Date como dd/mm/yyyy. */
export function formatDateBR(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

/** Converte um Date para yyyy-mm-dd (fuso local) para persistência. */
export function dateToISO(date: Date): string {
  return format(date, "yyyy-MM-dd")
}
