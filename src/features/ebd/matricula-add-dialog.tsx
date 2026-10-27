import * as React from "react"
import { PlusIcon, SearchIcon, UserPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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

  const n = selected.size

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
            Marque os membros que vão estudar nesta turma neste trimestre.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="matricula-data">Data da matrícula</Label>
          <DateField id="matricula-data" value={data} onChange={setData} />
          <p className="text-sm text-muted-foreground">
            O aluno só entra na chamada dos dias a partir desta data.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Buscar membro pelo nome"
              className="pl-11"
              placeholder="Buscar membro pelo nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[40dvh] overflow-y-auto overscroll-contain rounded-lg border border-rule">
            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border-b border-rule px-3.5 py-3 last:border-b-0">
                    <Skeleton className="h-6 w-2/3" />
                  </div>
                ))}
              </div>
            ) : disponiveis.length === 0 ? (
              <p className="px-4 py-6 text-center text-base text-muted-foreground">
                {term
                  ? `Nenhum membro com “${search.trim()}”.`
                  : "Todos os membros ativos já estão matriculados."}
              </p>
            ) : (
              disponiveis.map((m) => (
                <label
                  key={m.id}
                  className="flex min-h-13 cursor-pointer items-center gap-3.5 border-b border-rule px-3.5 py-2.5 text-[1.0625rem] transition-colors duration-150 last:border-b-0 hover:bg-accent has-data-[checked]:bg-accent/60"
                >
                  <Checkbox
                    checked={selected.has(m.id)}
                    onCheckedChange={() => toggle(m.id)}
                  />
                  <span className="min-w-0 truncate">{m.nome_completo}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="sm:items-center">
          <p className="num order-last text-base text-muted-foreground sm:order-first sm:mr-auto" aria-live="polite">
            {n === 0
              ? "Nenhum selecionado"
              : `${n} ${n === 1 ? "selecionado" : "selecionados"}`}
          </p>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={n === 0 || !data || createMatriculas.isPending}
          >
            <PlusIcon />
            {createMatriculas.isPending
              ? "Matriculando..."
              : n > 1
                ? `Matricular ${n} membros`
                : "Matricular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
