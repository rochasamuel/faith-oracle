import { Trash2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Member } from "@/api/members"
import { dateISOToBR } from "@/lib/date"

interface DeleteMemberDialogProps {
  member: Member | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteMemberDialog({
  member,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteMemberDialogProps) {
  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover o cadastro deste membro?</DialogTitle>
          <DialogDescription>
            O cadastro será apagado de vez e não pode ser recuperado. Para
            apenas tirar o membro da contagem, use “Inativar membro”.
          </DialogDescription>
        </DialogHeader>

        {member && (
          <dl className="flex flex-col border-t border-rule">
            <div className="flex justify-between gap-4 border-b border-rule py-2.5">
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="text-right font-semibold">
                {member.nome_completo}
              </dd>
            </div>
            {member.cargo && (
              <div className="flex justify-between gap-4 border-b border-rule py-2.5">
                <dt className="text-muted-foreground">Cargo</dt>
                <dd className="text-right font-semibold">{member.cargo.nome}</dd>
              </div>
            )}
            {member.data_ingresso && (
              <div className="flex justify-between gap-4 border-b border-rule py-2.5">
                <dt className="text-muted-foreground">Ingresso</dt>
                <dd className="num font-type text-right font-bold">
                  {dateISOToBR(member.data_ingresso)}
                </dd>
              </div>
            )}
          </dl>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Voltar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            <Trash2Icon />
            {isDeleting ? "Removendo..." : "Sim, remover cadastro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
