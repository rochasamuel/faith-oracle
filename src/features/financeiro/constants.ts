/**
 * Domínio do módulo Financeiro: tipos, categorias e seus rótulos.
 * Os valores (slugs) precisam casar com os enums definidos em supabase/schema.sql.
 */

export type TransactionType = "entrada" | "saida"

export type TransactionCategory =
  | "dizimos"
  | "ofertas"
  | "doacoes"
  | "ajuda_social"
  | "eventos"
  | "despesas_fixas"
  | "missoes"
  | "manutencao"
  | "construcao"
  | "insumos"
  | "outros"

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  entrada: "Entrada",
  saida: "Saída",
}

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  dizimos: "Dízimos",
  ofertas: "Ofertas",
  doacoes: "Doações (não identificado)",
  ajuda_social: "Ajuda social",
  eventos: "Eventos",
  despesas_fixas: "Despesas fixas",
  missoes: "Missões",
  manutencao: "Manutenção",
  construcao: "Construção",
  insumos: "Insumos",
  outros: "Outros",
}

/** Lista de categorias pronta para popular o <Select>. */
export const TRANSACTION_CATEGORIES = (
  Object.keys(TRANSACTION_CATEGORY_LABELS) as TransactionCategory[]
).map((value) => ({ value, label: TRANSACTION_CATEGORY_LABELS[value] }))
