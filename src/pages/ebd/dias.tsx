import * as React from "react"
import { Link } from "react-router"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarRangeIcon, ChevronRightIcon, Trash2Icon } from "lucide-react"

import {
  EmptyState,
  ErrorState,
  Page,
  PageHeader,
  Section,
  Stamp,
} from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { numerarFolhas } from "@/features/ebd/folha"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBRL } from "@/lib/currency"
import { dateToISO } from "@/lib/date"
import { trimestreLabel } from "@/features/ebd/constants"
import { OpenDayDialog } from "@/features/ebd/open-day-dialog"
import { TrimestreSelect } from "@/features/ebd/trimestre-select"
import {
  useAulas,
  useDeleteAula,
  useTurmaTrimestres,
  useTurmas,
} from "@/features/ebd/hooks"
import type { EbdAula, EbdTurmaTrimestre } from "@/api/ebd"

/** Trimestre vigente (contém hoje) ou, na falta, o mais recente. */
function pickDefault(tts: EbdTurmaTrimestre[], todayISO: string): string | null {
  const atual = tts.find(
    (tt) =>
      tt.trimestre &&
      tt.trimestre.data_inicio <= todayISO &&
      todayISO <= tt.trimestre.data_fim
  )
  return atual?.id ?? tts[0]?.id ?? null
}

export default function EbdDiasPage() {
  const { data: turmas, isError: turmasError, error: turmasErr } = useTurmas()
  const turma = turmas?.[0]
  const {
    data: ttData,
    isError: ttError,
    error: ttErr,
  } = useTurmaTrimestres(turma?.id)
  const tts = ttData ?? []
  const todayISO = dateToISO(new Date())

  // Seleção derivada: a escolha manual prevalece; senão, o trimestre vigente.
  const [override, setOverride] = React.useState<string | null>(null)
  const selectedId =
    override && tts.some((tt) => tt.id === override)
      ? override
      : pickDefault(tts, todayISO)
  const selectedTT = tts.find((tt) => tt.id === selectedId)

  const {
    data: aulas,
    isLoading,
    isError,
    error,
  } = useAulas(selectedId ?? undefined)
  const lista = aulas ?? []
  const folhas = numerarFolhas(lista)

  const carregandoTrimestres =
    turmas === undefined || (turma !== undefined && ttData === undefined)

  if (turmasError || ttError) {
    return (
      <Page width="narrow">
        <PageHeader title="Dias de aula" />
        <ErrorState
          title="Não foi possível carregar os trimestres."
          error={turmasErr ?? ttErr}
        />
      </Page>
    )
  }

  if (carregandoTrimestres) {
    return (
      <Page width="narrow">
        <PageHeader title="Dias de aula" />
        <RowsSkeleton />
      </Page>
    )
  }

  if (tts.length === 0) {
    return (
      <Page width="narrow">
        <PageHeader title="Dias de aula" />
        <EmptyState
          icon={CalendarRangeIcon}
          title="Nenhum trimestre criado"
          description="Antes de abrir um dia de aula, cadastre o trimestre com as datas e a revista."
          action={
            <Button render={<Link to="/ebd/trimestre" />}>Criar trimestre</Button>
          }
        />
      </Page>
    )
  }

  const folio = [
    selectedTT?.trimestre &&
      trimestreLabel(selectedTT.trimestre.numero, selectedTT.trimestre.ano),
    turma?.nome,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Page width="narrow">
      <PageHeader
        title="Dias de aula"
        folio={folio || undefined}
        description="Abra o dia para fazer a chamada e lançar os números. Toque num dia para ver ou continuar."
        actions={<OpenDayDialog turmaTrimestres={tts} />}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Label htmlFor="dias-trimestre">Trimestre</Label>
        <TrimestreSelect
          id="dias-trimestre"
          items={tts}
          value={selectedId}
          onValueChange={setOverride}
        />
      </div>

      <Section
        title="Dias registrados"
        count={
          isLoading || isError
            ? undefined
            : `${lista.length} ${lista.length === 1 ? "dia" : "dias"}`
        }
      >
        {isLoading ? (
          <RowsSkeleton />
        ) : isError ? (
          <ErrorState title="Não foi possível carregar os dias." error={error} />
        ) : lista.length === 0 ? (
          <EmptyState
            icon={CalendarRangeIcon}
            title="Nenhum dia aberto neste trimestre"
            description="Abra o dia de hoje para começar a chamada. Dá para abrir também um domingo que já passou."
            action={<OpenDayDialog turmaTrimestres={tts} />}
          />
        ) : (
          <ol className="flex flex-col">
            {lista.map((aula) => (
              <AulaRow
                key={aula.id}
                aula={aula}
                folha={folhas.get(aula.id)}
                hoje={aula.data === todayISO}
              />
            ))}
          </ol>
        )}
      </Section>
    </Page>
  )
}

function AulaRow({
  aula,
  folha,
  hoje,
}: {
  aula: EbdAula
  folha: number | undefined
  hoje: boolean
}) {
  const deleteAula = useDeleteAula()
  const fechada = aula.status === "fechada"
  const dataLonga = format(parseISO(aula.data), "d 'de' MMMM", { locale: ptBR })

  const detalhes = [
    folha && `Folha nº ${folha}`,
    hoje && "Hoje",
    aula.numero_licao != null && `Lição ${aula.numero_licao}`,
    fechada &&
      `${aula.total_presentes} de ${aula.total_matriculados} presentes`,
    fechada && `Assistência ${aula.total_assistencia}`,
    `Oferta ${formatBRL(aula.oferta_centavos)}`,
  ].filter(Boolean)

  return (
    <li className="flex items-center gap-1 border-b border-rule">
      <Link
        to={`/ebd/dias/${aula.id}`}
        className="group flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-md py-3 pr-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-heading text-xl leading-snug font-semibold first-letter:uppercase group-hover:underline">
              {format(parseISO(aula.data), "EEEE, d MMM", { locale: ptBR })}
            </p>
            {fechada ? (
              <Stamp className="origin-left scale-75" />
            ) : (
              <Badge variant="warning">Aberto</Badge>
            )}
          </div>
          <p className="num font-type text-base text-muted-foreground">
            {detalhes.join(" · ")}
          </p>
        </div>
        <ChevronRightIcon
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground"
        />
      </Link>

      <Dialog>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remover o dia ${dataLonga}`}
            >
              <Trash2Icon />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover o dia {dataLonga}?</DialogTitle>
            <DialogDescription>
              A chamada e os números deste dia serão apagados. Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Voltar</Button>} />
            <Button
              variant="destructive"
              onClick={() =>
                deleteAula.mutate({
                  id: aula.id,
                  turma_trimestre_id: aula.turma_trimestre_id,
                })
              }
              disabled={deleteAula.isPending}
            >
              <Trash2Icon />
              {deleteAula.isPending ? "Removendo..." : "Sim, remover o dia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-rule py-3.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
      ))}
    </div>
  )
}
