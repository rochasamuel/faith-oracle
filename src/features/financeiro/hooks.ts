import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createTransaction,
  deleteTransaction,
  listTransactions,
} from "@/api/transactions"

const transactionsKey = ["transactions"] as const

/** Busca a listagem de lançamentos. */
export function useTransactions() {
  return useQuery({
    queryKey: transactionsKey,
    queryFn: listTransactions,
  })
}

/** Cria um lançamento e invalida a listagem. */
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKey })
      toast.success("Lançamento registrado com sucesso.")
    },
    onError: (error) => {
      toast.error("Não foi possível registrar o lançamento.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/** Remove um lançamento e invalida a listagem. */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionsKey })
      toast.success("Lançamento removido.")
    },
    onError: (error) => {
      toast.error("Não foi possível remover o lançamento.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
