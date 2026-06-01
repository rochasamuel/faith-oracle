import {
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"

import logoIgreja from "@/assets/logo-igreja.png"
import InterRegular from "@/assets/fonts/Inter_400Regular.ttf"
import InterSemiBold from "@/assets/fonts/Inter_600SemiBold.ttf"
import InterBold from "@/assets/fonts/Inter_700Bold.ttf"
import type { Report } from "@/api/reports"
import { CHURCH_INFO, type IgrejaTipoImovel } from "@/config/church"
import { formatBRL } from "@/lib/currency"
import { dateISOToBR, formatDateBR } from "@/lib/date"
import type { ReportLine, ReportSummary } from "./report-summary"
import { formatReportPdfTitle } from "./report-title"

// Tipografia Inter (TTF estáticos empacotados). O peso é resolvido por fontWeight.
Font.register({
  family: "Inter",
  fonts: [
    { src: InterRegular, fontWeight: 400 },
    { src: InterSemiBold, fontWeight: 600 },
    { src: InterBold, fontWeight: 700 },
  ],
})

// Paleta neutra inspirada nos tokens do shadcn (zinc) para um visual moderno.
const COLORS = {
  text: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  headerBg: "#f4f4f5",
  primary: "#18181b",
  positive: "#059669",
  negative: "#e11d48",
  watermark: "#e11d48",
}

// Nº mínimo de linhas desenhadas por tabela (consistência visual quando há poucos
// lançamentos).
const MIN_TABLE_ROWS = 12

// Linhas a mais na tabela de Receitas para que sua malha (e o TOTAL) se estenda
// até o rodapé do Resumo na coluna direita: 4 linhas do Resumo + ~3 (título/margem).
const RESUMO_BLOCK_EXTRA_ROWS = 7

const styles = StyleSheet.create({
  page: {
    paddingVertical: 32,
    paddingHorizontal: 34,
    fontSize: 8,
    color: COLORS.text,
    fontFamily: "Inter",
    lineHeight: 1.35,
  },

  // Cabeçalho: logo flutua à esquerda; textos centralizados na página.
  header: {
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 14,
    marginBottom: 16,
  },
  logo: {
    position: "absolute",
    left: 0,
    top: -14,
    width: 76,
    height: 82,
    objectFit: "contain",
  },
  headerText: { alignItems: "center", textAlign: "center", paddingHorizontal: 96 },
  title: { fontSize: 15, fontWeight: 700, letterSpacing: 0.4, marginBottom: 8 },
  churchName: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  churchLine: { fontSize: 8, color: COLORS.muted, marginBottom: 1 },
  // Endereço ocupa a largura total do conteúdo (anula o paddingHorizontal do
  // headerText) para caber em uma única linha.
  addressLine: { marginHorizontal: -96 },

  columns: { flexDirection: "row", gap: 14 },
  column: { flex: 1 },

  sectionTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
  },

  // Tabela com borda externa arredondada e separadores horizontais sutis.
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
  },
  theadRow: { flexDirection: "row", backgroundColor: COLORS.headerBg },
  th: {
    paddingVertical: 5,
    paddingHorizontal: 7,
    fontWeight: 600,
    fontSize: 7,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    minHeight: 17,
  },
  td: { paddingVertical: 4, paddingHorizontal: 7 },
  colDate: { width: 58 },
  colCat: { flex: 1 },
  colVal: { width: 72, textAlign: "right" },

  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.headerBg,
  },
  totalLabel: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 7,
    fontWeight: 700,
  },
  totalVal: {
    width: 72,
    paddingVertical: 5,
    paddingHorizontal: 7,
    textAlign: "right",
    fontWeight: 700,
  },

  // Puxa o bloco do Resumo para cima (reduz a margem do topo) para alinhar o
  // "Saldo final" com o TOTAL da tabela de Receitas — sem mexer na margem inferior.
  resumoTitle: { marginTop: 1 },
  summaryLabel: { flex: 1, paddingVertical: 5, paddingHorizontal: 7 },
  summaryVal: {
    width: 90,
    paddingVertical: 5,
    paddingHorizontal: 7,
    textAlign: "right",
  },

  signatures: { flexDirection: "row", gap: 36, marginTop: 28 },
  signatureBox: { flex: 1, alignItems: "center" },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: COLORS.text,
    width: "100%",
    marginBottom: 5,
  },
  signatureLabel: { color: COLORS.muted },

  footer: {
    marginTop: 26,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 8,
  },
  footerLine: { flexDirection: "row", gap: 28 },
  checkRow: { flexDirection: "row", gap: 28, marginTop: 2 },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkbox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },

  watermark: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 96,
    fontWeight: 700,
    color: COLORS.watermark,
    opacity: 0.1,
    transform: "rotate(-30deg)",
  },
})

const TIPO_IMOVEL_LABEL: Record<IgrejaTipoImovel, string> = {
  propria: "Igreja própria",
  alugada: "Igreja alugada",
  cedida: "Igreja cedida",
}

