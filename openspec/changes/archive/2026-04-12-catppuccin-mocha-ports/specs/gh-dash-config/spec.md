## MODIFIED Requirements

### Requirement: Catppuccin Mocha theme

The gh-dash config SHALL use the official Catppuccin Mocha blue port color palette:

- `text.primary`: `#cdd6f4` (Text)
- `text.secondary`: `#89b4fa` (Blue — accent)
- `text.inverted`: `#11111b` (Crust)
- `text.faint`: `#bac2de` (Subtext0)
- `text.warning`: `#f9e2af` (Yellow — semantic warning)
- `text.success`: `#a6e3a1` (Green)
- `text.error`: `#f38ba8` (Red — new field, semantic error)
- `background.selected`: `#313244` (Surface0)
- `border.primary`: `#89b4fa` (Blue)
- `border.secondary`: `#45475a` (Surface1)
- `border.faint`: `#313244` (Surface0)

The theme SHALL enable `sectionsShowCount: true` and `table.showSeparator: true`.

#### Scenario: Theme colors match official Catppuccin Mocha port

- **WHEN** the user opens gh-dash
- **THEN** the UI renders with the official Catppuccin Mocha blue accent port colors, with yellow for warnings and red for errors (semantic separation)
