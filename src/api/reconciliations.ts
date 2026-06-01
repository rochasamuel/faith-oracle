import { supabase } from "@/lib/supabase"
import { createTransaction, getBalanceAsOf } from "@/api/transactions"
import { reconciliationAdjustment } from "@/features/relatorios/reconciliation"

const TABLE = "reconciliations"

export interface Reconciliation {
  id: string
  reconciled_at: string // ISO yyyy-mm-dd
  informed_balance: number // centavos
  system_balance: number
  difference: number
  adjustment_transaction_id: string | null
  created_at: string
}

export interface NewReconciliation {
  reconciled_at: string
  informed_balance: number // centavos
}

/** Lista as conciliações, mais recentes primeiro. */
export async function listReconciliations(): Promise<Reconciliation[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("reconciled_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Concilia: compara saldo informado x saldo do sistema na data, cria o
 * lançamento de ajuste (quando ≠ 0) e grava o registro de conciliação.
 */
export async function createReconciliation(
  input: NewReconciliation
): Promise<Reconciliation> {
  const systemBalance = await getBalanceAsOf(input.reconciled_at)
  const difference = input.informed_balance - systemBalance

  const adjustment = reconciliationAdjustment(difference, input.reconciled_at)
  let adjustmentId: string | null = null
  if (adjustment) {
    const tx = await createTransaction(adjustment)
    adjustmentId = tx.id
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      reconciled_at: input.reconciled_at,
      informed_balance: input.informed_balance,
      system_balance: systemBalance,
      difference,
      adjustment_transaction_id: adjustmentId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
