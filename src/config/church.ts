import type { TransactionCategory } from "@/features/financeiro/constants"

export type IgrejaTipoImovel = "propria" | "alugada" | "cedida"

/** Dados institucionais usados no cabeçalho e no rodapé do relatório em PDF. */
export const CHURCH_INFO = {
  nome: "ASSEMBLEIA DE DEUS MINISTÉRIO LIVRE",
  cnpj: "59.498.194/0001-40",
  pastorPresidente: "Miguel de Jesus Rocha",
  endereco:
    "SCSV Quadra 01 Conjunto 02 Lote 02 (Setor Leste) – Cidade Estrutural – DF CEP: 71.262-110",
  quantidadeMembros: 0, // editar conforme a igreja
  quantidadeObreiros: 0, // editar conforme a igreja
  tipoImovel: "alugada" as IgrejaTipoImovel,
} as const

/**
 * Categorias agregadas (mês + categoria) no relatório.
 * As demais categorias saem lançamento por lançamento.
 */
export const AGGREGATED_CATEGORIES: TransactionCategory[] = [
  "dizimos",
  "ofertas",
  "doacoes",
]
