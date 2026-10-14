# Design

## Context

`1password-cli` is a cask (binary `op`, no `.app`, no `auto_updates`). The install script has
three brew lists: `BREW_PACKAGES` (formulae, frozen), `FONT_CASKS` (frozen as casks) and
`ALL_CASKS` (GUI apps, optional picker, unfrozen). `apply_brew_freeze` already pins casks with
`brew pin --cask` for fonts. The Intel host has the cask at 2.41.0, installed by hand on 2026-10-13
and not pinned.

## Goals / Non-Goals

**Goals:**

- `op` on every macOS host through brew, frozen like the other CLI tools.

**Non-Goals:**

- Using `op` for secrets (`op run`, `op inject`, `shell-secrets`), the SSH agent, `op plugin`
  shell plugins, or the oh-my-zsh `1password` plugin.

## Decisions

**D1. New `BREW_CLI_CASKS` array, installed by Group 1.** Group 1's pre-scan counts it in
`BREW_PENDING` and its loop runs `brew install --cask` for it, under the same prompt. Alternatives:

- `ALL_CASKS`: optional picker, outside the freeze, and `cask_to_app` points to a
  `/Applications/1Password CLI.app` that never exists.
- `BREW_PACKAGES`: `brew install 1password-cli` resolves the cask, but the freeze tags every entry
  as a formula, so `brew list --formula` fails and the cask is never pinned. `cli-tool-expansion`
  also fixes that array at 32 formulae.
- Its own group: one more prompt for a single package.

**D2. Installed means `brew list --cask 1password-cli`, not `command -v op`.** Same reasoning as
`git` and the fonts: 1Password's `.pkg` installs `/usr/local/bin/op`, which would read as installed
while the freeze, keyed on brew, pins nothing.

**D3. Freeze it as a cask.** `apply_brew_freeze` adds `cask|<token>` for each `BREW_CLI_CASKS`
entry, as it does for `FONT_CASKS`. The GUI-cask exclusion is about `auto_updates`, which this cask
lacks. Row `1password-cli|2.41.0` is the Intel host's version; one cask version covers both
architectures. `brew-upgrade-pinned` stays as is: `brew unpin`, `upgrade` and `pin` resolve a bare
cask token.

**D4. One guidance helper, both branches.** `print_op_guidance` sits next to `print_gws_guidance`
in both manual lists. The Linux install hint links 1Password's install guide (apt, dnf or binary)
instead of assuming Homebrew casks on Linux.

**D5. No completion wiring.** The cask generates `_op` into brew's `share/zsh/site-functions`; on
the Intel host it autoloads with no repo change. Same baseline as every other brew completion.

## Risks / Trade-offs

- [A `.pkg`-installed `op` occupies `/usr/local/bin/op` on Intel] → `brew install --cask` fails with
  brew's "already a Binary" message, reported through `error`. Remove that `op` and re-run.
- [The pin delays a 1Password security release] → same trade-off as every frozen tool;
  `brew-upgrade-pinned 1password-cli` plus a row bump moves it.

## Migration Plan

On the Intel host the next run finds the cask, installs nothing, and pins and records it. Rollback:
drop the array entry and the row; the freeze releases the pin on the next run.
