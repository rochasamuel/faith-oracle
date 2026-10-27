---
name: Faith Oracle
description: The church's registro book, kept on screen. Navy cloth cover, white ruled pages, a red margin, and a "Conferido" stamp.
colors:
  cover: "oklch(0.29 0.105 272)"
  cover-foreground: "oklch(0.97 0.012 265)"
  cover-muted: "oklch(0.80 0.045 268)"
  cover-accent: "oklch(0.37 0.12 270)"
  primary: "oklch(0.46 0.175 266)"
  primary-foreground: "oklch(0.985 0.005 265)"
  ring: "oklch(0.55 0.17 266)"
  margin: "oklch(0.62 0.17 25)"
  destructive: "oklch(0.52 0.19 27)"
  danger-soft: "oklch(0.955 0.03 25)"
  success: "oklch(0.48 0.12 155)"
  success-soft: "oklch(0.95 0.04 155)"
  warning: "oklch(0.50 0.12 65)"
  warning-soft: "oklch(0.96 0.05 85)"
  page: "oklch(1 0 0)"
  background: "oklch(0.968 0.007 265)"
  foreground: "oklch(0.23 0.045 270)"
  muted-foreground: "oklch(0.47 0.035 268)"
  secondary: "oklch(0.945 0.018 265)"
  secondary-foreground: "oklch(0.28 0.08 270)"
  muted: "oklch(0.955 0.012 265)"
  accent: "oklch(0.94 0.025 265)"
  rule: "oklch(0.90 0.032 262)"
  border: "oklch(0.88 0.03 264)"
  input: "oklch(0.80 0.035 265)"
typography:
  headline:
    fontFamily: "Source Serif 4 Variable, ui-serif, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline-phone:
    fontFamily: "Source Serif 4 Variable, ui-serif, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Source Serif 4 Variable, ui-serif, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
  folio:
    fontFamily: "Source Serif 4 Variable, ui-serif, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum, lnum"
  figure:
    fontFamily: "Source Serif 4 Variable, ui-serif, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    fontFeature: "tnum, lnum"
  ledger-value:
    fontFamily: "Source Serif 4 Variable, ui-serif, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    fontFeature: "tnum, lnum"
  list-name:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.375
  field:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "lnum"
  label:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
  2xl: "0.9rem"
  full: "9999px"
spacing:
  row: "12px"
  row-loose: "14px"
  section-gap: "16px"
  page-stack: "32px"
  page-pad-mobile: "24px 16px 24px 28px"
  page-pad-tablet: "24px 32px 24px 48px"
  page-pad-desktop: "40px 40px 40px 56px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.page}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.accent}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.page}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "48px"
  button-lg:
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "56px"
  input:
    backgroundColor: "{colors.page}"
    textColor: "{colors.foreground}"
    typography: "{typography.field}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
    height: "48px"
  attendance-option:
    backgroundColor: "{colors.page}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "48px"
  attendance-presente:
    backgroundColor: "{colors.success}"
    textColor: "{colors.page}"
  attendance-falta:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.page}"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.md}"
    height: "28px"
    padding: "2px 10px"
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.md}"
    height: "28px"
    padding: "2px 10px"
  badge-destructive:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.md}"
    height: "28px"
    padding: "2px 10px"
  rail-link:
    textColor: "{colors.cover-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "44px"
  rail-link-active:
    backgroundColor: "{colors.cover-foreground}"
    textColor: "{colors.cover}"
  stamp:
    textColor: "{colors.margin}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
---

# Design System: Faith Oracle

## Overview

**Creative North Star: "The Registro Book"**

Every screen is a page of the church's own livro de registro. The shell is the book's navy cloth cover, taken from the indigo in the church seal. The content is a white folha with pale blue ruled lines and one thin red margin rule near its left edge. A page opens with a serif title and an italic folio line ("Folha nº 4 · 4º trimestre / 2026 · Lição 4"), a heavy rule closes the header, and ruled blocks follow. A closed record gets a double-bordered red "Conferido" stamp. Rules and rows carry the structure. Boxes, cards and shadows do not.

