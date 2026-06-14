import {
  DOMParser,
  type Element,
} from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts"
import { extrairLicao } from "./extrair.ts"
import { montarUrlLicao, montarUrlSumario, resolverHref } from "./url.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

/**
 * Lê o corpo respeitando a codificação do site (as páginas da CPAD são legadas,
 * em ISO-8859-1/windows-1252). Decodificar como UTF-8 corromperia os acentos.
 */
async function lerHtml(res: Response): Promise<string> {
  const buf = new Uint8Array(await res.arrayBuffer())
  const ct = res.headers.get("content-type") ?? ""
  let charset = /charset=([^;]+)/i.exec(ct)?.[1]?.trim().toLowerCase()
  if (!charset) {
    const head = new TextDecoder("ascii").decode(buf.slice(0, 2048))
    charset = /charset=["']?([\w-]+)/i.exec(head)?.[1]?.toLowerCase()
  }
  if (!charset || charset === "utf-8" || charset === "utf8") {
    return new TextDecoder("utf-8").decode(buf)
  }
  try {
    return new TextDecoder(charset).decode(buf)
  } catch {
    return new TextDecoder("windows-1252").decode(buf)
  }
}

/** Acha o href da lição no sumário pelo número (fallback quando a URL direta falha). */
function acharHrefNoSumario(html: string, licao: number): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html")
  if (!doc) return null
  for (const p of Array.from(doc.querySelectorAll("p")) as Element[]) {
    const strong = p.querySelector("strong")
    const rotulo = strong?.textContent?.trim() ?? ""
    if (new RegExp(`^Lição\\s+${licao}:`, "i").test(rotulo)) {
      const a = p.querySelector("a")
      const href = a?.getAttribute("href")
      if (href) return href
    }
  }
  return null
}

/** Busca o HTML da lição: tenta a URL direta; se falhar, resolve pelo sumário. */
async function buscarHtmlLicao(
  ano: number,
  trimestre: number,
  licao: number,
): Promise<string | null> {
  const direta = await fetch(montarUrlLicao(ano, trimestre, licao))
  if (direta.ok) return await lerHtml(direta)

  const sumario = await fetch(montarUrlSumario(ano, trimestre))
  if (!sumario.ok) return null
  const href = acharHrefNoSumario(await lerHtml(sumario), licao)
  if (!href) return null
  const viaSumario = await fetch(resolverHref(href))
  if (!viaSumario.ok) return null
  return await lerHtml(viaSumario)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405)

  let payload: { ano?: number; trimestre?: number; licao?: number }
  try {
    payload = await req.json()
  } catch {
    return json({ error: "JSON inválido." }, 400)
  }

  const { ano, trimestre, licao } = payload
  if (
    !Number.isInteger(ano) ||
    !Number.isInteger(trimestre) ||
    !Number.isInteger(licao) ||
    (trimestre as number) < 1 ||
    (trimestre as number) > 4 ||
    (licao as number) < 1
  ) {
    return json({ error: "Parâmetros inválidos (ano, trimestre 1-4, licao)." }, 400)
  }

  try {
    const html = await buscarHtmlLicao(ano!, trimestre!, licao!)
    if (!html) {
      return json({ error: "Lição não encontrada para este trimestre." }, 404)
    }
    const { titulo, markdown } = extrairLicao(html)
    if (!markdown) {
      return json({ error: "Não foi possível extrair o conteúdo da lição." }, 422)
    }
    return json({ titulo, markdown })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500)
  }
})
