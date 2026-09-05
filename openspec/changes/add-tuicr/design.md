# Design: add-tuicr

## Context

See proposal.md — Why. tuicr 0.25.0 (current homebrew-core stable), reads `~/.config/tuicr/config.toml` (static TOML), auths through the already-configured `gh`. Integration surfaces touched: install script, chezmoi config, gh-dash keybindings, lazygit customCommands, zshrc, tmux.conf. tmux here is 3.7b (`display-popup` needs ≥3.2).

## Goals / Non-Goals

**Goals**: human PR review from gh-dash without losing dashboard state; working-tree self-review from lazygit and the shell; stack-consistent theming.

**Non-Goals**: a bespoke `--stdout`-piped handoff (the upstream skill's `tuicr review` CLI supersedes it — see §7); unattended agent-authored comments; per-repo `.tuicrignore`; Linux automation (manual hint only); custom local themes (bundled catppuccin-mocha suffices).

## Decisions

### 1. gh-dash keys `n`/`N` (not `e`/`E`)

`e` is a gh-dash built-in in the PRs section ("expand description", verified in `internal/tui/keys/prKeys.go`). House rule since fix-ghd-keybinding-collisions: never shadow built-ins. Full enumeration of the PRs section + universal defaults + existing custom keys leaves exactly two free lowercase/uppercase pairs: `n`/`N` and `z`/`Z`. Chosen `n`/`N` (mnemonic: aNnotate). Convention kept: lowercase = direct execution, uppercase = tmux variant.

### 2. Popup over split for the tmux variant

`tmux display-popup -E` instead of the `split-window -h` used by `B`/`I`/`T`. A diff review wants full width, and the user's requirement is "close tuicr → be exactly where I was in gh-dash". The popup overlays the pane; gh-dash keeps running untouched underneath; `-E` closes the popup on command exit. Geometry 95%x95%, `-T` title with `{{.RepoName}}#{{.PrNumber}}`, working dir via `-d "{{.RepoPath}}"`.

- Fallback if `-d` fails tilde expansion (gh-dash expands `{{.RepoPath}}` before the shell sees it — `wt -C {{.RepoPath}}` already relies on this, but verify): wrap as `tmux display-popup -E 'cd {{.RepoPath}} && tuicr pr {{.PrNumber}}'`.
- Injection: only deterministic tokens (`RepoPath`, `RepoName`, `PrNumber`); never `{{.Title}}` — same rationale documented on the AoE bindings.
- Coexists with the skill: the skill ships its own `tuicr-wrapper.sh` that opens a tuicr pane when `$TMUX` is set. That is the agent-initiated path; `n`/`N` is the human-initiated one. Different entry points onto the same session store, no conflict.

### 3. Static config.toml, no `.tmpl`

Single-user dotfiles; `username = "pabloimrik17"` hardcoded (same call as tickrs-config: byte-identical across hosts beats template machinery). Plain TOML is safe for oxfmt — only chezmoi `modify_`/`run_` scripts need `.oxfmtignore` entries.

### 4. Config contents

```toml
theme = "catppuccin-mocha"
no_update_check = true      # brew owns updates; tuicr update would bypass it
show_pr_checks = true
username = "pabloimrik17"

comment_types = [
  { id = "issue",      label = "issue",      definition = "a defect that must be fixed before merge",        color = "#f38ba8" },
  { id = "suggestion", label = "suggestion", definition = "a concrete improvement, author's call",           color = "#89b4fa" },
  { id = "question",   label = "question",   definition = "needs an answer before this can be resolved",     color = "#f9e2af" },
  { id = "nit",        label = "nit",        definition = "minor style point, feel free to ignore",          color = "#9399b2" },
  { id = "praise",     label = "praise",     definition = "no action needed",                                color = "#a6e3a1" },
]

[export]
intro = "Address the review comments below. Treat 'issue' as required, 'suggestion' as recommended, answer 'question's, use judgment on 'nit's."
```

The five ids are a superset of the four the skill's legend documents to the agent. Equivalences:

| config id | skill legend | agent action |
|-----------|--------------|--------------|
| `issue` | `issue` | blocking; fix first |
| `suggestion` | `suggestion` | implement or explain why not |
| `question` | `note` | answer or acknowledge |
| `nit` | (extends `suggestion`) | non-blocking; judgment call |
| `praise` | `praise` | no action |

Ids must stay self-describing in plain English, because `definition` does **not** travel to the agent: `tuicr review comments` emits `id`, `location`, `path`, `start_line`, `end_line`, `side`, `comment_type`, `lifecycle_state`, `content` — the curated definitions only reach a consumer through the `[export]` path, which the skill treats as legacy. `question` and `nit` are outside the skill's legend but read unambiguously on their own; that is the whole reason for keeping them rather than collapsing to the skill's four.

Colors are Catppuccin Mocha (red/blue/yellow/overlay/green). Everything else stays at defaults: `transparent_background = true` matches the Ghostty transparency setup, `mouse = true` matches tmux `mouse on`, `diff_view` togglable at runtime with `:diff`.

### 5. lazygit binding `W` in files context

Free in the files context (checked against lazygit's default keybindings; global `R` refresh untouched). Command is plain `tuicr -w` — no lazygit templates, so no chezmoi `{{ "{{" }}` escaping needed, unlike the mdview entry. `output: terminal`, matching the mdview precedent.

### 6. tmux popup styling: hardcoded hex

`popup-border-lines rounded` + `set -g popup-border-style "fg=#cba6f7"` (Mocha mauve) as plain lines, not `@thm_*` variables: those only exist after the deferred catppuccin `run -b` load, and popup styling should survive a missing plugin (graceful-degradation property the tmux.conf already has).

### 7. Agent skill from upstream, not hand-written

`install_skill "agavra/tuicr" "tuicr" "claude-code opencode junie codex"` in the existing agent-skills group — same helper, same single confirmation prompt, same `npx skills list -g --json` cache check and error counter as the other 14 skills. Precedent for a dedicated capability per skill: `gluestack-ui-v5-skill-install`, `slidev-skill-install`.

Upstream over vendored: the skill encodes the CLI contract (`review list` / `review comments` / `review add`, slug addressing, `"active": true` discovery) and tracks it as tuicr evolves. Vendoring would fork that contract.

No version floor to enforce: slug-addressed sessions for agent discovery landed in 0.16.x (#339) and `review --repo` became a repo selector in 0.17.1 (#399), both far below the 0.25.0 brew ships. 0.25.0's Sessions tab (#669) is a TUI convenience, not a CLI dependency.

Agent targets match the gluestack precedent (all four agents in use) rather than the Claude-Code-only default: the skill is agent-agnostic and OpenCode/Junie/Codex review the same repos.

### 8. AoE tuicr tool-session, no hotkey

`(("tools", "tuicr", "command"), "tuicr", False)` in the MANAGED list — one entry, no `hotkey` sibling. Tools are invoked from the `;` picker, which lists every configured tool; the archived improve-aoe-config QA (task 7.2) confirms lazygit launches from both the picker and its hotkey, so the picker is sufficient on its own. Bare `tuicr` rather than `tuicr -w`, matching `[tools.lazygit]`'s bare `lazygit`: the selector covers both the working tree and a commit range, so it does not pre-commit to one.

Skipping the hotkey is also what keeps this change small. An `Alt+<key>` binding would have dragged in the keyboard question below.

**Considered and rejected: reverting `macos-option-as-alt = right`.** That Ghostty setting was added by improve-aoe-config purely as a prerequisite for `Alt+g` (default `false` makes ⌥ type `©`, so the hotkey was inert). Since this change adds no hotkey, the setting looked like dead weight — but it is not AoE-only any more: `source <(fzf --zsh)` binds `Alt+C` (cd into subdirectory), and the zshrc deliberately customizes it with `FZF_ALT_C_COMMAND` (fd) and `FZF_ALT_C_OPTS` (eza tree preview). Reverting to `false` would silently kill that binding and orphan both env vars, plus readline word-motion. Left alone; the cost of `= right` is only that the right ⌥ stops producing ISO alt-chars, and the left ⌥ still does.

## Risks / Trade-offs

- [tuicr pr resolves the forge from the local checkout; main checkout may be on any branch] → PR mode fetches the diff from the forge via `gh`, so local branch state is irrelevant; verify once during implementation with a dirty checkout.
- [`n`/`N` shadow a future gh-dash built-in after an upgrade] → same exposure as every existing custom key; the collision-fix change documents the audit procedure (`?` menu).
- [Popup styling applies globally to all popups] → intended: benefits any future popup consumer.
- [tuicr version drift vs config options] → brew, not a `gh` extension: all options used are present in 0.25.0; `no_update_check` keeps brew authoritative.
- [Skill's CLI contract drifts from the brew-pinned binary] → the skill is fetched at install time and the binary at brew-upgrade time, so they can desync. Failure mode is loud (`tuicr review` errors), not silent; `brew upgrade tuicr` plus a skills re-add resyncs.
- [Skill overrides the curated `comment_types` semantics] → it does not write config, only reads `comment_type` strings; the two unmapped ids (`question`, `nit`) degrade to plain English, not to an error.

## Migration Plan

Standard chezmoi flow: land on main → `chezmoi update` on each machine → `run_onchange_install-packages.sh.tmpl` re-runs (content hash changed) and installs `tuicr`. Rollback = revert commit + `chezmoi update`; brew package can stay (inert without bindings).

## Open Questions

None blocking. `diff_view` (unified vs side-by-side) left at default; runtime-togglable, revisit after real use.