The world is built for volunteers aged 40 and up, often standing with a phone in one hand on a Sunday morning. That sets the density. Base text is 16px, list names 18px, field text 17px. Buttons, fields and attendance controls are 48px tall, and every link and row target is at least 44px. Serif scale contrast does the hierarchy work: a 40px serif title over 16px humanist sans. Weight and color do much less of it.

The palette is restrained. Ink blue is for action, red is for the margin, for destructive actions and for the stamp, and green and amber mark money direction and status. Dark mode keeps the same book: a deeper navy cover and dark ink-blue folhas, with every role re-tuned in `.dark`.

**Key Characteristics:**
- Navy book-cloth shell (desktop rail and mobile top bar). White folha content surface with a red margin rule.
- Serif (Source Serif 4) for titles, folios and numbers that matter. Atkinson Hyperlegible Next for UI, labels and data.
- Rows and rules, not cards. The header closes with a 2px ink rule, sections with a pale blue rule, totals with a double rule.
- Big, labelled targets: 48px is the default control height, never under 44px.
- One signature moment: the "Conferido" ink stamp, pressed with a short scale-and-rotate settle.
- Money is tabular, right-aligned and signed: "+ R$" in green for entradas, "− R$" in red for saídas.

## Colors

A cool, ink-on-paper palette. Navy cloth and white paper carry the page, one ink blue does the acting, and registry red appears in a few strictly limited places.

### Primary
- **Ink Blue** (`primary`): primary buttons ("Novo lançamento", "Entrar"), the back link, the active mobile tab underline, the active bottom-nav item, the input caret, the selection tint (22% mix) and the base of the chart ramp. Hover darkens it by mixing in 14% black, so the hue stays the same.
- **Focus Blue** (`ring`): the 3px focus outline with a 2px offset, on everything.

### Secondary
- **Book-Cloth Navy** (`cover`): the desktop rail (17.5rem) and the mobile top bar (64px). It is never a content surface.
- **Cover Ink** (`cover-foreground`): text on the cover. It also fills the active rail link, which then inverts to navy text.
- **Cover Thread** (`cover-muted`): section group labels on the rail and the focus outline on the cover.
- **Cloth Fold** (`cover-accent`): hover fill for rail links.

### Tertiary
- **Registry Red** (`margin`): the 1px margin rule at 55% opacity and the "Conferido" stamp. Nothing else.
- **Destructive Red** (`destructive`) and **Blush** (`danger-soft`): saídas, faltas, delete actions, "Saída" badges and the error-state panel.
- **Ledger Green** (`success`) and **Mint** (`success-soft`): entradas, "Presente", "Entrada" badges and the presentes count.
- **Amber Ink** (`warning`) and **Cream Amber** (`warning-soft`): "Aberto" status, N/A attendance and the "sem marcar" count.

### Neutral
- **Folha White** (`page`): every content surface, including pages, fields, outline buttons, dialogs and bottom bars.
- **Desk Blue-Grey** (`background`): the desk the folha sits on. It shows only at the desktop margins.
- **Ink** (`foreground`): body text. It is also the header rule at 80% and the total rule at 70%.
- **Faded Ink** (`muted-foreground`): folio lines, descriptions, labels, table heads and counts.
- **Ruled Line** (`rule`): the pale blue line under every row and every section header.
- **Page Edge** (`border`): the folha's ring on desktop, mobile nav borders and dialog footers.
- **Field Stroke** (`input`): borders on fields, outline buttons and unselected attendance options.
- **Wash** (`accent`, `secondary`, `muted`): hover fills, the selected filter chip and the active bottom-nav pill.

### Named Rules
**The Three Reds Rule.** Red appears in three places only: the margin rule, destructive or negative meaning, and the stamp. A red heading, a red link or a red decoration is off-system.

**The White Folha Rule.** Content surfaces are pure white (`page`), never cream or tinted paper. The off-white `background` is the desk, not the page.

