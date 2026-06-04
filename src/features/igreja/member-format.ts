/**
 * Máscaras leves de exibição/digitação para documentos e contato.
 * Os valores são persistidos já mascarados (colunas text).
 */

/** Mantém apenas dígitos, limitado a `max` caracteres. */
function digits(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max)
}

/** 000.000.000-00 */
export function formatCPF(value: string): string {
  const d = digits(value, 11)
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
}

/** 00000-000 */
export function formatCEP(value: string): string {
  const d = digits(value, 8)
  return d.replace(/(\d{5})(\d)/, "$1-$2")
}

/** (00) 0000-0000 ou (00) 00000-0000 */
export function formatTelefone(value: string): string {
  const d = digits(value, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
