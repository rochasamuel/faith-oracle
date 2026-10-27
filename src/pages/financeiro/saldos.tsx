import { LandmarkIcon, Trash2Icon } from "lucide-react"

import {
  EmptyState,
  ErrorState,
  Page,
  PageHeader,
  Section,
} from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckpointForm } from "@/features/financeiro/checkpoint-form"
import {
  useBalanceCheckpoints,
  useDeleteCheckpoint,
  useUpsertCheckpoint,
} from "@/features/financeiro/use-balance-checkpoints"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { BalanceCheckpoint } from "@/api/balance-checkpoints"

export default function SaldosPage() {
  const { data, isLoading, isError, error } = useBalanceCheckpoints()
  const upsert = useUpsertCheckpoint()
  const remove = useDeleteCheckpoint()

  const list = data ?? []

  return (
    <Page width="narrow">
      <PageHeader
        title="Saldos iniciais"
        description="O saldo real da conta em datas-chave. Cada relatório parte do saldo mais recente até a data dele."
      />

      <Section
        title="Registrar saldo"
        description="Use o valor do extrato do banco. Se já houver um saldo nessa data, ele é substituído."
      >
        <CheckpointForm
          isSubmitting={upsert.isPending}
          onSubmit={async (payload) => {
            await upsert.mutateAsync(payload)
          }}
        />
      </Section>

      <Section
        title="Saldos registrados"
        count={data ? list.length : undefined}
      >
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-4 border-b border-rule py-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-28" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="Não foi possível carregar os saldos." error={error} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={LandmarkIcon}
            title="Nenhum saldo registrado"
            description="Informe acima o saldo real da conta em uma data. Os relatórios usam esse valor como ponto de partida."
          />
        ) : (
          <ul className="flex flex-col">
            {list.map((c, i) => (
              <li
                key={c.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-rule py-3.5"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="num font-type text-[1.125rem] font-bold">
                      {dateISOToBR(c.checkpoint_date)}
                    </span>
                    {i === 0 && <Badge variant="secondary">Mais recente</Badge>}
                  </p>
                  {c.notes && (
                    <p className="text-base break-words text-muted-foreground">
                      {c.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className={cn(
                      "num font-heading text-xl font-semibold whitespace-nowrap",
                      c.amount < 0 && "text-destructive"
                    )}
                  >
                    {formatBRL(c.amount)}
                  </span>
                  <DeleteCheckpointButton
                    checkpoint={c}
                    disabled={remove.isPending}
                    onConfirm={() => remove.mutate(c.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  )
}

function DeleteCheckpointButton({
  checkpoint,
  disabled,
  onConfirm,
}: {
  checkpoint: BalanceCheckpoint
  disabled: boolean
  onConfirm: () => void
}) {
  const data = dateISOToBR(checkpoint.checkpoint_date)
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 h-11 text-muted-foreground hover:text-destructive"
            disabled={disabled}
            aria-label={`Excluir saldo de ${data}`}
          />
        }
      >
        <Trash2Icon aria-hidden />
        Excluir
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir o saldo de {data}?</DialogTitle>
          <DialogDescription>
            O saldo de{" "}
            <strong className="num font-semibold text-foreground">
              {formatBRL(checkpoint.amount)}
            </strong>{" "}
            será apagado e os relatórios deixam de usar este valor como ponto
            de partida.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Voltar</Button>} />
          <DialogClose
            render={
              <Button variant="destructive" onClick={onConfirm}>
                <Trash2Icon aria-hidden />
                Sim, excluir saldo
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
