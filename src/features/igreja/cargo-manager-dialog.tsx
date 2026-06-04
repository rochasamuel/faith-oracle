import * as React from "react"
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react"

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
import type { MemberCargo } from "@/api/members"
import {
  useCargos,
  useCreateCargo,
  useDeleteCargo,
  useUpdateCargo,
} from "@/features/igreja/use-members"

/** Linha da lista: exibição com ações ou edição inline do nome. */
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

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          className="h-8 text-sm"
          value={nome}
          autoFocus
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSave()
            }
            if (e.key === "Escape") {
              setEditing(false)
              setNome(cargo.nome)
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Salvar cargo"
          disabled={updateCargo.isPending}
          onClick={handleSave}
        >
          <CheckIcon className="text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cancelar edição"
          onClick={() => {
            setEditing(false)
            setNome(cargo.nome)
          }}
        >
          <XIcon className="text-muted-foreground" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm">{cargo.nome}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Renomear cargo"
          onClick={() => setEditing(true)}
        >
          <PencilIcon className="text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remover cargo"
          disabled={deleteCargo.isPending}
          onClick={() => deleteCargo.mutate(cargo.id)}
        >
          <Trash2Icon className="text-muted-foreground" />
        </Button>
      </div>
    </div>
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
      <DialogTrigger
        render={<Button variant="outline" className="flex-1 sm:flex-none" />}
      >
        Gerenciar cargos
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cargos</DialogTitle>
          <DialogDescription>
            Cargos eclesiásticos atribuíveis aos membros. Ao remover um cargo,
            os membros que o possuíam ficam sem cargo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            className="h-9 text-sm"
            placeholder="Novo cargo"
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
            size="sm"
            disabled={createCargo.isPending || !novoNome.trim()}
            onClick={handleCreate}
          >
            {createCargo.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>

        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Carregando...
            </p>
          ) : (cargos ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum cargo cadastrado.
            </p>
          ) : (
            (cargos ?? []).map((cargo) => (
              <CargoRow key={cargo.id} cargo={cargo} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
