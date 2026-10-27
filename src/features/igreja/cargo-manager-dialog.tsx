import * as React from "react"
import {
  BriefcaseIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import type { MemberCargo } from "@/api/members"
import {
  useCargos,
  useCreateCargo,
  useDeleteCargo,
  useUpdateCargo,
} from "@/features/igreja/use-members"

/** Linha pautada: exibição com ações ou edição do nome no lugar. */
function CargoRow({ cargo }: { cargo: MemberCargo }) {
  const updateCargo = useUpdateCargo()
  const deleteCargo = useDeleteCargo()
  const [editing, setEditing] = React.useState(false)
  const [nome, setNome] = React.useState(cargo.nome)

  function handleSave() {
    const trimmed = nome.trim()
    if (!trimmed || trimmed === cargo.nome) {
      setEditing(false)
      setNome(cargo.nome)
      return
    }
    updateCargo.mutate(
      { id: cargo.id, nome: trimmed },
      { onSuccess: () => setEditing(false) }
    )
  }

  function handleCancel() {
    setEditing(false)
    setNome(cargo.nome)
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 border-b border-rule py-2.5">
        <Input
          aria-label={`Novo nome para o cargo ${cargo.nome}`}
          value={nome}
          autoFocus
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSave()
            }
            if (e.key === "Escape") handleCancel()
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Salvar nome do cargo"
          disabled={updateCargo.isPending}
          onClick={handleSave}
        >
          <CheckIcon className="text-success" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cancelar edição"
          onClick={handleCancel}
        >
          <XIcon className="text-muted-foreground" />
        </Button>
      </li>
    )
  }

  return (
    <li className="flex min-h-14 items-center justify-between gap-2 border-b border-rule py-1.5">
      <span className="text-base font-semibold">{cargo.nome}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Renomear cargo ${cargo.nome}`}
          onClick={() => setEditing(true)}
        >
          <PencilIcon className="text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remover cargo ${cargo.nome}`}
          disabled={deleteCargo.isPending}
          onClick={() => deleteCargo.mutate(cargo.id)}
        >
          <Trash2Icon className="text-destructive" />
        </Button>
      </div>
    </li>
  )
}

/** Gerencia a lista de cargos eclesiásticos (criar, renomear, remover). */
export function CargoManagerDialog() {
  const { data: cargos, isLoading } = useCargos()
  const createCargo = useCreateCargo()
  const [novoNome, setNovoNome] = React.useState("")

  function handleCreate() {
    const trimmed = novoNome.trim()
    if (!trimmed) return
    createCargo.mutate(trimmed, { onSuccess: () => setNovoNome("") })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <BriefcaseIcon />
        Gerenciar cargos
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar cargos</DialogTitle>
          <DialogDescription>
            Cargos que podem ser dados aos membros. Ao remover um cargo, os
            membros que o tinham ficam sem cargo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="novo-cargo">Novo cargo</Label>
          <div className="flex items-center gap-2">
            <Input
              id="novo-cargo"
              placeholder="Ex.: Diácono"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
            <Button
              disabled={createCargo.isPending || !novoNome.trim()}
              onClick={handleCreate}
            >
              <PlusIcon />
              {createCargo.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (cargos ?? []).length === 0 ? (
            <p className="py-6 text-center text-base text-muted-foreground">
              Nenhum cargo cadastrado. Escreva o nome acima e toque em
              “Adicionar”.
            </p>
          ) : (
            <ul className="flex flex-col border-t border-rule">
              {(cargos ?? []).map((cargo) => (
                <CargoRow key={cargo.id} cargo={cargo} />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
