## Context

The dotfiles repo's `run_onchange_install-packages.sh.tmpl` installs CLI tools through a single `BREW_PACKAGES` array, gated by chezmoi's `{{ if eq .chezmoi.os "darwin" }}` block. The script is fully idempotent: a per-package `command -v "$bin"` pre-scan computes the pending count, prompts once, and skips packages already on PATH. Two prior changes (`add-tickrs`, `add-ticker`) introduced the `BREW_TAPS` convention for third-party formulas. `mole` does not need that convention — its formula lives in `homebrew-core` — so this change reduces to a single-line extension of `BREW_PACKAGES` plus documentation.

Adopting `mole` covers a gap in the user's current toolkit: today the repo ships `appcleaner` (GUI cask) for app-uninstall housekeeping, but nothing for cache/log/build-artifact cleanup from the terminal. `mole` is a single brew formula (`brew install mole`, ~MIT-licensed, `Required: macOS`) that exposes its functionality as an interactive TUI menu — no configuration to manage, no shell integration to wire up.

## Goals / Non-Goals

**Goals:**

- Install `mole` on every macOS host the dotfiles target, reusing the existing brew packages group's confirmation prompt and idempotency logic. No new install pattern is invented.
- Surface `mole` in the closing summary and in user-facing docs (`README.md`, `docs/manual.html`) so the tool is discoverable.
- Keep non-macOS hosts unaffected, with no manual-install instructions to maintain for a tool that has no Linux build.

**Non-Goals:**

- Wrapping `mole` in shell aliases, custom commands, or launchers. The bare `mole` invocation produces the TUI; no convenience layer is justified.
- Templating a chezmoi-managed config file. `mole` has no rcfile and no shell-visible configuration surface.
- Hooking `mole` into any automated flow (post-merge, cron, chezmoi-apply). Its actions are destructive (file deletion), so they MUST remain user-initiated.
- Adding a Homebrew tap. `mole` is in `homebrew-core`, so it installs with no tap setup.
- Documenting Linux/Windows alternatives in this repo. Out of scope; the formula's macOS-only constraint is upstream and the chezmoi template's existing OS guard handles the filtering.

## Decisions

### Decision 1: `mole` goes into `BREW_PACKAGES`, not a new opt-in group

**Choice**: Append `mole` to `BREW_PACKAGES` as the 26th entry, alongside every other CLI the user relies on. It participates in the same single confirmation prompt that gates the whole brew packages group.

**Alternatives considered**:

- _A separate opt-in confirmation just for `mole`_: motivated by `mole`'s destructive runtime behavior, but the relevant blast radius is at invocation time, not install time. The binary on PATH does nothing until the user runs it and navigates the menu.
- _Cask + GUI version_: the upstream cask is a paid Mac App ($9). The CLI formula gives the same functional surface for free and is what the user asked for.

**Rationale**: Uniform install treatment matches every other CLI in the array (e.g., `lazygit`, `ripgrep`, `tickrs`). Adding a one-off prompt for `mole` would imply a safety property the install action doesn't actually provide and would dilute the existing group's purpose.

### Decision 2: No `BREW_TAPS` entry — `mole` is in `homebrew-core`

**Choice**: Leave `BREW_TAPS=(tarkah/tickrs achannarasappa/tap)` unchanged. `mole` installs via the default homebrew-core formula path.

**Rationale**: `brew info mole` confirms `From: https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/m/mole.rb`. Adding it to `BREW_TAPS` would tap an unnecessary remote.

### Decision 3: No `pkg_bin()` arm — identity mapping suffices

**Choice**: Do not add a `mole) echo "mole" ;;` clause to `pkg_bin()`. The default `*)` case maps the package name to itself.

**Rationale**: This is how every package without a binary-rename (e.g., `bat`, `eza`, `fd`) is handled. Adding a noop case adds noise without behavior.

### Decision 4: No chezmoi-managed config, no shell wiring

**Choice**: Do not ship a `~/.config/mole/` directory, alias, completion file, or environment variable. The install script's only edit is to `BREW_PACKAGES` and to the closing summary line.

**Alternatives considered**:

- _Pre-seed a "cleanup denylist" or favorite-actions config_: `mole` does not document a stable config file format, and the upstream interaction model is the TUI menu. Pre-seeding would couple this repo to upstream internals.
- _Shell alias `mole-clean` or `cleanup`_: nothing in the user's workflow yet calls `mole` from another script. Introducing an alias would invent a name without a caller.

**Rationale**: The minimum useful addition is the binary itself. Anything else is speculation.

### Decision 5: Non-macOS branch is silent about `mole`

**Choice**: The `{{ else -}}` branch of `run_onchange_install-packages.sh.tmpl` (non-macOS) does NOT add a "manual install instructions" line for `mole`, because the formula is macOS-only at upstream (formula declares `Required: macOS`). The chezmoi template's existing `{{ if eq .chezmoi.os "darwin" }}` guard already filters the brew block natively, and there is no portable equivalent to suggest.

**Alternatives considered**:

- _Print a "macOS-only — no Linux equivalent" notice in the Linux branch_: defensible for user awareness, but the user explicitly preferred the chezmoi-native filtering approach with no Linux mention. The Linux branch's instructions stay scoped to packages that actually have a non-macOS install path.

**Rationale**: The OS gate is structural (template-level), not informational. Mentioning macOS-only tools in the Linux branch would muddy that boundary.

## Risks / Trade-offs

- **[Destructive at runtime]** `mole` deletes files when the user navigates the TUI. → Mitigation: install is inert; deletion requires explicit interactive confirmation in `mole`'s own menu. The dotfiles repo does not call `mole` from any script, hook, or alias. Documented in `docs/manual.html` next to the entry.

- **[macOS lock-in]** The formula's `Required: macOS` rules out Linux hosts the user might add later. → Mitigation: the install script's existing OS template guard handles the exclusion structurally. No manual filter logic is added that would need maintenance.

- **[Upstream churn]** `mole` is shell + Go (~17% Go, ~82% shell) and ships rapid updates (multiple releases per quarter historically). Brew may lag the GitHub releases. → Mitigation: not addressed in this change. The brew formula is the source of truth for what this repo installs; advanced users can run the upstream `install.sh` separately, but the repo does not endorse that path.

- **[Formula availability]** If `mole` is ever delisted from `homebrew-core`, `brew install mole` fails. → Mitigation: the existing per-package error handling (`error "Failed to install $pkg"`) catches the failure, the script continues with other packages, and the closing summary reports the error count.

## Migration Plan

1. **Single phase — install**: On the next `chezmoi apply`, `run_onchange_install-packages.sh.tmpl` re-runs (its content has changed), the brew packages pre-scan reports `mole` as pending, and a single `Y` at the group prompt installs it. No state to migrate; no per-machine bootstrap step.

**Rollback strategy**: If the user later wants to remove `mole`, revert the `BREW_PACKAGES` and summary edits with `git revert`, then run `brew uninstall mole` manually (the install script does not auto-uninstall removed packages — known property shared with every other CLI in the array).

## Open Questions

None. The brew formula path, OS gating, and "no config / no alias / no hook" scope were all settled in the explore phase.
