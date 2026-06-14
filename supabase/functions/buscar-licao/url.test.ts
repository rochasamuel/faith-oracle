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
