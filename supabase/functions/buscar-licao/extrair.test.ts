import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts"
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
