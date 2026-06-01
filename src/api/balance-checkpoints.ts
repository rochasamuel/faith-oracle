import { supabase } from "@/lib/supabase"

const TABLE = "balance_checkpoints"

/** Marco de saldo como retornado pelo Supabase. */
export interface BalanceCheckpoint {
  id: string
  checkpoint_date: string // ISO yyyy-mm-dd
  amount: number // centavos
  notes: string | null
  created_at: string
  updated_at: string
}

/** Payload de criação/edição (upsert por data). */
export interface NewBalanceCheckpoint {
  checkpoint_date: string
  amount: number
  notes?: string | null
}

/** Lista os marcos, mais recentes primeiro. */
export async function listCheckpoints(): Promise<BalanceCheckpoint[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("checkpoint_date", { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Cria ou atualiza o marco da data (checkpoint_date é único). */
export async function upsertCheckpoint(
  payload: NewBalanceCheckpoint
): Promise<BalanceCheckpoint> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "checkpoint_date" })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Remove um marco pelo id. */
export async function deleteCheckpoint(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}

/** Marco mais recente com data <= dateISO, ou null. */
export async function getLatestCheckpointAsOf(
  dateISO: string
): Promise<BalanceCheckpoint | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .lte("checkpoint_date", dateISO)
    .order("checkpoint_date", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}
