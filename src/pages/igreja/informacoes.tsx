import { Page, PageHeader } from "@/components/page"
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
    <Page width="narrow">
      <PageHeader
        title="Informações da igreja"
        description="Dados institucionais usados no cabeçalho e no rodapé do relatório em PDF. As alterações passam a valer nos próximos relatórios gerados."
      />

      {isLoading ? (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {isError && (
            <div
              role="alert"
              className="flex flex-col gap-1 rounded-lg bg-warning-soft px-5 py-4"
            >
              <p className="text-base font-semibold text-warning">
                Não foi possível carregar os dados salvos.
              </p>
              <p className="text-base text-foreground/80">
                Os campos abaixo mostram os valores padrão. Verifique a
                internet e recarregue a página antes de salvar, para não
                substituir os dados atuais.
              </p>
            </div>
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
    </Page>
  )
}
