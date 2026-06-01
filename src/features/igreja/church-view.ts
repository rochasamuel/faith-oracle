import type { ChurchInfo } from "@/api/church-info"
import { CHURCH_INFO, type IgrejaTipoImovel } from "@/config/church"

/** Forma camelCase consumida pela página e pelo relatório. */
export interface ChurchView {
  nome: string
  cnpj: string
  pastorPresidente: string
  endereco: string
  quantidadeMembros: number
  quantidadeObreiros: number
  tipoImovel: IgrejaTipoImovel
}

/** Defaults usados como seed/fallback (a partir do const histórico). */
const DEFAULTS: ChurchView = {
  nome: CHURCH_INFO.nome,
  cnpj: CHURCH_INFO.cnpj,
  pastorPresidente: CHURCH_INFO.pastorPresidente,
  endereco: CHURCH_INFO.endereco,
  quantidadeMembros: CHURCH_INFO.quantidadeMembros,
  quantidadeObreiros: CHURCH_INFO.quantidadeObreiros,
  tipoImovel: CHURCH_INFO.tipoImovel,
}

/** Converte a linha do banco em ChurchView, caindo nos defaults quando vazio. */
export function toChurchView(db: ChurchInfo | null): ChurchView {
  if (!db) return DEFAULTS
  return {
    nome: db.nome || DEFAULTS.nome,
    cnpj: db.cnpj ?? DEFAULTS.cnpj,
    pastorPresidente: db.pastor_presidente ?? DEFAULTS.pastorPresidente,
    endereco: db.endereco ?? DEFAULTS.endereco,
    quantidadeMembros: db.quantidade_membros ?? DEFAULTS.quantidadeMembros,
    quantidadeObreiros: db.quantidade_obreiros ?? DEFAULTS.quantidadeObreiros,
    tipoImovel: db.tipo_imovel ?? DEFAULTS.tipoImovel,
  }
}
