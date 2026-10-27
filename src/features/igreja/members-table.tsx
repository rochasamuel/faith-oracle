import * as React from "react"
import { useNavigate } from "react-router"
import {
  ChevronRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  Trash2Icon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { dateISOToBR } from "@/lib/date"
import type { Member } from "@/api/members"
import {
  useDeleteMember,
  useUpdateMember,
} from "@/features/igreja/use-members"
import { DeleteMemberDialog } from "@/features/igreja/delete-member-dialog"
import { MemberAvatar } from "@/features/igreja/member-avatar"
import { MemberViewSheet } from "@/features/igreja/member-view-sheet"

interface MembersTableProps {
  members: Member[]
}

/** Selo de situação: palavra + cor, nunca só cor. */
function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "success" : "secondary"}>
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  )
}

/**
 * Lista de membros. No celular, cada membro é uma linha pautada (nome grande,
 * cargo, telefone) que abre a ficha; no computador, uma tabela.
 */
export function MembersTable({ members }: MembersTableProps) {
  const navigate = useNavigate()
  const updateMember = useUpdateMember()
  const deleteMember = useDeleteMember()
  const [pending, setPending] = React.useState<Member | null>(null)
  const [viewing, setViewing] = React.useState<Member | null>(null)

  function handleToggleAtivo(member: Member) {
    updateMember.mutate({
      id: member.id,
      payload: { ativo: !member.ativo },
    })
  }

  function handleConfirmDelete() {
    if (!pending) return
    deleteMember.mutate(pending.id, {
      onSuccess: () => setPending(null),
    })
  }

  function handleEdit(member: Member) {
    navigate(`/igreja/membros/${member.id}/editar`)
  }

  return (
    <>
      {/* Celular: linhas pautadas */}
      <ul className="flex flex-col border-t border-rule md:hidden">
        {members.map((member) => (
          <li key={member.id} className="border-b border-rule">
            <button
              type="button"
              className="flex min-h-[4.5rem] w-full items-center gap-3.5 py-3 text-left transition-colors duration-150 outline-none hover:bg-accent/60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={() => setViewing(member)}
            >
              <MemberAvatar
                nome={member.nome_completo}
                fotoPath={member.foto_path}
                className={cn("size-12 text-base", !member.ativo && "opacity-60")}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      "text-[1.125rem] leading-snug font-semibold break-words",
                      !member.ativo && "text-muted-foreground"
                    )}
                  >
                    {member.nome_completo}
                  </span>
                  {!member.ativo && <StatusBadge ativo={false} />}
                </span>
                <span className="text-base text-muted-foreground">
                  {member.cargo?.nome || "Sem cargo"}
                </span>
                <span className="num font-type text-base text-muted-foreground">
                  {member.telefone || "Sem telefone"}
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden
                className="size-5 shrink-0 text-muted-foreground"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Computador: tabela */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="w-32">Ingresso</TableHead>
              <TableHead className="w-28">Situação</TableHead>
              <TableHead className="w-40 text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-semibold">
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-md text-left outline-none hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      !member.ativo && "text-muted-foreground"
                    )}
                    onClick={() => setViewing(member)}
                  >
                    <MemberAvatar
                      nome={member.nome_completo}
                      fotoPath={member.foto_path}
                      size="lg"
                      className={cn(!member.ativo && "opacity-60")}
                    />
                    {member.nome_completo}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.cargo?.nome || "—"}
                </TableCell>
                <TableCell className="num font-type text-muted-foreground">
                  {member.telefone || "—"}
                </TableCell>
                <TableCell className="num font-type text-muted-foreground">
                  {member.data_ingresso
                    ? dateISOToBR(member.data_ingresso)
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge ativo={member.ativo} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                    >
                      <PencilIcon />
                      Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Mais ações para ${member.nome_completo}`}
                          />
                        }
                      >
                        <EllipsisVerticalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          disabled={updateMember.isPending}
                          onClick={() => handleToggleAtivo(member)}
                        >
                          {member.ativo ? <UserXIcon /> : <UserCheckIcon />}
                          {member.ativo ? "Inativar membro" : "Reativar membro"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setPending(member)}
                        >
                          <Trash2Icon />
                          Remover cadastro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MemberViewSheet
        member={viewing}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
        onToggleAtivo={(member) => {
          handleToggleAtivo(member)
          setViewing(null)
        }}
        togglingAtivo={updateMember.isPending}
        onDelete={(member) => {
          setViewing(null)
          setPending(member)
        }}
      />

      <DeleteMemberDialog
        member={pending}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMember.isPending}
      />
    </>
  )
}
