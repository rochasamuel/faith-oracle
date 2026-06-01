import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChurchInfoForm } from "@/features/igreja/church-info-form"
import { toChurchView } from "@/features/igreja/church-view"
import {
  useChurchInfo,
  useUpsertChurchInfo,
} from "@/features/igreja/use-church-info"

export default function InformacoesPage() {
  const { data, isLoading, isError } = useChurchInfo()
  const upsert = useUpsertChurchInfo()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-lg font-medium">
          Informações da igreja
        </h1>
        <p className="text-xs text-muted-foreground">
          Dados institucionais usados no cabeçalho e no rodapé do relatório em
          PDF. Alterações aqui passam a valer nos próximos relatórios gerados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da igreja</CardTitle>
          <CardDescription>
            Edite e salve. Os campos já vêm preenchidos com os dados atuais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <>
              {isError && (
                <p className="mb-4 text-xs text-destructive">
                  Não foi possível carregar do servidor; exibindo os valores
                  padrão.
                </p>
              )}
              <ChurchInfoForm
                defaultValues={toChurchView(data ?? null)}
                isSubmitting={upsert.isPending}
                onSubmit={async (payload) => {
                  await upsert.mutateAsync(payload)
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
