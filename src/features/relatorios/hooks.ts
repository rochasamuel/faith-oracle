import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createReport, invalidateReport, listReports } from "@/api/reports"

const reportsKey = ["reports"] as const

/** Busca a listagem de relatórios. */
export function useReports() {
  return useQuery({
    queryKey: reportsKey,
    queryFn: listReports,
  })
}

/** Gera (cria) um relatório e invalida a listagem. */
export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKey })
      toast.success("Relatório gerado com sucesso.")
    },
    onError: (error) => {
      toast.error("Não foi possível gerar o relatório.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/** Invalida um relatório (soft delete) e invalida a listagem. */
export function useInvalidateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string | null }) =>
      invalidateReport(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKey })
      toast.success("Relatório invalidado.")
    },
    onError: (error) => {
      toast.error("Não foi possível invalidar o relatório.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
