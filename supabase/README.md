# Banco de dados (Supabase / PostgreSQL)

Cada módulo do app tem sua própria pasta, espelhando `src/features`. Dentro dela,
os arquivos são migrations numeradas (`0001_…`, `0002_…`) mais um `reset.sql` que
derruba o módulo para recriá-lo do zero durante o desenvolvimento.

```
supabase/
├── financeiro/   transações, marcos de saldo e conciliações
├── igreja/       dados institucionais, membros, cargos e foto
├── relatorios/   relatórios financeiros gerados
└── ebd/          Escola Bíblica Dominical
```

## Como aplicar

No SQL Editor do Supabase, execute as migrations de cada módulo em ordem numérica.
Os arquivos são **re-executáveis** (usam `if not exists` / `create or replace`).

A função compartilhada `public.set_updated_at()` é definida em `financeiro/0001_init.sql`
e recriada de forma idempotente nos demais módulos, de modo que cada pasta é
autossuficiente e a ordem **entre** módulos é indiferente. Sugestão de ordem:

1. `financeiro/0001_init.sql` → `financeiro/0002_marcos_conciliacoes.sql`
2. `igreja/0001_church_info.sql` → `0002_membros.sql` → `0003_membros_foto.sql`
3. `relatorios/0001_init.sql`
4. `ebd/0001_init.sql` → `ebd/0002_remove_tema.sql` → `ebd/0003_conteudo_licao.sql`

## Reset (apaga dados)

Cada `reset.sql` derruba as tabelas/tipos do seu módulo (sem tocar na função
compartilhada `set_updated_at`). Rode o `reset.sql` do módulo e reaplique as
migrations dele para recriar do zero.
