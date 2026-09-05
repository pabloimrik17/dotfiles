# Add tuicr

## Why

Code review today happens either in the browser or delegated to Claude (`b`/`B` in gh-dash). There is no fast terminal path for a human to read a PR diff, leave line-level comments, and submit a real review. tuicr (homebrew-core, static binary, vim keybindings, bundled catppuccin-mocha theme, auth via the already-configured `gh`) fills that gap and also covers pre-commit self-review of the working tree.

## What Changes

- Install `tuicr` via Homebrew in `run_onchange_install-packages.sh.tmpl`.
- Install the upstream `agavra/tuicr` agent skill via the existing `install_skill` helper, inside the confirmation-gated agent-skills group (targets `claude-code opencode junie codex`), plus its line in the non-macOS manual block. The skill owns the agent half of review: `tuicr review list` to discover sessions, `tuicr review comments` to read the human's feedback as JSON, `tuicr review add` for agent-authored findings.
- New managed config at `dot_config/tuicr/config.toml`: catppuccin-mocha theme, `no_update_check` (brew owns updates), `show_pr_checks`, `username`, LLM-oriented `comment_types` (issue/suggestion/question/nit/praise with definitions), tuned `[export]` intro.
- gh-dash PR keybindings: `n` opens `tuicr pr <n>` via direct execution (suspend/resume, like `L`), `N` opens it in a `tmux display-popup -E` overlay that returns to gh-dash untouched on exit. Only deterministic tokens (`{{.RepoPath}}`, `{{.PrNumber}}`, `{{.RepoName}}`) — same injection rule as the AoE bindings. Keys verified against built-ins before landing (see fix-ghd-keybinding-collisions).
- lazygit customCommand in `files` context: launch `tuicr -w` for working-tree self-review before committing.
- AoE tool-session: `[tools.tuicr]` with `command = "tuicr"` and **no hotkey** in the managed AoE config, so tuicr shows up in the `;` tool picker scoped to the selected session's worktree — the natural place to read what an agent just wrote.
- zsh aliases: `tcr` (tuicr) and `tcrw` (tuicr -w).
- tmux popup styling: `popup-border-lines rounded` + Catppuccin `popup-border-style` in `dot_tmux.conf` (benefits any future popup).
- Docs: README What's Included entry + docs/manual.html section (via docs:readme / docs:manual skills).

Out of scope: a bespoke `--stdout`-piped handoff — superseded by the skill's `tuicr review` CLI, which reads comments as structured JSON instead of scraping an export. Also out of scope: unattended agent-authored comments (the skill gates `tuicr review add` behind explicit user approval).

## Capabilities

### New Capabilities

- `tuicr-install`: tuicr installed as a brew package with idempotent skip logic.
- `tuicr-config`: managed `~/.config/tuicr/config.toml` — theme, update check, PR checks, identity, comment types, export shape.
- `tuicr-integrations`: tuicr entry points from other tools it does not own a spec for — the lazygit `files`-context customCommand (precedent: markdown-viewer owns its lazygit binding).
- `tuicr-skill-install`: the `agavra/tuicr` agent skill provisioned globally through the agent-skills group (precedent: `gluestack-ui-v5-skill-install`, `slidev-skill-install`).

### Modified Capabilities

- `gh-dash-keybindings`: add PR keys `n` (direct tuicr review) and `N` (tmux popup tuicr review), following the lowercase-direct / uppercase-tmux convention. (`e` is a gh-dash built-in — expand description; see design §1.)
- `zsh-aliases`: add `tcr` and `tcrw` aliases.
- `tmux-config`: add popup border styling (rounded lines, Catppuccin border color).
- `agent-manager`: add `[tools.tuicr]` to the AoE managed-keys set (it owns `[tools.*]` and the MANAGED enumeration).

## Impact

- `run_onchange_install-packages.sh.tmpl`: `BREW_PACKAGES` gains `tuicr` (dep `libgit2` pulled automatically); the agent-skills group gains one `install_skill` call and the non-macOS manual block one matching line.
- `dot_config/tuicr/config.toml`: new file (plain TOML — no oxfmt concern; only chezmoi `modify_`/`run_` scripts are at risk).
- `dot_config/gh-dash/config.yml`: two new `prs` keybindings.
- `dot_config/lazygit/config.yml.tmpl`: one new customCommand.
- `dot_config/private_agent-of-empires/modify_private_config.toml`: one new MANAGED entry (already in `.oxfmtignore`, so the `modify_`-script-with-`.toml`-extension hazard is covered).
- `dot_zshrc.tmpl`: two aliases.
- `dot_tmux.conf`: popup styling lines.
- `README.md`, `docs/manual.html`: new tool documented.
- No breaking changes. Apply reaches machines via `chezmoi update` (dual-dir layout).
