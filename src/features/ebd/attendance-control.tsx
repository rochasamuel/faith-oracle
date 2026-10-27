import { CheckIcon, MinusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  FREQUENCIA_LABELS_CURTO,
  FREQUENCIA_STATUSES,
  type EbdFrequenciaStatus,
} from "@/features/ebd/constants"

const ACTIVE_STYLES: Record<EbdFrequenciaStatus, string> = {
  presente: "border-success bg-success text-white dark:text-background",
  falta: "border-destructive bg-destructive text-white dark:text-background",
  nao_aplicavel: "border-warning bg-warning-soft text-warning",
}

// Visto = presente · X = falta · – = não aplicável. Sempre com texto ao lado.
const ICONS: Record<EbdFrequenciaStatus, typeof CheckIcon> = {
  presente: CheckIcon,
  falta: XIcon,
  nao_aplicavel: MinusIcon,
}

interface AttendanceControlProps {
  value: EbdFrequenciaStatus | undefined
  onChange: (status: EbdFrequenciaStatus) => void
  disabled?: boolean
  /** Nome do aluno, para leitores de tela ("Presente — Maria"). */
  name?: string
}

/** Controle segmentado de presença: Presente · Falta · N/A. */
export function AttendanceControl({
  value,
  onChange,
  disabled,
  name,
}: AttendanceControlProps) {
  return (
    <div
      className="grid grid-cols-[1.25fr_1fr_0.8fr] gap-1.5"
      role="group"
      aria-label={name ? `Presença de ${name}` : "Presença"}
    >
      {FREQUENCIA_STATUSES.map((status) => {
        const active = value === status
        const Icon = ICONS[status]
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(status)}
            className={cn(
              "flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg border-2 px-2 text-base font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed",
              active
                ? ACTIVE_STYLES[status]
                : "border-input bg-page text-foreground hover:border-primary/50 hover:bg-accent disabled:text-muted-foreground disabled:hover:border-input disabled:hover:bg-page",
              disabled && !active && "opacity-60"
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={active ? 3 : 2} aria-hidden />
            <span className="truncate">{FREQUENCIA_LABELS_CURTO[status]}</span>
          </button>
        )
      })}
    </div>
  )
}
