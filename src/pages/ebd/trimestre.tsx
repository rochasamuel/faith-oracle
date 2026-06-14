import {
  BookOpenIcon,
  CalendarRangeIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { dateISOToBR } from "@/lib/date"
import { trimestreLabel } from "@/features/ebd/constants"
import { TrimestreDialog } from "@/features/ebd/trimestre-dialog"
import { useDeleteTrimestre, useTurmaTrimestres, useTurmas } from "@/features/ebd/hooks"
import type { EbdTurmaTrimestre } from "@/api/ebd"

export default function EbdTrimestrePage() {
  const { data: turmas } = useTurmas()
  const turma = turmas?.[0]
  const { data, isLoading, isError, error } = useTurmaTrimestres(turma?.id)
  const trimestres = data ?? []

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-lg font-medium">Trimestre / Turma</h1>
          <p className="text-xs text-muted-foreground">
            {turma?.nome ?? "Turma"} — período, revista e tema de cada trimestre.
          </p>
        </div>
        <TrimestreDialog turmaId={turma?.id} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            Erro ao carregar trimestres
            {error instanceof Error ? `: ${error.message}` : "."}
          </CardContent>
        </Card>
      ) : trimestres.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarRangeIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nenhum trimestre ainda</p>
              <p className="text-xs text-muted-foreground">
                Crie o primeiro trimestre para começar a matricular alunos.
              </p>
            </div>
            <TrimestreDialog turmaId={turma?.id} />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {trimestres.map((tt) => (
            <TrimestreCard key={tt.id} tt={tt} turmaId={turma?.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function TrimestreCard({
  tt,
  turmaId,
}: {
  tt: EbdTurmaTrimestre
  turmaId: string | undefined
}) {
  const deleteTrimestre = useDeleteTrimestre(turmaId)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-heading text-base font-medium">
              {tt.trimestre
                ? trimestreLabel(tt.trimestre.numero, tt.trimestre.ano)
                : "Trimestre"}
            </p>
            {tt.trimestre && (
              <p className="text-xs text-muted-foreground">
                {dateISOToBR(tt.trimestre.data_inicio)} a{" "}
                {dateISOToBR(tt.trimestre.data_fim)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <TrimestreDialog turmaId={turmaId} editing={tt} />
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm">
                    <Trash2Icon />
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Remover trimestre?</DialogTitle>
                  <DialogDescription>
                    Isso apaga o trimestre e tudo ligado a ele (matrículas, dias
                    e frequências). Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline">Cancelar</Button>}
                  />
                  <Button
                    variant="destructive"
                    onClick={() =>
                      tt.trimestre && deleteTrimestre.mutate(tt.trimestre.id)
                    }
                    disabled={deleteTrimestre.isPending}
                  >
                    Remover
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpenIcon className="size-4" />
            {tt.revista_titulo || "Sem revista"}
          </span>
          {tt.tema && <span className="text-muted-foreground">Tema: {tt.tema}</span>}
          <span className="text-muted-foreground">
            Revistas compradas: <span className="tabular-nums">{tt.revistas_compradas}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
