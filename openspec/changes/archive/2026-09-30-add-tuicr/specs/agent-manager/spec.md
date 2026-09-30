# Delta: agent-manager

## ADDED Requirements

### Requirement: AoE exposes a tuicr tool-session in the picker

The AoE config SHALL define a `[tools.tuicr]` tool-session with `command = "tuicr"` and **no** `hotkey`, so tuicr appears in the `;` tool picker scoped to the selected session's worktree — the natural place to read a diff an agent just wrote. The `;` picker lists every configured tool, so a hotkey is not required for the tool to be reachable; omitting it also avoids claiming another `Alt+<key>` binding.

The command SHALL be bare `tuicr`, not `tuicr -w`, matching `[tools.lazygit]`'s bare `lazygit`: tuicr's own selector already covers both the working tree and a commit range, so the config does not pre-commit to one.

#### Scenario: tuicr tool-session defined

- **WHEN** the AoE config is rendered by chezmoi
- **THEN** `[tools.tuicr]` has `command = "tuicr"`
- **AND** `[tools.tuicr]` has no `hotkey` key

#### Scenario: tuicr reachable from the tool picker

- **WHEN** the user presses `;` in the AoE home view with a session selected
- **THEN** `tuicr` is listed alongside `lazygit`
- **AND** launching it opens tuicr scoped to that session's worktree

#### Scenario: No new Alt binding is claimed

- **WHEN** the AoE config is inspected for hotkey collisions against ghostty, tmux, and AoE built-ins
- **THEN** the tuicr tool-session contributes no binding to check

## MODIFIED Requirements

### Requirement: AoE config preserves runtime writeback under chezmoi

The chezmoi management of `~/.config/agent-of-empires/config.toml` SHALL preserve AoE's runtime writeback tables (`[web]`, `[logging]`, and default-expanded keys) rather than clobbering them on `chezmoi apply`, while still enforcing the deliberately-managed keys (`[theme]`, `[session]`, `[acp]`, `[worktree]`, `[tmux]`, `[updates]`, `[status_hooks]`, `[sandbox]`, `[sound]`, `[tools.lazygit]`, `[tools.tuicr]`). The chezmoi target file SHALL remain mode `0600`.

Two corrections to the previous wording. `[cockpit]` no longer exists — AoE renamed it to `[acp]` in 1.11.0, which is before this repo's baseline, so the table named in the old requirement has been absent for three releases while `[acp]` was already being managed. And `[app_state]` is no longer part of this file at all: AoE 1.13.0 moved it to a sibling `state.toml`, which is unmanaged and left alone.

#### Scenario: Apply does not drop AoE runtime state

- **WHEN** AoE has written runtime tables (for example `[web]`) into the live config and the user runs `chezmoi apply`
- **THEN** those runtime tables remain present in `~/.config/agent-of-empires/config.toml`
- **AND** the deliberately-managed keys reflect the chezmoi-managed values

#### Scenario: Session state file is not managed

- **WHEN** AoE maintains `state.toml` alongside the config
- **THEN** chezmoi SHALL neither create, modify nor remove that file

#### Scenario: Re-apply is quiet (no churn)

- **WHEN** the deliberately-managed keys already hold the chezmoi-managed values and `chezmoi apply` / `chezmoi diff` runs again (including after AoE has only rewritten its own runtime tables)
- **THEN** the management reproduces the on-disk file with no formatting churn and `chezmoi diff` reports no changes to any non-managed table

#### Scenario: Managed config stays private

- **WHEN** chezmoi materializes the config
- **THEN** `~/.config/agent-of-empires/config.toml` has permissions `0600` or stricter
