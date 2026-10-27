import * as React from "react"
import { Link } from "react-router"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Folha do livro: fundo branco com a linha de margem vermelha. Todo conteúdo
 * de página mora dentro de uma folha.
 */
export function Page({
  className,
  width = "default",
  children,
}: {
  className?: string
  width?: "narrow" | "default" | "wide"
  children: React.ReactNode
}) {
  return (
    <div className="lg:px-6">
    <div
      className={cn(
        "folha mx-auto min-h-full w-full lg:my-6 lg:min-h-[calc(100svh-3rem)] lg:rounded-lg lg:ring-1 lg:ring-border",
        width === "narrow" && "max-w-3xl",
        width === "default" && "max-w-5xl",
        width === "wide" && "max-w-7xl",
        className
      )}
    >
      <div className="flex flex-col gap-8 py-6 pr-4 pl-7 sm:pr-8 sm:pl-12 lg:py-10 lg:pr-10 lg:pl-14">
        {children}
      </div>
    </div>
    </div>
  )
}

/**
 * Cabeçalho da folha: título em serifa, uma linha de registro (data, nº,
 * contexto) e as ações principais.
 */
export function PageHeader({
  title,
  folio,
  description,
  actions,
  back,
  status,
}: {
  title: React.ReactNode
  /** Linha curta de registro: "Lição 4 · Folha nº 12". */
  folio?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: { to: string; label: string }
  status?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-2 border-b-2 border-foreground/80 pb-4 sm:gap-3 sm:pb-5">
      {back && (
        <Link
          to={back.to}
          className="-ml-1 inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-1 text-base font-semibold text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-5" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-heading text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.01em] sm:text-[2.5rem]">
              {title}
            </h1>
            {status}
          </div>
          {folio && (
            <p className="num font-heading text-[1.0625rem] text-muted-foreground italic sm:text-lg">
              {folio}
            </p>
          )}
          {description && (
            <p className="max-w-[60ch] text-base text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2.5 sm:shrink-0 sm:justify-end [&>*]:max-sm:flex-1">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

/**
 * Bloco da folha com cabeçalho pautado: título à esquerda, ação à direita,
 * uma linha embaixo. Mesmo formato em todas as telas.
 */
export function Section({
  title,
  count,
  action,
  description,
  className,
  children,
}: {
  title: React.ReactNode
  count?: React.ReactNode
  action?: React.ReactNode
  description?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1 border-b border-rule pb-2.5">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="font-heading text-2xl font-semibold">
            {title}
            {count !== undefined && (
              <span className="num ml-2 font-sans text-lg font-normal whitespace-nowrap text-muted-foreground">
                {count}
              </span>
            )}
          </h2>
          {action}
        </div>
        {description && (
          <p className="text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

/** Estado vazio que ensina o próximo passo. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-rule px-6 py-12 text-center",
        className
      )}
    >
      {Icon && <Icon className="size-10 text-primary/70" />}
      <div className="flex flex-col gap-1.5">
        <p className="font-heading text-xl font-semibold">{title}</p>
        {description && (
          <p className="mx-auto max-w-[44ch] text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

/** Mensagem de erro de carregamento, com o que fazer a seguir. */
export function ErrorState({
  title = "Não foi possível carregar.",
  error,
  action,
}: {
  title?: string
  error?: unknown
  action?: React.ReactNode
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg bg-danger-soft px-5 py-4 text-destructive"
    >
      <p className="text-base font-semibold">{title}</p>
      {error instanceof Error && (
        <p className="text-base text-foreground/80">{error.message}</p>
      )}
      <p className="text-base text-foreground/80">
        Verifique a internet e tente de novo. Se continuar, avise o responsável
        pelo sistema.
      </p>
      {action}
    </div>
  )
}

/**
 * Número que importa (total, saldo, contagem). Rótulo em cima, número em
 * serifa grande, alinhado em coluna.
 */
export function Figure({
  label,
  value,
  tone = "default",
  hint,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  tone?: "default" | "positive" | "negative" | "muted"
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span
        className={cn(
          "num font-heading text-[1.75rem] leading-tight font-semibold",
          tone === "positive" && "text-success",
          tone === "negative" && "text-destructive",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </span>
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
    </div>
  )
}

/**
 * Carimbo "Conferido": marca um registro fechado. Anima uma vez ao aparecer
 * (escala + giro curto); com movimento reduzido aparece direto.
 */
export function Stamp({
  children = "Conferido",
  detail,
  animate = false,
  className,
}: {
  children?: React.ReactNode
  detail?: React.ReactNode
  animate?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex -rotate-6 flex-col items-center rounded-md border-[3px] border-double border-margin px-3 py-1 text-margin uppercase select-none",
        animate && "animate-stamp",
        className
      )}
    >
      <span className="font-heading text-lg leading-none font-bold tracking-[0.12em]">
        {children}
      </span>
      {detail && (
        <span className="num mt-0.5 text-[0.75rem] leading-none font-semibold tracking-wider">
          {detail}
        </span>
      )}
    </span>
  )
}

export interface LedgerRow {
  label: React.ReactNode
  value: React.ReactNode
  tone?: "default" | "positive" | "negative" | "muted"
  hint?: React.ReactNode
}

/**
 * Lançamento em livro-caixa: rótulo à esquerda, número em serifa à direita,
 * pauta embaixo. `total` fecha a conta com a linha dupla acima.
 */
export function Ledger({
  rows,
  total,
  columns = 1,
  className,
}: {
  rows: LedgerRow[]
  total?: LedgerRow
  columns?: 1 | 2
  className?: string
}) {
  return (
    <dl className={cn("flex flex-col", className)}>
      <div className={cn("grid", columns === 2 && "sm:grid-cols-2 sm:gap-x-10")}>
        {rows.map((row, i) => (
          <LedgerLine key={i} row={row} />
        ))}
      </div>
      {total && <LedgerLine row={total} isTotal />}
    </dl>
  )
}

function LedgerLine({ row, isTotal }: { row: LedgerRow; isTotal?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        isTotal
          ? "mt-1 border-t-[3px] border-double border-foreground/70 pt-3"
          : "border-b border-rule py-3"
      )}
    >
      <dt className="flex flex-col">
        <span className={cn("text-base", isTotal ? "font-bold" : "font-semibold text-muted-foreground")}>
          {row.label}
        </span>
        {row.hint && <span className="text-sm text-muted-foreground">{row.hint}</span>}
      </dt>
      <dd
        className={cn(
          "num text-right font-heading leading-tight font-semibold",
          isTotal ? "text-[1.75rem]" : "text-[1.375rem]",
          row.tone === "positive" && "text-success",
          row.tone === "negative" && "text-destructive",
          row.tone === "muted" && "text-muted-foreground"
        )}
      >
        {row.value}
      </dd>
    </div>
  )
}
