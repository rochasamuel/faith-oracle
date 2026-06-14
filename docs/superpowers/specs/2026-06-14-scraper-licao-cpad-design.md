# Scraper de lição da CPAD — Design

**Data:** 2026-06-14
**Status:** Aprovado (aguardando revisão do spec)

## Objetivo

No "dia" da EBD (`ebd_aulas`), permitir buscar automaticamente o conteúdo da lição
correspondente no site `estudantesdabiblia.com.br`, preenchendo o **título da lição**
e salvando o **conteúdo completo da lição em markdown** no próprio dia, para leitura
estilizada na tela.

## Contexto

- App é um SPA Vite + React + Supabase, **sem backend próprio** até aqui (não há
  `supabase/functions/`, não usa Supabase CLI local).
- O `ebd_aulas` (o "dia") já tem `numero_licao`, `titulo_licao`, `professor` e
  pertence a um `ebd_turma_trimestres` → `ebd_trimestres` (que carrega `ano` e
  `numero` 1–4). Esses dados montam as URLs do site.
- O navegador **não consegue** buscar o HTML do site diretamente (sem cabeçalhos
  CORS). O fetch precisa rodar do lado servidor.

## Decisão de arquitetura

O scraper (fetch + parse + conversão para markdown) roda numa **Supabase Edge
Function** (Deno). O front apenas invoca a função, recebe `{ titulo, markdown }` e
persiste no dia. Não há dependência de proxies de terceiros.

```
Dia (página) ──"Buscar lição da CPAD"──▶ Edge Function (Deno) ──fetch+parse──▶ estudantesdabiblia.com.br
     ▲                                          │
     └────────── { titulo, markdown } ◀─────────┘
     │
     └─ salva titulo_licao + conteudo_licao no dia (ebd_aulas)
```

## Padrões de URL do site

- **Sumário do trimestre:** `https://www.estudantesdabiblia.com.br/cpad_sumario_<ano>_<n>t.htm`
  (ex.: `cpad_sumario_2026_1t.htm`). `<n>` = número do trimestre (1–4).
- **Lição:** `https://www.estudantesdabiblia.com.br/licoes_cpad/<ano>/<ano>-<TT>-<LL>.htm`
  (ex.: `licoes_cpad/2026/2026-01-01.htm`), onde `<TT>` = trimestre com 2 dígitos e
  `<LL>` = número da lição com 2 dígitos.

## Estrutura do HTML de origem

### Página da lição (`div#contents`)
- Título da lição: `<p class="titlic"><strong>Lição N:</strong> <título></p>`.
- Seções de conteúdo, em ordem: Texto Áureo, Verdade Prática, Leitura Diária,
  Leitura Bíblica em Classe, Hinos Sugeridos, Plano de Aula (`div.plano`),
  Comentário (com subtítulos `p.tsec2` I/II/III, sinopses, auxílios), Conclusão,
  Revisando o Conteúdo, Subsídios.
- Cabeçalhos a **descartar**: `<h1>LIÇÕES BÍBLICAS CPAD</h1>`, `<h2>ADULTOS</h2>`.
- Ruído a **descartar**: `<img>`, `div.line`/`div.linesep` (separadores),
  parágrafos vazios (`&nbsp;`).

## Componentes

### 1. Banco — `supabase/ebd/0003_conteudo_licao.sql`
Migration idempotente que adiciona:
```sql
alter table public.ebd_aulas
  add column if not exists conteudo_licao text;
```
- `conteudo_licao`: markdown da lição; `null` = ainda não buscado.
- `titulo_licao` (já existente) é preenchido automaticamente pela busca.
- Atualizar também `supabase/ebd/0001_init.sql` (definição da tabela, para
  instalação nova vir correta) e citar a 0003 no cabeçalho do 0001 e no
  `supabase/README.md` (ordem de aplicação).

### 2. Edge Function — `supabase/functions/buscar-licao/index.ts`
- **Entrada** (POST JSON): `{ ano: number, trimestre: number, licao: number }`.
- **Auth:** protegida pelo JWT da sessão (default `verify_jwt = true`). Como o
  login do app é via Supabase (gate no front), o usuário logado tem sessão; o
  `supabase.functions.invoke` envia o header de auth automaticamente. Serve como
  gate natural para a função.
- **CORS:** trata `OPTIONS` (preflight) e devolve cabeçalhos CORS nas respostas,
  para ser chamável do browser.
- **Resolução da URL:**
  1. Monta a URL direta da lição pelo padrão `<ano>-<TT>-<LL>`.
  2. Faz `fetch`. Se `!response.ok` (ex.: 404), **fallback**: busca o sumário do
     trimestre, localiza o `<a>` cujo `<strong>` irmão é `Lição <licao>:`, resolve
     o `href` (relativo) para URL absoluta e busca essa página.
  3. Se ambos falharem, retorna 404 com mensagem.
