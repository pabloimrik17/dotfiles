## ADDED Requirements

### Requirement: AoE trash retention is pinned to 10 days

Discarding an AoE session moves it to the trash instead of deleting it: transcript and worktree survive until retention expires. That window SHALL be a dotfiles-managed knob pinned to `10`, not inherited from AoE's schema default (`30`). AoE may rewrite the live value between applies; `chezmoi apply` SHALL restore it to `10`.

#### Scenario: Retention pinned in the managed config

- **WHEN** chezmoi materializes `~/.config/agent-of-empires/config.toml`
- **THEN** the file contains `trash_retention_days = 10` under the `[session]` table

#### Scenario: AoE resolves the value as a user value

- **WHEN** the user runs `aoe settings explain session.trash_retention_days` after `chezmoi apply`
- **THEN** the resolved value is `10`
- **AND** the `source` is `user value`, not `schema default`

#### Scenario: Retention survives AoE runtime writeback

- **WHEN** AoE rewrites the config at runtime and `chezmoi apply` runs afterwards
- **THEN** `trash_retention_days` is back to `10` if AoE had altered it
- **AND** the other tables written by AoE are preserved intact

## MODIFIED Requirements

### Requirement: AoE configuration is chezmoi-managed at `~/.config/agent-of-empires/config.toml`

The dotfiles source tree SHALL contain `dot_config/private_agent-of-empires/modify_private_config.toml`, which targets `~/.config/agent-of-empires/config.toml` (AoE ≥1.10.1 reads `$XDG_CONFIG_HOME/agent-of-empires/` on macOS when that directory exists, preferring it over the legacy `~/.agent-of-empires/`). The file SHALL be applied unconditionally on `chezmoi apply` (no per-host gating). No `~/.agent-of-empires/` directory SHALL remain after migration (its presence alongside the XDG dir would strand legacy state).

#### Scenario: Config file present after chezmoi apply

- **WHEN** the user runs `chezmoi apply` on any supported host
- **THEN** `~/.config/agent-of-empires/config.toml` SHALL exist and be readable by the current user

#### Scenario: Config file is private (chezmoi `private_` attribute)

- **WHEN** `chezmoi apply` materializes the file
- **THEN** the resulting `~/.config/agent-of-empires/config.toml` SHALL have permissions `0600` or stricter

#### Scenario: Legacy dir absent after migration

- **WHEN** the migration has run on a host that previously used `~/.agent-of-empires/`
- **THEN** `~/.agent-of-empires/` no longer exists and aoe reads (and writes runtime state to) `~/.config/agent-of-empires/`

#### Scenario: AoE reads the managed file

- **WHEN** the user runs `aoe settings explain <key>` for a `MANAGED` key whose value differs from AoE's schema default
- **THEN** AoE reports the dotfiles value with `source: user value`, confirming the managed path is the one it reads
- **AND** for a `MANAGED` key whose value matches the schema default, AoE reports `source: schema default`, which does not by itself mean the managed file is unread
