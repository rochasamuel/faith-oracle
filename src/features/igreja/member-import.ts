/**
 * Importação em massa de membros a partir de JSON.
 *
 * Formato: array de objetos com as chaves do MODEL_JSON; apenas
 * `nome_completo` é obrigatório. Datas no formato yyyy-mm-dd, `cargo` pelo
 * nome (resolvido/criado na importação) e cpf/cep/telefone aceitos com ou
 * sem máscara (normalizados para o formato persistido).
 *
 * A validação é tudo-ou-nada: qualquer linha inválida impede a importação.
 */
import { z } from "zod"
import { isMatch } from "date-fns"

import type { MemberInput } from "@/api/members"
import {
  ESCOLARIDADE_LABELS,
  ESTADO_CIVIL_COM_CONJUGE,
  ESTADO_CIVIL_LABELS,
  UFS,
  type MemberEscolaridade,
  type MemberEstadoCivil,
} from "@/features/igreja/member-constants"
import {
  formatCEP,
  formatCPF,
  formatTelefone,
} from "@/features/igreja/member-format"

const ESTADO_CIVIL_VALUES = Object.keys(ESTADO_CIVIL_LABELS) as [
  MemberEstadoCivil,
  ...MemberEstadoCivil[],
]
const ESCOLARIDADE_VALUES = Object.keys(ESCOLARIDADE_LABELS) as [
  MemberEscolaridade,
  ...MemberEscolaridade[],
]

/** Texto opcional: aparado, limitado a `max` caracteres. */
const optionalText = (max: number) =>
  z
    .string("Deve ser um texto entre aspas.")
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .nullish()

/** Data ISO yyyy-mm-dd validada com date-fns. */
const dateSchema = z
  .string('Data inválida (use texto no formato "yyyy-mm-dd").')
  .refine(
    (value) => isMatch(value, "yyyy-MM-dd"),
    'Data inválida (use o formato "yyyy-mm-dd").'
  )

/** Booleano com mensagem em português. */
const boolSchema = z.boolean("Deve ser true ou false (sem aspas).")

/** CPF com ou sem máscara; persiste mascarado (000.000.000-00). */
const cpfSchema = z
  .string("CPF deve ser um texto entre aspas.")
  .transform((value) => value.replace(/\D/g, ""))
  .refine((d) => d.length === 11, "CPF deve ter 11 dígitos.")
  .transform(formatCPF)

/** CEP com ou sem máscara; persiste mascarado (00000-000). */
const cepSchema = z
  .string("CEP deve ser um texto entre aspas.")
  .transform((value) => value.replace(/\D/g, ""))
  .refine((d) => d.length === 8, "CEP deve ter 8 dígitos.")
  .transform(formatCEP)

/** Telefone com ou sem máscara; persiste mascarado ((00) 00000-0000). */
const telefoneSchema = z
  .string("Telefone deve ser um texto entre aspas.")
  .transform((value) => value.replace(/\D/g, ""))
  .refine(
    (d) => d.length === 10 || d.length === 11,
    "Telefone deve ter 10 ou 11 dígitos (com DDD)."
  )
  .transform(formatTelefone)

/** Linha do JSON de importação (chaves desconhecidas são erro — pega typos). */
const rowSchema = z.strictObject({
  nome_completo: z
    .string("Informe o nome completo.")
    .trim()
    .min(1, "Informe o nome completo.")
    .max(160, "Nome muito longo."),
  data_nascimento: dateSchema.nullish(),
  naturalidade: optionalText(120),
  estado_civil: z
    .enum(
      ESTADO_CIVIL_VALUES,
      `Estado civil inválido (valores: ${ESTADO_CIVIL_VALUES.join(", ")}).`
    )
    .nullish(),
  nome_conjuge: optionalText(160),
  rg: optionalText(20),
  orgao_emissor: optionalText(20),
  rg_uf: z.enum(UFS, "UF inválida (use a sigla, ex.: PE).").nullish(),
  cpf: cpfSchema.nullish(),
  nome_mae: optionalText(160),
  nome_pai: optionalText(160),
  escolaridade: z
    .enum(
      ESCOLARIDADE_VALUES,
      `Escolaridade inválida (valores: ${ESCOLARIDADE_VALUES.join(", ")}).`
    )
    .nullish(),
  profissao: optionalText(120),
  endereco: optionalText(300),
  cidade: optionalText(120),
  uf: z.enum(UFS, "UF inválida (use a sigla, ex.: PE).").nullish(),
  cep: cepSchema.nullish(),
  telefone: telefoneSchema.nullish(),
  email: z.email("E-mail inválido.").max(160, "E-mail muito longo.").nullish(),
  batizado_aguas: boolSchema.nullish(),
  batismo_aguas_data: dateSchema.nullish(),
  batismo_aguas_igreja: optionalText(160),
  batizado_espirito_santo: boolSchema.nullish(),
  data_ingresso: dateSchema.nullish(),
  cargo: optionalText(80),
  ativo: boolSchema.nullish(),
})

