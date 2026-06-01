/** Lançamento mínimo para cálculo de saldo (valores em centavos). */
export interface SignedEntry {
  type: "entrada" | "saida"
  amount: number
}

/** Soma com sinal: entradas positivas, saídas negativas (centavos). */
export function signedTotal(entries: SignedEntry[]): number {
  return entries.reduce(
    (sum, e) => sum + (e.type === "entrada" ? e.amount : -e.amount),
    0
  )
}

/** Saldo de aplicar `entries` sobre uma `base` (centavos). */
export function balanceFrom(base: number, entries: SignedEntry[]): number {
  return base + signedTotal(entries)
}
