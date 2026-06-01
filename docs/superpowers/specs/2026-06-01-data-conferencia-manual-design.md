# Data de conferência manual na geração de relatório

**Data:** 2026-06-01

## Problema

O PDF de relatório imprime *"Conferido dia {data}"* (`src/features/relatorios/report-pdf.tsx:395`).
Hoje essa data (`generatedAt`) é fixada em `new Date()` no momento do download
(`src/features/relatorios/report-table.tsx:105`), sempre "hoje", sem como ajustar.

Para relatórios antigos/retroativos isso fica errado: a conferência aconteceu numa data
passada, não no dia em que o PDF é baixado. É preciso poder definir manualmente o dia de
conferência na geração do relatório, mantendo o padrão atual (default = hoje) para o uso comum.

## Solução

Adicionar um campo **"Data de conferência"** na geração do relatório, persistido no registro e
usado no PDF.

### Comportamento

- No `GenerateReportDialog`, novo campo "Data de conferência" usando o padrão de datepicker
  (Calendar + Popover) já existente em `checkpoint-form.tsx` / `reconciliation-dialog.tsx`.
- O campo vem preenchido com **hoje por padrão** (mantém o padrão atual) e é editável.
- O campo é **obrigatório** (sempre tem um valor; default hoje).
- A data escolhida é salva no relatório e usada no PDF em *"Conferido dia {data}"* (rótulo
  inalterado), no lugar do `new Date()` fixo.

### Banco — `supabase/reports.sql`

- Nova coluna `conferred_at date` (nullable, sem default). Relatórios antigos ficam `null`.
- Adicionar de forma idempotente, no estilo do arquivo:

```sql
alter table public.reports add column if not exists conferred_at date;
comment on column public.reports.conferred_at is
  'Dia da conferência informado na geração; usado no PDF ("Conferido dia"). Nulo em relatórios antigos.';
```

### Camada de dados — `src/api/reports.ts`

- Em `Report`: adicionar `conferred_at: string | null` (ISO yyyy-mm-dd).
- Em `NewReport`: adicionar `conferred_at?: string | null`.

### Geração — `src/features/relatorios/generate-report-dialog.tsx`

- Novo estado `conferredAt: Date | undefined` com default `new Date()`.
- Novo estado `conferredAtOpen` para o Popover do datepicker.
- Datepicker `mode="single"` no form (seguindo `checkpoint-form.tsx`), usando `formatDateBR`.
- `reset()` volta `conferredAt` para `new Date()`.
- Em `handleGenerate`, validar que `conferredAt` está definido; incluir
  `conferred_at: dateToISO(conferredAt)` no payload de `createReport.mutate`.

### PDF / download — `src/features/relatorios/report-table.tsx`

- No `handleDownload`, trocar `generatedAt: new Date()` por:

```ts
generatedAt: parseISO(report.conferred_at ?? report.created_at)
```

  Ou seja: usa `conferred_at` quando existir; senão **fallback para `created_at` do registro**
  (nunca `new Date()` no caminho de download). Importar `parseISO` de `date-fns`.

- `report-pdf.tsx` permanece inalterado (já recebe `generatedAt: Date`).

## Fora de escopo

- Editar a data de conferência de relatórios já existentes. O input fica apenas na geração.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `supabase/reports.sql` | nova coluna `conferred_at` |
| `src/api/reports.ts` | campo em `Report` e `NewReport` |
| `src/features/relatorios/generate-report-dialog.tsx` | campo datepicker + payload |
| `src/features/relatorios/report-table.tsx` | `generatedAt` a partir de `conferred_at ?? created_at` |

## Verificação

- `tsc -b` limpo (gate de tipos do projeto).
- Gerar relatório com data padrão (hoje) → PDF mostra "Conferido dia {hoje}".
- Gerar relatório alterando a data para uma data passada → PDF mostra a data escolhida.
- Baixar PDF de relatório antigo (sem `conferred_at`) → PDF mostra `created_at`, não a data do download.
