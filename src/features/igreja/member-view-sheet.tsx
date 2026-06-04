import * as React from "react"
import { useNavigate } from "react-router"
import { differenceInYears, parseISO } from "date-fns"
import { PencilIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { dateISOToBR } from "@/lib/date"
import type { Member } from "@/api/members"
import {
  ESCOLARIDADE_LABELS,
  ESTADO_CIVIL_COM_CONJUGE,
  ESTADO_CIVIL_LABELS,
} from "@/features/igreja/member-constants"
import { MemberAvatar } from "@/features/igreja/member-avatar"

/** Par rótulo/valor de leitura ("—" quando vazio). */
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm break-words">{value || "—"}</span>
    </div>
  )
}

function ViewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

/** Data ISO formatada como dd/mm/yyyy + idade ("22/03/1985 (41 anos)"). */
function dataNascimentoLabel(iso: string): string {
  const idade = differenceInYears(new Date(), parseISO(iso))
  return `${dateISOToBR(iso)} (${idade} anos)`
}

interface MemberViewSheetProps {
  /** Membro em visualização; null fecha o sheet. */
  member: Member | null
  onOpenChange: (open: boolean) => void
}

/** Painel lateral de visualização dos dados do membro (somente leitura). */
export function MemberViewSheet({ member, onOpenChange }: MemberViewSheetProps) {
  const navigate = useNavigate()

  const temConjuge =
    !!member?.estado_civil &&
    ESTADO_CIVIL_COM_CONJUGE.includes(member.estado_civil)

  return (
    <Sheet open={!!member} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {member && (
          <>
            <SheetHeader className="flex-row items-center gap-3">
              <MemberAvatar
                nome={member.nome_completo}
                fotoPath={member.foto_path}
                className="size-14 text-base"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <SheetTitle className="break-words">
                  {member.nome_completo}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-xs">
                  {member.cargo?.nome || "Sem cargo"}
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
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
              <ViewSection title="Dados pessoais">
                <Field
                  label="Data de nascimento"
                  value={
                    member.data_nascimento
                      ? dataNascimentoLabel(member.data_nascimento)
                      : null
                  }
                />
                <Field label="Naturalidade" value={member.naturalidade} />
                <Field
                  label="Estado civil"
                  value={
                    member.estado_civil
                      ? ESTADO_CIVIL_LABELS[member.estado_civil]
                      : null
                  }
                />
                {temConjuge && (
                  <Field label="Cônjuge" value={member.nome_conjuge} />
                )}
              </ViewSection>

              <ViewSection title="Documentos">
                <Field
                  label="RG"
                  value={
                    member.rg
                      ? [
                          member.rg,
                          [member.orgao_emissor, member.rg_uf]
                            .filter(Boolean)
                            .join("/"),
                        ]
                          .filter(Boolean)
                          .join(" — ")
                      : null
                  }
                />
                <Field label="CPF" value={member.cpf} />
              </ViewSection>

              <ViewSection title="Filiação">
                <Field label="Mãe" value={member.nome_mae} />
                <Field label="Pai" value={member.nome_pai} />
              </ViewSection>

              <ViewSection title="Formação e profissão">
                <Field
                  label="Escolaridade"
                  value={
                    member.escolaridade
                      ? ESCOLARIDADE_LABELS[member.escolaridade]
                      : null
                  }
                />
                <Field label="Profissão" value={member.profissao} />
              </ViewSection>

              <ViewSection title="Endereço">
                <div className="col-span-2">
                  <Field label="Endereço" value={member.endereco} />
                </div>
                <Field
                  label="Cidade/UF"
                  value={
                    [member.cidade, member.uf].filter(Boolean).join(" - ") ||
                    null
                  }
                />
                <Field label="CEP" value={member.cep} />
              </ViewSection>

              <ViewSection title="Contato">
                <Field label="Telefone" value={member.telefone} />
                <Field label="E-mail" value={member.email} />
              </ViewSection>

              <ViewSection title="Vida eclesiástica">
                <Field
                  label="Batizado(a) nas águas"
                  value={member.batizado_aguas ? "Sim" : "Não"}
                />
                {member.batizado_aguas && (
                  <>
                    <Field
                      label="Data do batismo"
                      value={
                        member.batismo_aguas_data
                          ? dateISOToBR(member.batismo_aguas_data)
                          : null
                      }
                    />
                    <Field
                      label="Igreja do batismo"
                      value={member.batismo_aguas_igreja}
                    />
                  </>
                )}
                <Field
                  label="Batizado(a) no Espírito Santo"
                  value={member.batizado_espirito_santo ? "Sim" : "Não"}
                />
                <Field
                  label="Ingresso na igreja"
                  value={
                    member.data_ingresso
                      ? dateISOToBR(member.data_ingresso)
                      : null
                  }
                />
              </ViewSection>
            </div>

            <SheetFooter className="flex-row border-t border-border sm:justify-end">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={() => navigate(`/igreja/membros/${member.id}/editar`)}
              >
                <PencilIcon />
                Editar
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
