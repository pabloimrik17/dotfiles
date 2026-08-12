## ADDED Requirements

### Requirement: mole does not empty the Trash

The setup SHALL prevent `mole clean` from emptying `~/.Trash`, or, where that cannot be guaranteed, SHALL document the behaviour prominently wherever `mole clean` is described.

`mole clean` treats the Trash as reclaimable space by default; it is not covered by mole's built-in whitelist. That directly contradicts a deliberate choice made elsewhere in this configuration, where macOS is configured to retain trashed items for 30 days. It also removes the safety net behind mole's own destructive operations, which move files to the Trash rather than deleting them — so a single `mole clean` can make an earlier `mole analyze` deletion unrecoverable.

#### Scenario: Trash survives a clean

- **WHEN** the user runs `mole clean`
- **THEN** items in `~/.Trash` SHALL remain until the configured retention window expires

#### Scenario: Behaviour is documented if not suppressed

- **WHEN** the suppression mechanism is judged too fragile to depend on
- **THEN** the manual entry for `mole clean` SHALL state that it empties the Trash, and SHALL point at the flag that excludes it

#### Scenario: Retention policy stays coherent

- **WHEN** macOS is configured to retain trashed items for a fixed window
- **THEN** no chezmoi-managed tool invocation SHALL shorten that window as a side effect
