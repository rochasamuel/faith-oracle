import type { EbdAula } from "@/api/ebd"

/**
 * Número da folha de cada dia no livro do trimestre: 1 para o primeiro dia
 * (pela data), 2 para o seguinte, e assim por diante.
 */
export function numerarFolhas(aulas: Pick<EbdAula, "id" | "data">[]): Map<string, number> {
  const ordenadas = [...aulas].sort((a, b) => a.data.localeCompare(b.data))
  return new Map(ordenadas.map((a, i) => [a.id, i + 1]))
}
