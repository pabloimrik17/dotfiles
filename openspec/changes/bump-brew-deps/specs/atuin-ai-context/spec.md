## ADDED Requirements

### Requirement: Chezmoi-managed TERMINAL.md context file

The system SHALL include a `dot_config/atuin/TERMINAL.md` file in the chezmoi source tree that deploys to `~/.config/atuin/TERMINAL.md`. The file SHALL be plain Markdown documenting the user's local stack and tool ownership in a form `atuin ai` automatically loads as context for command suggestions.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without an atuin TERMINAL.md
- **THEN** `~/.config/atuin/TERMINAL.md` is created from the chezmoi source

#### Scenario: atuin ai loads the context

- **WHEN** the user invokes `atuin ai "..."` from any directory
- **THEN** the contents of `~/.config/atuin/TERMINAL.md` are included in the request context sent to the AI endpoint

### Requirement: TERMINAL.md documents owned-tool keybindings and stack basics

The TERMINAL.md content SHALL describe at minimum:

- The shell (zsh) and package manager (`bun`, never npm/yarn/pnpm).
- The host package manager (Homebrew on macOS) and configuration manager (chezmoi).
- Owned keybindings: `atuin` owns Ctrl+R, `tv` (television) owns Ctrl+T, `zoxide` is bound to `cd`.
- Common workflows the user invokes by name (e.g., `wt switch <branch>` for worktrunk, `bd ready` for beads, `wt step commit` for AI-generated commits).

#### Scenario: AI suggests bun instead of npm

- **WHEN** the user asks `atuin ai "install package X"` in a JavaScript project
- **THEN** the suggested command uses `bun add` rather than `npm install` because TERMINAL.md states bun ownership

#### Scenario: AI respects keybinding ownership

- **WHEN** the user asks `atuin ai "open fuzzy file picker"`
- **THEN** the response references the Ctrl+T binding (television) rather than suggesting fzf bindings that would conflict

### Requirement: TERMINAL.md SHALL NOT contain secrets or PII

Because `atuin ai` automatically includes the contents of `~/.config/atuin/TERMINAL.md` in every AI request context, the file SHALL NOT contain credentials, tokens, API keys, passwords, or personal/sensitive data. Maintainers SHALL treat the file as content that leaves the local machine on every `atuin ai` invocation.

#### Scenario: No credentials present in TERMINAL.md

- **WHEN** the file is reviewed before commit
- **THEN** it contains only stack/tooling/keybinding/workflow conventions; no API tokens, SSH keys, passwords, OAuth secrets, or personal identifiers

#### Scenario: Authors aware that contents leave the machine

- **WHEN** a contributor adds new content to TERMINAL.md
- **THEN** the contributor verifies the addition can be safely transmitted as part of an outbound AI request

### Requirement: TERMINAL.md remains under user-scope, not per-project

The TERMINAL.md SHALL live at `~/.config/atuin/TERMINAL.md` (user scope) only. The repo SHALL NOT introduce per-project `.atuin/TERMINAL.md` files; project-specific context, if ever needed, SHALL be added by the user manually outside of chezmoi management.

#### Scenario: Project context override absent by default

- **WHEN** the user runs `atuin ai` inside any working directory under chezmoi management
- **THEN** atuin discovers the global `~/.config/atuin/TERMINAL.md` and no project-level override
