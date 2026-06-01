import * as React from "react"
import { z } from "zod"

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

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da igreja."),
  cnpj: z.string().trim().max(30, "CNPJ muito longo.").optional(),
  pastorPresidente: z.string().trim().max(120, "Nome muito longo.").optional(),
  endereco: z.string().trim().max(300, "Endereço muito longo.").optional(),
  quantidadeMembros: z
    .number({ message: "Informe um número." })
    .int("Use um número inteiro.")
    .min(0, "Não pode ser negativo."),
  quantidadeObreiros: z
    .number({ message: "Informe um número." })
    .int("Use um número inteiro.")
    .min(0, "Não pode ser negativo."),
  tipoImovel: z.enum(["propria", "alugada", "cedida"]),
})

type FieldErrors = Partial<Record<keyof ChurchView, string>>

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
  const [quantidadeMembros, setQuantidadeMembros] = React.useState(
    String(defaultValues.quantidadeMembros)
  )
  const [quantidadeObreiros, setQuantidadeObreiros] = React.useState(
    String(defaultValues.quantidadeObreiros)
  )
  const [tipoImovel, setTipoImovel] = React.useState<IgrejaTipoImovel>(
    defaultValues.tipoImovel
  )
  const [errors, setErrors] = React.useState<FieldErrors>({})

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schema.safeParse({
      nome,
      cnpj: cnpj.trim() || undefined,
      pastorPresidente: pastorPresidente.trim() || undefined,
      endereco: endereco.trim() || undefined,
      quantidadeMembros: Number(quantidadeMembros),
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
      return
    }

    setErrors({})
    await onSubmit({
      nome: result.data.nome,
      cnpj: result.data.cnpj ?? null,
      pastor_presidente: result.data.pastorPresidente ?? null,
      endereco: result.data.endereco ?? null,
      quantidade_membros: result.data.quantidadeMembros,
      quantidade_obreiros: result.data.quantidadeObreiros,
      tipo_imovel: result.data.tipoImovel,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome da igreja</Label>
        <Input
          id="nome"
          className="h-9 text-sm"
          value={nome}
          aria-invalid={!!errors.nome}
          onChange={(e) => setNome(e.target.value)}
        />
        {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          className="h-9 text-sm"
          value={cnpj}
          aria-invalid={!!errors.cnpj}
          onChange={(e) => setCnpj(e.target.value)}
        />
        {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pastor">Pastor presidente</Label>
        <Input
          id="pastor"
          className="h-9 text-sm"
          value={pastorPresidente}
          aria-invalid={!!errors.pastorPresidente}
          onChange={(e) => setPastorPresidente(e.target.value)}
        />
        {errors.pastorPresidente && (
          <p className="text-xs text-destructive">{errors.pastorPresidente}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Textarea
          id="endereco"
          className="text-sm"
          value={endereco}
          aria-invalid={!!errors.endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />
        {errors.endereco && (
          <p className="text-xs text-destructive">{errors.endereco}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="membros">Quantidade de membros</Label>
          <Input
            id="membros"
            type="number"
            min={0}
            className="h-9 text-sm"
            value={quantidadeMembros}
            aria-invalid={!!errors.quantidadeMembros}
            onChange={(e) => setQuantidadeMembros(e.target.value)}
          />
          {errors.quantidadeMembros && (
            <p className="text-xs text-destructive">{errors.quantidadeMembros}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="obreiros">Quantidade de obreiros</Label>
          <Input
            id="obreiros"
            type="number"
            min={0}
            className="h-9 text-sm"
            value={quantidadeObreiros}
            aria-invalid={!!errors.quantidadeObreiros}
            onChange={(e) => setQuantidadeObreiros(e.target.value)}
          />
          {errors.quantidadeObreiros && (
            <p className="text-xs text-destructive">
              {errors.quantidadeObreiros}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tipo de imóvel</Label>
        <Select
          items={TIPO_IMOVEL_LABEL}
          value={tipoImovel}
          onValueChange={(value) => setTipoImovel(value as IgrejaTipoImovel)}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Selecione o tipo de imóvel" />
          </SelectTrigger>
          <SelectContent>
            {TIPO_IMOVEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar informações"}
      </Button>
    </form>
  )
}
