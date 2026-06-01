/**
 * Helpers de moeda em Real (BRL).
 *
 * Internamente o formulário trabalha com centavos (inteiro) para evitar erros
 * de ponto flutuante; ao enviar para o banco convertemos para reais (number).
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

/** Formata um valor em reais para exibição: 1234.5 -> "R$ 1.234,50". */
export function formatBRL(amountInReais: number): string {
  return brl.format(amountInReais)
}

/** Extrai apenas os dígitos de uma string e os interpreta como centavos. */
export function digitsToCents(value: string): number {
  const digits = value.replace(/\D/g, "")
  if (!digits) return 0
  return Number.parseInt(digits, 10)
}

/** Formata centavos como string monetária para o input: 123450 -> "R$ 1.234,50". */
export function formatCentsToBRL(cents: number): string {
  return brl.format(cents / 100)
}

/** Converte centavos para reais (number) para persistência: 123450 -> 1234.5. */
export function centsToReais(cents: number): number {
  return cents / 100
}
