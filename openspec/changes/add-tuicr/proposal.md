# Add tuicr

## Why

Code review today happens either in the browser or delegated to Claude (`b`/`B` in gh-dash). There is no fast terminal path for a human to read a PR diff, leave line-level comments, and submit a real review. tuicr (homebrew-core; bottled on arm64, source-built with `rust` on Intel macOS; vim keybindings, bundled catppuccin-mocha theme, auth via the already-configured `gh`) fills that gap and also covers pre-commit self-review of the working tree.

## What Changes

- Install `tuicr` via Homebrew in `run_onchange_install-packages.sh.tmpl`.
- Install the upstream `agavra/tuicr` agent skill via the existing `install_skill` helper, inside the confirmation-gated agent-skills group (targets `claude-code opencode junie codex`), plus its line in the non-macOS manual block. The skill owns the agent half of review: `tuicr review list` to discover sessions, `tuicr review comments` to read the human's feedback as JSON, `tuicr review add` for agent-authored findings.
- New managed config at `dot_config/tuicr/config.toml`: catppuccin-mocha theme, `no_update_check` (brew owns updates), `show_pr_checks`, `username`, LLM-oriented `comment_types` (issue/suggestion/question/nit/praise with definitions), tuned `[export]` intro.
- gh-dash PR keybindings: `z` opens `tuicr pr <n>` via direct execution (suspend/resume, like `L`), `Z` opens it in a titled, near-full-size `tmux display-popup -E` (gh-dash suspends and resumes as with `z`). Only deterministic tokens (`{{.RepoPath}}`, `{{.PrNumber}}`, `{{.RepoName}}`) — same injection rule as the AoE bindings. Keys verified against built-ins before landing (see fix-ghd-keybinding-collisions).
- lazygit customCommand in `files` context: launch `tuicr -w` for working-tree self-review before committing.
- AoE tool-session: `[tools.tuicr]` with `command = "tuicr"` and **no hotkey** in the managed AoE config, so tuicr shows up in the `;` tool picker scoped to the selected session's worktree — the natural place to read what an agent just wrote.
- zsh aliases: `tcr` (tuicr) and `tcrw` (tuicr -w).
- tmux popup styling: `popup-border-lines rounded` + Catppuccin `popup-border-style` in `dot_tmux.conf` (benefits any future popup).
- Docs: README What's Included entry + `assets/tuicr-overview.png` overview screenshot + docs/manual.html section (via docs:readme / docs:manual skills).

Out of scope: a bespoke `--stdout`-piped handoff — superseded by the skill's `tuicr review` CLI, which reads comments as structured JSON instead of scraping an export. Also out of scope: unattended agent-authored comments (the skill never runs `tuicr review add` in a user-led review, and adds findings only in a user-requested agent review).

## Capabilities

### New Capabilities

- `tuicr-install`: tuicr installed as a brew package with idempotent skip logic.
- `tuicr-config`: managed `~/.config/tuicr/config.toml` — theme, update check, PR checks, identity, comment types, export shape.
- `tuicr-integrations`: tuicr entry points from other tools it does not own a spec for — the lazygit `files`-context customCommand (precedent: markdown-viewer owns its lazygit binding).
- `tuicr-skill-install`: the `agavra/tuicr` agent skill provisioned globally through the agent-skills group (precedent: `gluestack-ui-v5-skill-install`, `slidev-skill-install`).

### Modified Capabilities

- `gh-dash-keybindings`: add PR keys `z` (direct tuicr review) and `Z` (tmux popup tuicr review), following the lowercase-direct / uppercase-tmux convention. (`e` and `n` are gh-dash built-ins — expand description, `ctrl+s n` new section; see design §1.)
- `zsh-aliases`: add `tcr` and `tcrw` aliases.
- `tmux-config`: add popup border styling (rounded lines, Catppuccin border color).
- `tmux-catppuccin`: document the `popup-border-style` re-set at the tail of the catppuccin `run -b` chain.
- `agent-manager`: add `[tools.tuicr]` to the AoE managed-keys set (it owns `[tools.*]` and the MANAGED enumeration).
- `cli-tool-expansion`: add `tuicr` to the `BREW_PACKAGES` requirement (29 → 30 entries; homebrew/core, identity `pkg_bin`).
- `llmfit-install`, `ticker-install`, `tickrs-install`: brew pre-scan count made count-free (`N/N`); adding tuicr made the hard-coded 29/29 stale.

## Impact

- `run_onchange_install-packages.sh.tmpl`: `BREW_PACKAGES` gains `tuicr` (dep `libgit2` pulled automatically); the agent-skills group gains one `install_skill` call and the non-macOS manual block one matching line; the non-macOS manual block's CLI-tools list gains `tuicr` and a new annotated install hint line (cargo/curl) is added; both the macOS and non-macOS closing `Installation complete!` CLI-tools summary lines gain `tuicr`.
- `dot_config/tuicr/config.toml`: new file (plain TOML — no oxfmt concern; only chezmoi `modify_`/`run_` scripts are at risk).
- `dot_config/gh-dash/config.yml`: two new `prs` keybindings.
- `dot_config/lazygit/config.yml.tmpl`: one new customCommand.
- `dot_config/private_agent-of-empires/modify_private_config.toml`: one new MANAGED entry (already in `.oxfmtignore`, so the `modify_`-script-with-`.toml`-extension hazard is covered).
- `dot_zshrc.tmpl`: two aliases.
- `dot_tmux.conf`: popup styling lines.
- `README.md`, `docs/manual.html`: new tool documented, plus `assets/tuicr-overview.png` added to the README overview screenshot gallery.
- No breaking changes. Apply reaches machines via `chezmoi update` (dual-dir layout).
