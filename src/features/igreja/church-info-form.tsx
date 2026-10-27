import * as React from "react"
import { z } from "zod"
import { CheckIcon } from "lucide-react"

import { Figure, Section } from "@/components/page"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TIPO_IMOVEL_LABEL,
  TIPO_IMOVEL_OPTIONS,
  type IgrejaTipoImovel,
} from "@/config/church"
import type { ChurchInfoInput } from "@/api/church-info"
import type { ChurchView } from "@/features/igreja/church-view"
import { useMemberCount } from "@/features/igreja/use-members"

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da igreja."),
  cnpj: z.string().trim().max(30, "CNPJ muito longo.").optional(),
  pastorPresidente: z.string().trim().max(120, "Nome muito longo.").optional(),
  endereco: z.string().trim().max(300, "Endereço muito longo.").optional(),
  quantidadeObreiros: z
    .number({ message: "Informe um número." })
    .int("Use um número inteiro.")
    .min(0, "Não pode ser negativo."),
  tipoImovel: z.enum(["propria", "alugada", "cedida"]),
})

type FieldErrors = Partial<Record<keyof ChurchView, string>>

/** Id do campo na tela para cada chave (foco no primeiro erro). */
const FIELD_IDS: Partial<Record<keyof FieldErrors, string>> = {
  nome: "nome",
  cnpj: "cnpj",
  pastorPresidente: "pastor",
  endereco: "endereco",
  quantidadeObreiros: "obreiros",
  tipoImovel: "tipo-imovel",
}

interface ChurchInfoFormProps {
  defaultValues: ChurchView
  onSubmit: (payload: ChurchInfoInput) => Promise<void> | void
  isSubmitting?: boolean
}

export function ChurchInfoForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: ChurchInfoFormProps) {
  const [nome, setNome] = React.useState(defaultValues.nome)
  const [cnpj, setCnpj] = React.useState(defaultValues.cnpj)
  const [pastorPresidente, setPastorPresidente] = React.useState(
    defaultValues.pastorPresidente
  )
  const [endereco, setEndereco] = React.useState(defaultValues.endereco)
  const memberCount = useMemberCount()
  const [quantidadeObreiros, setQuantidadeObreiros] = React.useState(
    String(defaultValues.quantidadeObreiros)
  )
  const [tipoImovel, setTipoImovel] = React.useState<IgrejaTipoImovel>(
    defaultValues.tipoImovel
  )
  const [errors, setErrors] = React.useState<FieldErrors>({})

  const errorCount = Object.keys(errors).length

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schema.safeParse({
      nome,
      cnpj: cnpj.trim() || undefined,
      pastorPresidente: pastorPresidente.trim() || undefined,
      endereco: endereco.trim() || undefined,
      quantidadeObreiros: Number(quantidadeObreiros),
      tipoImovel,
    })

    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      const first = result.error.issues[0]?.path[0]
      const firstId = first ? FIELD_IDS[first as keyof FieldErrors] : undefined
      if (firstId) document.getElementById(firstId)?.focus()
      return
    }

    setErrors({})
    await onSubmit({
      nome: result.data.nome,
      cnpj: result.data.cnpj ?? null,
      pastor_presidente: result.data.pastorPresidente ?? null,
      endereco: result.data.endereco ?? null,
      quantidade_obreiros: result.data.quantidadeObreiros,
      tipo_imovel: result.data.tipoImovel,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10" noValidate>
      <Section title="Identificação">
        <div className="flex flex-col gap-5">
          <Field id="nome" label="Nome da igreja" error={errors.nome}>
            <Input
              id="nome"
              value={nome}
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? "nome-erro" : undefined}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="cnpj" label="CNPJ" error={errors.cnpj}>
              <Input
                id="cnpj"
                className="num"
                inputMode="numeric"
                value={cnpj}
                aria-invalid={!!errors.cnpj}
                aria-describedby={errors.cnpj ? "cnpj-erro" : undefined}
                onChange={(e) => setCnpj(e.target.value)}
              />
            </Field>
            <Field
              id="pastor"
              label="Pastor presidente"
              error={errors.pastorPresidente}
            >
              <Input
                id="pastor"
                value={pastorPresidente}
                aria-invalid={!!errors.pastorPresidente}
                aria-describedby={
                  errors.pastorPresidente ? "pastor-erro" : undefined
                }
                onChange={(e) => setPastorPresidente(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Endereço">
        <Field id="endereco" label="Endereço completo" error={errors.endereco}>
          <Textarea
            id="endereco"
            value={endereco}
            placeholder="Rua, número, bairro, cidade, UF, CEP"
            aria-invalid={!!errors.endereco}
            aria-describedby={errors.endereco ? "endereco-erro" : undefined}
            onChange={(e) => setEndereco(e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Membros, obreiros e imóvel">
        <div className="flex flex-col gap-5">
          <div className="border-b border-rule pb-4">
            <Figure
              label="Quantidade de membros"
              value={
                memberCount.isLoading ? "…" : String(memberCount.data ?? 0)
              }
              hint="Calculado sozinho a partir dos membros ativos do cadastro."
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id="obreiros"
              label="Quantidade de obreiros"
              error={errors.quantidadeObreiros}
            >
              <Input
                id="obreiros"
                type="number"
                inputMode="numeric"
                min={0}
                className="num"
                value={quantidadeObreiros}
                aria-invalid={!!errors.quantidadeObreiros}
                aria-describedby={
                  errors.quantidadeObreiros ? "obreiros-erro" : undefined
                }
                onChange={(e) => setQuantidadeObreiros(e.target.value)}
              />
            </Field>
            <Field id="tipo-imovel" label="Tipo de imóvel">
              <Select
                items={TIPO_IMOVEL_LABEL}
                value={tipoImovel}
                onValueChange={(value) =>
                  setTipoImovel(value as IgrejaTipoImovel)
                }
              >
                <SelectTrigger
                  id="tipo-imovel"
                  className="w-full data-[size=default]:h-12"
                >
                  <SelectValue placeholder="Escolher o tipo de imóvel" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {TIPO_IMOVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </Section>

      {/* Barra de ação sempre ao alcance: fica acima da navegação no celular. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mr-4 -mb-6 -ml-7 border-t border-border bg-page sm:-mr-8 sm:-ml-12 lg:bottom-0 lg:-mr-10 lg:-mb-10 lg:-ml-14 lg:rounded-b-lg">
        <div className="flex flex-col gap-2.5 py-3 pr-4 pl-7 sm:flex-row sm:items-center sm:justify-between sm:pr-8 sm:pl-12 lg:pr-10 lg:pl-14">
          <p className="text-sm" aria-live="polite">
            {errorCount > 0 ? (
              <span className="font-semibold text-destructive">
                Corrija{" "}
                {errorCount === 1
                  ? "o campo marcado"
                  : `os ${errorCount} campos marcados`}{" "}
                em vermelho.
              </span>
            ) : (
              <span className="text-muted-foreground">
                Vale para os próximos relatórios gerados.
              </span>
            )}
          </p>
          <Button type="submit" className="sm:w-auto" disabled={isSubmitting}>
            <CheckIcon />
            {isSubmitting ? "Salvando..." : "Salvar informações"}
          </Button>
        </div>
      </div>
    </form>
  )
}

/** Rótulo em cima, campo, e o que corrigir embaixo. */
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-erro`} className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
