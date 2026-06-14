import * as React from "react"
import { CheckCheckIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AttendanceControl } from "@/features/ebd/attendance-control"
import type { EbdFrequenciaStatus } from "@/features/ebd/constants"
import type { EbdMatricula } from "@/api/ebd"

/** Normaliza texto para busca (minúsculas, sem acentos). */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

interface DayFrequencyProps {
  matriculas: EbdMatricula[]
  dataAulaISO: string
  statuses: Record<string, EbdFrequenciaStatus | undefined>
  onChange: (matriculaId: string, status: EbdFrequenciaStatus) => void
  onAllPresent: () => void
  readOnly: boolean
}

export function DayFrequency({
  matriculas,
  dataAulaISO,
  statuses,
  onChange,
  onAllPresent,
  readOnly,
}: DayFrequencyProps) {
  const [search, setSearch] = React.useState("")
  const term = normalize(search.trim())
  const visiveis = matriculas.filter(
    (m) => !term || normalize(m.member?.nome_completo ?? "").includes(term)
  )

  const pendentes = readOnly
    ? 0
    : matriculas.filter(
        (m) => m.data_matricula <= dataAulaISO && !statuses[m.id]
      ).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-medium">
          Frequência
          <span className="ml-1 text-muted-foreground">
            ({matriculas.length})
          </span>
          {pendentes > 0 && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">
              · {pendentes} sem marcar
            </span>
          )}
        </h2>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={onAllPresent}>
            <CheckCheckIcon />
            Todos presentes
          </Button>
        )}
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 pl-8 text-sm"
          placeholder="Buscar aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {visiveis.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhum aluno encontrado.
          </p>
        ) : (
          visiveis.map((m) => {
            const naoAplicavel = m.data_matricula > dataAulaISO
            const pendente = !readOnly && !naoAplicavel && !statuses[m.id]
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {m.member?.nome_completo ?? "—"}
                  </p>
                  {naoAplicavel ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Matriculado após esta data
                    </p>
                  ) : pendente ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Selecione a presença
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0">
                  <AttendanceControl
                    value={naoAplicavel ? "nao_aplicavel" : statuses[m.id]}
                    onChange={(status) => onChange(m.id, status)}
                    disabled={readOnly || naoAplicavel}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
