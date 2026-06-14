import { DownloadIcon, MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { CurrencyInput } from "@/features/financeiro/currency-input"
import type { AulaPatch } from "@/api/ebd"

export interface DayMetricsValues {
  oferta_centavos: number
  visitantes: number
  total_biblias: number
  total_revistas: number
  numero_licao: string
  titulo_licao: string
  professor: string
}

interface DayMetricsProps {
  values: DayMetricsValues
  /** Atualiza o estado local (digitação). */
  onLocal: (patch: Partial<DayMetricsValues>) => void
  /** Persiste no banco (autosave: blur dos campos / clique nos contadores). */
  onCommit: (patch: AulaPatch) => void
  readOnly: boolean
  /** Dispara a busca da lição na CPAD (usa o nº da lição atual). */
  onBuscarLicao: () => void
  /** Busca em andamento. */
  buscandoLicao: boolean
}

export function DayMetrics({
  values,
  onLocal,
  onCommit,
  readOnly,
  onBuscarLicao,
  buscandoLicao,
}: DayMetricsProps) {
  // Um committer debounced por campo (independentes, não se sobrescrevem).
  const commitOferta = useDebouncedCallback(
    (cents: number) => onCommit({ oferta_centavos: cents }),
    1000
  )
  const commitLicao = useDebouncedCallback(
    (raw: string) => onCommit({ numero_licao: raw ? Number(raw) : null }),
    1000
  )
  const commitTitulo = useDebouncedCallback(
    (v: string) => onCommit({ titulo_licao: v.trim() || null }),
    1000
  )
  const commitProfessor = useDebouncedCallback(
    (v: string) => onCommit({ professor: v.trim() || null }),
    1000
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-sm font-medium">Métricas do dia</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="oferta">Oferta</Label>
          <CurrencyInput
            id="oferta"
            className="h-9 text-sm"
            valueCents={values.oferta_centavos}
            onValueChange={(cents) => {
              onLocal({ oferta_centavos: cents })
              commitOferta(cents)
            }}
            disabled={readOnly}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="licao">Nº da lição</Label>
          <div className="flex items-center gap-2">
            <Input
              id="licao"
              inputMode="numeric"
              className="h-9 flex-1 text-sm"
              value={values.numero_licao}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "")
                onLocal({ numero_licao: raw })
                commitLicao(raw)
              }}
              disabled={readOnly}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={onBuscarLicao}
              disabled={readOnly || buscandoLicao || !values.numero_licao}
              title="Buscar lição da CPAD"
            >
              <DownloadIcon className="size-4" />
              {buscandoLicao ? "Buscando..." : "Buscar lição"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="titulo">Título da lição (opcional)</Label>
        <Input
          id="titulo"
          className="h-9 text-sm"
          value={values.titulo_licao}
          onChange={(e) => {
            onLocal({ titulo_licao: e.target.value })
            commitTitulo(e.target.value)
          }}
          disabled={readOnly}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="professor">Professor</Label>
        <Input
          id="professor"
          className="h-9 text-sm"
          placeholder="Nome do professor"
          value={values.professor}
          onChange={(e) => {
            onLocal({ professor: e.target.value })
            commitProfessor(e.target.value)
          }}
          disabled={readOnly}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stepper
          label="Visitantes"
          value={values.visitantes}
          onChange={(v) => onLocal({ visitantes: v })}
          onCommit={(v) => onCommit({ visitantes: v })}
          disabled={readOnly}
        />
        <Stepper
          label="Bíblias"
          value={values.total_biblias}
          onChange={(v) => onLocal({ total_biblias: v })}
          onCommit={(v) => onCommit({ total_biblias: v })}
          disabled={readOnly}
        />
        <Stepper
          label="Revistas"
          value={values.total_revistas}
          onChange={(v) => onLocal({ total_revistas: v })}
          onCommit={(v) => onCommit({ total_revistas: v })}
          disabled={readOnly}
        />
      </div>
    </div>
  )
}

interface StepperProps {
  label: string
  value: number
  /** Atualiza o estado local (digitação / clique). */
  onChange: (value: number) => void
  /** Persiste o valor (blur do campo / clique nos botões). */
  onCommit: (value: number) => void
  disabled?: boolean
}

/** Contador com botões +/− e digitação manual; persistência com debounce. */
function Stepper({ label, value, onChange, onCommit, disabled }: StepperProps) {
  const commit = useDebouncedCallback(onCommit, 1000)

  function parse(raw: string): number {
    return Number(raw.replace(/\D/g, "")) || 0
  }
  // Atualiza a UI na hora e agenda a gravação (coalescendo cliques/digitação).
  function update(next: number) {
    onChange(next)
    commit(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          disabled={disabled || value <= 0}
          onClick={() => update(Math.max(0, value - 1))}
        >
          <MinusIcon />
        </Button>
        <Input
          inputMode="numeric"
          className="h-9 w-full min-w-0 flex-1 text-center text-sm tabular-nums"
          value={value}
          onChange={(e) => update(parse(e.target.value))}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          disabled={disabled}
          onClick={() => update(value + 1)}
        >
          <PlusIcon />
        </Button>
      </div>
    </div>
  )
}
