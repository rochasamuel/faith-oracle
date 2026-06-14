import { supabase } from "@/lib/supabase"
import type {
  EbdAulaStatus,
  EbdFrequenciaStatus,
} from "@/features/ebd/constants"

// =============================================================================
// Tipos (linhas como retornadas pelo Supabase)
// =============================================================================

export interface EbdTurma {
  id: string
  org_id: string | null
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface EbdTrimestre {
  id: string
  org_id: string | null
  ano: number
  numero: number
  data_inicio: string // ISO yyyy-mm-dd
  data_fim: string // ISO yyyy-mm-dd
  created_at: string
  updated_at: string
}

/** A turma rodando num trimestre, com o trimestre embutido via join. */
export interface EbdTurmaTrimestre {
  id: string
  org_id: string | null
  turma_id: string
  trimestre_id: string
  revista_titulo: string | null
  revistas_compradas: number
  created_at: string
  updated_at: string
  trimestre: EbdTrimestre | null
}

/** Matrícula com o membro embutido (nome para exibição). */
export interface EbdMatricula {
  id: string
  org_id: string | null
  turma_trimestre_id: string
  member_id: string
  data_matricula: string // ISO yyyy-mm-dd
  ativa: boolean
  created_at: string
  updated_at: string
  member: { id: string; nome_completo: string; foto_path: string | null } | null
}

export interface EbdAula {
  id: string
  org_id: string | null
  turma_trimestre_id: string
  data: string // ISO yyyy-mm-dd
  numero_licao: number | null
  titulo_licao: string | null
  conteudo_licao: string | null
  professor: string | null
  oferta_centavos: number
  visitantes: number
  total_biblias: number
  total_revistas: number
  notes: string | null
  status: EbdAulaStatus
  total_matriculados: number
  total_presentes: number
  total_faltas: number
  total_nao_aplicavel: number
  total_assistencia: number
  closed_at: string | null
  created_at: string
  updated_at: string
}

/** Aula com o contexto (turma/trimestre) embutido, para a página do dia. */
export interface EbdAulaComContexto extends EbdAula {
  turma_trimestre: EbdTurmaTrimestre | null
}

export interface EbdFrequencia {
  id: string
  org_id: string | null
  aula_id: string
  matricula_id: string
  status: EbdFrequenciaStatus
  created_at: string
  updated_at: string
}

// =============================================================================
// Turmas
// =============================================================================

/** Lista as turmas ativas (hoje, só a Turma Principal). */
export async function listTurmas(): Promise<EbdTurma[]> {
  const { data, error } = await supabase
    .from("ebd_turmas")
    .select("*")
    .eq("ativo", true)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data ?? []
}

// =============================================================================
// Trimestres + turma_trimestres (a "espinha dorsal")
// =============================================================================

/**
 * Lista os trimestres de uma turma como linhas turma_trimestre (com o trimestre
 * embutido), das mais recentes para as mais antigas. É a base do seletor e da
 * página de Trimestre/Turma.
 */
export async function listTurmaTrimestres(
  turmaId: string
): Promise<EbdTurmaTrimestre[]> {
  const { data, error } = await supabase
    .from("ebd_turma_trimestres")
    .select("*, trimestre:ebd_trimestres(*)")
    .eq("turma_id", turmaId)

  if (error) throw error
  const rows = (data ?? []) as EbdTurmaTrimestre[]
  return rows.sort(ordenarPorTrimestreDesc)
}

function ordenarPorTrimestreDesc(
  a: EbdTurmaTrimestre,
  b: EbdTurmaTrimestre
): number {
  const ay = a.trimestre?.ano ?? 0
  const by = b.trimestre?.ano ?? 0
  if (ay !== by) return by - ay
  return (b.trimestre?.numero ?? 0) - (a.trimestre?.numero ?? 0)
}

export interface NovoTrimestre {
  turma_id: string
  ano: number
  numero: number
  data_inicio: string
  data_fim: string
  revista_titulo: string | null
  revistas_compradas: number
}

/**
 * Cria um trimestre e já vincula a turma a ele (com revista). Devolve a
 * linha turma_trimestre com o trimestre embutido.
 */
export async function createTrimestreComTurma(
  payload: NovoTrimestre
): Promise<EbdTurmaTrimestre> {
  const { data: trimestre, error: trimestreError } = await supabase
    .from("ebd_trimestres")
    .insert({
      ano: payload.ano,
      numero: payload.numero,
      data_inicio: payload.data_inicio,
      data_fim: payload.data_fim,
    })
    .select()
    .single()

  if (trimestreError) throw trimestreError

  const { data, error } = await supabase
    .from("ebd_turma_trimestres")
    .insert({
      turma_id: payload.turma_id,
      trimestre_id: trimestre.id,
      revista_titulo: payload.revista_titulo,
      revistas_compradas: payload.revistas_compradas,
    })
    .select("*, trimestre:ebd_trimestres(*)")
    .single()

  if (error) throw error
  return data as EbdTurmaTrimestre
}

export interface EditarTrimestre {
  ano: number
  numero: number
  data_inicio: string
  data_fim: string
  revista_titulo: string | null
  revistas_compradas: number
}

/** Atualiza o trimestre e os dados da turma naquele trimestre. */
export async function updateTrimestreComTurma(
  turmaTrimestreId: string,
  trimestreId: string,
  payload: EditarTrimestre
): Promise<void> {
  const { error: trimestreError } = await supabase
    .from("ebd_trimestres")
    .update({
      ano: payload.ano,
      numero: payload.numero,
      data_inicio: payload.data_inicio,
      data_fim: payload.data_fim,
    })
    .eq("id", trimestreId)

  if (trimestreError) throw trimestreError

  const { error } = await supabase
    .from("ebd_turma_trimestres")
    .update({
      revista_titulo: payload.revista_titulo,
      revistas_compradas: payload.revistas_compradas,
    })
    .eq("id", turmaTrimestreId)

  if (error) throw error
}

/** Remove o trimestre (cascateia turma_trimestre, matrículas, aulas, frequências). */
export async function deleteTrimestre(trimestreId: string): Promise<void> {
  const { error } = await supabase
    .from("ebd_trimestres")
    .delete()
    .eq("id", trimestreId)
  if (error) throw error
}

// =============================================================================
// Matrículas
// =============================================================================

/** Lista as matrículas de uma turma/trimestre, ordenadas por nome do membro. */
export async function listMatriculas(
  turmaTrimestreId: string
): Promise<EbdMatricula[]> {
  const { data, error } = await supabase
    .from("ebd_matriculas")
    .select("*, member:members(id, nome_completo, foto_path)")
    .eq("turma_trimestre_id", turmaTrimestreId)

  if (error) throw error
  const rows = (data ?? []) as EbdMatricula[]
  return rows.sort((a, b) =>
    (a.member?.nome_completo ?? "").localeCompare(
      b.member?.nome_completo ?? "",
      "pt-BR"
    )
  )
}

/** Matricula um ou mais membros (ignora quem já está matriculado). */
export async function createMatriculas(
  turmaTrimestreId: string,
  memberIds: string[],
  dataMatricula: string
): Promise<void> {
  const rows = memberIds.map((member_id) => ({
    turma_trimestre_id: turmaTrimestreId,
    member_id,
    data_matricula: dataMatricula,
  }))
  const { error } = await supabase
    .from("ebd_matriculas")
    .upsert(rows, {
      onConflict: "turma_trimestre_id,member_id",
      ignoreDuplicates: true,
    })
  if (error) throw error
}

export async function updateMatricula(
  id: string,
  payload: Partial<Pick<EbdMatricula, "data_matricula" | "ativa">>
): Promise<void> {
  const { error } = await supabase
    .from("ebd_matriculas")
    .update(payload)
    .eq("id", id)
  if (error) throw error
}

export async function deleteMatricula(id: string): Promise<void> {
  const { error } = await supabase.from("ebd_matriculas").delete().eq("id", id)
  if (error) throw error
}

// =============================================================================
// Aulas (o "dia")
// =============================================================================

/** Lista as aulas de uma turma/trimestre, mais recentes primeiro. */
export async function listAulas(turmaTrimestreId: string): Promise<EbdAula[]> {
  const { data, error } = await supabase
    .from("ebd_aulas")
    .select("*")
    .eq("turma_trimestre_id", turmaTrimestreId)
    .order("data", { ascending: false })

  if (error) throw error
  return data ?? []
}

/** Busca uma aula pelo id, com o contexto (turma/trimestre) embutido. */
export async function getAula(id: string): Promise<EbdAulaComContexto> {
  const { data, error } = await supabase
    .from("ebd_aulas")
    .select(
      "*, turma_trimestre:ebd_turma_trimestres(*, trimestre:ebd_trimestres(*))"
    )
    .eq("id", id)
    .single()

  if (error) throw error
  return data as EbdAulaComContexto
}

export interface NovaAula {
  turma_trimestre_id: string
  data: string
  numero_licao: number | null
  professor: string | null
}

/** Abre um novo dia (aula) e retorna a linha persistida. */
export async function createAula(payload: NovaAula): Promise<EbdAula> {
  const { data, error } = await supabase
    .from("ebd_aulas")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Campos editáveis da aula (métricas do dia, lição, etc.). */
export type AulaPatch = Partial<
  Pick<
    EbdAula,
    | "data"
    | "numero_licao"
    | "titulo_licao"
    | "conteudo_licao"
    | "professor"
    | "oferta_centavos"
    | "visitantes"
    | "total_biblias"
    | "total_revistas"
    | "notes"
    | "status"
    | "total_matriculados"
    | "total_presentes"
    | "total_faltas"
    | "total_nao_aplicavel"
    | "total_assistencia"
    | "closed_at"
  >
>

export async function updateAula(id: string, patch: AulaPatch): Promise<EbdAula> {
  const { data, error } = await supabase
    .from("ebd_aulas")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAula(id: string): Promise<void> {
  const { error } = await supabase.from("ebd_aulas").delete().eq("id", id)
  if (error) throw error
}

// =============================================================================
// Frequências
// =============================================================================

/** Lista a frequência registrada de uma aula. */
export async function listFrequencias(
  aulaId: string
): Promise<EbdFrequencia[]> {
  const { data, error } = await supabase
    .from("ebd_frequencias")
    .select("*")
    .eq("aula_id", aulaId)

  if (error) throw error
  return data ?? []
}

/** Marca/atualiza a presença de um aluno (upsert por aula + matrícula). */
export async function upsertFrequencia(
  aulaId: string,
  matriculaId: string,
  status: EbdFrequenciaStatus
): Promise<void> {
  const { error } = await supabase
    .from("ebd_frequencias")
    .upsert(
      { aula_id: aulaId, matricula_id: matriculaId, status },
      { onConflict: "aula_id,matricula_id" }
    )
  if (error) throw error
}

/** Grava a frequência de vários alunos de uma vez (usado em ações em lote). */
export async function upsertFrequencias(
  aulaId: string,
  rows: { matricula_id: string; status: EbdFrequenciaStatus }[]
): Promise<void> {
  if (rows.length === 0) return
  const payload = rows.map((r) => ({ aula_id: aulaId, ...r }))
  const { error } = await supabase
    .from("ebd_frequencias")
    .upsert(payload, { onConflict: "aula_id,matricula_id" })
  if (error) throw error
}
