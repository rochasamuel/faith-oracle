---
version: 1
slug: "src-layout-tsx"
primary_target: "src/layout.tsx"
related_targets: ["src/pages","src/features","src/components"]
---

# App shell (all authenticated screens + login)

Scope: the entire app interface — shell (navigation), Financeiro, Igreja, EBD, Relatórios, Entrar. Mode: Operate.
Audience: church volunteers 40+, phone-first on Sunday (EBD) and desktop for treasury. Priority screen: EBD dia (frequência) on a phone.
Must not feel: corporate/cold, startup/trendy, kitsch/decorative, small/cramped.
Constraints: logo as is; PDF report untouched; dark mode kept; church name/logo come from data (multi-church future).

## Direction contract

THESIS: Every screen is a page of the church's own registro book — ruled lines, a red margin, a folio number, and the "Conferido" stamp that closes a record. Refuses the generic SaaS sidebar-plus-white-cards dashboard.

OWN-WORLD: Navy book-cloth (#1E2A6E-ish, from the logo's indigo) owns the shell/header bands; pages are clean white (never cream) with pale blue ruled row lines and one thin red margin rule. Ink-blue primary actions, red reserved for the margin, destructive and the stamp. Serif (folio headings, numbers that matter) + highly legible humanist sans (UI, labels, data). No cards-in-cards, no shadows-as-hierarchy; rows and rules carry structure.

STORY: A volunteer opens the app, sees which book/page they are on (folio header), writes on the ruled lines with big targets, and closes the page with a stamp they can trust. Treasurer reads money like a ledger: right-aligned tabular numerals, entradas/saídas unmistakable.

FIRST VIEWPORT: Phone, EBD dia: navy band with church seal + "EBD" and back; folio header in serif ("Domingo, 26 de outubro" large, "Lição 4 · Folha nº 12" small); a ruled list, one enrolled student per line (name 18px) with a two-way Presente/Falta segmented control ≥48px; sticky bottom bar shows "18 presentes · 3 faltas" and the primary "Fechar o dia" action. Desktop: same page centered at reading width, navy left rail with labelled sections.

FORM: Livro de registro / livro ata (Brazilian ruled registry book), position 4 of 7 on the grounded list; seed key dc33bf60. Raises: folio numbers as record identity (catalog), one next decision + key number large on phone (wayfinding), consistent ruled block header everywhere (density), hierarchy by serif scale contrast not boxes (specimen). Signature interaction: closing a day/report presses a "Conferido" ink stamp onto the page (short scale+rotate settle, reduced-motion = instant). Motion grammar: 150–220ms ease-out state changes only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
