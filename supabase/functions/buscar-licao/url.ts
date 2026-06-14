const BASE = "https://www.estudantesdabiblia.com.br"

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/** URL direta da lição: licoes_cpad/<ano>/<ano>-<TT>-<LL>.htm */
export function montarUrlLicao(ano: number, trimestre: number, licao: number): string {
  return `${BASE}/licoes_cpad/${ano}/${ano}-${pad2(trimestre)}-${pad2(licao)}.htm`
}

/** URL do sumário do trimestre: cpad_sumario_<ano>_<n>t.htm */
export function montarUrlSumario(ano: number, trimestre: number): string {
  return `${BASE}/cpad_sumario_${ano}_${trimestre}t.htm`
}

/** Resolve um href relativo do site para URL absoluta. */
export function resolverHref(href: string): string {
  return new URL(href, `${BASE}/`).toString()
}
