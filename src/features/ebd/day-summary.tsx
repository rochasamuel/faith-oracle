import { LockIcon, LockOpenIcon } from "lucide-react"

import { Ledger, Section } from "@/components/page"
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
import { cn } from "@/lib/utils"
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
  onReopen: () => void
  reopening: boolean
}

/** Relatório do dia: os números que vão para o livro, em linhas pautadas. */
export function DaySummary({
  totals,
  visitantes,
  biblias,
  revistas,
  ofertaCentavos,
  status,
  onReopen,
  reopening,
}: DaySummaryProps) {
  const fechada = status === "fechada"

  return (
    <Section
      title="Relatório do dia"
      description={
        fechada
          ? "Dia fechado. Os totais abaixo estão gravados."
          : "Os totais se atualizam enquanto você marca a chamada."
      }
      action={
        fechada ? (
          <ReopenDayButton onReopen={onReopen} reopening={reopening} />
        ) : undefined
      }
    >
      <Ledger
        columns={2}
        rows={[
          { label: "Matriculados", value: totals.matriculados },
          { label: "Presentes", value: totals.presentes, tone: "positive" },
          { label: "Ausentes", value: totals.faltas, tone: totals.faltas > 0 ? "negative" : "default" },
          { label: "Visitantes", value: visitantes },
          { label: "Bíblias", value: biblias },
          { label: "Revistas", value: revistas },
          { label: "Oferta", value: formatBRL(ofertaCentavos) },
        ]}
        total={{ label: "Assistência", value: totals.assistencia, hint: "Presentes + visitantes" }}
      />
    </Section>
  )
}

/** Botão "Fechar o dia" com confirmação. Bloqueado enquanto houver alunos sem marcar. */
export function CloseDayButton({
  naoMarcados,
  onClose,
  closing,
  className,
}: {
  naoMarcados: number
  onClose: () => void
  closing: boolean
  className?: string
}) {
  if (naoMarcados > 0) {
    return (
      <Button
        size="lg"
        variant="outline"
        className={cn("w-full disabled:opacity-100 disabled:text-muted-foreground", className)}
        disabled
      >
        <LockIcon />
        Marque {naoMarcados === 1 ? "o último" : `os ${naoMarcados}`}
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<Button size="lg" className={cn("w-full", className)} disabled={closing} />}
      >
        <LockIcon />
        {closing ? "Fechando..." : "Fechar o dia"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fechar o dia?</DialogTitle>
          <DialogDescription>
            Os totais serão gravados e a chamada ficará travada. Se precisar
            corrigir algo depois, é só reabrir o dia.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Voltar</Button>} />
          <DialogClose
            render={
              <Button onClick={onClose} disabled={closing}>
                <LockIcon />
                Sim, fechar o dia
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReopenDayButton({
  onReopen,
  reopening,
}: {
  onReopen: () => void
  reopening: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" disabled={reopening} />}>
        <LockOpenIcon />
        {reopening ? "Reabrindo..." : "Reabrir"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reabrir o dia?</DialogTitle>
          <DialogDescription>
            A chamada e os números voltam a poder ser editados. Lembre de
            fechar o dia de novo quando terminar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Voltar</Button>} />
          <DialogClose
            render={
              <Button onClick={onReopen}>
                <LockOpenIcon />
                Reabrir o dia
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
