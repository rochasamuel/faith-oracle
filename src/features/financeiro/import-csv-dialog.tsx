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
import { cn } from "@/lib/utils"
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
        <FileUpIcon aria-hidden />
        Importar CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar lançamentos de uma planilha</DialogTitle>
          <DialogDescription>
            Copie as linhas da planilha e cole abaixo. Uma linha por
            lançamento, com as colunas separadas por ponto e vírgula (;) ou
            tabulação. O cabeçalho é opcional.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-1 text-base text-muted-foreground">
          <li>
            <strong className="font-semibold text-foreground">Colunas:</strong>{" "}
            data; tipo; categoria; valor; observação
          </li>
          <li>
            <strong className="font-semibold text-foreground">Tipo:</strong>{" "}
            entrada ou saida
          </li>
          <li>
            <strong className="font-semibold text-foreground">Categoria:</strong>{" "}
            o nome ou o código (ex.: dizimos, despesas_fixas)
          </li>
        </ul>

        <div className="flex flex-col gap-2">
          <Label htmlFor="csv">Linhas para importar</Label>
          <Textarea
            id="csv"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={CSV_TEMPLATE}
            rows={8}
            className="num"
            spellCheck={false}
            aria-invalid={errors.length > 0}
            aria-describedby={errors.length > 0 ? "csv-errors" : undefined}
          />
        </div>

        {errors.length > 0 && (
          <div
            id="csv-errors"
            role="alert"
            className="max-h-48 overflow-y-auto rounded-lg bg-danger-soft px-4 py-3.5 text-base text-destructive"
          >
            <p className="mb-1.5 font-semibold">
              Corrija {errors.length === 1 ? "a linha abaixo" : "as linhas abaixo"}{" "}
              para importar:
            </p>
            <ul className="flex flex-col gap-1 text-foreground/85">
              {errors.map((e) => (
                <li key={e.line}>
                  <span className="num font-semibold text-destructive">
                    Linha {e.line}:
                  </span>{" "}
                  {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {duplicateCount > 0 && (
          <div className="flex gap-3 rounded-lg bg-warning-soft px-4 py-3.5 text-base">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
            <p>
              <strong className="font-semibold text-warning">
                {duplicateCount === 1
                  ? "1 linha parece duplicada"
                  : `${duplicateCount} linhas parecem duplicadas`}
              </strong>{" "}
              (mesmo tipo, categoria, valor e data de um lançamento já
              registrado ou de outra linha). Confira antes de importar.
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex items-baseline justify-between gap-4 border-y border-rule py-3">
            <span className="text-base">
              <span className="num font-semibold">{rows.length}</span>{" "}
              {rows.length === 1 ? "lançamento pronto" : "lançamentos prontos"}
            </span>
            <span className="text-right text-base text-muted-foreground">
              Saldo do lote{" "}
              <span
                className={cn(
                  "num font-semibold",
                  total >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {total >= 0 ? "+ " : "− "}
                {formatBRL(Math.abs(total))}
              </span>
            </span>
          </div>
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
            <FileUpIcon aria-hidden />
            {importTransactions.isPending
              ? "Importando..."
              : rows.length > 0
                ? `Importar ${rows.length} ${rows.length === 1 ? "lançamento" : "lançamentos"}`
                : "Importar lançamentos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
