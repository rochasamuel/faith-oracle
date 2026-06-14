# Scraper de lição da CPAD — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No "dia" da EBD, buscar a lição correspondente no site da CPAD via uma Supabase Edge Function, preenchendo o título e salvando o conteúdo em markdown para leitura estilizada.

**Architecture:** O scraper (fetch + parse + conversão para markdown) roda numa Supabase Edge Function (Deno). O front invoca a função, recebe `{ titulo, markdown }` e persiste no `ebd_aulas`. Exibição com `react-markdown` + tipografia `prose` num bloco colapsável.

**Tech Stack:** Vite + React + TypeScript, Supabase (Postgres + Edge Functions/Deno), TanStack Query, sonner (toast), Tailwind v4, base-ui. Parse HTML na função com `deno-dom` (wasm). Render com `react-markdown` + `@tailwindcss/typography`.

**Spec:** `docs/superpowers/specs/2026-06-14-scraper-licao-cpad-design.md`

---

## Mapa de arquivos

- `supabase/ebd/0003_conteudo_licao.sql` (criar) — migration: coluna `conteudo_licao`.
- `supabase/ebd/0001_init.sql` (modificar) — coluna na definição da tabela + cabeçalho.
- `supabase/README.md` (modificar) — ordem de aplicação inclui a 0003.
- `src/api/ebd.ts` (modificar) — tipo `EbdAula.conteudo_licao`, `AulaPatch`, `buscarLicaoCpad()`.
- `src/features/ebd/hooks.ts` (modificar) — `useBuscarLicao()`.
- `supabase/config.toml` (criar via `supabase init`) — config do projeto/funcões.
- `supabase/functions/buscar-licao/url.ts` (criar) — montagem de URL (pura, testável).
- `supabase/functions/buscar-licao/url.test.ts` (criar) — teste Deno da URL.
- `supabase/functions/buscar-licao/extrair.ts` (criar) — `extrairLicao(html)` (pura, testável).
- `supabase/functions/buscar-licao/extrair.test.ts` (criar) — teste Deno do extrator (fixture).
- `supabase/functions/buscar-licao/index.ts` (criar) — handler HTTP (fetch + fallback + CORS).
- `src/features/ebd/lesson-content.tsx` (criar) — bloco colapsável que renderiza o markdown.
- `src/features/ebd/day-metrics.tsx` (modificar) — botão "Buscar lição da CPAD".
- `src/pages/ebd/dia.tsx` (modificar) — fiação: mutation + estado do conteúdo + `LessonContent`.
- `src/index.css` (modificar) — `@plugin "@tailwindcss/typography";`.
- `package.json` (modificar) — deps `react-markdown`, `@tailwindcss/typography`.

**Gate de verificação do projeto:** `pnpm tsc -b` (o `pnpm lint` tem 4 erros pré-existentes; não usar como gate).

---

## Task 1: Migração e tipos do banco

**Files:**
- Create: `supabase/ebd/0003_conteudo_licao.sql`
- Modify: `supabase/ebd/0001_init.sql`
- Modify: `supabase/README.md`
- Modify: `src/api/ebd.ts`

- [ ] **Step 1: Criar a migration**

Criar `supabase/ebd/0003_conteudo_licao.sql`:

```sql
-- =============================================================================
-- Faith Oracle — EBD · 0003 conteúdo da lição (markdown) em ebd_aulas
-- Banco de dados: PostgreSQL (Supabase)
--
-- Guarda o conteúdo da lição (markdown) buscado do site da CPAD, por dia.
-- null = ainda não buscado. O título da lição usa a coluna titulo_licao existente.
--
-- Como aplicar: cole e execute no SQL Editor (re-executável).
-- =============================================================================

alter table public.ebd_aulas
  add column if not exists conteudo_licao text;

comment on column public.ebd_aulas.conteudo_licao is
  'Conteúdo da lição em markdown, importado do site da CPAD; null quando não buscado.';
```

- [ ] **Step 2: Refletir a coluna na definição da tabela (instalação nova)**

Em `supabase/ebd/0001_init.sql`, na tabela `ebd_aulas`, logo após a linha `professor          text,` (bloco "Lição do dia"), adicionar:

```sql
  -- Conteúdo da lição em markdown (importado da CPAD; ver 0003). Null = não buscado.
  conteudo_licao     text,
```

E no cabeçalho do arquivo, atualizar a lista de "Como aplicar" para incluir a 0003:

