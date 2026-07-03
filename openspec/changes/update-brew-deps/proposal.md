## Why

`brew outdated` reports 18 pending upgrades, two with security fixes worth applying promptly (openssl@3 3.6.3 fixes 16 CVEs incl. a High-severity OCSP double-free; libevent 2.1.13 fixes 6+ security issues). A full changelog × config audit (every release note in each installed→target range, each finding adversarially verified against upstream code and this repo) found no hard breakage but one deprecation that touches our config (worktrunk `{{ commits }}`), one cosmetic regression (tmux 3.7 × pinned catppuccin v2.3.0 message-style), one latent bug in our television markdown channel surfaced by the 0.15.9 changelog, and eight adoptable features the user approved in full.

## What Changes

### Brew upgrades (no repo changes — `brew upgrade` per package)

- **Security**: openssl@3 3.6.2→3.6.3, libevent 2.1.12_1→2.1.13
- **Patches/minors, config no-ops**: bash 5.3.9→5.3.15, chezmoi 2.70.4→2.70.5, dolt 2.1.0→2.1.10 (beads dep; no schema migration; only removes unused `dolt archive`), jpeg-turbo 3.1.4.1→3.2.0, lazygit 0.62.1→0.62.2, llhttp 9.4.1→9.4.2, mole 1.40.0→1.44.1, starship 1.25.1→1.26.0, uv 0.11.17→0.11.26, zsh 5.9→5.9.1 (login shell is Apple zsh; brew zsh unaffected as shell)
- **Minors with config follow-ups**: aoe 1.9.5→1.12.0, gh 2.93.0→2.95.0, git 2.54.0→2.55.0, television 0.15.7→0.15.9, tmux 3.6b→3.7b, worktrunk 0.55.0→0.65.0

### Fixes (corrections to existing config)

- worktrunk squash-template: `{{ commits }}` → `{{ commit_details }}` (deprecated in 0.59.0; edit chezmoi source, never `wt config update`, which would drift the live file)
- television `cable/markdown.toml` open action: `mdview '{}'` → `mdview {}` (tv auto-quotes bare `{}` in action commands; our explicit quotes double-quote and break filenames with spaces)
- tmux 3.7 draws messages/prompts as a partial status-line overlay; append `fill=##{@thm_overlay_0}` to `message-style`/`message-command-style` after loading catppuccin v2.3.0 (pinned; no upstream release fixes it) to restore the full-width themed bar

### Feature adoption (user-approved)

- aoe theme: add `unread = "#94e2d5"` (1.11.2 unread session state; without the key it falls back to accent blue, indistinguishable)
- aoe managed config: `[acp].rate_limit_auto_resume = true` (1.10.1 opt-in auto-resume after rate-limit reset) and `[session].confirm_delete = true` (1.12.0 delete guard)
- **BREAKING (operational)**: aoe config relocates from `~/.agent-of-empires/` to the XDG path `~/.config/agent-of-empires/` (1.10.1, upstream-designed for chezmoi). Live state must move BEFORE the renamed source is applied (an existing XDG dir outranks the legacy dir); `.oxfmtignore` and `.chezmoiignore` paths follow
- git aliases: `--graph-lane-limit=8` (new in 2.55) added to zshrc `gl` and gitconfig `lg`
- gh: new idempotent install step for the official `gh` agent skill (`gh skill install cli/cli gh --agent claude-code --scope user`, 2.94/2.95)
- worktrunk `[aliases]`: add `wtpr = "wt switch --prs"` (0.63 PR picker with live CI/review state)
- worktrunk `[list]`: replace `full = true` / `summary = true` with `columns = ["branch", "working-diff", "branch-diff", "ci", "summary"]` (0.62+; since 0.63 explicit columns override the presets)

### Audited and rejected (documented, no action)

- `Bash(gh discussion *)` allowlist — GitHub Discussions unused here; command set is preview
- worktrunk `--safe-mode --setting-sources='user'` commit-generation flags — only needed with apiKeyHelper auth; this machine uses subscription/keychain (deferred note)
- zsh 5.9.1 `_as_if` completion for `wsh` — `wt switch --create <TAB>` offers no candidates, and the login shell (Apple zsh 5.9) lacks `_as_if` in fpath

## Capabilities

### New Capabilities

- `gh-skill-install`: install the official `gh` agent skill for Claude Code inside the existing gh CLI extensions confirmable group, idempotently.

### Modified Capabilities

- `agent-manager`: config path moves to `~/.config/agent-of-empires/` (source `dot_config/private_agent-of-empires/`); knob set gains `[acp].rate_limit_auto_resume` and `[session].confirm_delete`; theme gains `unread`; first-install path verification updated to the XDG location.
- `worktrunk-config`: `[list]` requirement changes from `full`/`summary` flags to an explicit `columns` pin; `[aliases]` grows `wtpr`.
- `television-markdown-channel`: Enter action requirement now mandates bare `{}` (auto-quoted) in the open command.
- `tmux-catppuccin`: plugin-load requirement extended to restore full-width message/prompt styling under tmux ≥3.7.
- `git-config`: `lg` alias requirement gains `--graph-lane-limit=8`.

## Impact

- **Files**: `dot_config/worktrunk/config.toml`, `dot_config/television/cable/markdown.toml`, `dot_tmux.conf`, `dot_zshrc.tmpl`, `dot_gitconfig.tmpl`, `run_onchange_install-packages.sh.tmpl`, `private_dot_agent-of-empires/` → `dot_config/private_agent-of-empires/` (git mv), `.oxfmtignore`, `.chezmoiignore`
- **Specs**: `gh-skill-install` (new); deltas for `agent-manager`, `worktrunk-config`, `television-markdown-channel`, `tmux-catppuccin`, `git-config`
- **Systems**: Homebrew (18 formulae), live `~/.agent-of-empires` state relocation (aoe must be closed; sqlite WAL), tmux server restart to load 3.7b + new conf (coordinate with aoe shutdown), `chezmoi apply` re-runs the onchange install script (installs the gh skill interactively)
- **Out of scope**: gl/squash-template zshrc details not covered by specs need no delta; README/manual sync handled post-implementation via `/docs:manual` + `/docs:readme`
