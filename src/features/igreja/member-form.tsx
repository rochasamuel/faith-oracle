import * as React from "react"
import { z } from "zod"
import { ptBR } from "date-fns/locale"
import { parseISO } from "date-fns"
import { CalendarIcon, CheckIcon } from "lucide-react"

import { Section } from "@/components/page"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value: Date | undefined
  onChange: (value: Date | undefined) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start gap-2.5 px-3.5 text-[1.0625rem] font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="text-muted-foreground" />
              <span className="num">
                {value ? formatDateBR(value) : "Escolher a data"}
              </span>
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

/** Campo de texto com rótulo em cima e mensagem de erro embaixo. */
function TextField({
  id,
  label,
  error,
  hint,
  ...inputProps
}: Omit<React.ComponentProps<typeof Input>, "id"> & {
  id: string
  label: string
  error?: string
  hint?: string
}) {
  const describedBy = error ? `${id}-erro` : hint ? `${id}-dica` : undefined
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-erro`} className="text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-dica`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** Campo de escolha (Select) com rótulo em cima. */
function SelectField({
  id,
  label,
  items,
  value,
  onValueChange,
  placeholder,
  children,
}: {
  id: string
  label: string
  items: Record<string, string>
  value: string | null
  onValueChange: (value: string) => void
  placeholder: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => onValueChange(next as string)}
      >
        <SelectTrigger id={id} className="w-full data-[size=default]:h-12">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>{children}</SelectContent>
      </Select>
    </div>
  )
}

/** Caixa de marcar com a linha inteira clicável (alvo ≥ 44px). */
function CheckField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
      />
      <Label htmlFor={id} className="min-h-11 flex-1 cursor-pointer">
        {label}
      </Label>
    </div>
  )
}

