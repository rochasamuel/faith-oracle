import {
  DOMParser,
  type Element,
  type Node,
} from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts"

/** Converte os filhos inline de um elemento em texto markdown (negrito/itálico). */
function inline(el: Element): string {
  let out = ""
  for (const child of Array.from(el.childNodes) as Node[]) {
    if (child.nodeType === 3) {
      out += child.textContent ?? ""
      continue
    }
    if (child.nodeType !== 1) continue
    const c = child as Element
    const tag = c.tagName.toLowerCase()
    if (tag === "img") continue
    const inner = inline(c)
    if (tag === "strong" || tag === "b") out += `**${inner}**`
    else if (tag === "em" || tag === "i") out += `*${inner}*`
    else if (tag === "br") out += " "
    else out += inner // a, font, span, etc. → só o texto
  }
  // Colapsa o espaçamento/indentação herdado do HTML de origem.
  return out.replace(/\s+/g, " ")
}

/**
 * Extrai o conteúdo da lição (dentro de #contents) como markdown e o título.
 * Ignora imagens, separadores decorativos e os cabeçalhos do site.
 */
export function extrairLicao(html: string): { titulo: string; markdown: string } {
  const doc = new DOMParser().parseFromString(html, "text/html")
  if (!doc) throw new Error("HTML inválido.")
  const contents = doc.querySelector("#contents") ?? doc.body
  if (!contents) throw new Error("Bloco de conteúdo (#contents) não encontrado.")

  let titulo = ""
  const blocks: string[] = []

  for (const node of Array.from(contents.children) as Element[]) {
    const tag = node.tagName.toLowerCase()
    const cls = node.getAttribute("class") ?? ""

    if (tag === "img") continue
    if (tag === "div" && (cls.includes("line") || cls.includes("linesep"))) continue
    if (tag === "h1" || tag === "h2") continue // cabeçalhos do site

    if (tag === "h6") {
      const t = inline(node).trim()
      if (t) blocks.push(`## ${t}`)
      continue
    }
    if (tag === "p" && cls.includes("tsec2")) {
      const t = inline(node).trim()
      if (t) blocks.push(`### ${t}`)
      continue
    }
    if (tag === "div" && cls.includes("plano")) {
      for (const p of Array.from(node.children) as Element[]) {
        const t = inline(p).trim()
        if (t) blocks.push(t)
      }
      continue
    }
    if (tag === "p") {
      const t = inline(node).trim()
      if (!t) continue // parágrafos só com &nbsp;
      const m = t.match(/^\*\*Lição\s+\d+:\*\*\s*(.+)$/i)
      if (m && !titulo) titulo = m[1].trim()
      blocks.push(t)
      continue
    }
    // demais tags: ignoradas
  }

  const markdown = blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
  return { titulo, markdown }
}
