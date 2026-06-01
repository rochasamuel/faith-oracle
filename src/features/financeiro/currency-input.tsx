import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { digitsToCents, formatCentsToBRL } from "@/lib/currency"

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  /** Valor em centavos (inteiro). */
  valueCents: number
  /** Recebe o novo valor em centavos. */
  onValueChange: (cents: number) => void
}

/** Input monetário em Real com prefixo "R$" e máscara (trabalha em centavos). */
export function CurrencyInput({
  valueCents,
  onValueChange,
  className,
  placeholder = "0,00",
  ...props
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-xs text-muted-foreground">
        R$
      </span>
      <Input
        inputMode="numeric"
        placeholder={placeholder}
        className={cn("pl-8", className)}
        value={
          valueCents === 0
            ? ""
            : formatCentsToBRL(valueCents).replace("R$", "").trim()
        }
        onChange={(e) => onValueChange(digitsToCents(e.target.value))}
        {...props}
      />
    </div>
  )
}
