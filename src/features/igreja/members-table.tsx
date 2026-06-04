import * as React from "react"
import { useNavigate } from "react-router"
import {
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

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="w-28">Ingresso</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow
                key={member.id}
                className={cn(!member.ativo && "opacity-60")}
              >
                <TableCell className="font-medium">
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-3 hover:underline"
                    onClick={() => setViewing(member)}
                  >
                    <MemberAvatar
                      nome={member.nome_completo}
                      fotoPath={member.foto_path}
                    />
                    {member.nome_completo}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {member.telefone || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.cargo?.nome || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {member.data_ingresso
                    ? dateISOToBR(member.data_ingresso)
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border",
                      member.ativo
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {member.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={
                        member.ativo ? "Inativar membro" : "Reativar membro"
                      }
                      disabled={updateMember.isPending}
                      onClick={() => handleToggleAtivo(member)}
                    >
                      {member.ativo ? (
                        <UserXIcon className="text-muted-foreground" />
                      ) : (
                        <UserCheckIcon className="text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar membro"
                      onClick={() =>
                        navigate(`/igreja/membros/${member.id}/editar`)
                      }
                    >
                      <PencilIcon className="text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remover membro"
                      onClick={() => setPending(member)}
                    >
                      <Trash2Icon className="text-muted-foreground" />
                    </Button>
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
