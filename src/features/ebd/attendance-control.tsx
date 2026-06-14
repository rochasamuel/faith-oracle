import { CircleIcon, MinusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  FREQUENCIA_LABELS_CURTO,
  FREQUENCIA_STATUSES,
  type EbdFrequenciaStatus,
} from "@/features/ebd/constants"

const ACTIVE_STYLES: Record<EbdFrequenciaStatus, string> = {
  presente:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  falta: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  nao_aplicavel:
    "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

// Círculo = presente · X = ausente · – = não aplicável.
const ICONS: Record<EbdFrequenciaStatus, typeof CircleIcon> = {
  presente: CircleIcon,
  falta: XIcon,
  nao_aplicavel: MinusIcon,
}

interface AttendanceControlProps {
  value: EbdFrequenciaStatus | undefined
  onChange: (status: EbdFrequenciaStatus) => void
  disabled?: boolean
}

/** Controle segmentado de presença: ○ Presente · ✕ Falta · – N/A. */
export function AttendanceControl({
  value,
  onChange,
  disabled,
}: AttendanceControlProps) {
  return (
    <div className="flex gap-1" role="group">
      {FREQUENCIA_STATUSES.map((status) => {
        const active = value === status
        const Icon = ICONS[status]
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            aria-label={FREQUENCIA_LABELS_CURTO[status]}
            title={FREQUENCIA_LABELS_CURTO[status]}
            onClick={() => onChange(status)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              active
                ? ACTIVE_STYLES[status]
                : "border-input text-muted-foreground hover:bg-accent"
            )}
          >
            <Icon className="size-4" />
          </button>
        )
      })}
    </div>
  )
}
