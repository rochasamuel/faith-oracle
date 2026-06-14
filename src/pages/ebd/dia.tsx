import * as React from "react"
import { Link, useParams } from "react-router"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeftIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { DayFrequency } from "@/features/ebd/day-frequency"
import { DayMetrics, type DayMetricsValues } from "@/features/ebd/day-metrics"
import { DaySummary } from "@/features/ebd/day-summary"
import {
  contarTotais,
  statusFinal,
  trimestreLabel,
  type EbdFrequenciaStatus,
} from "@/features/ebd/constants"
import {
  useAula,
  useCloseDay,
  useFrequencias,
  useMatriculas,
  useReopenDay,
  useSetFrequencia,
  useSetFrequencias,
  useUpdateAula,
} from "@/features/ebd/hooks"
import type {
  AulaPatch,
  EbdAulaComContexto,
  EbdFrequencia,
  EbdMatricula,
} from "@/api/ebd"

export default function EbdDiaPage() {
  const { id } = useParams()
  const { data: aula, isLoading, isError } = useAula(id)
  const { data: matriculas } = useMatriculas(aula?.turma_trimestre_id)
  const { data: frequencias } = useFrequencias(id)

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !aula) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Dia não encontrado.
          </CardContent>
        </Card>
      </div>
    )
  }

  // Espera matrículas e frequências para inicializar o editor de uma vez só.
  if (matriculas === undefined || frequencias === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <DayEditor
      key={aula.id}
      aula={aula}
      matriculas={matriculas}
      frequencias={frequencias}
    />
  )
}

