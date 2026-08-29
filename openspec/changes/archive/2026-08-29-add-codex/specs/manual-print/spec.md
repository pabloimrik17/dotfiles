## MODIFIED Requirements

### Requirement: Page break control

Print CSS SHALL use `break-inside: avoid` on tables and subsection-sized content blocks to prevent awkward mid-table page breaks. Section headers SHALL use `break-after: avoid`. Oversized top-level section blocks MAY flow across columns or pages when keeping each whole section together would exceed the page-count target.

#### Scenario: Table not split across pages

- **WHEN** a shortcut table fits on the remaining page space
- **THEN** it is kept together on one page, while its containing top-level section may continue in the next column or page

### Requirement: A4 target of 2-4 pages

The print output SHALL be optimized to fit within roughly 2-4 A4 pages under a reference print setup (Chrome, 100% scale, default margins, no headers/footers). Font size and column count MAY be tuned to achieve this.

#### Scenario: Print page count

- **WHEN** all 14 sections are printed with current content using reference setup (Chrome, 100% scale, default margins, no headers/footers)
- **THEN** the output fits in approximately 2-4 A4 pages
