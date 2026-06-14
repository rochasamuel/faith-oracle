import * as React from "react"
import { Link } from "react-router"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarRangeIcon, Trash2Icon } from "lucide-react"

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
import { formatBRL } from "@/lib/currency"
import { dateToISO } from "@/lib/date"
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

  const { data: aulas, isLoading } = useAulas(selectedId ?? undefined)
  const lista = aulas ?? []

  if (tts.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
        <h1 className="font-heading text-lg font-medium">Dias da EBD</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarRangeIcon className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum trimestre criado</p>
            <p className="text-xs text-muted-foreground">
              Crie um trimestre antes de abrir os dias de aula.
            </p>
            <Button render={<Link to="/ebd/trimestre" />}>Ir para Trimestre</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-lg font-medium">Dias da EBD</h1>
          <TrimestreSelect
            items={tts}
            value={selectedId}
            onValueChange={setOverride}
          />
        </div>
        <OpenDayDialog turmaTrimestres={tts} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarRangeIcon className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum dia aberto ainda</p>
            <p className="text-xs text-muted-foreground">
              Abra um dia para registrar a frequência e as métricas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((aula) => (
            <AulaCard key={aula.id} aula={aula} />
          ))}
        </div>
      )}
    </div>
  )
}

function AulaCard({ aula }: { aula: EbdAula }) {
  const deleteAula = useDeleteAula()
  const fechada = aula.status === "fechada"

  return (
    <Card className="relative">
      <Link to={`/ebd/dias/${aula.id}`} className="block p-4 pr-12">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-sm font-medium capitalize">
            {format(parseISO(aula.data), "EEEE, dd/MM/yyyy", { locale: ptBR })}
          </p>
          <span
            className={
              fechada
                ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                : "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"
            }
          >
            {fechada ? "Fechado" : "Aberto"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          {aula.numero_licao != null && <span>Lição {aula.numero_licao}</span>}
          {fechada && (
            <span>
              Presentes {aula.total_presentes}/{aula.total_matriculados} ·
              Assistência {aula.total_assistencia}
            </span>
          )}
          <span>Oferta {formatBRL(aula.oferta_centavos)}</span>
        </div>
      </Link>

      <div className="absolute top-2 right-2">
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
              <DialogTitle>Remover este dia?</DialogTitle>
              <DialogDescription>
                A frequência e as métricas deste dia serão apagadas. Esta ação
                não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancelar</Button>} />
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
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  )
}
