import { CHURCH_INFO } from "@/config/church"
import { useChurchInfo } from "@/features/igreja/use-church-info"

/** Nome da igreja vindo do cadastro; cai no config enquanto carrega. */
export function useChurchName(): string {
  const { data } = useChurchInfo()
  return data?.nome?.trim() || CHURCH_INFO.nome
}
