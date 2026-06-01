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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { parseISO } from "date-fns"

import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR } from "@/lib/date"
import { getBalanceBefore, listTransactionsInPeriod } from "@/api/transactions"
import type { Report } from "@/api/reports"
import {
  formatReferenceLabel,
  REPORT_PERIOD_TYPE_LABELS,
  REPORT_STATUS_CLASSES,
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
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className={cn("-mx-2 gap-1", active && "text-foreground")}
        onClick={() => onToggleSort(sortKey)}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <Icon className={cn("size-3.5", active ? "opacity-100" : "opacity-50")} />
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
      const [transactions, saldoInicial] = await Promise.all([
        listTransactionsInPeriod(report.period_start, report.period_end),
        getBalanceBefore(report.period_start),
      ])
      const summary = buildReportSummary(report, transactions, saldoInicial)
      const blob = await reportPdfBlob({
        report,
        summary,
        conferredAt: parseISO(report.conferred_at ?? report.created_at),
        generatedAt: new Date(),
        church: toChurchView(churchData ?? null),
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
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Referência"
                sortKey="reference"
                sort={sort}
                onToggleSort={onToggleSort}
              />
              <TableHead>Tipo</TableHead>
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
                label="Geração"
                sortKey="created_at"
                sort={sort}
                onToggleSort={onToggleSort}
                className="w-28"
              />
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const invalidated = report.status === "invalidado"
              return (
                <TableRow
                  key={report.id}
                  className={cn(invalidated && "opacity-60")}
                >
                  <TableCell className="font-medium">
                    {formatReferenceLabel(report)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {REPORT_PERIOD_TYPE_LABELS[report.period_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {dateISOToBR(report.period_start)} –{" "}
                    {dateISOToBR(report.period_end)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("border", REPORT_STATUS_CLASSES[report.status])}
                    >
                      {REPORT_STATUS_LABELS[report.status]}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      report.balance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {formatBRL(report.balance)}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {dateISOToBR(report.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Baixar relatório"
                        disabled={downloadingId === report.id}
                        onClick={() => handleDownload(report)}
                      >
                        {downloadingId === report.id ? (
                          <Loader2Icon className="animate-spin" />
                        ) : (
                          <DownloadIcon className="text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Invalidar relatório"
                        disabled={invalidated}
                        onClick={() => setPending(report)}
                      >
                        <BanIcon
                          className={cn(!invalidated && "text-destructive")}
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

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