/** Checkbox no estilo shadcn: quadrado arredondado, preenchido com check (SVG) quando marcado. */
function CheckField({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={styles.checkItem}>
      <View style={[styles.checkbox, ...(checked ? [styles.checkboxChecked] : [])]}>
        {checked && (
          <Svg width={8} height={8} viewBox="0 0 24 24">
            <Path
              d="M20 6 L9 17 L4 12"
              stroke="#ffffff"
              strokeWidth={3.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
      <Text>{label}</Text>
    </View>
  )
}

/**
 * Tabela de lançamentos (Data | Descrição | Valor) com `rowCount` linhas:
 * linhas além dos lançamentos ficam vazias, mantendo a malha desenhada.
 */
function LinesTable({
  title,
  lines,
  total,
  rowCount,
}: {
  title: string
  lines: ReportLine[]
  total: number
  rowCount: number
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.theadRow}>
          <Text style={[styles.th, styles.colDate]}>Data</Text>
          <Text style={[styles.th, styles.colCat]}>Descrição</Text>
          <Text style={[styles.th, styles.colVal]}>Valor</Text>
        </View>
        {Array.from({ length: rowCount }).map((_, i) => {
          const line = lines[i]
          return (
            <View key={i} style={styles.row}>
              <Text style={[styles.td, styles.colDate]}>
                {line ? dateISOToBR(line.date) : ""}
              </Text>
              <Text style={[styles.td, styles.colCat]}>{line ? line.label : ""}</Text>
              <Text style={[styles.td, styles.colVal]}>
                {line ? formatBRL(line.amount) : ""}
              </Text>
            </View>
          )
        })}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalVal}>{formatBRL(total)}</Text>
        </View>
      </View>
    </View>
  )
}

function SummaryRow({
  label,
  value,
  emphasis,
  color,
}: {
  label: string
  value: string
  emphasis?: boolean
  color?: string
}) {
  const bold = emphasis ? { fontWeight: 700 as const } : {}
  return (
    <View style={styles.row}>
      <Text style={[styles.summaryLabel, bold]}>{label}</Text>
      <Text style={[styles.summaryVal, bold, ...(color ? [{ color }] : [])]}>
        {value}
      </Text>
    </View>
  )
}

export interface ReportDocumentProps {
  report: Report
  summary: ReportSummary
  generatedAt: Date
}

export function ReportDocument({
  report,
  summary,
  generatedAt,
}: ReportDocumentProps) {
  const invalidated = report.status === "invalidado"
  const saldoColor = summary.saldoFinal >= 0 ? COLORS.positive : COLORS.negative
  // Despesas usa a contagem base; Receitas leva linhas extras para se estender
  // (com malha) até o rodapé do Resumo da coluna direita.
  const baseRowCount = Math.max(
    summary.receitas.length,
    summary.despesas.length,
    MIN_TABLE_ROWS
  )
  const receitasRowCount = baseRowCount + RESUMO_BLOCK_EXTRA_ROWS

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {invalidated && <Text style={styles.watermark}>INVALIDADO</Text>}

        <View style={styles.header}>
          <Image style={styles.logo} src={logoIgreja} />
          <View style={styles.headerText}>
            <Text style={styles.title}>{formatReportPdfTitle(report)}</Text>
            <Text style={styles.churchName}>{CHURCH_INFO.nome}</Text>
            <Text style={styles.churchLine}>
              CNPJ: {CHURCH_INFO.cnpj} | Pastor Presidente:{" "}
              {CHURCH_INFO.pastorPresidente}
            </Text>
            <Text style={[styles.churchLine, styles.addressLine]}>
              {CHURCH_INFO.endereco}
            </Text>
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.column}>
            <LinesTable
              title="Receitas"
              lines={summary.receitas}
              total={summary.totalEntradas}
              rowCount={receitasRowCount}
            />
          </View>
          <View style={styles.column}>
            <LinesTable
              title="Despesas"
              lines={summary.despesas}
              total={summary.totalSaidas}
              rowCount={baseRowCount}
            />
            <Text style={[styles.sectionTitle, styles.resumoTitle]}>Resumo</Text>
            <View style={styles.table}>
              <SummaryRow
                label="Saldo inicial"
                value={formatBRL(summary.saldoInicial)}
              />
              <SummaryRow
                label="Total de entradas"
                value={formatBRL(summary.totalEntradas)}
              />
              <SummaryRow
                label="Total de saídas"
                value={formatBRL(summary.totalSaidas)}
              />
              <SummaryRow
                label="Saldo final"
                value={formatBRL(summary.saldoFinal)}
                emphasis
                color={saldoColor}
              />
            </View>
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Pastor Presidente</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Tesoureiro</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Conferido dia {formatDateBR(generatedAt)}</Text>
          <View style={styles.footerLine}>
            <Text>Quantidade de membros: {CHURCH_INFO.quantidadeMembros}</Text>
            <Text>Quantidade de obreiros: {CHURCH_INFO.quantidadeObreiros}</Text>
          </View>
          <View style={styles.checkRow}>
            <CheckField
              label={TIPO_IMOVEL_LABEL.propria}
              checked={CHURCH_INFO.tipoImovel === "propria"}
            />
            <CheckField
              label={TIPO_IMOVEL_LABEL.alugada}
              checked={CHURCH_INFO.tipoImovel === "alugada"}
            />
            <CheckField
              label={TIPO_IMOVEL_LABEL.cedida}
              checked={CHURCH_INFO.tipoImovel === "cedida"}
            />
          </View>
        </View>
      </Page>
    </Document>
  )
}
