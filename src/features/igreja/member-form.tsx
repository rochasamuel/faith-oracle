import * as React from "react"
import { z } from "zod"
import { ptBR } from "date-fns/locale"
import { parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { dateToISO, formatDateBR } from "@/lib/date"
import {
  deleteMemberPhoto,
  uploadMemberPhoto,
  type Member,
  type MemberInput,
} from "@/api/members"
import { MemberAvatar } from "@/features/igreja/member-avatar"
import {
  ESCOLARIDADE_LABELS,
  ESCOLARIDADE_OPTIONS,
  ESTADO_CIVIL_COM_CONJUGE,
  ESTADO_CIVIL_LABELS,
  ESTADO_CIVIL_OPTIONS,
  UF_ITEMS,
  UFS,
  type MemberEscolaridade,
  type MemberEstadoCivil,
} from "@/features/igreja/member-constants"
import {
  formatCEP,
  formatCPF,
  formatTelefone,
} from "@/features/igreja/member-format"
import { useCargos } from "@/features/igreja/use-members"

const schema = z.object({
  nomeCompleto: z.string().trim().min(1, "Informe o nome completo."),
  naturalidade: z.string().trim().max(120, "Naturalidade muito longa.").optional(),
  nomeConjuge: z.string().trim().max(160, "Nome muito longo.").optional(),
  rg: z.string().trim().max(20, "RG muito longo.").optional(),
  orgaoEmissor: z.string().trim().max(20, "Órgão emissor muito longo.").optional(),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF incompleto.")
    .optional(),
  nomeMae: z.string().trim().max(160, "Nome muito longo.").optional(),
  nomePai: z.string().trim().max(160, "Nome muito longo.").optional(),
  profissao: z.string().trim().max(120, "Profissão muito longa.").optional(),
  endereco: z.string().trim().max(300, "Endereço muito longo.").optional(),
  cidade: z.string().trim().max(120, "Cidade muito longa.").optional(),
  cep: z.string().regex(/^\d{5}-\d{3}$/, "CEP incompleto.").optional(),
  telefone: z.string().min(14, "Telefone incompleto.").optional(),
  email: z.email("E-mail inválido.").max(160, "E-mail muito longo.").optional(),
  batismoAguasIgreja: z.string().trim().max(160, "Nome muito longo.").optional(),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof schema>, string>>

interface MemberFormProps {
  /** Membro existente (edição); ausente na criação. */
  member?: Member
  onSubmit: (payload: MemberInput) => Promise<void> | void
  onCancel: () => void
  isSubmitting?: boolean
}

/** Campo de data com popover + calendário (anos via dropdown). */
function DateField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: Date | undefined
  onChange: (value: Date | undefined) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-9 w-full justify-start gap-2 font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="size-4" />
              {value ? formatDateBR(value) : "Selecione uma data"}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date()}
            selected={value}
            onSelect={(selected) => {
              onChange(selected)
              setOpen(false)
            }}
            locale={ptBR}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}

export function MemberForm({
  member,
  onSubmit,
  onCancel,
  isSubmitting,
}: MemberFormProps) {
  const { data: cargos } = useCargos()

  // Foto
  const fotoInputRef = React.useRef<HTMLInputElement>(null)
  const [fotoFile, setFotoFile] = React.useState<File | null>(null)
  const [fotoRemovida, setFotoRemovida] = React.useState(false)
  const [fotoError, setFotoError] = React.useState<string | null>(null)
  const [enviandoFoto, setEnviandoFoto] = React.useState(false)
  const fotoPreview = React.useMemo(
    () => (fotoFile ? URL.createObjectURL(fotoFile) : null),
    [fotoFile]
  )
  React.useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    }
  }, [fotoPreview])

  // Dados pessoais
  const [nomeCompleto, setNomeCompleto] = React.useState(
    member?.nome_completo ?? ""
  )
  const [dataNascimento, setDataNascimento] = React.useState<Date | undefined>(
    member?.data_nascimento ? parseISO(member.data_nascimento) : undefined
  )
  const [naturalidade, setNaturalidade] = React.useState(
    member?.naturalidade ?? ""
  )
  const [estadoCivil, setEstadoCivil] = React.useState<MemberEstadoCivil | null>(
    member?.estado_civil ?? null
  )
  const [nomeConjuge, setNomeConjuge] = React.useState(
    member?.nome_conjuge ?? ""
  )

  // Documentos
  const [rg, setRg] = React.useState(member?.rg ?? "")
  const [orgaoEmissor, setOrgaoEmissor] = React.useState(
    member?.orgao_emissor ?? ""
  )
  const [rgUf, setRgUf] = React.useState<string | null>(member?.rg_uf ?? null)
  const [cpf, setCpf] = React.useState(member?.cpf ?? "")

  // Filiação
  const [nomeMae, setNomeMae] = React.useState(member?.nome_mae ?? "")
  const [nomePai, setNomePai] = React.useState(member?.nome_pai ?? "")

  // Formação e profissão
  const [escolaridade, setEscolaridade] =
    React.useState<MemberEscolaridade | null>(member?.escolaridade ?? null)
  const [profissao, setProfissao] = React.useState(member?.profissao ?? "")

  // Endereço
  const [endereco, setEndereco] = React.useState(member?.endereco ?? "")
  const [cidade, setCidade] = React.useState(member?.cidade ?? "")
  const [uf, setUf] = React.useState<string | null>(member?.uf ?? null)
  const [cep, setCep] = React.useState(member?.cep ?? "")

  // Contato
  const [telefone, setTelefone] = React.useState(member?.telefone ?? "")
  const [email, setEmail] = React.useState(member?.email ?? "")

  // Vida eclesiástica
  const [batizadoAguas, setBatizadoAguas] = React.useState(
    member?.batizado_aguas ?? false
  )
  const [batismoAguasData, setBatismoAguasData] = React.useState<
    Date | undefined
  >(
    member?.batismo_aguas_data ? parseISO(member.batismo_aguas_data) : undefined
  )
  const [batismoAguasIgreja, setBatismoAguasIgreja] = React.useState(
    member?.batismo_aguas_igreja ?? ""
  )
  const [batizadoEspiritoSanto, setBatizadoEspiritoSanto] = React.useState(
    member?.batizado_espirito_santo ?? false
  )
  const [dataIngresso, setDataIngresso] = React.useState<Date | undefined>(
    member?.data_ingresso ? parseISO(member.data_ingresso) : undefined
  )
  const [cargoId, setCargoId] = React.useState<string | null>(
    member?.cargo_id ?? null
  )
  const [ativo, setAtivo] = React.useState(member?.ativo ?? true)

  const [errors, setErrors] = React.useState<FieldErrors>({})

  const temConjuge =
    estadoCivil !== null && ESTADO_CIVIL_COM_CONJUGE.includes(estadoCivil)

  const cargoItems = React.useMemo(
    () =>
      Object.fromEntries((cargos ?? []).map((cargo) => [cargo.id, cargo.nome])),
    [cargos]
  )

  function handleFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = "" // permite reescolher o mesmo arquivo
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setFotoError("Escolha um arquivo de imagem (JPG ou PNG).")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFotoError("A foto deve ter no máximo 5MB.")
      return
    }
    setFotoError(null)
    setFotoFile(file)
    setFotoRemovida(false)
  }

  function handleFotoRemove() {
    setFotoError(null)
    setFotoFile(null)
    setFotoRemovida(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const result = schema.safeParse({
      nomeCompleto,
      naturalidade: naturalidade.trim() || undefined,
      nomeConjuge: temConjuge ? nomeConjuge.trim() || undefined : undefined,
      rg: rg.trim() || undefined,
      orgaoEmissor: orgaoEmissor.trim() || undefined,
      cpf: cpf || undefined,
      nomeMae: nomeMae.trim() || undefined,
      nomePai: nomePai.trim() || undefined,
      profissao: profissao.trim() || undefined,
      endereco: endereco.trim() || undefined,
      cidade: cidade.trim() || undefined,
      cep: cep || undefined,
      telefone: telefone || undefined,
      email: email.trim() || undefined,
      batismoAguasIgreja: batizadoAguas
        ? batismoAguasIgreja.trim() || undefined
        : undefined,
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

    // Envia a nova foto (se houver) antes de salvar o membro.
    let fotoPath = member?.foto_path ?? null
    if (fotoFile) {
      setEnviandoFoto(true)
      try {
        fotoPath = await uploadMemberPhoto(fotoFile)
      } catch (uploadError) {
        setFotoError(
          uploadError instanceof Error
            ? `Não foi possível enviar a foto: ${uploadError.message}`
            : "Não foi possível enviar a foto."
        )
        return
      } finally {
        setEnviandoFoto(false)
      }
    } else if (fotoRemovida) {
      fotoPath = null
    }

    await onSubmit({
      foto_path: fotoPath,
      nome_completo: result.data.nomeCompleto,
      data_nascimento: dataNascimento ? dateToISO(dataNascimento) : null,
      naturalidade: result.data.naturalidade ?? null,
      estado_civil: estadoCivil,
      nome_conjuge: result.data.nomeConjuge ?? null,
      rg: result.data.rg ?? null,
      orgao_emissor: result.data.orgaoEmissor ?? null,
      rg_uf: rgUf,
      cpf: result.data.cpf ?? null,
      nome_mae: result.data.nomeMae ?? null,
      nome_pai: result.data.nomePai ?? null,
      escolaridade,
      profissao: result.data.profissao ?? null,
      endereco: result.data.endereco ?? null,
      cidade: result.data.cidade ?? null,
      uf,
      cep: result.data.cep ?? null,
      telefone: result.data.telefone ?? null,
      email: result.data.email ?? null,
      batizado_aguas: batizadoAguas,
      batismo_aguas_data:
        batizadoAguas && batismoAguasData ? dateToISO(batismoAguasData) : null,
      batismo_aguas_igreja: result.data.batismoAguasIgreja ?? null,
      batizado_espirito_santo: batizadoEspiritoSanto,
      data_ingresso: dataIngresso ? dateToISO(dataIngresso) : null,
      cargo_id: cargoId,
      ativo,
    })

    // Salvou: remove do storage a foto antiga substituída/removida (best-effort).
    if (member?.foto_path && member.foto_path !== fotoPath) {
      void deleteMemberPhoto(member.foto_path).catch(() => {})
    }
  }

  const fotoAtualSrc = fotoPreview
  const fotoAtualPath =
    !fotoPreview && !fotoRemovida ? (member?.foto_path ?? null) : null
  const temFoto = !!fotoAtualSrc || !!fotoAtualPath

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <FormSection title="Foto">
        <div className="flex items-center gap-4">
          <MemberAvatar
            nome={nomeCompleto || "?"}
            fotoPath={fotoAtualPath}
            src={fotoAtualSrc}
            className="size-20 text-lg"
          />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fotoInputRef.current?.click()}
              >
                {temFoto ? "Trocar foto" : "Escolher foto"}
              </Button>
              {temFoto && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFotoRemove}
                >
                  Remover
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Imagem JPG ou PNG de até 5MB.
            </p>
            {fotoError && (
              <p className="text-xs text-destructive">{fotoError}</p>
            )}
          </div>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFotoChange}
          />
        </div>
      </FormSection>

      <FormSection title="Dados pessoais">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nome-completo">Nome completo</Label>
          <Input
            id="nome-completo"
            className="h-9 text-sm"
            value={nomeCompleto}
            aria-invalid={!!errors.nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
          />
          {errors.nomeCompleto && (
            <p className="text-xs text-destructive">{errors.nomeCompleto}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateField
            label="Data de nascimento"
            value={dataNascimento}
            onChange={setDataNascimento}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="naturalidade">Naturalidade</Label>
            <Input
              id="naturalidade"
              className="h-9 text-sm"
              value={naturalidade}
              aria-invalid={!!errors.naturalidade}
              onChange={(e) => setNaturalidade(e.target.value)}
            />
            {errors.naturalidade && (
              <p className="text-xs text-destructive">{errors.naturalidade}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Estado civil</Label>
            <Select
              items={ESTADO_CIVIL_LABELS}
              value={estadoCivil}
              onValueChange={(value) =>
                setEstadoCivil(value as MemberEstadoCivil)
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADO_CIVIL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-conjuge">Nome do cônjuge</Label>
            <Input
              id="nome-conjuge"
              className="h-9 text-sm"
              value={temConjuge ? nomeConjuge : ""}
              disabled={!temConjuge}
              aria-invalid={!!errors.nomeConjuge}
              onChange={(e) => setNomeConjuge(e.target.value)}
            />
            {errors.nomeConjuge && (
              <p className="text-xs text-destructive">{errors.nomeConjuge}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Documentos">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rg">RG</Label>
            <Input
              id="rg"
              className="h-9 text-sm"
              value={rg}
              aria-invalid={!!errors.rg}
              onChange={(e) => setRg(e.target.value)}
            />
            {errors.rg && <p className="text-xs text-destructive">{errors.rg}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="orgao-emissor">Órgão emissor</Label>
            <Input
              id="orgao-emissor"
              className="h-9 text-sm"
              value={orgaoEmissor}
              aria-invalid={!!errors.orgaoEmissor}
              onChange={(e) => setOrgaoEmissor(e.target.value)}
            />
            {errors.orgaoEmissor && (
              <p className="text-xs text-destructive">{errors.orgaoEmissor}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>UF do RG</Label>
            <Select
              items={UF_ITEMS}
              value={rgUf}
              onValueChange={(value) => setRgUf(value as string)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((sigla) => (
                  <SelectItem key={sigla} value={sigla}>
                    {sigla}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              className="h-9 text-sm"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              aria-invalid={!!errors.cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
            />
            {errors.cpf && (
              <p className="text-xs text-destructive">{errors.cpf}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Filiação">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-mae">Nome da mãe</Label>
            <Input
              id="nome-mae"
              className="h-9 text-sm"
              value={nomeMae}
              aria-invalid={!!errors.nomeMae}
              onChange={(e) => setNomeMae(e.target.value)}
            />
            {errors.nomeMae && (
              <p className="text-xs text-destructive">{errors.nomeMae}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-pai">Nome do pai</Label>
            <Input
              id="nome-pai"
              className="h-9 text-sm"
              value={nomePai}
              aria-invalid={!!errors.nomePai}
              onChange={(e) => setNomePai(e.target.value)}
            />
            {errors.nomePai && (
              <p className="text-xs text-destructive">{errors.nomePai}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Formação e profissão">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Escolaridade</Label>
            <Select
              items={ESCOLARIDADE_LABELS}
              value={escolaridade}
              onValueChange={(value) =>
                setEscolaridade(value as MemberEscolaridade)
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESCOLARIDADE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profissao">Profissão</Label>
            <Input
              id="profissao"
              className="h-9 text-sm"
              value={profissao}
              aria-invalid={!!errors.profissao}
              onChange={(e) => setProfissao(e.target.value)}
            />
            {errors.profissao && (
              <p className="text-xs text-destructive">{errors.profissao}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Endereço">
        <div className="flex flex-col gap-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            className="h-9 text-sm"
            placeholder="Rua, número, complemento, bairro"
            value={endereco}
            aria-invalid={!!errors.endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
          {errors.endereco && (
            <p className="text-xs text-destructive">{errors.endereco}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              className="h-9 text-sm"
              value={cidade}
              aria-invalid={!!errors.cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            {errors.cidade && (
              <p className="text-xs text-destructive">{errors.cidade}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>UF</Label>
            <Select
              items={UF_ITEMS}
              value={uf}
              onValueChange={(value) => setUf(value as string)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {UFS.map((sigla) => (
                  <SelectItem key={sigla} value={sigla}>
                    {sigla}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              className="h-9 text-sm"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              aria-invalid={!!errors.cep}
              onChange={(e) => setCep(formatCEP(e.target.value))}
            />
            {errors.cep && (
              <p className="text-xs text-destructive">{errors.cep}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Contato">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              className="h-9 text-sm"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              aria-invalid={!!errors.telefone}
              onChange={(e) => setTelefone(formatTelefone(e.target.value))}
            />
            {errors.telefone && (
              <p className="text-xs text-destructive">{errors.telefone}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              className="h-9 text-sm"
              value={email}
              aria-invalid={!!errors.email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Vida eclesiástica">
        <div className="flex items-center gap-2">
          <Checkbox
            id="batizado-aguas"
            checked={batizadoAguas}
            onCheckedChange={(checked) => setBatizadoAguas(checked === true)}
          />
          <Label htmlFor="batizado-aguas">Batizado(a) nas águas</Label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateField
            label="Data do batismo"
            value={batizadoAguas ? batismoAguasData : undefined}
            onChange={setBatismoAguasData}
            disabled={!batizadoAguas}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="batismo-igreja">Igreja do batismo</Label>
            <Input
              id="batismo-igreja"
              className="h-9 text-sm"
              value={batizadoAguas ? batismoAguasIgreja : ""}
              disabled={!batizadoAguas}
              aria-invalid={!!errors.batismoAguasIgreja}
              onChange={(e) => setBatismoAguasIgreja(e.target.value)}
            />
            {errors.batismoAguasIgreja && (
              <p className="text-xs text-destructive">
                {errors.batismoAguasIgreja}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="batizado-espirito"
            checked={batizadoEspiritoSanto}
            onCheckedChange={(checked) =>
              setBatizadoEspiritoSanto(checked === true)
            }
          />
          <Label htmlFor="batizado-espirito">
            Batizado(a) no Espírito Santo
          </Label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateField
            label="Data de ingresso na igreja"
            value={dataIngresso}
            onChange={setDataIngresso}
          />
          <div className="flex flex-col gap-2">
            <Label>Cargo</Label>
            <Select
              items={cargoItems}
              value={cargoId}
              onValueChange={(value) => setCargoId(value as string)}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(cargos ?? []).map((cargo) => (
                  <SelectItem key={cargo.id} value={cargo.id}>
                    {cargo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="ativo"
            checked={ativo}
            onCheckedChange={(checked) => setAtivo(checked === true)}
          />
          <Label htmlFor="ativo">Membro ativo</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Apenas membros ativos entram na contagem oficial exibida nas
          configurações e no relatório.
        </p>
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || enviandoFoto}>
          {isSubmitting || enviandoFoto
            ? "Salvando..."
            : member
              ? "Salvar alterações"
              : "Cadastrar membro"}
        </Button>
      </div>
    </form>
  )
}
