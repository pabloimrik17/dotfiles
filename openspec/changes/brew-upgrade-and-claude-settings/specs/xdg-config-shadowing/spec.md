## Purpose

Remove stale configuration files under `~/Library` that outrank the chezmoi-managed XDG copies, so that a tool cannot silently run unconfigured while `chezmoi status` reports everything as clean.

## ADDED Requirements

### Requirement: Shadowing macOS config files are removed

The dotfiles source SHALL declare removal of macOS-native configuration paths that take precedence over the chezmoi-managed `~/.config` copies for tools this repo configures.

On macOS several tools resolve a `~/Library` location ahead of `~/.config` whenever `XDG_CONFIG_HOME` is unset. A file left at the higher-precedence path wins silently: the managed config is never read, and because the shadowing file is not in the chezmoi source, `chezmoi status` and `chezmoi diff` report no problem.

#### Scenario: lazygit resolves the managed config

- **WHEN** `XDG_CONFIG_HOME` is unset
- **AND** the removal has been applied
- **THEN** lazygit SHALL resolve its config directory to `~/.config/lazygit`
- **AND** the Catppuccin theme and the `mdview` custom command SHALL be in effect

#### Scenario: glow resolves the managed config

- **WHEN** `XDG_CONFIG_HOME` is unset
- **AND** the removal has been applied
- **THEN** glow SHALL read the chezmoi-managed `~/.config/glow/glow.yml` rather than a copy under `~/Library`

#### Scenario: Tool state is not removed

- **WHEN** the removal is applied
- **THEN** files that hold tool state rather than configuration SHALL be left untouched

#### Scenario: Removal is idempotent

- **WHEN** the shadowing paths do not exist
- **AND** `chezmoi apply` runs
- **THEN** the apply SHALL succeed without error
