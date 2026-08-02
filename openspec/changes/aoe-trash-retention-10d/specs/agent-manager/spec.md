## RENAMED Requirements

- FROM: `### Requirement: AoE configuration is chezmoi-managed at `~/.agent-of-empires/config.toml``
- TO: `### Requirement: AoE configuration is chezmoi-managed at `~/.config/agent-of-empires/config.toml``

## ADDED Requirements

### Requirement: AoE trash retention is pinned to 10 days

Descartar una sesión en AoE la mueve a la Trash, no la borra: transcript y worktree sobreviven hasta que expira la retención. Ese plazo SHALL ser una knob gestionada por los dotfiles y fijada a `10`, no heredada del schema default de AoE (`30`), de modo que ni una release de AoE ni el writeback en runtime puedan cambiarlo silenciosamente.

#### Scenario: Retention pinned in the managed config

- **WHEN** chezmoi materializa `~/.config/agent-of-empires/config.toml`
- **THEN** el fichero contiene `trash_retention_days = 10` bajo la tabla `[session]`

#### Scenario: AoE resolves the value as a user value

- **WHEN** el usuario ejecuta `aoe settings explain session.trash_retention_days` tras `chezmoi apply`
- **THEN** el valor resuelto es `10`
- **AND** el `source` es `user value`, no `schema default`

#### Scenario: Retention survives AoE runtime writeback

- **WHEN** AoE reescribe el config en runtime y después se ejecuta `chezmoi apply`
- **THEN** `trash_retention_days` vuelve a `10` si AoE lo hubiera alterado
- **AND** el resto de tablas escritas por AoE se conservan intactas

## MODIFIED Requirements

### Requirement: AoE configuration is chezmoi-managed at `~/.config/agent-of-empires/config.toml`

El árbol fuente de los dotfiles SHALL contener `dot_config/private_agent-of-empires/modify_private_config.toml`, apuntando a `~/.config/agent-of-empires/config.toml`. AoE 1.12.0 lee esta ruta XDG; la ruta legacy `~/.agent-of-empires/config.toml` documentada originalmente ya no se usa. El fichero SHALL aplicarse incondicionalmente en `chezmoi apply` (sin gating por host).

#### Scenario: Config file present after chezmoi apply

- **WHEN** the user runs `chezmoi apply` on any supported host
- **THEN** `~/.config/agent-of-empires/config.toml` SHALL exist and be readable by the current user

#### Scenario: Config file is private (chezmoi `private_` prefix)

- **WHEN** `chezmoi apply` materializes the file
- **THEN** the resulting `~/.config/agent-of-empires/config.toml` SHALL have permissions `0600` or stricter

#### Scenario: AoE reads the managed file

- **WHEN** el usuario ejecuta `aoe settings explain <clave gestionada>` para cualquier clave de `MANAGED`
- **THEN** AoE reporta el valor de los dotfiles con `source: user value`, confirmando que la ruta gestionada es la que lee

## REMOVED Requirements

### Requirement: AoE config path is verified at first install

**Reason**: Requisito de bootstrap ya cumplido, y su expectativa quedó desmentida. La verificación se hizo contra AoE 1.12.0: la ruta real es `~/.config/agent-of-empires/config.toml` y la legacy `~/.agent-of-empires/` ni siquiera existe. El escenario "Verified path is `~/.agent-of-empires/`" afirmaba lo contrario, así que mantenerlo documenta una ruta falsa.

**Migration**: El delta de esta misma capability corrige la requirement de ubicación a la ruta XDG, y su escenario "AoE reads the managed file" cubre de forma permanente lo que este requisito verificaba una sola vez.