- **Parse** (`deno-dom`): isola `div#contents`. Função pura e **exportada**
  `extrairLicao(html: string): { titulo: string; markdown: string }`:
  - Título: do `p.titlic` que contém `Lição N:` (texto após o `<strong>`).
  - Conversor direcionado, percorrendo os filhos de `#contents`:
    - `<h6>` → `## `
    - `<p class="tsec2">` → `### `
    - `<strong>` → `**texto**`; `<em>`/`<font>` aninhado → `*texto*`
    - `<a>` → mantém apenas o texto (sem link)
    - parágrafos comuns (`semrecuo`, `semrecuoc`, `comrecuo`, `titlic`, `pcr`…)
      → parágrafo markdown
    - `div.plano` → processa os parágrafos internos
    - **descarta**: `<img>`, `div.line`, `div.linesep`, parágrafos só com `&nbsp;`,
      e os cabeçalhos `<h1>`/`<h2>` do topo do site
  - Normaliza espaços/quebras (colapsa múltiplas linhas em branco).
- **Saída:** `200 { titulo, markdown }` ou erro (`404` lição não encontrada,
  `400` entrada inválida, `500` falha inesperada).

### 3. Front — API e hook
- `src/api/ebd.ts`: `buscarLicaoCpad({ ano, trimestre, licao }): Promise<{ titulo: string; markdown: string }>`
  via `supabase.functions.invoke('buscar-licao', { body })`.
- `src/features/ebd/hooks.ts`: `useBuscarLicao()` (mutation). No `onSuccess`,
  chama `updateAula({ id, patch: { titulo_licao, conteudo_licao } })` e dispara
  toast; o componente atualiza o estado local (título e conteúdo).

### 4. Front — gatilho (UI)
- No `src/features/ebd/day-metrics.tsx`, ao lado do campo "Nº da lição", um botão
  **"Buscar lição da CPAD"**.
  - Desabilitado quando `numero_licao` vazio ou o dia está fechado (`readOnly`).
  - Estado de carregando enquanto busca.
  - Sucesso: preenche `titulo_licao` (e `conteudo_licao`) + toast. Erro: toast,
    sem alterar o dia.
- Os valores de `ano`/`trimestre` vêm de `aula.turma_trimestre.trimestre`
  (`ano`, `numero`).

### 5. Front — exibição
- Novo componente `src/features/ebd/lesson-content.tsx`: bloco **colapsável**
  "Conteúdo da lição" no fim da página do dia (`src/pages/ebd/dia.tsx`),
  renderizando `aula.conteudo_licao` com `react-markdown` dentro de um container
  com classe `prose` (tipografia padrão). Só aparece quando há conteúdo.
- Usa o `Collapsible` existente (ou `details`/estado derivado — sem `useEffect`,
  conforme padrão do projeto).

## Dependências novas
- **Front:** `react-markdown` (render) e `@tailwindcss/typography` (estilo `prose`,
  habilitado via `@plugin "@tailwindcss/typography";` no CSS de entrada — compatível
  com Tailwind v4).
- **Edge Function (Deno):** `deno-dom` para parse de HTML (import por URL/JSR).

## Tratamento de erros
| Situação | Comportamento |
|---|---|
| `numero_licao` vazio | Botão desabilitado com dica; não chama a função. |
| Lição não encontrada (direta + fallback) | Toast "Lição não encontrada para este trimestre."; dia inalterado. |
| Falha de rede/parse / função 5xx | Toast genérico de erro; dia inalterado. |
| Dia fechado (`readOnly`) | Botão desabilitado. |

## Testes
- **Edge Function:** teste Deno do extrator puro `extrairLicao(html)` usando o HTML
  de exemplo fornecido como fixture (`supabase/functions/buscar-licao/extrair.test.ts`).
  Verifica: título extraído corretamente; markdown contém as seções-chave
  (Texto Áureo, Comentário, Conclusão); ausência de `<img>`/tags/`&nbsp;`/cabeçalhos
  do site. É a lógica de maior risco.
- **Front:** verificação manual (o front não tem runner de teste configurado hoje).

## Fora de escopo (YAGNI)
- Cache do conteúdo entre dias / pré-busca de todas as lições do trimestre.
- Importar imagens da lição.
- Suporte a revistas que não sigam o padrão de URL "Adultos" descrito.
- Edição manual do markdown buscado (o campo é texto; pode ser editado depois se
  necessário, mas não há UI dedicada nesta entrega).

## Premissas
- O padrão de URL `licoes_cpad/<ano>/<ano>-<TT>-<LL>.htm` vale para os trimestres
  do ano corrente; o fallback via sumário cobre divergências de href.
- O conteúdo de interesse está sempre dentro de `div#contents` na página da lição.
- O usuário está logado ao acionar a busca (sessão Supabase válida).
