import { supabase } from "@/lib/supabase"
import { SALDO_ABERTURA } from "@/config/church"
import type {
  TransactionCategory,
  TransactionType,
} from "@/features/financeiro/constants"

/** Linha de lançamento como retornada pelo Supabase. */
export interface Transaction {
  id: string
  type: TransactionType
  category: TransactionCategory
  amount: number
  occurred_at: string // ISO yyyy-mm-dd
  notes: string | null
  created_at: string
  updated_at: string
}

/** Payload para criação de um novo lançamento. */
export interface NewTransaction {
  type: TransactionType
  category: TransactionCategory
  amount: number
  occurred_at: string // ISO yyyy-mm-dd
  notes?: string | null
}

const TABLE = "transactions"

/** Lista todos os lançamentos, mais recentes primeiro. */
export async function listTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

/** Lista os lançamentos dentro de um intervalo de datas (ISO yyyy-mm-dd). */
export async function listTransactionsInPeriod(
  start: string,
  end: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Cria um novo lançamento e retorna a linha persistida. */
export async function createTransaction(
  payload: NewTransaction
): Promise<Transaction> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Remove um lançamento pelo id. */
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}

/**
 * Saldo (entradas − saídas) de todos os lançamentos anteriores a `dateISO`,
 * partindo do saldo de abertura (caixa anterior ao uso do sistema).
 * Usado como "saldo inicial" do relatório (= saldo final do período anterior).
 */
export async function getBalanceBefore(dateISO: string): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("type, amount")
    .lt("occurred_at", dateISO)

  if (error) throw error
  return (data ?? []).reduce(
    (sum, t) => sum + (t.type === "entrada" ? t.amount : -t.amount),
    SALDO_ABERTURA
  )
}