**The Cover Is Chrome Rule.** Navy belongs to navigation: the rail and the top bar. Content never sits on navy.

## Typography

**Display Font:** Source Serif 4 Variable (optical sizes; with ui-serif, Georgia)
**Body Font:** Atkinson Hyperlegible Next Variable (with ui-sans-serif, system-ui)
**Record Font:** Courier Prime (`font-type`, 400/700), only on typed record data: dates, amounts and data cells in tables and lists.

**Character:** A bookish, upright serif for the record itself (titles, folios, the numbers you sign off on), paired with a sans designed for low-vision legibility for everything you operate. `h1`, `h2` and `h3` get the serif and `text-wrap: balance` globally. Body text uses lining numerals. The `num` utility adds tabular figures wherever numbers stack in a column.

### Hierarchy
- **Headline** (serif 600; 28px on phone, 40px from 640px; line-height 1.15; -0.01em): the page title in PageHeader ("Segunda, 26 de outubro", "Lançamentos"). There is one per page. The login hero reaches 44px on desktop.
- **Title** (serif 600, 24px): section headers ("Chamada", "Registros"), with an optional sans count in muted 18px beside them. Dialog titles use the same size. Empty-state titles use 20px.
- **Folio** (serif italic 400, 17px rising to 18px, tabular): the record line under the title.
- **Figure** (serif 600, 28px, tabular): a key number, with a 14px semibold label above it. Ledger values are 22px, and the ledger total is 28px.
- **List name** (sans 600, 18px, line-height 1.375): one person per ruled row.
- **Field** (sans 400, 17px): text inside inputs and selects, and rail links.
- **Body** (sans 400, 16px, line-height 1.5): all running text. Descriptions are capped at 60ch, and empty-state text at 44ch.
- **Label** (sans 600, 14px): field labels, Figure labels, table heads and bottom-nav captions. This is the smallest text the system uses for reading.

### Named Rules
**The Serif Means Record Rule.** Serif is for what is written into the book: titles, folios and the figures a treasurer reads. Buttons, labels, fields, names and the menu stay in Atkinson.

**The Typed Record Rule.** Dates and amounts in record lists and tables are set in Courier Prime (`num font-type`), like a typed ledger entry. Never for menus, buttons, names, labels, inputs or running text: a full-typewriter UI was tested and rejected because it slows reading for 40+ users.

**The Hierarchy-by-Scale Rule.** Rank comes from serif size contrast and rules, not from boxes, color blocks or uppercase. Uppercase with tracking belongs only to the stamp.

## Layout

The app is a single column of content on a folha, inside a navy shell.

- **Desktop (≥64rem):** a two-column grid with a 17.5rem sticky navy rail and the content area. The folha floats on the desk with 24px margins and a 1px `border` ring at 8px radius. It is at least one viewport tall. Width is narrow (max 48rem) for task pages like EBD dia, default (64rem) for most screens, and wide (80rem) for dense tables.
- **Mobile:** the folha runs edge to edge. A 64px navy top bar shows the seal and the section name. Below it is a sticky white tab strip with the section's pages and a 3px ink underline on the active one. At the bottom is a fixed three-item nav with labelled icons, 64px tall and safe-area aware. Content reserves 5.5rem plus the safe area under itself (`pb-safe-nav`).
- **The margin rule:** a 1px red line at 0.75rem from the folha's left edge, moving to 1.75rem from 640px. Page padding puts content to the right of it: 28px on the left and 16px on the right on mobile, 48/32px from 640px, and 56/40px with 40px vertical padding on desktop.
- **Rhythm:** page blocks are 32px apart. Within a section, 16px separates the header from its content. Ruled rows use 12–14px of vertical padding. Header actions sit right-aligned on desktop and stretch to full width on phones.
- **Sticky action bar:** task pages with an open record get a bottom bar on 95% white with a small backdrop blur. It holds the live tally ("10 presentes · 1 falta · 6 sem marcar") and the closing action. It sits above the bottom nav on mobile and at the viewport bottom on desktop.

## Elevation & Depth

