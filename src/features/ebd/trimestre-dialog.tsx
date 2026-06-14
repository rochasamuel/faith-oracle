import * as React from "react"
import { parseISO } from "date-fns"
import { z } from "zod"
import { PencilIcon, PlusIcon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { dateToISO } from "@/lib/date"
import { DateField } from "@/features/ebd/date-field"
import {
  useCreateTrimestre,
  useUpdateTrimestre,
} from "@/features/ebd/hooks"
import type { EbdTurmaTrimestre } from "@/api/ebd"

const NUMERO_LABELS: Record<string, string> = {
  "1": "1º trimestre",
  "2": "2º trimestre",
  "3": "3º trimestre",
  "4": "4º trimestre",
}

const schema = z.object({
  ano: z
    .number()
    .int()
    .min(2000, "Ano inválido.")
    .max(2100, "Ano inválido."),
  numero: z.number().int().min(1).max(4),
  revista_titulo: z.string().max(200).optional(),
  tema: z.string().max(200).optional(),
  revistas_compradas: z
    .number()
    .int()
    .min(0, "Não pode ser negativo."),
})

type FieldErrors = Partial<
  Record<keyof z.infer<typeof schema> | "datas", string>
>

interface TrimestreDialogProps {
  turmaId: string | undefined
  /** Quando presente, o diálogo entra em modo de edição. */
  editing?: EbdTurmaTrimestre
}

export function TrimestreDialog({ turmaId, editing }: TrimestreDialogProps) {
  const [open, setOpen] = React.useState(false)
  const createTrimestre = useCreateTrimestre(turmaId)
  const updateTrimestre = useUpdateTrimestre(turmaId)
  const isEditing = !!editing

  const currentYear = new Date().getFullYear()
  const [ano, setAno] = React.useState(editing?.trimestre?.ano ?? currentYear)
  const [numero, setNumero] = React.useState(editing?.trimestre?.numero ?? 1)
  const [inicio, setInicio] = React.useState<Date | undefined>(
    editing?.trimestre ? parseISO(editing.trimestre.data_inicio) : undefined
  )
  const [fim, setFim] = React.useState<Date | undefined>(
    editing?.trimestre ? parseISO(editing.trimestre.data_fim) : undefined
  )
  const [revista, setRevista] = React.useState(editing?.revista_titulo ?? "")
  const [tema, setTema] = React.useState(editing?.tema ?? "")
  const [revistasCompradas, setRevistasCompradas] = React.useState(
    editing?.revistas_compradas ?? 0
  )
  const [errors, setErrors] = React.useState<FieldErrors>({})

  const isPending = createTrimestre.isPending || updateTrimestre.isPending

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!turmaId) return

    const result = schema.safeParse({
      ano,
      numero,
      revista_titulo: revista.trim() || undefined,
      tema: tema.trim() || undefined,
      revistas_compradas: revistasCompradas,
    })

    const fieldErrors: FieldErrors = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
    }
    if (!inicio || !fim) fieldErrors.datas = "Informe início e fim."
    else if (fim < inicio) fieldErrors.datas = "O fim deve ser após o início."

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const payload = {
      ano: result.data!.ano,
      numero: result.data!.numero,
      data_inicio: dateToISO(inicio!),
      data_fim: dateToISO(fim!),
      revista_titulo: result.data!.revista_titulo ?? null,
      tema: result.data!.tema ?? null,
      revistas_compradas: result.data!.revistas_compradas,
    }

    if (isEditing && editing?.trimestre) {
      updateTrimestre.mutate(
        {
          turmaTrimestreId: editing.id,
          trimestreId: editing.trimestre.id,
          payload,
        },
        { onSuccess: () => setOpen(false) }
      )
    } else {
      createTrimestre.mutate(
        { turma_id: turmaId, ...payload },
        { onSuccess: () => setOpen(false) }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEditing ? (
            <Button variant="outline" size="sm">
              <PencilIcon />
              Editar
            </Button>
          ) : (
            <Button>
              <PlusIcon />
              Novo trimestre
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar trimestre" : "Novo trimestre"}
          </DialogTitle>
          <DialogDescription>
            Período, revista e tema da turma neste trimestre.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                inputMode="numeric"
                className="h-9 text-sm"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value.replace(/\D/g, "")) || 0)}
                aria-invalid={!!errors.ano}
              />
              {errors.ano && (
                <p className="text-xs text-destructive">{errors.ano}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Trimestre</Label>
              <Select
                items={NUMERO_LABELS}
                value={String(numero)}
                onValueChange={(v) => setNumero(Number(v))}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(NUMERO_LABELS).map((n) => (
                    <SelectItem key={n} value={n}>
                      {NUMERO_LABELS[n]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Início</Label>
              <DateField value={inicio} onChange={setInicio} invalid={!!errors.datas} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fim</Label>
              <DateField value={fim} onChange={setFim} invalid={!!errors.datas} />
            </div>
          </div>
          {errors.datas && (
            <p className="-mt-3 text-xs text-destructive">{errors.datas}</p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="revista">Revista (opcional)</Label>
            <Input
              id="revista"
              className="h-9 text-sm"
              placeholder="Título da revista do trimestre"
              value={revista}
              onChange={(e) => setRevista(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tema">Tema (opcional)</Label>
            <Input
              id="tema"
              className="h-9 text-sm"
              placeholder="Tema do trimestre"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="revistas-compradas">Revistas compradas</Label>
            <Input
              id="revistas-compradas"
              inputMode="numeric"
              className="h-9 w-32 text-sm"
              value={revistasCompradas}
              onChange={(e) =>
                setRevistasCompradas(Number(e.target.value.replace(/\D/g, "")) || 0)
              }
              aria-invalid={!!errors.revistas_compradas}
            />
            {errors.revistas_compradas && (
              <p className="text-xs text-destructive">
                {errors.revistas_compradas}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar trimestre"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
