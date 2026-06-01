import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createReconciliation,
  listReconciliations,
  type NewReconciliation,
} from "@/api/reconciliations"

const reconciliationsKey = ["reconciliations"] as const

/** Lê o histórico de conciliações. */
export function useReconciliations() {
  return useQuery({
    queryKey: reconciliationsKey,
    queryFn: listReconciliations,
  })
}

/** Cria uma conciliação e revalida conciliações + lançamentos + relatórios. */
export function useCreateReconciliation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewReconciliation) => createReconciliation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reconciliationsKey })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
    onError: (error) => {
      toast.error("Não foi possível conciliar.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
