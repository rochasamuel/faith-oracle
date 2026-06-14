import * as React from "react"
import { PlusIcon, UserPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useCreateMatriculas } from "@/features/ebd/hooks"
import { useMembers } from "@/features/igreja/use-members"

/** Normaliza texto para busca (minúsculas, sem acentos). */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

interface MatriculaAddDialogProps {
  turmaTrimestreId: string
  /** member_ids já matriculados (ficam de fora da lista). */
  matriculadosIds: string[]
  /** Data padrão da matrícula (geralmente o início do trimestre). */
  defaultDate?: Date
}

export function MatriculaAddDialog({
  turmaTrimestreId,
  matriculadosIds,
  defaultDate,
}: MatriculaAddDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { data: members, isLoading } = useMembers()
  const createMatriculas = useCreateMatriculas(turmaTrimestreId)

  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [data, setData] = React.useState<Date | undefined>(defaultDate)

  // Reinicia a seleção/data ao abrir o diálogo.
  function handleOpenChange(next: boolean) {
    if (next) {
      setSelected(new Set())
      setSearch("")
      setData(defaultDate)
    }
    setOpen(next)
  }

  const jaMatriculados = new Set(matriculadosIds)
  const term = normalize(search.trim())
  const disponiveis = (members ?? [])
    .filter((m) => m.ativo && !jaMatriculados.has(m.id))
    .filter((m) => !term || normalize(m.nome_completo).includes(term))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    if (selected.size === 0 || !data) return
    createMatriculas.mutate(
      { memberIds: [...selected], dataMatricula: dateToISO(data) },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <UserPlusIcon />
            Matricular membros
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Matricular membros</DialogTitle>
          <DialogDescription>
            Selecione os membros para matricular neste trimestre.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Data da matrícula</Label>
            <DateField value={data} onChange={setData} />
          </div>

          <Input
            className="h-9 text-sm"
            placeholder="Buscar membro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
            ) : disponiveis.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhum membro disponível para matricular.
              </p>
            ) : (
              disponiveis.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 text-sm last:border-b-0 hover:bg-accent"
                >
                  <Checkbox
                    checked={selected.has(m.id)}
                    onCheckedChange={() => toggle(m.id)}
                  />
                  <span className="truncate">{m.nome_completo}</span>
                </label>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {selected.size} selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={
                  selected.size === 0 || !data || createMatriculas.isPending
                }
              >
                <PlusIcon />
                {createMatriculas.isPending ? "Matriculando..." : "Matricular"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
