import { useNavigate, useParams } from "react-router"

import { Card, CardContent } from "@/components/ui/card"
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-lg font-medium">
          {isEditing ? "Editar membro" : "Novo membro"}
        </h1>
        <p className="text-xs text-muted-foreground">
          {isEditing
            ? "Atualize os dados do membro. Apenas o nome completo é obrigatório."
            : "Preencha os dados do membro. Apenas o nome completo é obrigatório."}
        </p>
      </div>

      {isEditing && isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isEditing && (isError || !member) ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            Não foi possível carregar o membro.
          </CardContent>
        </Card>
      ) : (
        <MemberForm
          member={member ?? undefined}
          onSubmit={handleSubmit}
          onCancel={handleDone}
          isSubmitting={createMember.isPending || updateMember.isPending}
        />
      )}
    </div>
  )
}
