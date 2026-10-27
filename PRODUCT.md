# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Tesoureiro(a)** — no computador, registra lançamentos (dízimos, ofertas, despesas), importa CSV, confere saldos e gera o relatório financeiro mensal em PDF.
- **Secretário(a) da EBD** — no celular, durante a Escola Bíblica Dominical: abre o dia, marca presença/falta, lança métricas (visitantes, bíblias, revistas, oferta) e fecha o relatório do dia.
- **Secretário(a) de membros** — cadastra e edita membros, cargos, importa listas.
- **Pastor / liderança** — consulta números e relatórios, principalmente pelo celular.

Todos são voluntários da igreja, muitos com 40+ anos, sem familiaridade com software de gestão. Uso esporádico (semanal ou mensal), então a interface precisa ser reconhecível de novo a cada visita.

## Product Purpose

Substituir o papel e planilhas na gestão de uma igreja evangélica: finanças com prestação de contas, cadastro de membros, e a rotina da EBD (trimestres, turmas, matrículas, frequência diária). Sucesso é o voluntário concluir a tarefa sem ajuda e sem medo de errar.

## Positioning

Feito sob medida para a rotina real de uma Assembleia de Deus: o relatório financeiro no formato aceito pela contabilidade, a EBD estruturada por trimestres da revista CPAD (com a lição buscada automaticamente), e o dia da EBD que pode ser aberto em qualquer data.

## Operating Context

- Domingo de manhã, EBD: celular na mão, em pé, sala cheia, pouco tempo, luz variável.
- Fechamento do mês: computador, com extratos e comprovantes ao lado.
- Idioma: português do Brasil. Moeda em reais (armazenada em centavos). Datas via date-fns.
- Autenticação: login e-mail/senha (Supabase).

## Capabilities and Constraints

- Módulos: Financeiro (Lançamentos, Saldos iniciais, Relatórios/conciliação), Igreja (Informações, Membros), EBD (Dias, Dia, Matrículas, Trimestre/Turma).
- Stack existente: React 19 + Vite + Tailwind v4 + shadcn (base-ui) + TanStack Query + Supabase.
- Multi-igreja no futuro: nome e logo não podem ser fixos no design; a identidade da igreja é dado, não código.
- O relatório PDF (`src/features/relatorios/report-pdf.tsx`) mantém o formato atual.
- Tema escuro deve continuar disponível.

## Brand Commitments

- Logo atual da AD Ministério Livre (`src/assets/logo-igreja.png`): selo circular azul → índigo com pomba, mãos quebrando correntes e Bíblia aberta. Usado como está, sem redesenho.
- Nome da igreja: "Assembleia de Deus Ministério Livre" (vem de dados institucionais).

## Evidence on Hand

- Dados institucionais em `src/config/church.ts` e na tabela de informações da igreja.
- Specs de funcionalidades em `docs/superpowers/specs/`.
- Não há depoimentos, métricas de uso ou fotos da igreja; não inventar.

## Product Principles

1. Clareza antes de densidade: uma tarefa por tela, rótulos por extenso, nada escondido atrás de ícone sem texto.
2. Celular é primeira classe, não versão reduzida: a EBD é feita em pé, com uma mão.
3. Errar tem que ser seguro: confirmações claras em ações destrutivas, desfazer quando possível, feedback visível ao salvar.
4. Prestação de contas: números de dinheiro sempre legíveis, alinhados e inequívocos.
5. Reverente sem ser decorativo: a identidade da igreja aparece com dignidade, sem atrapalhar o trabalho.

## Accessibility & Inclusion

- Público 40+: texto base ≥ 16px (17–18px em campos e listas no celular), contraste WCAG AA no mínimo, alvos de toque ≥ 44px, foco visível.
- Evitar dependência de cor isolada (presença/falta com texto e ícone).
- Respeitar `prefers-reduced-motion`.
