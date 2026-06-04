import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  countActiveMembers,
  createCargo,
  createMember,
  createMembers,
  deleteCargo,
  deleteMember,
  getMember,
  listCargos,
  listMembers,
  updateCargo,
  updateMember,
  type MemberInput,
} from "@/api/members"
import type { ParsedMemberRow } from "@/features/igreja/member-import"

const membersKey = ["members"] as const
const cargosKey = ["member-cargos"] as const

/** Lista todos os membros (ativos e inativos). */
export function useMembers() {
  return useQuery({
    queryKey: membersKey,
    queryFn: listMembers,
  })
}

/** Busca um membro pelo id (para a tela de edição). */
export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: [...membersKey, id],
    queryFn: () => getMember(id!),
    enabled: !!id,
  })
}

/**
 * Contagem oficial de membros (apenas ativos). Fonte da quantidade exibida
 * nas configurações e usada na geração do relatório.
 */
export function useMemberCount() {
  return useQuery({
    queryKey: [...membersKey, "count"],
    queryFn: countActiveMembers,
  })
}

/** Cria um membro e invalida a listagem/contagem. */
export function useCreateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MemberInput) => createMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey })
      toast.success("Membro cadastrado com sucesso.")
    },
    onError: (error) => {
      toast.error("Não foi possível cadastrar o membro.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/**
 * Importa membros em massa: resolve cargos pelo nome (case-insensitive),
 * criando os que faltam, e insere todos os membros de uma vez.
 */
export function useImportMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rows: ParsedMemberRow[]) => {
      const cargos = await listCargos()
      const cargoIdByNome = new Map(
        cargos.map((cargo) => [cargo.nome.toLocaleLowerCase("pt-BR"), cargo.id])
      )

      const payloads: MemberInput[] = []
      for (const row of rows) {
        let cargoId: string | null = null
        if (row.cargoNome) {
          const key = row.cargoNome.toLocaleLowerCase("pt-BR")
          cargoId = cargoIdByNome.get(key) ?? null
          if (!cargoId) {
            const created = await createCargo(row.cargoNome)
            cargoIdByNome.set(key, created.id)
            cargoId = created.id
          }
        }
        payloads.push({ ...row.payload, cargo_id: cargoId })
      }

      return createMembers(payloads)
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: membersKey })
      queryClient.invalidateQueries({ queryKey: cargosKey })
      toast.success(
        created.length === 1
          ? "1 membro importado."
          : `${created.length} membros importados.`
      )
    },
    onError: (error) => {
      toast.error("Não foi possível importar os membros.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/** Atualiza um membro e invalida a listagem/contagem. */
export function useUpdateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<MemberInput>
    }) => updateMember(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey })
      toast.success("Membro atualizado.")
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar o membro.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/** Remove um membro permanentemente e invalida a listagem/contagem. */
export function useDeleteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey })
      toast.success("Membro removido.")
    },
    onError: (error) => {
      toast.error("Não foi possível remover o membro.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

// -----------------------------------------------------------------------------
// Cargos
// -----------------------------------------------------------------------------

/** Lista os cargos disponíveis. */
export function useCargos() {
  return useQuery({
    queryKey: cargosKey,
    queryFn: listCargos,
  })
}

/** Invalida cargos e membros (as linhas de membro embutem o nome do cargo). */
function useInvalidateCargos() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: cargosKey })
    queryClient.invalidateQueries({ queryKey: membersKey })
  }
}

/** Cria um cargo. */
export function useCreateCargo() {
  const invalidate = useInvalidateCargos()
  return useMutation({
    mutationFn: createCargo,
    onSuccess: () => {
      invalidate()
      toast.success("Cargo criado.")
    },
    onError: (error) => {
      toast.error("Não foi possível criar o cargo.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/** Renomeia um cargo. */
export function useUpdateCargo() {
  const invalidate = useInvalidateCargos()
  return useMutation({
    mutationFn: ({ id, nome }: { id: string; nome: string }) =>
      updateCargo(id, nome),
    onSuccess: () => {
      invalidate()
      toast.success("Cargo renomeado.")
    },
    onError: (error) => {
      toast.error("Não foi possível renomear o cargo.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}

/** Remove um cargo (membros que o usavam ficam sem cargo). */
export function useDeleteCargo() {
  const invalidate = useInvalidateCargos()
  return useMutation({
    mutationFn: deleteCargo,
    onSuccess: () => {
      invalidate()
      toast.success("Cargo removido.")
    },
    onError: (error) => {
      toast.error("Não foi possível remover o cargo.", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
}
