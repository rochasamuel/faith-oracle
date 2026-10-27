import * as React from "react"
import { BanIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Report } from "@/api/reports"
import { formatReferenceLabel } from "@/features/relatorios/constants"

interface InvalidateReportDialogProps {
  report: Report | null
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isInvalidating: boolean
}

export function InvalidateReportDialog({
  report,
  onOpenChange,
  onConfirm,
  isInvalidating,
}: InvalidateReportDialogProps) {
  // O componente é remontado por `key` a cada relatório (ver ReportTable),
  // então o estado começa limpo sem precisar de efeito de reset.
  const [reason, setReason] = React.useState("")

  return (
    <Dialog open={report !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invalidar este relatório?</DialogTitle>
          <DialogDescription>
            O relatório fica marcado como invalidado e continua guardado para
            consulta, mas deixa de valer como prestação de contas. Isso não
            pode ser desfeito.
          </DialogDescription>
        </DialogHeader>

        {report && (
          <dl className="flex flex-col border-t border-rule text-base">
            <div className="flex flex-col gap-0.5 border-b border-rule py-2.5 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-muted-foreground">Relatório</dt>
              <dd className="font-semibold sm:text-right">{report.title}</dd>
            </div>
            <div className="flex flex-col gap-0.5 border-b border-rule py-2.5 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-muted-foreground">Referência</dt>
              <dd className="font-semibold sm:text-right">
                {formatReferenceLabel(report)}
              </dd>
            </div>
          </dl>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="invalidate-reason">Motivo (opcional)</Label>
          <Textarea
            id="invalidate-reason"
            placeholder="Por que este relatório está sendo invalidado?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isInvalidating}
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason.trim())}
            disabled={isInvalidating}
          >
            <BanIcon />
            {isInvalidating ? "Invalidando..." : "Sim, invalidar relatório"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
