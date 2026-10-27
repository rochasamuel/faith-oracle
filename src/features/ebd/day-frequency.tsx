import * as React from "react"
import { CheckCheckIcon, SearchIcon, XIcon } from "lucide-react"

import { Section } from "@/components/page"
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

  const aplicaveis = matriculas.filter((m) => m.data_matricula <= dataAulaISO).length
  const depois = matriculas.length - aplicaveis

  return (
    <Section
      title="Chamada"
      description={
        <span className="num">
          {aplicaveis} {aplicaveis === 1 ? "aluno" : "alunos"}
          {depois > 0 &&
            ` · ${depois} ${depois === 1 ? "matriculado" : "matriculados"} depois desta data`}
        </span>
      }
      action={
        !readOnly && matriculas.length > 0 ? (
          <Button variant="outline" size="sm" className="shrink-0" onClick={onAllPresent}>
            <CheckCheckIcon />
            Todos presentes
          </Button>
        ) : undefined
      }
    >
      {matriculas.length > 20 && (
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar aluno pelo nome"
            className="pr-12 pl-11"
            placeholder="Buscar aluno pelo nome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-1 right-1"
              aria-label="Limpar busca"
              onClick={() => setSearch("")}
            >
              <XIcon />
            </Button>
          )}
        </div>
      )}

      {visiveis.length === 0 ? (
        <p className="py-6 text-center text-base text-muted-foreground">
          {matriculas.length === 0
            ? "Nenhum aluno matriculado nesta turma."
            : `Nenhum aluno com “${search.trim()}”.`}
        </p>
      ) : (
        <ol className="flex flex-col">
          {visiveis.map((m) => {
            const naoAplicavel = m.data_matricula > dataAulaISO
            const nome = m.member?.nome_completo ?? "—"
            return (
              <li
                key={m.id}
                className="flex flex-col gap-2.5 border-b border-rule py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-[1.125rem] leading-snug font-semibold">
                    {nome}
                  </p>
                  {naoAplicavel && (
                    <p className="text-sm text-muted-foreground">
                      Matriculado depois desta data
                    </p>
                  )}
                </div>
                <div className="sm:w-[22rem] sm:shrink-0">
                  <AttendanceControl
                    name={nome}
                    value={naoAplicavel ? "nao_aplicavel" : statuses[m.id]}
                    onChange={(status) => onChange(m.id, status)}
                    disabled={readOnly || naoAplicavel}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Section>
  )
}
