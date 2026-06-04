import { supabase } from "@/lib/supabase"
import type {
  MemberEscolaridade,
  MemberEstadoCivil,
} from "@/features/igreja/member-constants"

const MEMBERS_TABLE = "members"
const CARGOS_TABLE = "member_cargos"
const PHOTOS_BUCKET = "member-photos"

/** Linha de member_cargos como retornada pelo Supabase. */
export interface MemberCargo {
  id: string
  org_id: string | null
  nome: string
  created_at: string
  updated_at: string
}

/** Linha de members como retornada pelo Supabase (com cargo embutido). */
export interface Member {
  id: string
  org_id: string | null
  nome_completo: string
  foto_path: string | null // caminho no bucket member-photos
  data_nascimento: string | null // ISO yyyy-mm-dd
  naturalidade: string | null
  estado_civil: MemberEstadoCivil | null
  nome_conjuge: string | null
  rg: string | null
  orgao_emissor: string | null
  rg_uf: string | null
  cpf: string | null
  nome_mae: string | null
  nome_pai: string | null
  escolaridade: MemberEscolaridade | null
  profissao: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
  telefone: string | null
  email: string | null
  batizado_aguas: boolean
  batismo_aguas_data: string | null // ISO yyyy-mm-dd
  batismo_aguas_igreja: string | null
  batizado_espirito_santo: boolean
  data_ingresso: string | null // ISO yyyy-mm-dd
  cargo_id: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  /** Cargo embutido via join (null quando o membro não tem cargo). */
  cargo: Pick<MemberCargo, "id" | "nome"> | null
}

/** Campos editáveis de um membro (payload de insert/update). */
export type MemberInput = Omit<
  Member,
  "id" | "org_id" | "created_at" | "updated_at" | "cargo"
>

const MEMBER_SELECT = "*, cargo:member_cargos(id, nome)"

/** Lista todos os membros (ativos e inativos), em ordem alfabética. */
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from(MEMBERS_TABLE)
    .select(MEMBER_SELECT)
    .order("nome_completo", { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Busca um membro pelo id (ou null se não existir). */
export async function getMember(id: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from(MEMBERS_TABLE)
    .select(MEMBER_SELECT)
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

/** Cria um membro e retorna a linha persistida. */
export async function createMember(payload: MemberInput): Promise<Member> {
  const { data, error } = await supabase
    .from(MEMBERS_TABLE)
    .insert(payload)
    .select(MEMBER_SELECT)
    .single()
  if (error) throw error
  return data
}

/**
 * Cria vários membros em um único insert (uma instrução = tudo-ou-nada).
 * Usado na importação em massa via JSON.
 */
export async function createMembers(payloads: MemberInput[]): Promise<Member[]> {
  const { data, error } = await supabase
    .from(MEMBERS_TABLE)
    .insert(payloads)
    .select(MEMBER_SELECT)
  if (error) throw error
  return data ?? []
}

/** Atualiza um membro e retorna a linha persistida. */
export async function updateMember(
  id: string,
  payload: Partial<MemberInput>
): Promise<Member> {
  const { data, error } = await supabase
    .from(MEMBERS_TABLE)
    .update(payload)
    .eq("id", id)
    .select(MEMBER_SELECT)
    .single()
  if (error) throw error
  return data
}

/** Remove um membro permanentemente (o fluxo principal é inativar). */
export async function deleteMember(id: string): Promise<void> {
  // Lê o caminho da foto antes para limpar o storage após excluir a linha.
  const { data: row } = await supabase
    .from(MEMBERS_TABLE)
    .select("foto_path")
    .eq("id", id)
    .maybeSingle()

  const { error } = await supabase.from(MEMBERS_TABLE).delete().eq("id", id)
  if (error) throw error

  if (row?.foto_path) {
    // Limpeza best-effort: a exclusão do membro já foi concluída.
    await supabase.storage.from(PHOTOS_BUCKET).remove([row.foto_path])
  }
}

/**
 * Contagem oficial de membros: apenas ativos. Usada no relatório e na
 * página de configurações (substitui o antigo campo manual).
 */
export async function countActiveMembers(): Promise<number> {
  const { count, error } = await supabase
    .from(MEMBERS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("ativo", true)
  if (error) throw error
  return count ?? 0
}

// -----------------------------------------------------------------------------
// Fotos (Storage)
// -----------------------------------------------------------------------------

/** Envia a foto para o bucket e retorna o caminho a persistir em foto_path. */
export async function uploadMemberPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  return path
}

/** Remove uma foto do bucket (usado ao trocar/remover a foto do membro). */
export async function deleteMemberPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove([path])
  if (error) throw error
}

/** URL pública da foto a partir do caminho persistido em foto_path. */
export function getMemberPhotoUrl(path: string): string {
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl
}

// -----------------------------------------------------------------------------
// Cargos
// -----------------------------------------------------------------------------

/** Lista os cargos em ordem alfabética. */
export async function listCargos(): Promise<MemberCargo[]> {
  const { data, error } = await supabase
    .from(CARGOS_TABLE)
    .select("*")
    .order("nome", { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Cria um cargo e retorna a linha persistida. */
export async function createCargo(nome: string): Promise<MemberCargo> {
  const { data, error } = await supabase
    .from(CARGOS_TABLE)
    .insert({ nome })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Renomeia um cargo e retorna a linha persistida. */
export async function updateCargo(
  id: string,
  nome: string
): Promise<MemberCargo> {
  const { data, error } = await supabase
    .from(CARGOS_TABLE)
    .update({ nome })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Remove um cargo; membros que o usavam ficam sem cargo (FK set null). */
export async function deleteCargo(id: string): Promise<void> {
  const { error } = await supabase.from(CARGOS_TABLE).delete().eq("id", id)
  if (error) throw error
}
