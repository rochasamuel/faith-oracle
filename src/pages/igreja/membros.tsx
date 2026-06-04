import * as React from "react"
import { useNavigate } from "react-router"
import { PlusIcon, SearchXIcon, UsersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Member } from "@/api/members"
import { CargoManagerDialog } from "@/features/igreja/cargo-manager-dialog"
import { ImportMembersDialog } from "@/features/igreja/import-members-dialog"
import { MembersTable } from "@/features/igreja/members-table"
import { useMembers } from "@/features/igreja/use-members"

type StatusFilter = "todos" | "ativos" | "inativos"

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  todos: "Todos",
  ativos: "Ativos",
  inativos: "Inativos",
}

/** Normaliza texto para busca (minúsculas, sem acentos). */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function applyFilters(
  members: Member[],
  search: string,
  status: StatusFilter
): Member[] {
  const term = normalize(search.trim())
  return members.filter((member) => {
    if (status === "ativos" && !member.ativo) return false
    if (status === "inativos" && member.ativo) return false
    if (term && !normalize(member.nome_completo).includes(term)) return false
    return true
  })
}

export default function MembrosPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useMembers()

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("todos")

  const members = React.useMemo(() => data ?? [], [data])
  const visible = React.useMemo(
    () => applyFilters(members, search, status),
    [members, search, status]
  )

  const ativos = members.filter((member) => member.ativo).length
  const isEmpty = members.length === 0
  const filtersActive = search.trim() !== "" || status !== "todos"

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-lg font-medium">Membros</h1>
          <p className="text-xs text-muted-foreground">
            Cadastro de membros da igreja. A contagem oficial considera apenas
            os ativos.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <CargoManagerDialog />
          <ImportMembersDialog />
          <Button
            className="w-full sm:w-auto"
            onClick={() => navigate("/igreja/membros/novo")}
          >
            <PlusIcon />
            Novo membro
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Membros ativos" value={ativos} highlight />
        <SummaryCard label="Inativos" value={members.length - ativos} />
        <SummaryCard label="Total cadastrado" value={members.length} />
      </div>

      {/* Filtros */}
      {!isEmpty && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-9 max-w-xs text-sm"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            items={STATUS_FILTER_LABELS}
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
          >
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map(
                (option) => (
                  <SelectItem key={option} value={option}>
                    {STATUS_FILTER_LABELS[option]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            Erro ao carregar membros
            {error instanceof Error ? `: ${error.message}` : "."}
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <UsersIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nenhum membro ainda</p>
              <p className="text-xs text-muted-foreground">
                Comece cadastrando o primeiro membro da igreja.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate("/igreja/membros/novo")}>
              <PlusIcon />
              Novo membro
            </Button>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <SearchXIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nenhum resultado</p>
              <p className="text-xs text-muted-foreground">
                Nenhum membro corresponde aos filtros aplicados.
              </p>
            </div>
            {filtersActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setStatus("todos")
                }}
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <MembersTable members={visible} />
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={
            highlight
              ? "text-xl tabular-nums text-emerald-600 dark:text-emerald-400"
              : "text-xl tabular-nums"
          }
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
