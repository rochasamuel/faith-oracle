import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  buscarLicaoCpad,
  createAula,
  createMatriculas,
  createTrimestreComTurma,
  deleteAula,
  deleteMatricula,
  deleteTrimestre,
  getAula,
  listAulas,
  listFrequencias,
  listMatriculas,
  listTurmas,
  listTurmaTrimestres,
  updateAula,
  updateMatricula,
  updateTrimestreComTurma,
  upsertFrequencia,
  upsertFrequencias,
  type AulaPatch,
  type EbdAula,
  type EditarTrimestre,
  type NovaAula,
  type NovoTrimestre,
} from "@/api/ebd"
import type { EbdFrequenciaStatus } from "@/features/ebd/constants"

// Chaves de cache -------------------------------------------------------------
const turmasKey = ["ebd", "turmas"] as const
const turmaTrimestresKey = (turmaId: string) =>
  ["ebd", "turma-trimestres", turmaId] as const
const matriculasKey = (ttId: string) => ["ebd", "matriculas", ttId] as const
const aulasKey = (ttId: string) => ["ebd", "aulas", ttId] as const
const aulaKey = (id: string) => ["ebd", "aula", id] as const
const frequenciasKey = (aulaId: string) =>
  ["ebd", "frequencias", aulaId] as const

function errorDescription(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined
}

// Turmas ----------------------------------------------------------------------

/** Turmas ativas (hoje, apenas a Turma Principal). */
export function useTurmas() {
  return useQuery({ queryKey: turmasKey, queryFn: listTurmas })
}

// Trimestres ------------------------------------------------------------------

/** Trimestres da turma (linhas turma_trimestre com o trimestre embutido). */
export function useTurmaTrimestres(turmaId: string | undefined) {
  return useQuery({
    queryKey: turmaTrimestresKey(turmaId ?? ""),
    queryFn: () => listTurmaTrimestres(turmaId!),
    enabled: !!turmaId,
  })
}

export function useCreateTrimestre(turmaId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NovoTrimestre) => createTrimestreComTurma(payload),
    onSuccess: () => {
      if (turmaId)
        queryClient.invalidateQueries({ queryKey: turmaTrimestresKey(turmaId) })
      toast.success("Trimestre criado.")
    },
    onError: (error) =>
      toast.error("Não foi possível criar o trimestre.", {
        description: errorDescription(error),
      }),
  })
}

export function useUpdateTrimestre(turmaId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      turmaTrimestreId: string
      trimestreId: string
      payload: EditarTrimestre
    }) =>
      updateTrimestreComTurma(
        args.turmaTrimestreId,
        args.trimestreId,
        args.payload
      ),
    onSuccess: () => {
      if (turmaId)
        queryClient.invalidateQueries({ queryKey: turmaTrimestresKey(turmaId) })
      toast.success("Trimestre atualizado.")
    },
    onError: (error) =>
      toast.error("Não foi possível atualizar o trimestre.", {
        description: errorDescription(error),
      }),
  })
}

export function useDeleteTrimestre(turmaId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (trimestreId: string) => deleteTrimestre(trimestreId),
    onSuccess: () => {
      if (turmaId)
        queryClient.invalidateQueries({ queryKey: turmaTrimestresKey(turmaId) })
      toast.success("Trimestre removido.")
    },
    onError: (error) =>
      toast.error("Não foi possível remover o trimestre.", {
        description: errorDescription(error),
      }),
  })
}

// Matrículas ------------------------------------------------------------------

export function useMatriculas(turmaTrimestreId: string | undefined) {
  return useQuery({
    queryKey: matriculasKey(turmaTrimestreId ?? ""),
    queryFn: () => listMatriculas(turmaTrimestreId!),
    enabled: !!turmaTrimestreId,
  })
}

export function useCreateMatriculas(turmaTrimestreId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { memberIds: string[]; dataMatricula: string }) =>
      createMatriculas(turmaTrimestreId!, args.memberIds, args.dataMatricula),
    onSuccess: (_data, args) => {
      if (turmaTrimestreId)
        queryClient.invalidateQueries({
          queryKey: matriculasKey(turmaTrimestreId),
        })
      const n = args.memberIds.length
      toast.success(n === 1 ? "1 membro matriculado." : `${n} membros matriculados.`)
    },
    onError: (error) =>
      toast.error("Não foi possível matricular.", {
        description: errorDescription(error),
      }),
  })
}

export function useUpdateMatricula(turmaTrimestreId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      id: string
      payload: { data_matricula?: string; ativa?: boolean }
    }) => updateMatricula(args.id, args.payload),
    onSuccess: () => {
      if (turmaTrimestreId)
        queryClient.invalidateQueries({
          queryKey: matriculasKey(turmaTrimestreId),
        })
    },
    onError: (error) =>
      toast.error("Não foi possível atualizar a matrícula.", {
        description: errorDescription(error),
      }),
  })
}

export function useDeleteMatricula(turmaTrimestreId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMatricula(id),
    onSuccess: () => {
      if (turmaTrimestreId)
        queryClient.invalidateQueries({
          queryKey: matriculasKey(turmaTrimestreId),
        })
      toast.success("Matrícula removida.")
    },
    onError: (error) =>
      toast.error("Não foi possível remover a matrícula.", {
        description: errorDescription(error),
      }),
  })
}