```
--   3. Em seguida, ebd/0002_remove_tema.sql e ebd/0003_conteudo_licao.sql.
```
(substituindo a linha que hoje cita apenas a `0002_remove_tema.sql`).

- [ ] **Step 3: Atualizar o índice de migrations no README**

Em `supabase/README.md`, na lista de ordem de aplicação do EBD, trocar a linha:

```
4. `ebd/0001_init.sql` → `ebd/0002_remove_tema.sql`
```
por:
```
4. `ebd/0001_init.sql` → `ebd/0002_remove_tema.sql` → `ebd/0003_conteudo_licao.sql`
```

- [ ] **Step 4: Adicionar o campo aos tipos do front**

Em `src/api/ebd.ts`, na interface `EbdAula`, após a linha `professor: string | null`, adicionar:

```ts
  conteudo_licao: string | null
```

E no tipo `AulaPatch`, adicionar `"conteudo_licao"` à lista de chaves do `Pick` (ex.: logo após `| "titulo_licao"`):

```ts
    | "conteudo_licao"
```

- [ ] **Step 5: Verificar o type-check**

Run: `pnpm tsc -b`
Expected: sem erros (exit 0).

- [ ] **Step 6: Aplicar a migration no Supabase (manual)**

No SQL Editor do projeto Supabase, colar e executar `supabase/ebd/0003_conteudo_licao.sql`.
Expected: "Success. No rows returned". (A coluna `conteudo_licao` passa a existir; `getAula` já usa `select("*")`, então o campo virá automaticamente.)

- [ ] **Step 7: Commit**

```bash
git add supabase/ebd/0003_conteudo_licao.sql supabase/ebd/0001_init.sql supabase/README.md src/api/ebd.ts
git commit -m "feat(ebd): coluna conteudo_licao no dia (markdown da lição)"
```

---

## Task 2: Tooling da Edge Function (Deno + Supabase CLI)

A Edge Function roda em Deno e é servida/deployada pela Supabase CLI. Nenhum dos dois está instalado nesta máquina (WSL2). Esta task prepara o ambiente e o esqueleto do projeto de functions.

**Files:**
- Create (via CLI): `supabase/config.toml` e estrutura de `supabase/functions/`.

- [ ] **Step 1: Instalar a Supabase CLI**

Run:
```bash
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz -o /tmp/supabase.tar.gz && tar -xzf /tmp/supabase.tar.gz -C /tmp && sudo mv /tmp/supabase /usr/local/bin/supabase && supabase --version
```
Expected: imprime a versão (ex.: `2.x.x`). (Se `sudo` não estiver disponível, mover o binário para um diretório do PATH do usuário.)

- [ ] **Step 2: Instalar o Deno (para rodar os testes da função)**

Run:
```bash
curl -fsSL https://deno.land/install.sh | sh && export PATH="$HOME/.deno/bin:$PATH" && deno --version
```
Expected: imprime a versão do Deno. (Adicionar `$HOME/.deno/bin` ao PATH do shell para sessões futuras.)

- [ ] **Step 3: Inicializar o Supabase no projeto (se ainda não houver config.toml)**

Run (na raiz do repo):
```bash
supabase init
```
Expected: cria `supabase/config.toml`. Se perguntar sobre sobrescrever a pasta `supabase/`, responder de forma a **preservar** os `.sql` existentes (o `init` só cria `config.toml` e pastas vazias; não apaga os SQL).

- [ ] **Step 4: Criar o scaffolding da função**

Run:
```bash
supabase functions new buscar-licao
```
Expected: cria `supabase/functions/buscar-licao/index.ts` (placeholder) — será substituído nas próximas tasks.

- [ ] **Step 5: Commit do scaffolding**

```bash
git add supabase/config.toml supabase/functions/buscar-licao/
git commit -m "chore(supabase): inicializa Edge Functions e scaffolding de buscar-licao"
```

---

## Task 3: Montagem de URL da lição (TDD)

**Files:**
- Create: `supabase/functions/buscar-licao/url.ts`
- Test: `supabase/functions/buscar-licao/url.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `supabase/functions/buscar-licao/url.test.ts`:

```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { montarUrlLicao, montarUrlSumario } from "./url.ts"

Deno.test("monta a URL da lição com 2 dígitos em trimestre e lição", () => {
  assertEquals(
    montarUrlLicao(2026, 1, 1),
    "https://www.estudantesdabiblia.com.br/licoes_cpad/2026/2026-01-01.htm",
  )
  assertEquals(
    montarUrlLicao(2026, 2, 13),
    "https://www.estudantesdabiblia.com.br/licoes_cpad/2026/2026-02-13.htm",
  )
})

