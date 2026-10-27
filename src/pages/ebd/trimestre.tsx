import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarRangeIcon, Trash2Icon } from "lucide-react"

import {
  EmptyState,
  ErrorState,
  Page,
  PageHeader,
  Section,
} from "@/components/page"
import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { dateToISO } from "@/lib/date"
import { trimestreLabel } from "@/features/ebd/constants"
import { TrimestreDialog } from "@/features/ebd/trimestre-dialog"
import { useDeleteTrimestre, useTurmaTrimestres, useTurmas } from "@/features/ebd/hooks"
import type { EbdTurmaTrimestre } from "@/api/ebd"

/** "5 de out. a 28 de dez. de 2026" (ano só no fim quando é o mesmo). */
function periodo(inicioISO: string, fimISO: string): string {
  const inicio = parseISO(inicioISO)
  const fim = parseISO(fimISO)
  const mesmoAno = format(inicio, "yyyy") === format(fim, "yyyy")
  const fmtInicio = mesmoAno ? "d 'de' MMM" : "d 'de' MMM 'de' yyyy"
  return `${format(inicio, fmtInicio, { locale: ptBR })} a ${format(
    fim,
    "d 'de' MMM 'de' yyyy",
    { locale: ptBR }
  )}`
}

export default function EbdTrimestrePage() {
  const { data: turmas, isError: turmasError, error: turmasErr } = useTurmas()
  const turma = turmas?.[0]
  const { data, isLoading, isError, error } = useTurmaTrimestres(turma?.id)
  const trimestres = data ?? []
  const todayISO = dateToISO(new Date())

  const carregando = turmas === undefined || (turma !== undefined && isLoading)

  return (
    <Page width="narrow">
      <PageHeader
        title="Trimestre e turma"
        folio={turma?.nome}
        description="O período e a revista de cada trimestre. Os dias de aula e as matrículas ficam dentro do trimestre."
        actions={<TrimestreDialog turmaId={turma?.id} />}
      />

      <Section
        title="Trimestres"
        count={
          carregando || isError || turmasError
            ? undefined
            : trimestres.length
        }
      >
        {carregando ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 border-b border-rule py-4">
                <Skeleton className="h-7 w-56 max-w-full" />
                <Skeleton className="h-5 w-72 max-w-full" />
              </div>
            ))}
          </div>
        ) : turmasError || isError ? (
          <ErrorState
            title="Não foi possível carregar os trimestres."
            error={turmasErr ?? error}
          />
        ) : trimestres.length === 0 ? (
          <EmptyState
            icon={CalendarRangeIcon}
            title="Nenhum trimestre ainda"
            description="Crie o primeiro trimestre com as datas e a revista. Depois você matricula os alunos e abre os dias de aula."
            action={<TrimestreDialog turmaId={turma?.id} />}
          />
        ) : (
          <ol className="flex flex-col">
            {trimestres.map((tt) => (
              <TrimestreRow
                key={tt.id}
                tt={tt}
                turmaId={turma?.id}
                vigente={
                  !!tt.trimestre &&
                  tt.trimestre.data_inicio <= todayISO &&
                  todayISO <= tt.trimestre.data_fim
                }
              />
            ))}
          </ol>
        )}
      </Section>
    </Page>
  )
}

function TrimestreRow({
  tt,
  turmaId,
  vigente,
}: {
  tt: EbdTurmaTrimestre
  turmaId: string | undefined
  vigente: boolean
}) {
  const deleteTrimestre = useDeleteTrimestre(turmaId)
  const label = tt.trimestre
    ? trimestreLabel(tt.trimestre.numero, tt.trimestre.ano)
    : "Trimestre"

  return (
    <li className="flex flex-col gap-3 border-b border-rule py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="num font-heading text-xl leading-snug font-semibold">
            {label}
          </p>
          {vigente && <Badge variant="success">Em andamento</Badge>}
        </div>
        {tt.trimestre && (
          <p className="num font-type text-base text-muted-foreground">
            {periodo(tt.trimestre.data_inicio, tt.trimestre.data_fim)}
          </p>
        )}
        <p className="num font-type text-base text-muted-foreground">
          {tt.revista_titulo ? (
            <>
              Revista: <span className="text-foreground">{tt.revista_titulo}</span>
            </>
          ) : (
            "Sem revista cadastrada"
          )}
          {" · "}
          {tt.revistas_compradas}{" "}
          {tt.revistas_compradas === 1 ? "revista comprada" : "revistas compradas"}
        </p>
      </div>

      <div className="flex shrink-0 gap-2.5 [&>*]:max-sm:flex-1">
        <TrimestreDialog turmaId={turmaId} editing={tt} />
        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                className="hover:border-destructive/40 hover:text-destructive"
              >
                <Trash2Icon />
                Remover
                <span className="sr-only"> {label}</span>
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remover o {label}?</DialogTitle>
              <DialogDescription>
                Isso apaga o trimestre e tudo ligado a ele: matrículas, dias de
                aula e frequências. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Voltar</Button>} />
              <Button
                variant="destructive"
                onClick={() =>
                  tt.trimestre && deleteTrimestre.mutate(tt.trimestre.id)
                }
                disabled={deleteTrimestre.isPending}
              >
                <Trash2Icon />
                {deleteTrimestre.isPending
                  ? "Removendo..."
                  : "Sim, remover tudo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </li>
  )
}
