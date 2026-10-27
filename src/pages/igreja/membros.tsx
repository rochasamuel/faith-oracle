import * as React from "react"
import { useNavigate } from "react-router"
import { PlusIcon, SearchIcon, SearchXIcon, UsersIcon, XIcon } from "lucide-react"

import {
  EmptyState,
  ErrorState,
  Page,
  PageHeader,
  Section,
} from "@/components/page"
import { Button } from "@/components/ui/button"
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
  ativos: "Só ativos",
  inativos: "Só inativos",
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

  function goToNew() {
    navigate("/igreja/membros/novo")
  }

  return (
    <Page>
      <PageHeader
        title="Membros"
        description="Cadastro de membros da igreja. A contagem oficial considera apenas os ativos."
        actions={
          <>
            <Button className="max-sm:basis-full" onClick={goToNew}>
              <PlusIcon />
              Novo membro
            </Button>
            <ImportMembersDialog />
            <CargoManagerDialog />
          </>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <div className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 border-b border-rule py-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-48 max-w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <ErrorState title="Não foi possível carregar os membros." error={error} />
      ) : isEmpty ? (
        <EmptyState
          icon={UsersIcon}
          title="Nenhum membro cadastrado"
          description="Comece cadastrando o primeiro membro, ou importe uma lista que você já tenha."
          action={
            <Button onClick={goToNew}>
              <PlusIcon />
              Cadastrar o primeiro membro
            </Button>
          }
        />
      ) : (
        <>

          <Section
            title="Lista de membros"
            count={
              filtersActive
                ? `${visible.length} de ${members.length}`
                : `${ativos} ${ativos === 1 ? "ativo" : "ativos"}${members.length - ativos > 0 ? ` · ${members.length - ativos} ${members.length - ativos === 1 ? "inativo" : "inativos"}` : ""}`
            }
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <div className="relative">
                <SearchIcon
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  aria-label="Buscar membro pelo nome"
                  className="pr-12 pl-11"
                  placeholder="Buscar pelo nome"
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
              <Select
                items={STATUS_FILTER_LABELS}
                value={status}
                onValueChange={(value) => setStatus(value as StatusFilter)}
              >
                <SelectTrigger className="w-full data-[size=default]:h-12" aria-label="Mostrar membros">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
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

            {visible.length === 0 ? (
              <EmptyState
                icon={SearchXIcon}
                title="Nenhum membro encontrado"
                description={
                  search.trim()
                    ? `Nenhum membro com “${search.trim()}” no nome. Confira a grafia ou limpe a busca.`
                    : "Nenhum membro nesta situação."
                }
                action={
                  filtersActive ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("")
                        setStatus("todos")
                      }}
                    >
                      Mostrar todos os membros
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <MembersTable members={visible} />
            )}
          </Section>
        </>
      )}
    </Page>
  )
}

