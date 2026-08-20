## Purpose

Remove stale configuration files under `~/Library` that outrank the chezmoi-managed XDG copies, so that a tool cannot silently run unconfigured while `chezmoi status` reports everything as clean.

## ADDED Requirements

### Requirement: Shadowing macOS config files are removed

The dotfiles source SHALL declare removal of macOS-native configuration paths that take precedence over the chezmoi-managed `~/.config` copies for tools this repo configures.

On macOS several tools resolve a `~/Library` location ahead of `~/.config` whenever `XDG_CONFIG_HOME` is unset. A file left at the higher-precedence path wins silently: the managed config is never read, and because the shadowing file is not in the chezmoi source, `chezmoi status` and `chezmoi diff` report no problem.

Removal is the right fix only where the tool does not re-create the file, and the two tools this repo configures differ on exactly that point.

lazygit falls back to `~/.config/lazygit` once no config file remains at the `~/Library` path and never writes one back, so removal is a permanent fix.

glow is the counter-example, and SHALL NOT be removed this way. Its default path stays under `~/Library` whether or not a file is there, so removal never redirects it to `~/.config`; and glow writes its own default config at that path on any invocation without `XDG_CONFIG_HOME`. Declaring it for removal is therefore both ineffective and destructive: once glow re-creates the file, `chezmoi apply` fails with "has changed since chezmoi last wrote it" and refuses to continue until the file is deleted by hand. What guarantees glow reads the managed copy is the shell exporting `XDG_CONFIG_HOME=$HOME/.config`, which covers every real invocation.

#### Scenario: lazygit resolves the managed config

- **WHEN** `XDG_CONFIG_HOME` is unset
- **AND** the removal has been applied
- **THEN** lazygit SHALL resolve its config directory to `~/.config/lazygit`
- **AND** the Catppuccin theme and the `mdview` custom command SHALL be in effect

#### Scenario: glow reads the managed config when invoked from a shell

- **WHEN** glow is invoked from a shell, which exports `XDG_CONFIG_HOME=$HOME/.config`
- **THEN** glow SHALL read the chezmoi-managed `~/.config/glow/glow.yml`

#### Scenario: A tool that re-creates its own config is not declared for removal

- **WHEN** a tool writes a default config back to the higher-precedence `~/Library` path on invocation
- **THEN** that path SHALL NOT be declared for removal
- **AND** the managed copy SHALL instead be guaranteed by exporting `XDG_CONFIG_HOME`, because a re-created file at a declared-removed path makes `chezmoi apply` fail

#### Scenario: Tool state is not removed

- **WHEN** the removal is applied
- **THEN** files that hold tool state rather than configuration SHALL be left untouched

#### Scenario: Removal is idempotent

- **WHEN** the shadowing paths do not exist
- **AND** `chezmoi apply` runs
- **THEN** the apply SHALL succeed without error
