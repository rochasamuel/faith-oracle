import * as React from "react"
import { Link } from "react-router"
import { Trash2Icon, UsersIcon } from "lucide-react"
import { parseISO } from "date-fns"

import {
  EmptyState,
  ErrorState,
  Page,
  PageHeader,
  Section,
} from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { dateISOToBR, dateToISO } from "@/lib/date"
import { trimestreLabel } from "@/features/ebd/constants"
import { MatriculaAddDialog } from "@/features/ebd/matricula-add-dialog"
import { TrimestreSelect } from "@/features/ebd/trimestre-select"
import {
  useDeleteMatricula,
  useMatriculas,
  useTurmaTrimestres,
  useTurmas,
  useUpdateMatricula,
} from "@/features/ebd/hooks"
import type { EbdMatricula, EbdTurmaTrimestre } from "@/api/ebd"

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

export default function EbdMatriculasPage() {
  const { data: turmas, isError: turmasError, error: turmasErr } = useTurmas()
  const turma = turmas?.[0]
  const {
    data: ttData,
    isError: ttError,
    error: ttErr,
  } = useTurmaTrimestres(turma?.id)
  const tts = ttData ?? []

  // Seleção derivada: a escolha manual prevalece; senão, o trimestre vigente.
  const [override, setOverride] = React.useState<string | null>(null)
  const selectedId =
    override && tts.some((tt) => tt.id === override)
      ? override
      : pickDefault(tts, dateToISO(new Date()))

  const selectedTT = tts.find((tt) => tt.id === selectedId)
  const {
    data: matriculas,
    isLoading,
    isError,
    error,
  } = useMatriculas(selectedId ?? undefined)
  const lista = matriculas ?? []
  const ativas = lista.filter((m) => m.ativa).length

  const defaultDate = selectedTT?.trimestre
    ? parseISO(selectedTT.trimestre.data_inicio)
    : undefined

  const carregandoTrimestres =
    turmas === undefined || (turma !== undefined && ttData === undefined)

  if (turmasError || ttError) {
    return (
      <Page width="narrow">
        <PageHeader title="Matrículas" />
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
        <PageHeader title="Matrículas" />
        <RowsSkeleton />
      </Page>
    )
  }

  if (tts.length === 0) {
    return (
      <Page width="narrow">
        <PageHeader title="Matrículas" />
        <EmptyState
          icon={UsersIcon}
          title="Nenhum trimestre criado"
          description="Antes de matricular alunos, cadastre o trimestre com as datas e a revista."
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

  const addDialog = selectedId ? (
    <MatriculaAddDialog
      turmaTrimestreId={selectedId}
      matriculadosIds={lista.map((m) => m.member_id)}
      defaultDate={defaultDate}
    />
  ) : null

  return (
    <Page width="narrow">
      <PageHeader
        title="Matrículas"
        folio={folio || undefined}
        description="Quem estuda na turma neste trimestre. Só os alunos com matrícula ativa entram na chamada."
        actions={addDialog}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Label htmlFor="matriculas-trimestre">Trimestre</Label>
        <TrimestreSelect
          id="matriculas-trimestre"
          items={tts}
          value={selectedId}
          onValueChange={setOverride}
        />
      </div>

      <Section
        title="Alunos"
        count={
          isLoading || isError
            ? undefined
            : `${ativas} ${ativas === 1 ? "ativo" : "ativos"}${
                lista.length > ativas ? ` de ${lista.length}` : ""
              }`
        }
      >
        {isLoading ? (
          <RowsSkeleton />
        ) : isError ? (
          <ErrorState
            title="Não foi possível carregar as matrículas."
            error={error}
          />
        ) : lista.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Nenhum aluno matriculado"
            description="Matricule os membros da igreja que vão estudar nesta turma. Eles aparecem na chamada de cada dia."
            action={addDialog}
          />
        ) : (
          <ol className="flex flex-col">
            {lista.map((m) => (
              <MatriculaRow
                key={m.id}
                matricula={m}
                turmaTrimestreId={selectedId ?? undefined}
              />
            ))}
          </ol>
        )}
      </Section>
    </Page>
  )
}

function MatriculaRow({
  matricula,
  turmaTrimestreId,
}: {
  matricula: EbdMatricula
  turmaTrimestreId: string | undefined
}) {
  const updateMatricula = useUpdateMatricula(turmaTrimestreId)
  const deleteMatricula = useDeleteMatricula(turmaTrimestreId)
  const nome = matricula.member?.nome_completo ?? "—"

  return (
    <li className="flex flex-col gap-2.5 border-b border-rule py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p
            className={
              matricula.ativa
                ? "text-[1.125rem] leading-snug font-semibold"
                : "text-[1.125rem] leading-snug font-semibold text-muted-foreground"
            }
          >
            {nome}
          </p>
          {!matricula.ativa && <Badge variant="secondary">Inativa</Badge>}
        </div>
        <p className="num font-type text-sm text-muted-foreground">
          Matriculado em {dateISOToBR(matricula.data_matricula)}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
        <label
          className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md pr-2 text-base"
        >
          <Checkbox
            checked={matricula.ativa}
            onCheckedChange={(checked) =>
              updateMatricula.mutate({
                id: matricula.id,
                payload: { ativa: checked === true },
              })
            }
          />
          Matrícula ativa
        </label>

        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon />
                Remover
                <span className="sr-only"> {nome}</span>
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remover a matrícula?</DialogTitle>
              <DialogDescription>
                {nome} sairá deste trimestre e as presenças e faltas já
                registradas para este aluno serão apagadas. Se ele só parou de
                vir, desmarque “Matrícula ativa” em vez de remover.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Voltar</Button>} />
              <Button
                variant="destructive"
                onClick={() => deleteMatricula.mutate(matricula.id)}
                disabled={deleteMatricula.isPending}
              >
                <Trash2Icon />
                {deleteMatricula.isPending
                  ? "Removendo..."
                  : "Sim, remover matrícula"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </li>
  )
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-rule py-3.5">
          <Skeleton className="h-6 w-56 max-w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  )
}
