import { DownloadIcon, MinusIcon, PlusIcon } from "lucide-react"

import { Section } from "@/components/page"
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
    <>
      <Section
        title="Números do dia"
        description="Toque em + ou − para contar. Tudo é salvo sozinho."
      >
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="oferta">Oferta do dia</Label>
            <CurrencyInput
              id="oferta"
              className="h-14 text-xl font-semibold"
              valueCents={values.oferta_centavos}
              onValueChange={(cents) => {
                onLocal({ oferta_centavos: cents })
                commitOferta(cents)
              }}
              disabled={readOnly}
            />
          </div>
        </div>
      </Section>

      <Section title="Lição e professor">
        <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="licao">Nº da lição</Label>
            <Input
              id="licao"
              inputMode="numeric"
              className="num"
              placeholder="Ex.: 4"
              value={values.numero_licao}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "")
                onLocal({ numero_licao: raw })
                commitLicao(raw)
              }}
              disabled={readOnly}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="professor">Professor</Label>
            <Input
              id="professor"
              placeholder="Nome de quem deu a aula"
              autoComplete="off"
              value={values.professor}
              onChange={(e) => {
                onLocal({ professor: e.target.value })
                commitProfessor(e.target.value)
              }}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="titulo">Título da lição</Label>
          <Input
            id="titulo"
            placeholder="Opcional — preenchido ao buscar na CPAD"
            value={values.titulo_licao}
            onChange={(e) => {
              onLocal({ titulo_licao: e.target.value })
              commitTitulo(e.target.value)
            }}
            disabled={readOnly}
          />
        </div>

        {!readOnly && (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBuscarLicao}
              disabled={buscandoLicao || !values.numero_licao}
            >
              <DownloadIcon />
              {buscandoLicao ? "Buscando a lição..." : "Buscar lição na CPAD"}
            </Button>
            <p className="text-sm text-muted-foreground">
              {values.numero_licao
                ? "Traz o título e o texto da lição para esta página."
                : "Informe o nº da lição para buscar."}
            </p>
          </div>
        )}
      </Section>
    </>
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

  const id = `contador-${label.toLowerCase()}`
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="shrink-0"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          disabled={disabled || value <= 0}
          onClick={() => update(Math.max(0, value - 1))}
        >
          <MinusIcon className="size-6" />
        </Button>
        <Input
          id={id}
          inputMode="numeric"
          className="num h-14 w-full min-w-0 flex-1 text-center font-heading text-2xl font-semibold"
          value={value}
          onChange={(e) => update(parse(e.target.value))}
          onFocus={(e) => e.currentTarget.select()}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="shrink-0"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={disabled}
          onClick={() => update(value + 1)}
        >
          <PlusIcon className="size-6" />
        </Button>
      </div>
    </div>
  )
}
