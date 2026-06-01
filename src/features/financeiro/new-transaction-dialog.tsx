import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TransactionForm } from "@/features/financeiro/transaction-form"

interface NewTransactionDialogProps {
  /** Tamanho do botão que abre o diálogo (padrão: default). */
  size?: React.ComponentProps<typeof Button>["size"]
}

/** Abre o formulário de novo lançamento em um diálogo (modal). */
export function NewTransactionDialog({ size }: NewTransactionDialogProps = {}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size={size} />}>
        <PlusIcon />
        Novo lançamento
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>
            Registre uma entrada ou saída financeira da igreja.
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
