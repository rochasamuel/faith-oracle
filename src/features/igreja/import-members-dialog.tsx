import * as React from "react"
import { CopyIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
      <DialogTrigger
        render={<Button variant="outline" className="flex-1 sm:flex-none" />}
      >
        <UploadIcon />
        Importar JSON
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar membros via JSON</DialogTitle>
          <DialogDescription>
            Cole um array JSON de membros. Apenas{" "}
            <code className="font-mono text-xs">nome_completo</code> é
            obrigatório; datas no formato yyyy-mm-dd e cargo pelo nome (criado
            automaticamente se não existir). Nada é importado enquanto houver
            erros.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleCopyModel}>
            <CopyIcon />
            Copiar modelo
          </Button>
        </div>

        <Textarea
          className="max-h-80 min-h-64 font-mono text-xs"
          placeholder={MODEL_JSON}
          value={text}
          aria-invalid={errors.length > 0}
          onChange={(e) => setText(e.target.value)}
        />

        {errors.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <ul className="flex flex-col gap-1">
              {errors.map((error, index) => (
                <li key={index} className="text-xs text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
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
            {importMembers.isPending ? "Importando..." : "Importar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
