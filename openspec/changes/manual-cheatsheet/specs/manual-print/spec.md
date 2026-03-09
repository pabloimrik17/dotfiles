## ADDED Requirements

### Requirement: Print-optimized cheatsheet via CSS @media print

The same `docs/manual.html` file SHALL transform to a dense, printable cheatsheet when printed (Ctrl+P / browser print). This SHALL be achieved entirely via CSS `@media print` — no separate file.

#### Scenario: Print the manual

- **WHEN** user triggers browser print on `docs/manual.html`
- **THEN** the output is a dense multi-column cheatsheet on a light background, without sidebar or interactive elements

### Requirement: Light theme for print

Print output SHALL use white/light background with dark text for ink efficiency and paper readability.

#### Scenario: Print colors

- **WHEN** the manual is printed
- **THEN** background is white, text is near-black, accent colors are print-safe (no neon/low-contrast colors)

### Requirement: Multi-column dense layout

Print CSS SHALL use `column-count: 2` or `column-count: 3` to maximize information density on A4 pages.

#### Scenario: Column layout

- **WHEN** the manual is printed
- **THEN** content flows in 2-3 columns per page with balanced distribution

### Requirement: Hide interactive elements on print

Print CSS SHALL hide: sidebar navigation, search input, flow/narrative blocks (`.flow-only`), and any interactive-only UI.

#### Scenario: No sidebar in print

- **WHEN** the manual is printed
- **THEN** sidebar navigation is not present in the output

#### Scenario: No narrative flows in print

- **WHEN** the manual is printed
- **THEN** flow blocks are hidden — only shortcut tables and section headers appear

### Requirement: Force all sections expanded on print

All `<details>` elements SHALL be forced open via CSS so no content is hidden when printing.

#### Scenario: Collapsed section in screen, expanded in print

- **WHEN** a section is collapsed on screen and user prints
- **THEN** the section appears fully expanded in the print output

### Requirement: Page break control

Print CSS SHALL use `break-inside: avoid` on tables and section blocks to prevent awkward mid-table page breaks. Section headers SHALL use `break-after: avoid`.

#### Scenario: Table not split across pages

- **WHEN** a shortcut table fits on the remaining page space
- **THEN** it is kept together on one page

### Requirement: A4 target of 2-4 pages

The print output SHALL target 2-4 A4 pages at a readable font size. Font size and column count MAY be tuned to achieve this.

#### Scenario: Print page count

- **WHEN** all 12 sections are printed with current content
- **THEN** the output fits in 2-4 A4 pages
