import * as React from "react"
import { useNavigate } from "react-router"
import { differenceInYears, parseISO } from "date-fns"
import { PencilIcon, Trash2Icon, UserCheckIcon, UserXIcon } from "lucide-react"

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
import { dateISOToBR } from "@/lib/date"
import type { Member } from "@/api/members"
import {
  ESCOLARIDADE_LABELS,
  ESTADO_CIVIL_COM_CONJUGE,
  ESTADO_CIVIL_LABELS,
} from "@/features/igreja/member-constants"
import { MemberAvatar } from "@/features/igreja/member-avatar"

/** Par rótulo/valor de leitura ("—" quando vazio). */
function Field({
  label,
  value,
  wide,
}: {
  label: string
  value?: string | null
  wide?: boolean
}) {
  return (
    <div className={wide ? "flex flex-col gap-0.5 sm:col-span-2" : "flex flex-col gap-0.5"}>
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-base break-words">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  )
}

/** Bloco pautado da ficha: título em serifa e uma linha embaixo. */
function ViewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="border-b border-rule pb-1.5 font-heading text-xl font-semibold">
        {title}
      </h3>
      <dl className="grid grid-cols-1 gap-x-5 gap-y-3.5 sm:grid-cols-2">
        {children}
      </dl>
    </section>
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
  /** Inativar/reativar a partir da ficha (opcional). */
  onToggleAtivo?: (member: Member) => void
  togglingAtivo?: boolean
  /** Pedir a remoção do cadastro a partir da ficha (opcional). */
  onDelete?: (member: Member) => void
}

/** Ficha do membro (somente leitura), com atalhos para editar. */
export function MemberViewSheet({
  member,
  onOpenChange,
  onToggleAtivo,
  togglingAtivo,
  onDelete,
}: MemberViewSheetProps) {
  const navigate = useNavigate()

  const temConjuge =
    !!member?.estado_civil &&
    ESTADO_CIVIL_COM_CONJUGE.includes(member.estado_civil)

  return (
    <Sheet open={!!member} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {member && (
          <>
            <SheetHeader className="flex-row items-center gap-4 border-b-2 border-foreground/80 px-5 pt-5 pr-16 pb-4">
              <MemberAvatar
                nome={member.nome_completo}
                fotoPath={member.foto_path}
                className="size-16 text-lg"
              />
              <div className="flex min-w-0 flex-col gap-1.5">
                <SheetTitle className="leading-tight break-words">
                  {member.nome_completo}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                  {member.cargo?.nome || "Sem cargo"}
                  <Badge variant={member.ativo ? "success" : "secondary"}>
                    {member.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 pt-1 pb-5">
              <ViewSection title="Contato">
                <Field label="Telefone" value={member.telefone} />
                <Field label="E-mail" value={member.email} />
              </ViewSection>

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
                <Field label="Endereço" value={member.endereco} wide />
                <Field
                  label="Cidade/UF"
                  value={
                    [member.cidade, member.uf].filter(Boolean).join(" - ") ||
                    null
                  }
                />
                <Field label="CEP" value={member.cep} />
              </ViewSection>

              <ViewSection title="Vida na igreja">
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

              {(onToggleAtivo || onDelete) && (
                <section className="flex flex-col gap-3">
                  <h3 className="border-b border-rule pb-1.5 font-heading text-xl font-semibold">
                    Situação do cadastro
                  </h3>
                  <p className="text-base text-muted-foreground">
                    Inativar tira o membro da contagem oficial, sem apagar os
                    dados.
                  </p>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    {onToggleAtivo && (
                      <Button
                        variant="outline"
                        disabled={togglingAtivo}
                        onClick={() => onToggleAtivo(member)}
                      >
                        {member.ativo ? <UserXIcon /> : <UserCheckIcon />}
                        {member.ativo ? "Inativar membro" : "Reativar membro"}
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        className="text-destructive hover:bg-danger-soft"
                        onClick={() => onDelete(member)}
                      >
                        <Trash2Icon />
                        Remover cadastro
                      </Button>
                    )}
                  </div>
                </section>
              )}
            </div>

            <SheetFooter className="flex-row gap-2.5 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => onOpenChange(false)}
              >
                Voltar
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={() => navigate(`/igreja/membros/${member.id}/editar`)}
              >
                <PencilIcon />
                Editar dados
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