type ImportRow = z.infer<typeof rowSchema>

/** Linha validada: payload de insert + nome do cargo a resolver. */
export interface ParsedMemberRow {
  payload: Omit<MemberInput, "cargo_id">
  /** Nome do cargo informado no JSON (null quando ausente). */
  cargoNome: string | null
}

export type ParseMembersResult =
  | { ok: true; rows: ParsedMemberRow[] }
  | { ok: false; errors: string[] }

/** Converte uma linha validada no payload de insert (mesmas regras do form). */
function toParsedRow(row: ImportRow): ParsedMemberRow {
  const estadoCivil = row.estado_civil ?? null
  const temConjuge =
    estadoCivil !== null && ESTADO_CIVIL_COM_CONJUGE.includes(estadoCivil)
  const batizadoAguas = row.batizado_aguas ?? false

  return {
    cargoNome: row.cargo || null,
    payload: {
      nome_completo: row.nome_completo,
      foto_path: null, // foto não entra na importação via JSON
      data_nascimento: row.data_nascimento ?? null,
      naturalidade: row.naturalidade || null,
      estado_civil: estadoCivil,
      nome_conjuge: temConjuge ? row.nome_conjuge || null : null,
      rg: row.rg || null,
      orgao_emissor: row.orgao_emissor || null,
      rg_uf: row.rg_uf ?? null,
      cpf: row.cpf ?? null,
      nome_mae: row.nome_mae || null,
      nome_pai: row.nome_pai || null,
      escolaridade: row.escolaridade ?? null,
      profissao: row.profissao || null,
      endereco: row.endereco || null,
      cidade: row.cidade || null,
      uf: row.uf ?? null,
      cep: row.cep ?? null,
      telefone: row.telefone ?? null,
      email: row.email || null,
      batizado_aguas: batizadoAguas,
      batismo_aguas_data: batizadoAguas ? (row.batismo_aguas_data ?? null) : null,
      batismo_aguas_igreja: batizadoAguas
        ? row.batismo_aguas_igreja || null
        : null,
      batizado_espirito_santo: row.batizado_espirito_santo ?? false,
      data_ingresso: row.data_ingresso ?? null,
      ativo: row.ativo ?? true,
    },
  }
}

/**
 * Valida o texto JSON colado e retorna as linhas prontas para importação ou
 * a lista completa de erros (tudo-ou-nada).
 */
export function parseMembersJson(text: string): ParseMembersResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return {
      ok: false,
      errors: ["JSON inválido. Confira a sintaxe (use o modelo como base)."],
    }
  }

  if (!Array.isArray(raw)) {
    return { ok: false, errors: ["O JSON deve ser um array de membros."] }
  }
  if (raw.length === 0) {
    return { ok: false, errors: ["O array está vazio."] }
  }

  const errors: string[] = []
  const rows: ParsedMemberRow[] = []

  raw.forEach((item, index) => {
    const result = rowSchema.safeParse(item)
    if (!result.success) {
      for (const issue of result.error.issues) {
        if (issue.code === "unrecognized_keys") {
          errors.push(
            `Membro ${index + 1}: chave(s) desconhecida(s): ${issue.keys.join(", ")}. Use o modelo como base.`
          )
          continue
        }
        const campo = issue.path.join(".") || "membro"
        errors.push(`Membro ${index + 1}: ${campo} — ${issue.message}`)
      }
      return
    }
    rows.push(toParsedRow(result.data))
  })

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, rows }
}

/** Modelo de JSON exibido/copiado no diálogo de importação. */
export const MODEL_JSON = JSON.stringify(
  [
    {
      nome_completo: "Maria Souza da Silva",
      data_nascimento: "1985-03-22",
      naturalidade: "Recife - PE",
      estado_civil: "casado",
      nome_conjuge: "João da Silva",
      rg: "1234567",
      orgao_emissor: "SSP",
      rg_uf: "PE",
      cpf: "123.456.789-00",
      nome_mae: "Ana Souza",
      nome_pai: "José Souza",
      escolaridade: "medio_completo",
      profissao: "Professora",
      endereco: "Rua das Flores, 123, Centro",
      cidade: "Recife",
      uf: "PE",
      cep: "50000-000",
      telefone: "(81) 91234-5678",
      email: "maria@email.com",
      batizado_aguas: true,
      batismo_aguas_data: "2001-06-10",
      batismo_aguas_igreja: "AD Recife",
      batizado_espirito_santo: true,
      data_ingresso: "2010-01-15",
      cargo: "Diácono",
      ativo: true,
    },
  ],
  null,
  2
)
