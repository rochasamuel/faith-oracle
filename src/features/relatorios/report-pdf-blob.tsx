import { pdf } from "@react-pdf/renderer"

import { ReportDocument, type ReportDocumentProps } from "./report-pdf"

/** Renderiza o documento e devolve o Blob do PDF para download. */
export function reportPdfBlob(props: ReportDocumentProps): Promise<Blob> {
  return pdf(<ReportDocument {...props} />).toBlob()
}
