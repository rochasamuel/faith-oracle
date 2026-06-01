import { supabase } from "@/lib/supabase"
import { getLatestCheckpointAsOf } from "@/api/balance-checkpoints"
import { balanceFrom } from "@/features/financeiro/balance"
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
 * Saldo no INÍCIO de `dateISO` (exclusivo): base do marco mais recente
 * (<= data) + lançamentos da data do marco até `dateISO` (exclusivo).
 * Sem marco anterior, base = 0. É o "saldo inicial" do relatório.
 */
export async function getBalanceBefore(dateISO: string): Promise<number> {
  return balanceUpTo(dateISO, false)
}

/**
 * Saldo ao FIM de `dateISO` (inclusive): inclui os lançamentos do próprio dia.
 * Usado na conciliação (comparar com o saldo informado do banco na data).
 */
export async function getBalanceAsOf(dateISO: string): Promise<number> {
  return balanceUpTo(dateISO, true)
}

/** Núcleo: base do marco + soma dos lançamentos até `dateISO` (centavos). */
async function balanceUpTo(dateISO: string, inclusive: boolean): Promise<number> {
  const checkpoint = await getLatestCheckpointAsOf(dateISO)
  const base = checkpoint?.amount ?? 0

  let q = supabase.from(TABLE).select("type, amount")
  if (checkpoint) q = q.gte("occurred_at", checkpoint.checkpoint_date)
  q = inclusive ? q.lte("occurred_at", dateISO) : q.lt("occurred_at", dateISO)

  const { data, error } = await q
  if (error) throw error
  return balanceFrom(base, data ?? [])
}
