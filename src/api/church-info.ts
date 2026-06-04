import { supabase } from "@/lib/supabase"
import type { IgrejaTipoImovel } from "@/config/church"

const TABLE = "church_info"

/** Linha de church_info como retornada pelo Supabase. */
export interface ChurchInfo {
  id: string
  org_id: string | null
  nome: string
  cnpj: string | null
  pastor_presidente: string | null
  endereco: string | null
  quantidade_membros: number
  quantidade_obreiros: number
  tipo_imovel: IgrejaTipoImovel
  created_at: string
  updated_at: string
}

/**
 * Campos editáveis (payload de upsert). `quantidade_membros` não é mais
 * editável: a contagem oficial vem do cadastro de membros (ver api/members).
 */
export interface ChurchInfoInput {
  nome: string
  cnpj: string | null
  pastor_presidente: string | null
  endereco: string | null
  quantidade_obreiros: number
  tipo_imovel: IgrejaTipoImovel
}

/** Lê a única linha de informações da igreja (ou null se ainda não houver). */
export async function getChurchInfo(): Promise<ChurchInfo | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

/** Cria ou atualiza a linha singleton (org_id null, conflito por org_id). */
export async function upsertChurchInfo(
  payload: ChurchInfoInput
): Promise<ChurchInfo> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ ...payload, org_id: null }, { onConflict: "org_id" })
    .select()
    .single()
  if (error) throw error
  return data
}
