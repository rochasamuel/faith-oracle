export type MemberEstadoCivil =
  | "solteiro"
  | "casado"
  | "divorciado"
  | "viuvo"
  | "uniao_estavel"

export type MemberEscolaridade =
  | "fundamental_incompleto"
  | "fundamental_completo"
  | "medio_incompleto"
  | "medio_completo"
  | "superior_incompleto"
  | "superior_completo"
  | "pos_graduacao"

/** Rótulos exibidos para cada estado civil. */
export const ESTADO_CIVIL_LABELS: Record<MemberEstadoCivil, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  uniao_estavel: "União estável",
}

/** Lista value/label para popular selects. */
export const ESTADO_CIVIL_OPTIONS = (
  Object.keys(ESTADO_CIVIL_LABELS) as MemberEstadoCivil[]
).map((value) => ({ value, label: ESTADO_CIVIL_LABELS[value] }))

/** Estados civis em que o campo "nome do cônjuge" se aplica. */
export const ESTADO_CIVIL_COM_CONJUGE: MemberEstadoCivil[] = [
  "casado",
  "uniao_estavel",
]

/** Rótulos exibidos para cada escolaridade. */
export const ESCOLARIDADE_LABELS: Record<MemberEscolaridade, string> = {
  fundamental_incompleto: "Fundamental incompleto",
  fundamental_completo: "Fundamental completo",
  medio_incompleto: "Médio incompleto",
  medio_completo: "Médio completo",
  superior_incompleto: "Superior incompleto",
  superior_completo: "Superior completo",
  pos_graduacao: "Pós-graduação",
}

/** Lista value/label para popular selects. */
export const ESCOLARIDADE_OPTIONS = (
  Object.keys(ESCOLARIDADE_LABELS) as MemberEscolaridade[]
).map((value) => ({ value, label: ESCOLARIDADE_LABELS[value] }))

/** Siglas das unidades federativas do Brasil. */
export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const

/** Mapa value/label das UFs (Base UI Select usa um Record como items). */
export const UF_ITEMS: Record<string, string> = Object.fromEntries(
  UFS.map((uf) => [uf, uf])
)
