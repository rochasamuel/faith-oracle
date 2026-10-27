import * as React from "react"
import { AlertTriangleIcon, FileUpIcon } from "lucide-react"

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
import { formatBRL } from "@/lib/currency"
import {
  CSV_TEMPLATE,
  duplicateKey,
  parseTransactionsCsv,
} from "@/features/financeiro/csv-import"
import {
  useImportTransactions,
  useTransactions,
} from "@/features/financeiro/hooks"

/** Diálogo para colar um CSV e importar vários lançamentos de uma vez. */
export function ImportCsvDialog() {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState("")
  const { data: existing } = useTransactions()
  const importTransactions = useImportTransactions()

  const { rows, errors } = React.useMemo(
    () => parseTransactionsCsv(text),
    [text]
  )

  // Possíveis duplicados: já registrados ou repetidos dentro do próprio CSV.
  const duplicateCount = React.useMemo(() => {
    const seen = new Set((existing ?? []).map(duplicateKey))
    let count = 0
    for (const row of rows) {
      const key = duplicateKey(row)
      if (seen.has(key)) count++
      seen.add(key)
    }
    return count
  }, [existing, rows])

  const total = rows.reduce(
    (sum, r) => sum + (r.type === "entrada" ? r.amount : -r.amount),
    0
  )

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setText("")
  }

  function handleImport() {
    importTransactions.mutate(rows, {
      onSuccess: () => handleOpenChange(false),
    })
  }

  const canImport =
    rows.length > 0 && errors.length === 0 && !importTransactions.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FileUpIcon />
        Importar CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar lançamentos (CSV)</DialogTitle>
          <DialogDescription>
            Cole as linhas separadas por ponto e vírgula (;) ou copiadas de uma
            planilha. O cabeçalho é opcional. Tipo: entrada ou saida.
            Categoria: nome ou código (ex.: dizimos, despesas_fixas).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="csv">Conteúdo CSV</Label>
          <Textarea
            id="csv"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={CSV_TEMPLATE}
            rows={8}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </div>

        {errors.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <p className="mb-1 font-medium">
              Corrija as linhas abaixo para importar:
            </p>
            <ul className="flex flex-col gap-0.5">
              {errors.map((e) => (
                <li key={e.line}>
                  Linha {e.line}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {duplicateCount > 0 && (
          <div className="flex gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangleIcon className="size-4 shrink-0" />
            <p>
              {duplicateCount === 1
                ? "1 linha parece duplicada"
                : `${duplicateCount} linhas parecem duplicadas`}{" "}
              (mesmo tipo, categoria, valor e data de um lançamento existente
              ou de outra linha). Confira antes de importar.
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {rows.length === 1
              ? "1 lançamento válido"
              : `${rows.length} lançamentos válidos`}{" "}
            · saldo do lote:{" "}
            <span className="font-medium tabular-nums">{formatBRL(total)}</span>
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importTransactions.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!canImport}>
            {importTransactions.isPending
              ? "Importando..."
              : rows.length > 0
                ? `Importar ${rows.length}`
                : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
