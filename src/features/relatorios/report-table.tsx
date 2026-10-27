import * as React from "react"
import { toast } from "sonner"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  Loader2Icon,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Stamp } from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { parseISO } from "date-fns"

import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"
import { getBalanceBefore, listTransactionsInPeriod } from "@/api/transactions"
import { countActiveMembers } from "@/api/members"
import type { Report } from "@/api/reports"
import {
  formatReferenceLabel,
  REPORT_PERIOD_TYPE_LABELS,
  REPORT_STATUS_LABELS,
} from "@/features/relatorios/constants"
import { useInvalidateReport } from "@/features/relatorios/hooks"
import { InvalidateReportDialog } from "@/features/relatorios/invalidate-report-dialog"
import { downloadBlob, slugify } from "@/features/relatorios/report-download"
import { buildReportSummary } from "@/features/relatorios/report-summary"
import { reportPdfBlob } from "@/features/relatorios/report-pdf-blob"
import { useChurchInfo } from "@/features/igreja/use-church-info"
import { toChurchView } from "@/features/igreja/church-view"
import { formatReportPdfTitle } from "@/features/relatorios/report-title"
import type {
  ReportSortKey,
  ReportSortState,
} from "@/features/relatorios/sorting"

interface ReportTableProps {
  reports: Report[]
  sort: ReportSortState
  onToggleSort: (key: ReportSortKey) => void
}

function SortableHead({
  label,
  sortKey,
  sort,
  onToggleSort,
  className,
}: {
  label: string
  sortKey: ReportSortKey
  sort: ReportSortState
  onToggleSort: (key: ReportSortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = !active
    ? ChevronsUpDownIcon
    : sort.dir === "asc"
      ? ArrowUpIcon
      : ArrowDownIcon

  return (
    <TableHead
      className={className}
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
      }
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "-mx-3 gap-1.5 text-muted-foreground",
          active && "text-foreground"
        )}
        onClick={() => onToggleSort(sortKey)}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <Icon
          aria-hidden
          className={cn("size-4", active ? "opacity-100" : "opacity-50")}
        />
      </Button>
    </TableHead>
  )
}

