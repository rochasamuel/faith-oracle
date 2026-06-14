import { LockIcon, LockOpenIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatBRL } from "@/lib/currency"
import type { EbdAulaStatus } from "@/features/ebd/constants"

export interface DaySummaryTotals {
  matriculados: number
  presentes: number
  faltas: number
  naoAplicavel: number
  naoMarcados: number
  assistencia: number
}

interface DaySummaryProps {
  totals: DaySummaryTotals
  visitantes: number
  biblias: number
  revistas: number
  ofertaCentavos: number
  status: EbdAulaStatus
  onClose: () => void
  onReopen: () => void
  closing: boolean
  reopening: boolean
}

export function DaySummary({
  totals,
  visitantes,
  biblias,
  revistas,
  ofertaCentavos,
  status,
  onClose,
  onReopen,
  closing,
  reopening,
}: DaySummaryProps) {
  const fechada = status === "fechada"

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-medium">Relatório do dia</h2>
        {fechada && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <LockIcon className="size-3" />
            Fechado
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Matriculados" value={totals.matriculados} />
        <Stat label="Presentes" value={totals.presentes} tone="emerald" />
        <Stat label="Ausentes" value={totals.faltas} tone="rose" />
        <Stat label="Visitantes" value={visitantes} />
        <Stat label="Assistência" value={totals.assistencia} tone="primary" />
        <Stat label="Bíblias" value={biblias} />
        <Stat label="Revistas" value={revistas} />
        <Stat label="Oferta" text={formatBRL(ofertaCentavos)} tone="emerald" />
      </div>

      {fechada ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={onReopen}
          disabled={reopening}
        >
          <LockOpenIcon />
          {reopening ? "Reabrindo..." : "Reabrir dia"}
        </Button>
      ) : totals.naoMarcados > 0 ? (
        <div className="flex flex-col gap-2">
          <Button className="w-full" disabled>
            <LockIcon />
            Fechar o dia
          </Button>
          <p className="text-center text-xs text-amber-600 dark:text-amber-400">
            Marque a presença de todos os alunos para fechar (
            {totals.naoMarcados} sem marcar).
          </p>
        </div>
      ) : (
        <Dialog>
          <DialogTrigger render={<Button className="w-full" disabled={closing} />}>
            <LockIcon />
            Fechar o dia
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Fechar o dia?</DialogTitle>
              <DialogDescription>
                Os totais serão gravados e a edição ficará travada (dá para
                reabrir depois).
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancelar</Button>} />
              <Button onClick={onClose} disabled={closing}>
                {closing ? "Fechando..." : "Fechar o dia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface StatProps {
  label: string
  value?: number
  text?: string
  tone?: "emerald" | "rose" | "primary"
}

const TONES: Record<NonNullable<StatProps["tone"]>, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  rose: "text-rose-600 dark:text-rose-400",
  primary: "text-primary",
}

function Stat({ label, value, text, tone }: StatProps) {
  return (
    <div className="rounded-md border border-border bg-background p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-medium tabular-nums ${tone ? TONES[tone] : ""}`}
      >
        {text ?? value}
      </p>
    </div>
  )
}