Deno.test("monta a URL do sumário do trimestre", () => {
  assertEquals(
    montarUrlSumario(2026, 1),
    "https://www.estudantesdabiblia.com.br/cpad_sumario_2026_1t.htm",
  )
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `cd supabase/functions/buscar-licao && deno test url.test.ts`
Expected: FAIL (módulo `./url.ts` não existe).

- [ ] **Step 3: Implementar o mínimo**

Criar `supabase/functions/buscar-licao/url.ts`:

```ts
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
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `cd supabase/functions/buscar-licao && deno test url.test.ts`
Expected: PASS (2 testes ok).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/buscar-licao/url.ts supabase/functions/buscar-licao/url.test.ts
git commit -m "feat(buscar-licao): montagem de URLs da lição e do sumário"
```

---

## Task 4: Extrator de lição → markdown (TDD)

Esta é a lógica de maior risco. `extrairLicao(html)` recebe o HTML da página da lição e devolve `{ titulo, markdown }`, ignorando imagens, separadores e cabeçalhos do site.

**Files:**
- Create: `supabase/functions/buscar-licao/extrair.ts`
- Test: `supabase/functions/buscar-licao/extrair.test.ts`

- [ ] **Step 1: Escrever o teste que falha (com fixture mínima)**

Criar `supabase/functions/buscar-licao/extrair.test.ts`:

```ts
import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { extrairLicao } from "./extrair.ts"

const HTML = `
<html><body>
<div id="contents">
  <h1>LIÇÕES BÍBLICAS CPAD</h1>
  <h2>ADULTOS</h2>
  <div class="line"><img src="../../images/h_line.jpg"></div>
  <h2><strong>1º Trimestre de 2026</strong></h2>
  <p class="titlic"><strong>Título:</strong> A Santíssima Trindade</p>
  <p class="titlic"><strong>Comentarista:</strong> Douglas Baptista</p>
  <div class="line"><img src="../../images/h_line.jpg"></div>
  <p class="titlic"><strong>Lição 1:</strong> O mistério da Santíssima Trindade</p>
  <p class="titlic"><strong>Data:</strong> <em>4 de janeiro de 2026</em></p>
  <img class="center" src="../../images/2026/img_01963.jpg">
  <h6>TEXTO ÁUREO</h6>
  <p class="semrecuo">&nbsp;</p>
  <p class="semrecuoc">“<em>Este é o meu Filho amado.</em>” <strong>(Mt 3.17)</strong>.</p>
  <p class="tsec2" style="color: #000080">I. A REVELAÇÃO TRINITÁRIA</p>
  <p class="comrecuo"><strong>1. O batismo do Filho.</strong> Jesus desceu às águas.</p>
  <div class="plano">
    <p class="pcr"><strong>1. INTRODUÇÃO</strong></p>
    <p class="pcr">Neste trimestre estudaremos a Trindade.</p>
  </div>
  <p class="tsec2" style="color: #000080">CONCLUSÃO</p>
  <p class="comrecuo">Compreender a Trindade é fundamental.</p>
</div>
</body></html>`

Deno.test("extrai o título da lição (após 'Lição N:')", () => {
  const { titulo } = extrairLicao(HTML)
  assertEquals(titulo, "O mistério da Santíssima Trindade")
})

Deno.test("converte seções em markdown", () => {
  const { markdown } = extrairLicao(HTML)
  assertStringIncludes(markdown, "## TEXTO ÁUREO")
  assertStringIncludes(markdown, "### I. A REVELAÇÃO TRINITÁRIA")
  assertStringIncludes(markdown, "### CONCLUSÃO")
  assertStringIncludes(markdown, "**(Mt 3.17)**")
  assertStringIncludes(markdown, "**1. O batismo do Filho.**")
  assertStringIncludes(markdown, "Neste trimestre estudaremos a Trindade.")
})

Deno.test("descarta imagens, separadores e cabeçalhos do site", () => {
  const { markdown } = extrairLicao(HTML)
  assert(!markdown.includes("<img"), "não deve conter tags img")
  assert(!markdown.includes("h_line"), "não deve conter separadores")
  assert(!markdown.includes("LIÇÕES BÍBLICAS CPAD"), "não deve conter o cabeçalho do site")
  assert(!markdown.includes("&nbsp;"), "não deve conter espaços não-quebráveis")
  assert(!markdown.includes("ADULTOS"), "não deve conter o subtítulo do site")
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd supabase/functions/buscar-licao && deno test extrair.test.ts`
Expected: FAIL (módulo `./extrair.ts` não existe).

- [ ] **Step 3: Implementar o extrator**

Criar `supabase/functions/buscar-licao/extrair.ts`:

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd supabase/functions/buscar-licao && deno test extrair.test.ts`
Expected: PASS (3 testes ok). (A primeira execução baixa o `deno_dom` wasm.)

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/buscar-licao/extrair.ts supabase/functions/buscar-licao/extrair.test.ts
git commit -m "feat(buscar-licao): extrator de lição (HTML -> markdown) com testes"
```

---

## Task 5: Handler HTTP da Edge Function

Junta tudo: recebe `{ ano, trimestre, licao }`, resolve a URL (direta + fallback no sumário), busca, extrai e responde JSON com CORS.

**Files:**
- Modify (substituir o placeholder): `supabase/functions/buscar-licao/index.ts`

- [ ] **Step 1: Escrever o handler**

Substituir todo o conteúdo de `supabase/functions/buscar-licao/index.ts`:

```ts
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
  if (direta.ok) return await direta.text()

  const sumario = await fetch(montarUrlSumario(ano, trimestre))
  if (!sumario.ok) return null
  const href = acharHrefNoSumario(await sumario.text(), licao)
  if (!href) return null
  const viaSumario = await fetch(resolverHref(href))
  if (!viaSumario.ok) return null
  return await viaSumario.text()
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
```

- [ ] **Step 2: Checar o type-check da função (Deno)**

Run: `cd supabase/functions/buscar-licao && deno check index.ts`
Expected: sem erros de tipo.

- [ ] **Step 3: Servir localmente e testar com curl (manual)**

Run (terminal 1): `supabase functions serve buscar-licao --no-verify-jwt`
Run (terminal 2):
```bash
curl -s -X POST http://localhost:54321/functions/v1/buscar-licao \
  -H "Content-Type: application/json" \
  -d '{"ano":2026,"trimestre":1,"licao":1}' | head -c 400
```
Expected: JSON `{"titulo":"...","markdown":"## TEXTO ÁUREO\n\n..."}`. (Requer rede para alcançar o site da CPAD.)

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/buscar-licao/index.ts
git commit -m "feat(buscar-licao): handler HTTP (fetch + fallback sumário + CORS)"
```

- [ ] **Step 5: Deploy da função (manual)**

Run:
```bash
supabase link --project-ref <SEU_PROJECT_REF>
supabase functions deploy buscar-licao
```
Expected: "Deployed Function buscar-licao". (`<SEU_PROJECT_REF>` é o ref do projeto no painel do Supabase.)

---

## Task 6: API e hook no front

**Files:**
- Modify: `src/api/ebd.ts`
- Modify: `src/features/ebd/hooks.ts`

- [ ] **Step 1: Adicionar `buscarLicaoCpad` à API**

Em `src/api/ebd.ts`, ao final do arquivo, adicionar:

```ts
// =============================================================================
// Scraper da lição (Edge Function buscar-licao)
// =============================================================================

export interface LicaoImportada {
  titulo: string
  markdown: string
}

/** Invoca a Edge Function que busca e converte a lição da CPAD em markdown. */
export async function buscarLicaoCpad(params: {
  ano: number
  trimestre: number
  licao: number
}): Promise<LicaoImportada> {
  const { data, error } = await supabase.functions.invoke<LicaoImportada>(
    "buscar-licao",
    { body: params },
  )
  if (error) {
    let msg = "Não foi possível buscar a lição."
    // A função devolve { error } no corpo; tenta ler a mensagem específica.
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === "function") {
      try {
        const body = await ctx.json()
        if (body?.error) msg = body.error as string
      } catch {
        /* mantém a mensagem padrão */
      }
    }
    throw new Error(msg)
  }
  if (!data) throw new Error("Resposta vazia da função.")
  return data
}
```

- [ ] **Step 2: Adicionar o hook `useBuscarLicao`**

Em `src/features/ebd/hooks.ts`, adicionar `buscarLicaoCpad` e o tipo `LicaoImportada` ao import de `@/api/ebd`, e adicionar o hook na seção "Aulas (o dia)":

```ts
/** Busca a lição da CPAD (Edge Function). O componente persiste o resultado. */
export function useBuscarLicao() {
  return useMutation({
    mutationFn: (params: { ano: number; trimestre: number; licao: number }) =>
      buscarLicaoCpad(params),
    onError: (error) =>
      toast.error("Não foi possível buscar a lição.", {
        description: errorDescription(error),
      }),
  })
}
```

- [ ] **Step 3: Verificar o type-check**

Run: `pnpm tsc -b`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/api/ebd.ts src/features/ebd/hooks.ts
git commit -m "feat(ebd): API e hook para buscar a lição da CPAD"
```

---

## Task 7: Dependências de exibição (react-markdown + typography)

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `src/index.css`

- [ ] **Step 1: Instalar as dependências**

Run: `pnpm add react-markdown && pnpm add -D @tailwindcss/typography`
Expected: instala sem erros; entradas aparecem no `package.json`.

- [ ] **Step 2: Habilitar o plugin de tipografia no CSS**

Em `src/index.css`, logo após a linha `@import "@fontsource-variable/inter";`, adicionar:

```css
@plugin "@tailwindcss/typography";
```

- [ ] **Step 3: Verificar que o build compila o CSS**

Run: `pnpm build`
Expected: build conclui sem erros (gera `dist/`). (Confirma que o `@plugin` é reconhecido pelo Tailwind v4.)

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/index.css
git commit -m "chore: react-markdown + plugin de tipografia do Tailwind"
```

---

## Task 8: Componente de exibição do conteúdo

**Files:**
- Create: `src/features/ebd/lesson-content.tsx`

- [ ] **Step 1: Criar o componente colapsável**

Criar `src/features/ebd/lesson-content.tsx`:

```tsx
import Markdown from "react-markdown"
import { ChevronDownIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface LessonContentProps {
  markdown: string
}

/** Bloco colapsável com o conteúdo da lição (markdown estilizado). */
export function LessonContent({ markdown }: LessonContentProps) {
  if (!markdown.trim()) return null

  return (
    <Collapsible className="flex flex-col gap-3">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group flex w-fit items-center gap-1.5 font-heading text-sm font-medium"
          >
            Conteúdo da lição
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
          </button>
        }
      />
      <CollapsibleContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown>{markdown}</Markdown>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

- [ ] **Step 2: Verificar o type-check**

Run: `pnpm tsc -b`
Expected: sem erros. (Se o atributo de estado do painel aberto do base-ui diferir de `data-panel-open`, ajustar o seletor `group-data-[...]` conforme `src/components/ui/collapsible.tsx`; a rotação do chevron é cosmética e não bloqueia.)

- [ ] **Step 3: Commit**

```bash
git add src/features/ebd/lesson-content.tsx
git commit -m "feat(ebd): bloco colapsável de conteúdo da lição (markdown)"
```

---

## Task 9: Botão na UI e fiação na página do dia

**Files:**
- Modify: `src/features/ebd/day-metrics.tsx`
- Modify: `src/pages/ebd/dia.tsx`

- [ ] **Step 1: Adicionar props e botão ao `DayMetrics`**

Em `src/features/ebd/day-metrics.tsx`:

(a) No import de ícones, adicionar `DownloadIcon`:
```ts
import { DownloadIcon, MinusIcon, PlusIcon } from "lucide-react"
```

(b) Na interface `DayMetricsProps`, adicionar:
```ts
  /** Dispara a busca da lição na CPAD (usa o nº da lição atual). */
  onBuscarLicao: () => void
  /** Busca em andamento. */
  buscandoLicao: boolean
```

(c) Na assinatura do componente, desestruturar os novos props:
```tsx
export function DayMetrics({
  values,
  onLocal,
  onCommit,
  readOnly,
  onBuscarLicao,
  buscandoLicao,
}: DayMetricsProps) {
```

(d) Substituir o bloco do campo "Nº da lição" (o `<div className="flex flex-col gap-2">` que contém o `Label htmlFor="licao"` e o `Input`) por uma versão com o botão ao lado:

```tsx
        <div className="flex flex-col gap-2">
          <Label htmlFor="licao">Nº da lição</Label>
          <div className="flex items-center gap-2">
            <Input
              id="licao"
              inputMode="numeric"
              className="h-9 flex-1 text-sm"
              value={values.numero_licao}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "")
                onLocal({ numero_licao: raw })
                commitLicao(raw)
              }}
              disabled={readOnly}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={onBuscarLicao}
              disabled={readOnly || buscandoLicao || !values.numero_licao}
              title="Buscar lição da CPAD"
            >
              <DownloadIcon className="size-4" />
              {buscandoLicao ? "Buscando..." : "Buscar lição"}
            </Button>
          </div>
        </div>
```

- [ ] **Step 2: Fiar na página do dia**

Em `src/pages/ebd/dia.tsx`:

(a) Adicionar imports:
```ts
import { LessonContent } from "@/features/ebd/lesson-content"
```
e incluir `useBuscarLicao` na lista importada de `@/features/ebd/hooks`.

(b) Dentro de `DayEditor`, junto às outras mutations, adicionar:
```ts
  const buscarLicao = useBuscarLicao()
```

(c) Adicionar o estado local do conteúdo (após o `useState` de `metrics`):
```ts
  const [conteudoLicao, setConteudoLicao] = React.useState(
    aula.conteudo_licao ?? ""
  )
```

(d) Adicionar o handler (junto às outras funções `handle*`):
```ts
  function handleBuscarLicao() {
    const tri = aula.turma_trimestre?.trimestre
    const licao = Number(metrics.numero_licao)
    if (!tri || !licao) return
    buscarLicao.mutate(
      { ano: tri.ano, trimestre: tri.numero, licao },
      {
        onSuccess: (data) => {
          setMetrics((prev) => ({
            ...prev,
            titulo_licao: data.titulo || prev.titulo_licao,
          }))
          setConteudoLicao(data.markdown)
          updateAula.mutate({
            id: aula.id,
            patch: {
              titulo_licao: data.titulo || metrics.titulo_licao.trim() || null,
              conteudo_licao: data.markdown,
            },
          })
          toast.success("Lição importada da CPAD.")
        },
      }
    )
  }
```
e adicionar o import do `toast`:
```ts
import { toast } from "sonner"
```

(e) Passar os novos props ao `DayMetrics` (no JSX, no elemento `<DayMetrics ... />`):
```tsx
        <DayMetrics
          values={metrics}
          onLocal={(patch) => setMetrics((prev) => ({ ...prev, ...patch }))}
          onCommit={commitMetric}
          readOnly={readOnly}
          onBuscarLicao={handleBuscarLicao}
          buscandoLicao={buscarLicao.isPending}
        />
```

(f) Renderizar o conteúdo da lição ao final, logo após o `</DayMetrics>` (antes de fechar o `</div>` externo):
```tsx
        {conteudoLicao && (
          <>
            <Separator />
            <LessonContent markdown={conteudoLicao} />
          </>
        )}
```

- [ ] **Step 3: Verificar o type-check**

Run: `pnpm tsc -b`
Expected: sem erros.

- [ ] **Step 4: Verificação manual (com a função deployada)**

Run: `pnpm dev` e abrir um dia da EBD.
- Preencher "Nº da lição" = 1 e clicar "Buscar lição".
- Expected: toast "Lição importada da CPAD."; o "Título da lição" preenche sozinho; aparece o bloco "Conteúdo da lição" com o markdown estilizado; ao recarregar a página, o conteúdo persiste (veio do banco via `getAula`).
- Com "Nº da lição" vazio: botão desabilitado.
- Com o dia fechado: botão desabilitado.

- [ ] **Step 5: Commit**

```bash
git add src/features/ebd/day-metrics.tsx src/pages/ebd/dia.tsx
git commit -m "feat(ebd): botão 'Buscar lição' e exibição do conteúdo no dia"
```

---

## Task 10: Verificação final

- [ ] **Step 1: Type-check + build**

Run: `pnpm tsc -b && pnpm build`
Expected: ambos sem erros.

- [ ] **Step 2: Testes da função**

Run: `cd supabase/functions/buscar-licao && deno test`
Expected: todos os testes passam (url + extrair).

- [ ] **Step 3: Sanidade do scraper (manual, opcional)**

Buscar uma lição de outro trimestre (ex.: nº 1 do 2º trimestre) e confirmar que o conteúdo vem correto, exercitando o padrão de URL `2026-02-01`.

---

## Notas de execução

- **Ações manuais fora desta máquina:** aplicar a migration (Task 1, Step 6), instalar CLI/Deno (Task 2), `supabase link` + `deploy` (Task 5, Step 5). Sem o deploy, a verificação manual da UI (Task 9, Step 4) não funciona — mas o type-check/build e os testes Deno rodam localmente.
- **Auth:** a função usa `verify_jwt` (default). O `supabase.functions.invoke` envia o token da sessão automaticamente; para testes locais usa-se `--no-verify-jwt`.
- **Padrão do projeto:** sem `useEffect` para sincronizar estado (ver memória do projeto); aqui o estado local do conteúdo é inicializado no `useState` e atualizado só no `onSuccess`.
```
