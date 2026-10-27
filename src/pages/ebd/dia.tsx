import * as React from "react"
import { Link, useParams } from "react-router"
import { CalendarXIcon } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

import { EmptyState, Page, PageHeader, Stamp } from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DayFrequency } from "@/features/ebd/day-frequency"
import { DayMetrics, type DayMetricsValues } from "@/features/ebd/day-metrics"
import { CloseDayButton, DaySummary } from "@/features/ebd/day-summary"
import { LessonContent } from "@/features/ebd/lesson-content"
import { numerarFolhas } from "@/features/ebd/folha"
import {
  contarTotais,
  statusFinal,
  trimestreLabel,
  type EbdFrequenciaStatus,
} from "@/features/ebd/constants"
import {
  useAula,
  useAulas,
  useCloseDay,
  useFrequencias,
  useMatriculas,
  useBuscarLicao,
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
    return <DaySkeleton />
  }

  if (isError || !aula) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={CalendarXIcon}
          title="Dia não encontrado"
          description="Ele pode ter sido apagado, ou o link está incompleto."
          action={
            <Button render={<Link to="/ebd/dias" />}>Ver os dias de aula</Button>
          }
        />
      </Page>
    )
  }

  // Espera matrículas e frequências para inicializar o editor de uma vez só.
  if (matriculas === undefined || frequencias === undefined) {
    return <DaySkeleton />
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
  const buscarLicao = useBuscarLicao()
  const { data: aulasDoTrimestre } = useAulas(aula.turma_trimestre_id)

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

  const [conteudoLicao, setConteudoLicao] = React.useState(
    aula.conteudo_licao ?? ""
  )

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

  function handleBuscarLicao() {
    const tri = aula.turma_trimestre?.trimestre
    const licao = Number(metrics.numero_licao)
    if (!tri || !licao) return
    buscarLicao.mutate(
      { ano: tri.ano, trimestre: tri.numero, licao },
      {
        onSuccess: (data) => {
          setMetrics((prev) => ({
            ...prev,
            titulo_licao: data.titulo || prev.titulo_licao,
          }))
          setConteudoLicao(data.markdown)
          updateAula.mutate({
            id: aula.id,
            patch: {
              titulo_licao: data.titulo || metrics.titulo_licao.trim() || null,
              conteudo_licao: data.markdown,
            },
          })
          toast.success("Lição importada da CPAD.")
        },
      }
    )
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

  const semana = format(parseISO(aula.data), "EEEE", { locale: ptBR }).replace("-feira", "")
  const titulo = `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${format(parseISO(aula.data), "d 'de' MMMM", { locale: ptBR })}`
  const folha = numerarFolhas(aulasDoTrimestre ?? []).get(aula.id)
  const ano = format(parseISO(aula.data), "yyyy")
  const folio = [
    folha && `Folha nº ${folha}`,
    contexto ? trimestreLabel(contexto.numero, contexto.ano) : ano,
    metrics.numero_licao && `Lição ${metrics.numero_licao}`,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <Page width="narrow">
        <PageHeader
          back={{ to: "/ebd/dias", label: "Dias de aula" }}
          title={titulo}
          folio={folio}
          status={
            readOnly ? (
              <Stamp detail={ano} animate={closeDay.isSuccess} className="ml-1" />
            ) : (
              <Badge variant="warning" className="max-sm:hidden">Aberto</Badge>
            )
          }
        />

        <DayFrequency
          matriculas={ativas}
          dataAulaISO={dataAulaISO}
          statuses={statuses}
          onChange={handleStatus}
          onAllPresent={handleAllPresent}
          readOnly={readOnly}
        />

        <DayMetrics
          values={metrics}
          onLocal={(patch) => setMetrics((prev) => ({ ...prev, ...patch }))}
          onCommit={commitMetric}
          readOnly={readOnly}
          onBuscarLicao={handleBuscarLicao}
          buscandoLicao={buscarLicao.isPending}
        />

        {conteudoLicao && <LessonContent markdown={conteudoLicao} />}

        <DaySummary
          totals={totals}
          visitantes={visitantesSummary}
          biblias={bibliasSummary}
          revistas={revistasSummary}
          ofertaCentavos={ofertaSummary}
          status={aula.status}
          onReopen={() => reopenDay.mutate(aula.id)}
          reopening={reopenDay.isPending}
        />
      </Page>

      {!readOnly && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-border bg-page/95 backdrop-blur-sm lg:bottom-0">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8">
            <p className="num flex flex-col text-base leading-snug sm:flex-row sm:gap-2" aria-live="polite">
              <span>
                <strong className="text-success">{totals.presentes} presentes</strong>
                <span className="text-muted-foreground"> · </span>
                <strong className={totals.faltas > 0 ? "text-destructive" : undefined}>
                  {totals.faltas} {totals.faltas === 1 ? "falta" : "faltas"}
                </strong>
              </span>
              {totals.naoMarcados > 0 && (
                <strong className="text-warning">{totals.naoMarcados} sem marcar</strong>
              )}
            </p>
            <CloseDayButton
              naoMarcados={totals.naoMarcados}
              onClose={handleClose}
              closing={closeDay.isPending}
              className="w-auto shrink-0"
            />
          </div>
        </div>
      )}
    </>
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

function DaySkeleton() {
  return (
    <Page width="narrow">
      <div className="flex flex-col gap-3 border-b-2 border-rule pb-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </Page>
  )
}
