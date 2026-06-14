# EBD (Escola Bíblica Dominical) — Modelo de dados

Data: 2026-06-13 · Status: aprovado (entidades) · Módulo: `supabase/ebd/`

## Objetivo

Tirar do papel o controle da Escola Bíblica Dominical: registrar, por dia de aula
(em qualquer data, inclusive retroativa), a frequência dos alunos e as métricas do
dia (oferta, visitantes, bíblias, revistas, nº da lição, professor). No fim do dia,
"fechar o relatório" trava os dados e gera um snapshot consultável na própria página.
Trimestral/anual virão depois por agregação. Um dashboard de métricas (faltas,
ofertas, progressão) é o consumidor futuro deste modelo.

## Decisões

- **Trimestre é da igreja; revista/tema são por turma.** Um trimestre (ano + nº 1–4,
  datas) vale para a igreja toda; cada turma roda dentro dele com sua revista, tema e
  matrículas. Pronto para múltiplas turmas (hoje só a principal).
- **Matrícula só de membros** do cadastro (`public.members`).
- **Oferta fica isolada na EBD** por enquanto (sem lançar no módulo financeiro).
- **Frequência:** `presente | falta | nao_aplicavel`. "Não aplicável" cobre quem se
  matriculou depois do início do trimestre (não conta como falta em aulas anteriores).
- **Professor = texto livre** (cobre preletor visitante sem cadastro).
- **Snapshot ao fechar:** totais gravados na própria aula → relatório estável e
  agregação trimestral/anual/dashboard barata (somar colunas, sem re-joins).

## Espinha dorsal

```
ebd_turmas ───┐
              ├── ebd_turma_trimestres ──┬── ebd_matriculas ──┐
ebd_trimestres┘   (turma rodando no tri) │                    ├── ebd_frequencias
                                         └── ebd_aulas ───────┘   (1 por aluno/dia)
                                             (o "dia" / relatório diário)
```

Tudo pendura em `ebd_turma_trimestres`. Hoje: 1 turma × 1 trimestre por vez; schema aguenta N.

## Tabelas

| Tabela | Papel | Colunas-chave |
|---|---|---|
| `ebd_turmas` | turma persistente | `nome`, `descricao`, `ativo` |
| `ebd_trimestres` | período da igreja | `ano`, `numero` (1–4), `data_inicio`, `data_fim` |
| `ebd_turma_trimestres` | turma rodando no trimestre | `turma_id`, `trimestre_id`, `revista_titulo`, `tema`, `revistas_compradas` |
| `ebd_matriculas` | membro inscrito no tri | `turma_trimestre_id`, `member_id`, `data_matricula`, `ativa` |
| `ebd_aulas` | o dia / relatório diário | `data`, `numero_licao`, `titulo_licao`, `professor`, `oferta_centavos`, `visitantes`, `total_biblias`, `total_revistas`, `status`, snapshot, `closed_at` |
| `ebd_frequencias` | presença por aluno/dia | `aula_id`, `matricula_id`, `status` |

Enums: `ebd_aula_status (aberta|fechada)`, `ebd_frequencia_status (presente|falta|nao_aplicavel)`.

## Métricas: digitado vs. calculado

| Métrica | Origem |
|---|---|
| Oferta, visitantes, bíblias, revistas, nº lição, professor | digitadas na aula |
| Presentes, faltas, não-aplicável, matriculados | calculadas das `ebd_frequencias` |
| Total de assistência | calculado = presentes + visitantes |

Aula **aberta**: tudo calculado ao vivo. Ao **fechar**: grava
`total_matriculados / total_presentes / total_faltas / total_nao_aplicavel /
total_assistencia` + `closed_at` e trava a edição. Reabrir volta para `aberta`.

## Convenções (herdadas do projeto)

`uuid` PK · `org_id` reservado (null) · `created_at`/`updated_at` + trigger
`set_updated_at()` · enums idempotentes · **valores em centavos (int)** · RLS
habilitada e **aberta** (`using (true)`; gate de auth é no front).

## Layout de arquivos

- `supabase/ebd/0001_init.sql` — schema inicial (re-executável: `if not exists` em
  tabelas/enums, `drop ... if exists` em triggers/policies).
- `supabase/ebd/reset.sql` — derruba os objetos da EBD (em ordem de dependência)
  para recriar fácil durante mudanças. Não toca em `set_updated_at()` (compartilhada).
- Migrações futuras da EBD entram na mesma pasta (`0002_...`, etc.).

## Frontend (mobile-first)

Segue os padrões do app (api pura → hooks react-query → páginas; componentes
shadcn/base-ui; React 19 com react-compiler). Nav "EBD" com 3 itens.

**Páginas** (`src/pages/ebd/`)
- `trimestre.tsx` — cria/edita trimestres (período, revista, tema, revistas compradas).
- `matriculas.tsx` — seletor de trimestre + matricular membros (do cadastro), ativar/remover.
- `dias.tsx` — seletor de trimestre + "Abrir dia" (qualquer data) + lista de dias.
- `dia.tsx` — **a tela principal**: cabeçalho (data/lição/professor/status), resumo
  do dia, frequência segmentada e métricas. Orquestra o estado; remonta via `key={aula.id}`.

**Componentes** (`src/features/ebd/`)
- `constants.ts` — tipos/rótulos + cálculo dos totais (`statusFinal`, `contarTotais`).
- `hooks.ts` — react-query (trimestres, matrículas, aulas, frequências, fechar/reabrir).
- `attendance-control.tsx` — segmentado Presente · Falta · N/A.
- `day-frequency.tsx` / `day-metrics.tsx` / `day-summary.tsx` — seções da tela do dia.
- `trimestre-dialog`, `matricula-add-dialog`, `open-day-dialog`, `trimestre-select`, `date-field`.

**Decisões de UX**
- Frequência segmentada por aluno + "Marcar todos presentes"; N/A automático para quem
  matriculou após a data da aula (botão travado).
- Autosave: presença persiste a cada toque; métricas no blur / clique nos contadores.
- "Fechar o dia" finaliza não-marcados como falta, grava o snapshot e trava (com reabrir).
- Seleção de trimestre derivada (sem `useEffect`): escolha manual prevalece, senão o vigente.

## Fora de escopo (por agora)

Template/PDF dos relatórios, tabela própria de relatório trimestral/anual, dashboard,
integração oferta→financeiro, cópia de matrículas entre trimestres, alunos não-membros.
