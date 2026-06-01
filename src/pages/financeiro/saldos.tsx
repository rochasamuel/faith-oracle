import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckpointForm } from "@/features/financeiro/checkpoint-form"
import {
  useBalanceCheckpoints,
  useDeleteCheckpoint,
  useUpsertCheckpoint,
} from "@/features/financeiro/use-balance-checkpoints"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"

export default function SaldosPage() {
  const { data, isLoading, isError } = useBalanceCheckpoints()
  const upsert = useUpsertCheckpoint()
  const remove = useDeleteCheckpoint()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-lg font-medium">Saldos iniciais</h1>
        <p className="text-xs text-muted-foreground">
          Saldo real da conta em datas-chave. Cada relatório usa o marco mais
          recente como ponto de partida.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo marco</CardTitle>
          <CardDescription>Informe a data e o saldo real da conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <CheckpointForm
            isSubmitting={upsert.isPending}
            onSubmit={async (payload) => {
              await upsert.mutateAsync(payload)
            }}
          />
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-24 w-full" />}
      {isError && <p className="text-sm text-destructive">Erro ao carregar marcos.</p>}

      <ul className="flex flex-col gap-2">
        {(data ?? []).map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-md border p-3 text-sm"
          >
            <span>
              {dateISOToBR(c.checkpoint_date)} —{" "}
              <strong>{formatBRL(c.amount)}</strong>
              {c.notes ? (
                <span className="text-muted-foreground"> · {c.notes}</span>
              ) : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate(c.id)}
            >
              Excluir
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
