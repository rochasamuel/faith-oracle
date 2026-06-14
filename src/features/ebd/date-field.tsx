import * as React from "react"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { Matcher } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatDateBR } from "@/lib/date"

interface DateFieldProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  invalid?: boolean
  placeholder?: string
  /** Limita a seleção (inclusive) a este intervalo. */
  min?: Date
  max?: Date
}

/** Botão + popover de calendário (date-fns/pt-BR), reaproveitado nos formulários. */
export function DateField({
  value,
  onChange,
  invalid,
  placeholder = "Selecione uma data",
  min,
  max,
}: DateFieldProps) {
  const [open, setOpen] = React.useState(false)

  const disabled: Matcher[] = []
  if (min) disabled.push({ before: min })
  if (max) disabled.push({ after: max })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-invalid={invalid}
            className={cn(
              "h-9 w-full justify-start gap-2 font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="size-4" />
            {value ? formatDateBR(value) : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          locale={ptBR}
          autoFocus
          disabled={disabled.length ? disabled : undefined}
          startMonth={min}
          endMonth={max}
          defaultMonth={value ?? min}
        />
      </PopoverContent>
    </Popover>
  )
}
