/**
 * Helpers de moeda em Real (BRL). Tudo trabalha em CENTAVOS (inteiro) para
 * evitar erros de ponto flutuante — inclusive o que é persistido no banco.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

/** Formata centavos para exibição: 123450 -> "R$ 1.234,50". */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100)
}

/** Alias histórico: idêntico a formatBRL (recebe centavos). */
export function formatCentsToBRL(cents: number): string {
  return formatBRL(cents)
}

/** Extrai apenas os dígitos de uma string e os interpreta como centavos. */
export function digitsToCents(value: string): number {
  const digits = value.replace(/\D/g, "")
  if (!digits) return 0
  return Number.parseInt(digits, 10)
}