function DayEditor({
  aula,
  matriculas,
  frequencias,
}: {
  aula: EbdAulaComContexto
  matriculas: EbdMatricula[]
  frequencias: EbdFrequencia[]
}) {
  const setFrequencia = useSetFrequencia()
  const setFrequencias = useSetFrequencias()
  const updateAula = useUpdateAula()
  const closeDay = useCloseDay()
  const reopenDay = useReopenDay()

  const dataAulaISO = aula.data
  const readOnly = aula.status === "fechada"
  const ativas = matriculas.filter((m) => m.ativa)

  const [statuses, setStatuses] = React.useState<
    Record<string, EbdFrequenciaStatus | undefined>
  >(() => {
    const init: Record<string, EbdFrequenciaStatus> = {}
    for (const f of frequencias) init[f.matricula_id] = f.status
    return init
  })

  const [metrics, setMetrics] = React.useState<DayMetricsValues>(() => ({
    oferta_centavos: aula.oferta_centavos,
    visitantes: aula.visitantes,
    total_biblias: aula.total_biblias,
    total_revistas: aula.total_revistas,
    numero_licao: aula.numero_licao?.toString() ?? "",
    titulo_licao: aula.titulo_licao ?? "",
    professor: aula.professor ?? "",
  }))

  function handleStatus(matriculaId: string, status: EbdFrequenciaStatus) {
    setStatuses((prev) => ({ ...prev, [matriculaId]: status }))
    setFrequencia.mutate({ aulaId: aula.id, matriculaId, status })
  }

  function handleAllPresent() {
    const aplicaveis = ativas.filter((m) => m.data_matricula <= dataAulaISO)
    setStatuses((prev) => {
      const next = { ...prev }
      for (const m of aplicaveis) next[m.id] = "presente"
      return next
    })
    setFrequencias.mutate({
      aulaId: aula.id,
      rows: aplicaveis.map((m) => ({ matricula_id: m.id, status: "presente" as const })),
    })
  }

  function commitMetric(patch: AulaPatch) {
    updateAula.mutate({ id: aula.id, patch })
  }

  function handleClose() {
    const rows = ativas.map((m) => ({
      matricula_id: m.id,
      status: statusFinal(statuses[m.id], m.data_matricula, dataAulaISO),
    }))
    setStatuses(Object.fromEntries(rows.map((r) => [r.matricula_id, r.status])))
    const totais = contarTotais(
      rows.map((r) => r.status),
      metrics.visitantes
    )
    closeDay.mutate({
      aulaId: aula.id,
      rows,
      snapshot: {
        total_matriculados: totais.matriculados,
        total_presentes: totais.presentes,
        total_faltas: totais.faltas,
        total_nao_aplicavel: totais.naoAplicavel,
        total_assistencia: totais.assistencia,
      },
    })
  }

  // Totais ao vivo (editando) ou do snapshot (fechado).
  const live = computeLive(ativas, statuses, dataAulaISO, metrics.visitantes)
  const totals = readOnly
    ? {
        matriculados: aula.total_matriculados,
        presentes: aula.total_presentes,
        faltas: aula.total_faltas,
        naoAplicavel: aula.total_nao_aplicavel,
        naoMarcados: 0,
        assistencia: aula.total_assistencia,
      }
    : live

  const contexto = aula.turma_trimestre?.trimestre
  const ofertaSummary = readOnly ? aula.oferta_centavos : metrics.oferta_centavos
  const visitantesSummary = readOnly ? aula.visitantes : metrics.visitantes
  const bibliasSummary = readOnly ? aula.total_biblias : metrics.total_biblias
  const revistasSummary = readOnly ? aula.total_revistas : metrics.total_revistas

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-2">
        <Link
          to="/ebd/dias"
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Voltar aos dias
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-heading text-lg font-medium capitalize">
            {format(parseISO(aula.data), "EEEE, dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </h1>
          <StatusBadge fechada={readOnly} />
        </div>
        <p className="text-xs text-muted-foreground">
          {contexto
            ? trimestreLabel(contexto.numero, contexto.ano)
            : "Trimestre"}
          {metrics.numero_licao && ` · Lição ${metrics.numero_licao}`}
          {metrics.professor && ` · Prof. ${metrics.professor}`}
        </p>
      </div>

      <DaySummary
        totals={totals}
        visitantes={visitantesSummary}
        biblias={bibliasSummary}
        revistas={revistasSummary}
        ofertaCentavos={ofertaSummary}
        status={aula.status}
        onClose={handleClose}
        onReopen={() => reopenDay.mutate(aula.id)}
        closing={closeDay.isPending}
        reopening={reopenDay.isPending}
      />

      <Separator />

      <DayFrequency
        matriculas={ativas}
        dataAulaISO={dataAulaISO}
        statuses={statuses}
        onChange={handleStatus}
        onAllPresent={handleAllPresent}
        readOnly={readOnly}
      />

      <Separator />

      <DayMetrics
        values={metrics}
        onLocal={(patch) => setMetrics((prev) => ({ ...prev, ...patch }))}
        onCommit={commitMetric}
        readOnly={readOnly}
      />
    </div>
  )
}

/** Totais ao vivo a partir do estado local da frequência. */
function computeLive(
  ativas: EbdMatricula[],
  statuses: Record<string, EbdFrequenciaStatus | undefined>,
  dataAulaISO: string,
  visitantes: number
) {
  const aplicaveis = ativas.filter((m) => m.data_matricula <= dataAulaISO)
  let presentes = 0
  let faltas = 0
  let naoMarcados = 0
  for (const m of aplicaveis) {
    const s = statuses[m.id]
    if (s === "presente") presentes++
    else if (s === "falta") faltas++
    else if (!s) naoMarcados++ // sem nenhum botão selecionado
  }
  return {
    matriculados: aplicaveis.length,
    presentes,
    faltas,
    naoAplicavel: ativas.length - aplicaveis.length,
    naoMarcados,
    assistencia: presentes + visitantes,
  }
}

function StatusBadge({ fechada }: { fechada: boolean }) {
  if (fechada) {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        Fechado
      </span>
    )
  }
  return (
    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
      Aberto
    </span>
  )
}
