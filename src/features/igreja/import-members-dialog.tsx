import * as React from "react"
import { CopyIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  MODEL_JSON,
  parseMembersJson,
} from "@/features/igreja/member-import"
import { useImportMembers } from "@/features/igreja/use-members"

/**
 * Importação em massa de membros: cola-se um array JSON, tudo é validado e,
 * se não houver erros, todos os membros são criados de uma vez.
 */
export function ImportMembersDialog() {
  const importMembers = useImportMembers()
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState("")
  const [errors, setErrors] = React.useState<string[]>([])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setText("")
      setErrors([])
    }
  }

  async function handleCopyModel() {
    await navigator.clipboard.writeText(MODEL_JSON)
    toast.success("Modelo copiado para a área de transferência.")
  }

  function handleImport() {
    const result = parseMembersJson(text)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors([])
    importMembers.mutate(result.rows, {
      onSuccess: () => handleOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <UploadIcon />
        Importar lista
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar membros de uma lista</DialogTitle>
          <DialogDescription>
            Cole a lista no formato JSON. Só o nome completo é obrigatório;
            datas no formato ano-mês-dia (ex.: 1985-03-22) e cargo pelo nome
            (criado sozinho se ainda não existir). Nada é importado enquanto
            houver erros.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <Label htmlFor="import-membros">Lista de membros (JSON)</Label>
            <Button variant="outline" size="sm" onClick={handleCopyModel}>
              <CopyIcon />
              Copiar modelo
            </Button>
          </div>
          <Textarea
            id="import-membros"
            className="max-h-80 min-h-64 font-mono text-sm"
            placeholder={MODEL_JSON}
            value={text}
            aria-invalid={errors.length > 0}
            aria-describedby={errors.length > 0 ? "import-membros-erros" : undefined}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {errors.length > 0 && (
          <div
            id="import-membros-erros"
            role="alert"
            className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg bg-danger-soft px-4 py-3"
          >
            <p className="text-base font-semibold text-destructive">
              Corrija {errors.length === 1 ? "o erro" : `os ${errors.length} erros`}{" "}
              abaixo e tente de novo:
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={importMembers.isPending || !text.trim()}
            onClick={handleImport}
          >
            <UploadIcon />
            {importMembers.isPending ? "Importando..." : "Importar membros"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
