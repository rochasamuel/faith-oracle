import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { trimestreLabel } from "@/features/ebd/constants"
import type { EbdTurmaTrimestre } from "@/api/ebd"

interface TrimestreSelectProps {
  items: EbdTurmaTrimestre[]
  value: string | null
  onValueChange: (id: string) => void
  className?: string
}

/** Seletor do trimestre vigente (reaproveitado em Dias e Matrículas). */
export function TrimestreSelect({
  items,
  value,
  onValueChange,
  className,
}: TrimestreSelectProps) {
  const labels: Record<string, string> = {}
  for (const tt of items) {
    labels[tt.id] = tt.trimestre
      ? trimestreLabel(tt.trimestre.numero, tt.trimestre.ano)
      : "Trimestre"
  }

  return (
    <Select
      items={labels}
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
    >
      <SelectTrigger className={cn("h-9 w-full sm:w-56", className)}>
        <SelectValue placeholder="Selecione o trimestre" />
      </SelectTrigger>
      <SelectContent>
        {items.map((tt) => (
          <SelectItem key={tt.id} value={tt.id}>
            {labels[tt.id]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
