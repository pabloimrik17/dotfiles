## ADDED Requirements

### Requirement: Window padding values optimize for density and aesthetics

The Ghostty config SHALL set `window-padding-x = 10` and `window-padding-y = 6` to balance visual breathing room with vertical line density. Horizontal padding is generous (10pt) because it does not reduce visible lines. Vertical padding is reduced (6pt) to recover ~2-3 lines in dense output sessions and the 40%-height quick terminal, while remaining visually polished with `window-padding-balance = true`.

#### Scenario: Padding values are set

- **WHEN** a user opens a Ghostty terminal window
- **THEN** the config contains `window-padding-x = 10` and `window-padding-y = 6`

#### Scenario: Vertical padding preserves lines in quick terminal

- **WHEN** the quick terminal is open at 40% screen height
- **THEN** the reduced vertical padding (6 vs 10) provides ~2-3 additional visible lines compared to symmetric 10x10 padding
