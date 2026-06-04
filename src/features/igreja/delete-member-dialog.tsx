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
          <DialogTitle>Remover membro</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O cadastro será removido
            permanentemente. Para apenas tirá-lo da contagem, prefira inativar.
          </DialogDescription>
        </DialogHeader>

        {member && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{member.nome_completo}</span>
            </div>
            {member.cargo && (
              <div className="mt-1 flex justify-between gap-4">
                <span className="text-muted-foreground">Cargo</span>
                <span className="font-medium">{member.cargo.nome}</span>
              </div>
            )}
            {member.data_ingresso && (
              <div className="mt-1 flex justify-between gap-4">
                <span className="text-muted-foreground">Ingresso</span>
                <span className="font-medium">
                  {dateISOToBR(member.data_ingresso)}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