/** Id do campo na tela para cada chave do schema (foco no primeiro erro). */
const FIELD_IDS: Record<keyof FieldErrors, string> = {
  nomeCompleto: "nome-completo",
  naturalidade: "naturalidade",
  nomeConjuge: "nome-conjuge",
  rg: "rg",
  orgaoEmissor: "orgao-emissor",
  cpf: "cpf",
  nomeMae: "nome-mae",
  nomePai: "nome-pai",
  profissao: "profissao",
  endereco: "endereco",
  cidade: "cidade",
  cep: "cep",
  telefone: "telefone",
  email: "email",
  batismoAguasIgreja: "batismo-igreja",
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
      const first = result.error.issues[0]?.path[0] as
        | keyof FieldErrors
        | undefined
      if (first) document.getElementById(FIELD_IDS[first])?.focus()
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

  const salvando = isSubmitting || enviandoFoto
  const errorCount = Object.keys(errors).length + (fotoError ? 1 : 0)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10" noValidate>
      <Section title="Dados pessoais">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <MemberAvatar
              nome={nomeCompleto || "?"}
              fotoPath={fotoAtualPath}
              src={fotoAtualSrc}
              className="size-24 text-xl"
            />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
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
                    Tirar a foto
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Opcional. Imagem JPG ou PNG de até 5MB.
              </p>
              {fotoError && (
                <p role="alert" className="text-sm font-semibold text-destructive">
                  {fotoError}
                </p>
              )}
            </div>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Escolher foto do membro"
              onChange={handleFotoChange}
            />
          </div>

          <TextField
            id="nome-completo"
            label="Nome completo"
            autoComplete="off"
            value={nomeCompleto}
            error={errors.nomeCompleto}
            hint="Obrigatório."
            onChange={(e) => setNomeCompleto(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DateField
              id="data-nascimento"
              label="Data de nascimento"
              value={dataNascimento}
              onChange={setDataNascimento}
            />
            <TextField
              id="naturalidade"
              label="Naturalidade"
              placeholder="Cidade onde nasceu"
              value={naturalidade}
              error={errors.naturalidade}
              onChange={(e) => setNaturalidade(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SelectField
              id="estado-civil"
              label="Estado civil"
              items={ESTADO_CIVIL_LABELS}
              value={estadoCivil}
              onValueChange={(value) =>
                setEstadoCivil(value as MemberEstadoCivil)
              }
              placeholder="Escolher"
            >
              {ESTADO_CIVIL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectField>
            <TextField
              id="nome-conjuge"
              label="Nome do cônjuge"
              value={temConjuge ? nomeConjuge : ""}
              disabled={!temConjuge}
              error={errors.nomeConjuge}
              hint={temConjuge ? undefined : "Disponível para casados ou em união estável."}
              onChange={(e) => setNomeConjuge(e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section title="Contato">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id="telefone"
            label="Telefone"
            className="num"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={telefone}
            error={errors.telefone}
            onChange={(e) => setTelefone(formatTelefone(e.target.value))}
          />
          <TextField
            id="email"
            label="E-mail"
            type="email"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Endereço">
        <div className="flex flex-col gap-5">
          <TextField
            id="endereco"
            label="Endereço"
            placeholder="Rua, número, complemento, bairro"
            value={endereco}
            error={errors.endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_8rem_10rem]">
            <TextField
              id="cidade"
              label="Cidade"
              value={cidade}
              error={errors.cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <SelectField
              id="uf"
              label="UF"
              items={UF_ITEMS}
              value={uf}
              onValueChange={setUf}
              placeholder="UF"
            >
              {UFS.map((sigla) => (
                <SelectItem key={sigla} value={sigla}>
                  {sigla}
                </SelectItem>
              ))}
            </SelectField>
            <TextField
              id="cep"
              label="CEP"
              className="num"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              error={errors.cep}
              onChange={(e) => setCep(formatCEP(e.target.value))}
            />
          </div>
        </div>
      </Section>

      <Section title="Vida na igreja">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SelectField
              id="cargo"
              label="Cargo"
              items={cargoItems}
              value={cargoId}
              onValueChange={setCargoId}
              placeholder="Sem cargo"
            >
              {(cargos ?? []).map((cargo) => (
                <SelectItem key={cargo.id} value={cargo.id}>
                  {cargo.nome}
                </SelectItem>
              ))}
            </SelectField>
            <DateField
              id="data-ingresso"
              label="Data de ingresso na igreja"
              value={dataIngresso}
              onChange={setDataIngresso}
            />
          </div>

          <div className="flex flex-col gap-1 border-t border-rule pt-4">
            <CheckField
              id="batizado-aguas"
              label="Batizado(a) nas águas"
              checked={batizadoAguas}
              onCheckedChange={setBatizadoAguas}
            />
            <div className="grid grid-cols-1 gap-5 pt-2 sm:grid-cols-2">
              <DateField
                id="batismo-data"
                label="Data do batismo"
                value={batizadoAguas ? batismoAguasData : undefined}
                onChange={setBatismoAguasData}
                disabled={!batizadoAguas}
              />
              <TextField
                id="batismo-igreja"
                label="Igreja do batismo"
                value={batizadoAguas ? batismoAguasIgreja : ""}
                disabled={!batizadoAguas}
                error={errors.batismoAguasIgreja}
                onChange={(e) => setBatismoAguasIgreja(e.target.value)}
              />
            </div>
            {!batizadoAguas && (
              <p className="pt-1 text-sm text-muted-foreground">
                Marque “Batizado(a) nas águas” para preencher a data e a igreja.
              </p>
            )}
          </div>

          <div className="border-t border-rule pt-4">
            <CheckField
              id="batizado-espirito"
              label="Batizado(a) no Espírito Santo"
              checked={batizadoEspiritoSanto}
              onCheckedChange={setBatizadoEspiritoSanto}
            />
          </div>

          <div className="flex flex-col gap-1 border-t border-rule pt-4">
            <CheckField
              id="ativo"
              label="Membro ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
            <p className="text-sm text-muted-foreground">
              Apenas membros ativos entram na contagem oficial exibida nas
              informações da igreja e no relatório.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Documentos">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_1fr_8rem]">
            <TextField
              id="rg"
              label="RG"
              className="num"
              value={rg}
              error={errors.rg}
              onChange={(e) => setRg(e.target.value)}
            />
            <TextField
              id="orgao-emissor"
              label="Órgão emissor"
              placeholder="Ex.: SSP"
              value={orgaoEmissor}
              error={errors.orgaoEmissor}
              onChange={(e) => setOrgaoEmissor(e.target.value)}
            />
            <SelectField
              id="rg-uf"
              label="UF do RG"
              items={UF_ITEMS}
              value={rgUf}
              onValueChange={setRgUf}
              placeholder="UF"
            >
              {UFS.map((sigla) => (
                <SelectItem key={sigla} value={sigla}>
                  {sigla}
                </SelectItem>
              ))}
            </SelectField>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              id="cpf"
              label="CPF"
              className="num"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              error={errors.cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
            />
          </div>
        </div>
      </Section>

      <Section title="Filiação">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id="nome-mae"
            label="Nome da mãe"
            value={nomeMae}
            error={errors.nomeMae}
            onChange={(e) => setNomeMae(e.target.value)}
          />
          <TextField
            id="nome-pai"
            label="Nome do pai"
            value={nomePai}
            error={errors.nomePai}
            onChange={(e) => setNomePai(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Formação e profissão">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField
            id="escolaridade"
            label="Escolaridade"
            items={ESCOLARIDADE_LABELS}
            value={escolaridade}
            onValueChange={(value) =>
              setEscolaridade(value as MemberEscolaridade)
            }
            placeholder="Escolher"
          >
            {ESCOLARIDADE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectField>
          <TextField
            id="profissao"
            label="Profissão"
            value={profissao}
            error={errors.profissao}
            onChange={(e) => setProfissao(e.target.value)}
          />
        </div>
      </Section>

      {/* Barra de ação sempre ao alcance: fica acima da navegação no celular. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mr-4 -mb-6 -ml-7 border-t border-border bg-page sm:-mr-8 sm:-ml-12 lg:bottom-0 lg:-mr-10 lg:-mb-10 lg:-ml-14 lg:rounded-b-lg">
        <div className="flex flex-col gap-2.5 py-3 pr-4 pl-7 sm:flex-row sm:items-center sm:justify-between sm:pr-8 sm:pl-12 lg:pr-10 lg:pl-14">
          <p className="text-sm" aria-live="polite">
            {errorCount > 0 ? (
              <span className="font-semibold text-destructive">
                Corrija {errorCount === 1 ? "o campo marcado" : `os ${errorCount} campos marcados`}{" "}
                em vermelho.
              </span>
            ) : (
              <span className="text-muted-foreground">
                Só o nome completo é obrigatório.
              </span>
            )}
          </p>
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-[2] sm:flex-none"
              disabled={salvando}
            >
              <CheckIcon />
              {salvando
                ? "Salvando..."
                : member
                  ? "Salvar alterações"
                  : "Cadastrar membro"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
