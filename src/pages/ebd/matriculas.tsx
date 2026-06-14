import * as React from "react"
import { Link } from "react-router"
import { Trash2Icon, UsersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { dateISOToBR, dateToISO } from "@/lib/date"
import { MatriculaAddDialog } from "@/features/ebd/matricula-add-dialog"
import { TrimestreSelect } from "@/features/ebd/trimestre-select"
import {
  useDeleteMatricula,
  useMatriculas,
  useTurmaTrimestres,
  useTurmas,
  useUpdateMatricula,
} from "@/features/ebd/hooks"
import { parseISO } from "date-fns"
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
  const { data: turmas } = useTurmas()
  const turma = turmas?.[0]
  const { data: ttData } = useTurmaTrimestres(turma?.id)
  const tts = ttData ?? []

  // Seleção derivada: a escolha manual prevalece; senão, o trimestre vigente.
  const [override, setOverride] = React.useState<string | null>(null)
  const selectedId =
    override && tts.some((tt) => tt.id === override)
      ? override
      : pickDefault(tts, dateToISO(new Date()))

  const selectedTT = tts.find((tt) => tt.id === selectedId)
  const { data: matriculas, isLoading } = useMatriculas(selectedId ?? undefined)
  const lista = matriculas ?? []

  const defaultDate = selectedTT?.trimestre
    ? parseISO(selectedTT.trimestre.data_inicio)
    : undefined

  if (tts.length === 0) {
    return <EmptyTrimestre />
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-lg font-medium">Matrículas</h1>
          <TrimestreSelect
            items={tts}
            value={selectedId}
            onValueChange={setOverride}
          />
        </div>
        {selectedId && (
          <MatriculaAddDialog
            turmaTrimestreId={selectedId}
            matriculadosIds={lista.map((m) => m.member_id)}
            defaultDate={defaultDate}
          />
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <UsersIcon className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum aluno matriculado</p>
            <p className="text-xs text-muted-foreground">
              Matricule membros da igreja neste trimestre.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {lista.map((m) => (
            <MatriculaRow
              key={m.id}
              matricula={m}
              turmaTrimestreId={selectedId ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
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

  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm">{matricula.member?.nome_completo ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          Matriculado em {dateISOToBR(matricula.data_matricula)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <Checkbox
            checked={matricula.ativa}
            onCheckedChange={(checked) =>
              updateMatricula.mutate({
                id: matricula.id,
                payload: { ativa: checked === true },
              })
            }
          />
          Ativa
        </label>
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <Trash2Icon />
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remover matrícula?</DialogTitle>
              <DialogDescription>
                {matricula.member?.nome_completo} sairá deste trimestre. As
                frequências já registradas para o aluno serão apagadas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancelar</Button>} />
              <Button
                variant="destructive"
                onClick={() => deleteMatricula.mutate(matricula.id)}
                disabled={deleteMatricula.isPending}
              >
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function EmptyTrimestre() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-heading text-lg font-medium">Matrículas</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhum trimestre criado</p>
          <p className="text-xs text-muted-foreground">
            Crie um trimestre antes de matricular alunos.
          </p>
          <Button render={<Link to="/ebd/trimestre" />}>Ir para Trimestre</Button>
        </CardContent>
      </Card>
    </div>
  )
}
