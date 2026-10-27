import { Link, useNavigate, useParams } from "react-router"
import { UserXIcon } from "lucide-react"

import { EmptyState, Page, PageHeader } from "@/components/page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { MemberInput } from "@/api/members"
import { MemberForm } from "@/features/igreja/member-form"
import {
  useCreateMember,
  useMember,
  useUpdateMember,
} from "@/features/igreja/use-members"

/** Página de cadastro/edição de membro (rotas /novo e /:id/editar). */
export default function MembroFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: member, isLoading, isError } = useMember(id)
  const createMember = useCreateMember()
  const updateMember = useUpdateMember()

  function handleDone() {
    navigate("/igreja/membros")
  }

  async function handleSubmit(payload: MemberInput) {
    if (isEditing) {
      await updateMember.mutateAsync({ id, payload })
    } else {
      await createMember.mutateAsync(payload)
    }
    handleDone()
  }

  return (
    <Page width="narrow">
      <PageHeader
        back={{ to: "/igreja/membros", label: "Membros" }}
        title={isEditing ? "Editar membro" : "Novo membro"}
        folio={isEditing && member ? member.nome_completo : undefined}
        description={
          isEditing
            ? "Atualize os dados e toque em “Salvar alterações”."
            : "Preencha o que souber. Os outros dados podem ser completados depois."
        }
      />

      {isEditing && isLoading ? (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : isEditing && (isError || !member) ? (
        <EmptyState
          icon={UserXIcon}
          title="Membro não encontrado"
          description="Não foi possível carregar este cadastro. Ele pode ter sido removido, ou a internet caiu."
          action={
            <Button render={<Link to="/igreja/membros" />}>
              Voltar para a lista de membros
            </Button>
          }
        />
      ) : (
        <MemberForm
          member={member ?? undefined}
          onSubmit={handleSubmit}
          onCancel={handleDone}
          isSubmitting={createMember.isPending || updateMember.isPending}
        />
      )}
    </Page>
  )
}
