import type { NewTransaction } from "@/api/transactions"

const NOTE = "Ajuste de conciliação"

/**
 * Lançamento de ajuste para a diferença (saldoInformado - saldoSistema), em centavos:
 * - positiva → entrada em "doacoes" (PIX/doação não lançado);
 * - negativa → saída em "outros";
 * - zero → null (nada a lançar).
 */
export function reconciliationAdjustment(
  difference: number,
  occurredAt: string
): NewTransaction | null {
  if (difference === 0) return null
  if (difference > 0) {
    return {
      type: "entrada",
      category: "doacoes",
      amount: difference,
      occurred_at: occurredAt,
      notes: NOTE,
    }
  }
  return {
    type: "saida",
    category: "outros",
    amount: -difference,
    occurred_at: occurredAt,
    notes: NOTE,
  }
}