The page is flat. Depth on the folha comes from rules: a 2px ink rule under the header, a 1px pale blue rule under each row and section, and a 3px double rule over totals. The folha itself has only a 1px ring. Shadows appear only on layers that float above the page, and they are tinted with the navy hue, never neutral black.

### Shadow Vocabulary
- **Floating menu** (`box-shadow: 0 12px 32px -8px oklch(0.2 0.08 270 / 0.28)`): select lists, popovers and dropdown menus, always with a 1px `border` ring.
- **Bottom sheet** (`box-shadow: 0 -8px 40px -12px oklch(0.2 0.08 270 / 0.35)`): dialogs on mobile, which rise from the bottom with a 16px (`2xl`) top radius. From 640px the dialog centres, drops the shadow for a 1px ring and uses a 12px (`xl`) radius.

### Named Rules
**The Rules Not Shadows Rule.** Nothing on the folha casts a shadow. To group content, use a ruled Section header. To close a sum, use the double rule. Shadows belong only to menus and sheets that float above the page.

## Shapes

Corners are gently softened from a 0.5rem base (`--radius`). Buttons, fields, attendance options, rail links, the desktop folha, empty states and error panels all use the 8px `lg` radius. Badges and the stamp use the tighter 6.4px `md`. Floating menus use `lg`, the centred dialog uses `xl`, and the mobile sheet's top corners use `2xl`. Round shapes are limited to the church seal, the account initials and the bottom-nav active pill (56×32). Borders do real work. Unselected attendance options use 2px strokes, the empty state uses a 2px dashed `rule` outline, and the stamp uses a 3px double red border rotated -6°.

## Components

### Buttons
Solid, large and plainly labelled. Every button has text, and icons sit inside it at 20px.
- **Shape:** gently rounded (8px `lg`), 1px transparent border.
- **Primary:** Ink Blue on white text, 16px semibold, 48px tall, 20px side padding (16px on the icon side). `lg` is 56px and 18px. `sm` is 40px and is used for secondary in-section actions such as "Todos presentes".
- **Hover / Focus / Active:** the background darkens by a 14% black mix over 150ms ease-out. Focus is a 3px `ring` outline offset 2px. On press the button moves down 1px. Disabled buttons drop to 50% opacity.
- **Outline:** white background with a `input` stroke. On hover the border shifts toward ink blue at 50% and the background fills with `accent`. It is the default for "Importar CSV", "Fechar" and the dialog cancel.
- **Destructive:** solid Destructive Red with white text, and its focus outline is red too.
- **Ghost / Link:** ghost is for icon closers. Link is Ink Blue, underlined, with the underline thickening to 2px on hover.

### Attendance Control (signature)
A three-way segmented row: "Presente", "Falta" and "N/A", in columns weighted 1.25/1/0.8 with 6px gaps. Each option is 48px tall with a 2px border and 8px radius, and always pairs an icon (check, X, dash) with its word. Unselected options use a white fill and the `input` stroke. A selected option fills solid: success green for Presente, destructive red for Falta, and Cream Amber with amber text and border for N/A. The selected icon stroke thickens from 2 to 3. On press the option scales to 0.97 over 150ms.

### Chips / Badges
- **Style:** 28px tall with 6.4px corners, 14px semibold, and an optional 16px icon. Status variants are a soft fill with text in the matching deep tone: "Entrada" in mint and green, "Saída" in blush and red, "Aberto" in cream amber and amber.
- **Filter toggles:** "Todos / Entradas / Saídas" are outline buttons. The selected one takes an accent fill and an ink-blue border.

### Cards / Containers
The folha is the only container. Sections are open blocks with a ruled header, not boxed cards. A Card primitive exists in `ui/` (white, 1px ring, `lg` radius, 20px padding), but no screen uses it.
- **Empty state:** centred, with a 2px dashed `rule` border, 8px radius, 48px vertical padding, a 40px icon at 70% ink blue, a 20px serif title, a one-line next step and an action.
- **Error state:** a Blush panel with 8px radius and red semibold title. The explanation is in ink at 80%, followed by the fixed guidance "Verifique a internet e tente de novo."

