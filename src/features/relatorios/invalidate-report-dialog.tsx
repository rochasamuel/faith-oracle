import * as React from "react"

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
          <DialogTitle>Invalidar relatório</DialogTitle>
          <DialogDescription>
            O relatório será marcado como invalidado (soft delete) e mantido
            para auditoria. Ele não poderá mais ser considerado válido.
          </DialogDescription>
        </DialogHeader>

        {report && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Relatório</span>
              <span className="font-medium">{report.title}</span>
            </div>
            <div className="mt-1 flex justify-between gap-4">
              <span className="text-muted-foreground">Referência</span>
              <span className="font-medium">
                {formatReferenceLabel(report)}
              </span>
            </div>
          </div>
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
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason.trim())}
            disabled={isInvalidating}
          >
            {isInvalidating ? "Invalidando..." : "Invalidar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
