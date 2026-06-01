import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getChurchInfo,
  upsertChurchInfo,
  type ChurchInfoInput,
} from "@/api/church-info"

const churchInfoKey = ["church-info"] as const

/** Lê as informações da igreja. */
export function useChurchInfo() {
  return useQuery({
    queryKey: churchInfoKey,
    queryFn: getChurchInfo,
  })
}

/** Salva as informações e revalida church-info + relatórios. */
export function useUpsertChurchInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChurchInfoInput) => upsertChurchInfo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchInfoKey })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Informações da igreja salvas.")
    },
    onError: (error) => {
      toast.error("Não foi possível salvar as informações.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