### Inputs / Fields
- **Style:** 48px tall with a white background, 1px `input` stroke, 8px radius, 14px side padding and 17px text. The placeholder is Faded Ink, and the caret is ink blue.
- **Focus:** the border turns ink blue and gets a 3px ring of ink blue at 20%.
- **Error / Disabled:** an invalid field gets a destructive border and a 3px ring of destructive at 20%. Disabled fields drop to 50% opacity on an `input` wash. Checkboxes are 24px with a 2px stroke.

### Navigation
- **Desktop rail:** navy. The 56px seal and the church name (serif 17px semibold, from data) sit at the top. Each group has a 14px semibold Cover Thread label with an 18px icon, followed by links at 17px with a 44px minimum height and 8px radius. On hover a link takes the Cloth Fold fill. The active link inverts to a Cover Ink fill with navy semibold text. The account menu sits at the foot, above a 12% white rule.
- **Mobile:** the top bar has a 40px seal and the section title (serif 20px). Section tabs are 48px tall at 16px, with the active one semibold ink and a 3px Ink Blue underline. The bottom nav has three labelled sections with 24px icons, and the active one is bold Ink Blue on a 56×32 `accent` pill.

### Page Header (signature)
An optional back link (ink blue, semibold, 44px tall, arrow icon), then the serif headline with an optional status (a badge or the stamp) inline. Below that come the italic serif folio line and an optional description. Actions sit at the right, and the header closes with a 2px rule at 80% ink.

### Ledger and Figure (signature)
A Ledger row has a semibold muted sans label on the left and a right-aligned 22px serif tabular value on the right, over a `rule` line with 12px vertical padding. The total row sits under a 3px double rule at 70% ink, with a bold label and a 28px value. Values take a tone: green for positive, red for negative, muted otherwise. In tables, money is right-aligned, tabular and signed ("+ R$ 1.250,00" or "− R$ 98,70"), the footer gets a 2px ink rule, and rows get `rule` lines with an `accent` hover at 60%.

### Conferido Stamp (signature)
"Conferido" is set in 18px bold serif uppercase with 0.12em tracking, optionally with a year line beneath. It sits inside a 3px double Registry Red border with 6.4px radius, rotated -6°. When a record closes, it plays once: 320ms `cubic-bezier(0.16, 1, 0.3, 1)` from scale 1.6 at -14° to scale 1 at -6°. With reduced motion it appears at once. In lists it shows at 75% scale.

## Do's and Don'ts

### Do:
- **Do** put every screen inside `Page` (the folha) and open it with `PageHeader`: serif title, italic folio line, 2px ink rule.
- **Do** group content with `Section`: a 24px serif title, an optional count and action, and a `rule` line beneath.
- **Do** make every control at least 44px tall, with 48px as the default. Use 17px text in fields and 18px for names in lists.
- **Do** pair every status color with a word and an icon: "Presente" with a check, "Falta" with an X, "Entrada" or "Saída" with arrows.
- **Do** set money and counts with `num` (tabular lining figures), right-aligned and signed, green for entradas and red for saídas.
- **Do** close a record with the "Conferido" stamp and keep its single 320ms settle. State changes elsewhere use 150–200ms ease-out.
- **Do** tune both `:root` and `.dark` whenever you add a color role.

### Don't:
- **Don't** use red outside the margin rule, destructive or negative meaning, and the stamp.
- **Don't** box sections in cards, nest cards, or use shadows for hierarchy on the folha. Use rules.
- **Don't** put content on the navy cover, or tint the folha cream.
- **Don't** set buttons, labels or data in the serif, or titles in the sans.
- **Don't** add uppercase or letter-spaced labels above titles. Tracking and uppercase belong only to the stamp.
- **Don't** set reading text below 14px, or ship icon-only actions without a visible label (dialog close and the account avatar excepted).
- **Don't** recolor, crop or filter the church seal. Church name and logo come from data, never hard-coded.
