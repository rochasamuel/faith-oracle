import * as React from "react"
import { useNavigate } from "react-router"
import { parseISO } from "date-fns"
import { CalendarPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { dateToISO } from "@/lib/date"
import { DateField } from "@/features/ebd/date-field"
import { TrimestreSelect } from "@/features/ebd/trimestre-select"
import { useCreateAula } from "@/features/ebd/hooks"
import type { EbdTurmaTrimestre } from "@/api/ebd"

interface OpenDayDialogProps {
  /** Trimestres disponíveis (o último cadastrado vem pré-selecionado). */
  turmaTrimestres: EbdTurmaTrimestre[]
}

/** Trimestre cadastrado mais recentemente (maior created_at). */
function ultimoCadastrado(
  tts: EbdTurmaTrimestre[]
): EbdTurmaTrimestre | undefined {
  return tts.reduce<EbdTurmaTrimestre | undefined>(
    (acc, tt) => (!acc || tt.created_at > acc.created_at ? tt : acc),
    undefined
  )
}

function rangeOf(tt: EbdTurmaTrimestre | undefined) {
  if (!tt?.trimestre) return { min: undefined, max: undefined }
  return {
    min: parseISO(tt.trimestre.data_inicio),
    max: parseISO(tt.trimestre.data_fim),
  }
}

/** Data inicial sugerida: hoje, se cair no trimestre; senão, o início. */
function defaultDay(min?: Date, max?: Date): Date {
  const today = new Date()
  if (min && today < min) return min
  if (max && today > max) return max
  return today
}

/** Abre um dia de aula em qualquer data do trimestre (inclusive retroativa). */
export function OpenDayDialog({ turmaTrimestres }: OpenDayDialogProps) {
  const navigate = useNavigate()
  const createAula = useCreateAula()

  const [open, setOpen] = React.useState(false)
  const [trimestreId, setTrimestreId] = React.useState<string | null>(
    () => ultimoCadastrado(turmaTrimestres)?.id ?? null
  )
  const [data, setData] = React.useState<Date | undefined>(() => {
    const r = rangeOf(ultimoCadastrado(turmaTrimestres))
    return defaultDay(r.min, r.max)
  })
  const [licao, setLicao] = React.useState("")
  const [professor, setProfessor] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const selected = turmaTrimestres.find((tt) => tt.id === trimestreId)
  const { min, max } = rangeOf(selected)

  // Reinicia o formulário ao abrir, com o último trimestre cadastrado.
  function handleOpenChange(next: boolean) {
    if (next) {
      const last = ultimoCadastrado(turmaTrimestres)
      const r = rangeOf(last)
      setTrimestreId(last?.id ?? null)
      setData(defaultDay(r.min, r.max))
      setLicao("")
      setProfessor("")
      setError(null)
    }
    setOpen(next)
  }

  function handleTrimestre(id: string) {
    setTrimestreId(id)
    const r = rangeOf(turmaTrimestres.find((tt) => tt.id === id))
    setData(defaultDay(r.min, r.max))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!trimestreId) {
      setError("Selecione o trimestre.")
      return
    }
    if (!data) {
      setError("Selecione a data do dia.")
      return
    }
    createAula.mutate(
      {
        turma_trimestre_id: trimestreId,
        data: dateToISO(data),
        numero_licao: licao ? Number(licao) : null,
        professor: professor.trim() || null,
      },
      {
        onSuccess: (aula) => {
          setOpen(false)
          navigate(`/ebd/dias/${aula.id}`)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <CalendarPlusIcon />
            Abrir dia
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir dia da EBD</DialogTitle>
          <DialogDescription>
            Escolha o trimestre e a data. Você pode registrar a frequência e as
            métricas em seguida.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label>Trimestre</Label>
            <TrimestreSelect
              items={turmaTrimestres}
              value={trimestreId}
              onValueChange={handleTrimestre}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Data</Label>
            <DateField
              value={data}
              onChange={setData}
              invalid={!!error}
              min={min}
              max={max}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="licao">Nº da lição (opcional)</Label>
              <Input
                id="licao"
                inputMode="numeric"
                className="h-9 text-sm"
                value={licao}
                onChange={(e) => setLicao(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="professor">Professor (opcional)</Label>
              <Input
                id="professor"
                className="h-9 text-sm"
                placeholder="Nome do professor"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAula.isPending}>
              {createAula.isPending ? "Abrindo..." : "Abrir dia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