// Aulas (o dia) ---------------------------------------------------------------

export function useAulas(turmaTrimestreId: string | undefined) {
  return useQuery({
    queryKey: aulasKey(turmaTrimestreId ?? ""),
    queryFn: () => listAulas(turmaTrimestreId!),
    enabled: !!turmaTrimestreId,
  })
}

export function useAula(id: string | undefined) {
  return useQuery({
    queryKey: aulaKey(id ?? ""),
    queryFn: () => getAula(id!),
    enabled: !!id,
  })
}

export function useCreateAula() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NovaAula) => createAula(payload),
    onSuccess: (aula) => {
      queryClient.invalidateQueries({
        queryKey: aulasKey(aula.turma_trimestre_id),
      })
      toast.success("Dia aberto.")
    },
    onError: (error) =>
      toast.error("Não foi possível abrir o dia.", {
        description: errorDescription(error),
      }),
  })
}

/** Salva métricas/lição da aula (autosave silencioso; toast só no erro). */
export function useUpdateAula() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; patch: AulaPatch }) =>
      updateAula(args.id, args.patch),
    onSuccess: (aula) => {
      queryClient.setQueryData(aulaKey(aula.id), (old: unknown) =>
        old ? { ...old, ...aula } : old
      )
      queryClient.invalidateQueries({
        queryKey: aulasKey(aula.turma_trimestre_id),
      })
    },
    onError: (error) =>
      toast.error("Não foi possível salvar.", {
        description: errorDescription(error),
      }),
  })
}

/** Busca a lição da CPAD (Edge Function). O componente persiste o resultado. */
export function useBuscarLicao() {
  return useMutation({
    mutationFn: (params: { ano: number; trimestre: number; licao: number }) =>
      buscarLicaoCpad(params),
    onError: (error) =>
      toast.error("Não foi possível buscar a lição.", {
        description: errorDescription(error),
      }),
  })
}

export function useDeleteAula() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (aula: Pick<EbdAula, "id" | "turma_trimestre_id">) =>
      deleteAula(aula.id),
    onSuccess: (_data, aula) => {
      queryClient.invalidateQueries({
        queryKey: aulasKey(aula.turma_trimestre_id),
      })
      toast.success("Dia removido.")
    },
    onError: (error) =>
      toast.error("Não foi possível remover o dia.", {
        description: errorDescription(error),
      }),
  })
}

// Frequências -----------------------------------------------------------------

export function useFrequencias(aulaId: string | undefined) {
  return useQuery({
    queryKey: frequenciasKey(aulaId ?? ""),
    queryFn: () => listFrequencias(aulaId!),
    enabled: !!aulaId,
  })
}

/** Marca a presença de um aluno (a UI mantém o estado local; aqui só persiste). */
export function useSetFrequencia() {
  return useMutation({
    mutationFn: (args: {
      aulaId: string
      matriculaId: string
      status: EbdFrequenciaStatus
    }) => upsertFrequencia(args.aulaId, args.matriculaId, args.status),
    onError: (error) =>
      toast.error("Não foi possível salvar a presença.", {
        description: errorDescription(error),
      }),
  })
}

/** Persiste a frequência de vários alunos (ex.: "marcar todos presentes"). */
export function useSetFrequencias() {
  return useMutation({
    mutationFn: (args: {
      aulaId: string
      rows: { matricula_id: string; status: EbdFrequenciaStatus }[]
    }) => upsertFrequencias(args.aulaId, args.rows),
    onError: (error) =>
      toast.error("Não foi possível salvar a frequência.", {
        description: errorDescription(error),
      }),
  })
}

export interface DaySnapshot {
  total_matriculados: number
  total_presentes: number
  total_faltas: number
  total_nao_aplicavel: number
  total_assistencia: number
}

/** Fecha o dia: persiste a frequência final, grava o snapshot e trava. */
export function useCloseDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      aulaId: string
      rows: { matricula_id: string; status: EbdFrequenciaStatus }[]
      snapshot: DaySnapshot
    }) => {
      await upsertFrequencias(args.aulaId, args.rows)
      return updateAula(args.aulaId, {
        ...args.snapshot,
        status: "fechada",
        closed_at: new Date().toISOString(),
      })
    },
    onSuccess: (aula) => {
      queryClient.invalidateQueries({ queryKey: aulaKey(aula.id) })
      queryClient.invalidateQueries({ queryKey: frequenciasKey(aula.id) })
      queryClient.invalidateQueries({
        queryKey: aulasKey(aula.turma_trimestre_id),
      })
      toast.success("Dia fechado. Relatório gerado.")
    },
    onError: (error) =>
      toast.error("Não foi possível fechar o dia.", {
        description: errorDescription(error),
      }),
  })
}

/** Reabre um dia fechado para edição. */
export function useReopenDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (aulaId: string) =>
      updateAula(aulaId, { status: "aberta", closed_at: null }),
    onSuccess: (aula) => {
      queryClient.invalidateQueries({ queryKey: aulaKey(aula.id) })
      queryClient.invalidateQueries({
        queryKey: aulasKey(aula.turma_trimestre_id),
      })
      toast.success("Dia reaberto para edição.")
    },
    onError: (error) =>
      toast.error("Não foi possível reabrir o dia.", {
        description: errorDescription(error),
      }),
  })
}
