import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  deleteCheckpoint,
  listCheckpoints,
  upsertCheckpoint,
  type NewBalanceCheckpoint,
} from "@/api/balance-checkpoints"

const checkpointsKey = ["balance-checkpoints"] as const

/** Lê todos os marcos de saldo. */
export function useBalanceCheckpoints() {
  return useQuery({
    queryKey: checkpointsKey,
    queryFn: listCheckpoints,
  })
}

/** Cria/atualiza um marco e revalida marcos + relatórios. */
export function useUpsertCheckpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NewBalanceCheckpoint) => upsertCheckpoint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkpointsKey })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Marco de saldo salvo.")
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o marco.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/** Remove um marco e revalida marcos + relatórios. */
export function useDeleteCheckpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCheckpoint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkpointsKey })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Marco removido.")
    },
    onError: (error) => {
      toast.error("Não foi possível remover o marco.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
