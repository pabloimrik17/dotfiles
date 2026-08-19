## MODIFIED Requirements

### Requirement: AoE config preserves runtime writeback under chezmoi

The chezmoi management of `~/.config/agent-of-empires/config.toml` SHALL preserve AoE's runtime writeback tables (`[web]`, `[logging]`, and default-expanded keys) rather than clobbering them on `chezmoi apply`, while still enforcing the deliberately-managed keys (`[theme]`, `[session]`, `[acp]`, `[worktree]`, `[tmux]`, `[updates]`, `[status_hooks]`, `[sandbox]`, `[sound]`, `[tools.lazygit]`). The chezmoi target file SHALL remain mode `0600`.

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

## ADDED Requirements

### Requirement: The config merge runs isolated from the invoking directory

The mechanism that merges managed keys into the AoE config SHALL resolve its own runtime dependencies without reference to any project rooted at the current working directory.

`chezmoi apply` inherits the directory it was invoked from. Without isolation the merge engine walks upward looking for a project to attach to, with two observed consequences: from a directory whose project cannot be resolved, the merge is skipped while the apply still reports success — so the managed keys silently do not land; and from a directory whose project does resolve, the engine writes environment and lockfile artifacts into that unrelated repository.

This is a pre-existing defect, not a consequence of any version in this upgrade.

#### Scenario: Apply from inside an unrelated project

- **WHEN** `chezmoi apply` is run from a working directory belonging to another project
- **THEN** the managed AoE keys SHALL be applied to the config
- **AND** no files SHALL be created in that other project

#### Scenario: Merge failure is reported

- **WHEN** the merge engine fails for any reason
- **THEN** the live config SHALL be passed through unchanged
- **AND** a diagnostic SHALL reach standard error rather than being suppressed
