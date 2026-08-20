## ADDED Requirements

### Requirement: mole does not empty the Trash

`mole clean` empties `~/.Trash`, and this setup does not prevent it: mole's built-in whitelist does not cover the Trash, and no user whitelist is shipped or created here. The safeguard SHALL therefore be documentation — the manual SHALL state the behaviour wherever `mole clean` is described, and SHALL name the opt-in that exempts the Trash.

That directly contradicts a deliberate choice made elsewhere in this configuration, where macOS is configured to retain trashed items for 30 days. It also removes the safety net behind mole's own destructive operations, which move files to the Trash rather than deleting them — so a single `mole clean` can make an earlier `mole analyze` deletion unrecoverable.

#### Scenario: Trash survives a clean

- **WHEN** the user has added `~/.Trash` to `~/.config/mole/whitelist`, an opt-in this setup does not perform on their behalf
- **THEN** `mole clean` SHALL leave the Trash intact
- **AND** without that entry `mole clean` SHALL empty `~/.Trash` outright, with no Finder confirmation

#### Scenario: Behaviour is documented if not suppressed

- **WHEN** the manual entry for `mole clean` is written
- **THEN** it SHALL state that the command empties the Trash, and SHALL point at `mole clean --whitelist` as the supported way to exempt it
- **AND** the undocumented `MOLE_SKIP_TRASH_CLEANUP=1` SHALL NOT be relied on in its place

#### Scenario: Retention policy stays coherent

- **WHEN** macOS is configured to retain trashed items for a fixed window
- **THEN** no chezmoi-managed tool invocation SHALL shorten that window as a side effect