export function ReportTable({ reports, sort, onToggleSort }: ReportTableProps) {
  const invalidateReport = useInvalidateReport()
  const { data: churchData } = useChurchInfo()
  const [pending, setPending] = React.useState<Report | null>(null)
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)

  async function handleDownload(report: Report) {
    setDownloadingId(report.id)
    try {
      const [transactions, saldoInicial, quantidadeMembros] =
        await Promise.all([
          listTransactionsInPeriod(report.period_start, report.period_end),
          getBalanceBefore(report.period_start),
          countActiveMembers(),
        ])
      const summary = buildReportSummary(report, transactions, saldoInicial)
      const blob = await reportPdfBlob({
        report,
        summary,
        conferredAt: parseISO(report.conferred_at ?? report.created_at),
        generatedAt: new Date(),
        // A contagem oficial de membros vem do cadastro (apenas ativos).
        church: { ...toChurchView(churchData ?? null), quantidadeMembros },
      })
      downloadBlob(`${slugify(formatReportPdfTitle(report))}.pdf`, blob)
    } catch (error) {
      toast.error("Não foi possível gerar o arquivo.", {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setDownloadingId(null)
    }
  }

  function handleConfirmInvalidate(reason: string) {
    if (!pending) return
    invalidateReport.mutate(
      { id: pending.id, reason: reason || null },
      { onSuccess: () => setPending(null) }
    )
  }

  return (
    <>
      {/* md+: tabela pautada */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead
                label="Referência"
                sortKey="reference"
                sort={sort}
                onToggleSort={onToggleSort}
              />
              <TableHead>Período</TableHead>
              <SortableHead
                label="Status"
                sortKey="status"
                sort={sort}
                onToggleSort={onToggleSort}
              />
              <SortableHead
                label="Saldo"
                sortKey="balance"
                sort={sort}
                onToggleSort={onToggleSort}
                className="text-right [&>button]:ml-auto"
              />
              <SortableHead
                label="Gerado em"
                sortKey="created_at"
                sort={sort}
                onToggleSort={onToggleSort}
              />
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const invalidated = report.status === "invalidado"
              return (
                <TableRow key={report.id}>
                  <TableCell className="py-3.5">
                    <p
                      className={cn(
                        "font-semibold",
                        invalidated && "text-muted-foreground line-through"
                      )}
                    >
                      {formatReferenceLabel(report)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {REPORT_PERIOD_TYPE_LABELS[report.period_type]}
                    </p>
                  </TableCell>
                  <TableCell className="num font-type whitespace-nowrap text-muted-foreground">
                    {formatPeriod(report)}
                  </TableCell>
                  <TableCell>
                    <ReportStatusMark report={report} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Balance report={report} />
                  </TableCell>
                  <TableCell className="num font-type whitespace-nowrap text-muted-foreground">
                    {dateISOToBR(report.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <DownloadButton
                        report={report}
                        downloading={downloadingId === report.id}
                        onDownload={handleDownload}
                      />
                      {!invalidated && (
                        <InvalidateButton
                          report={report}
                          onInvalidate={setPending}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* abaixo de md: lista pautada empilhada */}
      <ul className="flex flex-col border-t border-rule md:hidden">
        {reports.map((report) => {
          const invalidated = report.status === "invalidado"
          return (
            <li
              key={report.id}
              className="flex flex-col gap-3 border-b border-rule py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[1.125rem] leading-snug font-semibold",
                      invalidated && "text-muted-foreground line-through"
                    )}
                  >
                    {formatReferenceLabel(report)}
                  </p>
                  <p className="num font-type text-base text-muted-foreground">
                    {REPORT_PERIOD_TYPE_LABELS[report.period_type]} ·{" "}
                    {formatPeriod(report)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="sr-only">Saldo: </span>
                  <Balance report={report} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <ReportStatusMark report={report} />
                <p className="num font-type text-sm text-muted-foreground">
                  Gerado em {dateISOToBR(report.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 [&>*]:flex-1">
                <DownloadButton
                  report={report}
                  downloading={downloadingId === report.id}
                  onDownload={handleDownload}
                />
                {!invalidated && (
                  <InvalidateButton report={report} onInvalidate={setPending} />
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <InvalidateReportDialog
        key={pending?.id ?? "none"}
        report={pending}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        onConfirm={handleConfirmInvalidate}
        isInvalidating={invalidateReport.isPending}
      />
    </>
  )
}

function formatPeriod(report: Report): string {
  return `${dateISOToBR(report.period_start)} – ${dateISOToBR(report.period_end)}`
}

/** Saldo do período: sinal explícito e cor (entrada = verde, saída = vermelho). */
function Balance({ report }: { report: Report }) {
  const invalidated = report.status === "invalidado"
  const negative = report.balance < 0
  return (
    <span
      className={cn(
        "num font-semibold whitespace-nowrap",
        invalidated
          ? "text-muted-foreground"
          : negative
            ? "text-destructive"
            : "text-success"
      )}
    >
      {negative ? "−" : "+"} {formatBRL(Math.abs(report.balance))}
    </span>
  )
}

/**
 * Marca de status: relatório concluído leva o carimbo "Conferido" (registro
 * fechado); os demais estados usam um selo com texto.
 */
function ReportStatusMark({ report }: { report: Report }) {
  if (report.status === "concluido") {
    return (
      <Stamp
        detail={
          report.conferred_at ? dateISOToBR(report.conferred_at) : undefined
        }
        className="origin-left scale-75"
      />
    )
  }
  return (
    <Badge variant={STATUS_BADGE_VARIANT[report.status]}>
      {REPORT_STATUS_LABELS[report.status]}
    </Badge>
  )
}

const STATUS_BADGE_VARIANT: Record<
  Exclude<Report["status"], "concluido">,
  "warning" | "destructive" | "outline"
> = {
  processando: "warning",
  erro: "destructive",
  invalidado: "outline",
}

function DownloadButton({
  report,
  downloading,
  onDownload,
}: {
  report: Report
  downloading: boolean
  onDownload: (report: Report) => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={downloading}
      onClick={() => onDownload(report)}
      aria-label={`Baixar PDF do relatório de ${formatReferenceLabel(report)}`}
    >
      {downloading ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
      {downloading ? "Gerando PDF..." : "Baixar PDF"}
    </Button>
  )
}

function InvalidateButton({
  report,
  onInvalidate,
}: {
  report: Report
  onInvalidate: (report: Report) => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:bg-danger-soft hover:text-destructive"
      onClick={() => onInvalidate(report)}
      aria-label={`Invalidar relatório de ${formatReferenceLabel(report)}`}
    >
      <BanIcon />
      Invalidar
    </Button>
  )
}
