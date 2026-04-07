## MODIFIED Requirements

### Requirement: bun aliases

The zshrc SHALL define 7 bun aliases using the `b` prefix: `bi` (install), `bdv` (dev), `bb` (build), `bt` (test), `ba` (add), `br` (run), `bx` (bunx). The `bdv` alias replaces the former `bd` alias to avoid collision with the beads CLI binary at `/opt/homebrew/bin/bd`.

#### Scenario: bi runs bun install

- **WHEN** user types `bi`
- **THEN** `bun install` is executed

#### Scenario: bdv runs bun dev

- **WHEN** user types `bdv`
- **THEN** `bun dev` is executed

#### Scenario: bx runs bunx

- **WHEN** user types `bx`
- **THEN** `bunx` is executed

#### Scenario: bd resolves to beads CLI

- **WHEN** user types `bd` with no alias defined for it
- **THEN** the shell resolves `bd` to `/opt/homebrew/bin/bd` (the beads CLI)

### Requirement: pnpm aliases

The zshrc SHALL define 7 pnpm aliases using the `p` prefix: `pi` (install), `pdv` (dev), `pb` (build), `pt` (test), `pa` (add), `pr` (run), `px` (exec). The `pdv` alias replaces the former `pd` alias for symmetry with the bun `bdv` alias.

#### Scenario: pi runs pnpm install

- **WHEN** user types `pi`
- **THEN** `pnpm install` is executed

#### Scenario: pdv runs pnpm dev

- **WHEN** user types `pdv`
- **THEN** `pnpm dev` is executed

#### Scenario: px runs pnpm exec

- **WHEN** user types `px`
- **THEN** `pnpm exec` is executed
