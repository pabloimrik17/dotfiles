# Design: add-extra-updates-command

## Context

Tools in this repo split into four update classes: brew-managed (`brew upgrade` / omz `bubu`), self-updating (opencode, CodeRabbit, Claude Code, omz — several deliberately migrated off brew in `2026-05-31-brew-upgrade` so their self-update works), repo-pinned (Renovate-managed MCP pins, pinned installers like nvm and tmux Catppuccin), and manual. The manual class has no entry point today; `run_onchange_install-packages.sh.tmpl` is install-only (skip-if-present; the sole exception is `tv update-channels`, and the script only re-fires when its rendered content changes).

## Goals / Non-Goals

**Goals:**

- One interactive command that updates the manual class: gh extensions, you-should-use, skills.sh globals, plannotator, Catppuccin theme assets, tv channels.
- A failing step never aborts the rest; clear per-step output and final summary.
- A project skill that keeps the step list in sync as tools are added.

**Non-Goals:**

- Touching brew, self-updating, or repo-pinned tools (Renovate/pin-bump owns those).
- mas apps (App Store auto-updates), Node/nvm (runtime management; installer pinned), superpowers-opencode plugin (user-excluded), tmux Catppuccin (pinned by design).
- Changing `run_onchange_install-packages.sh.tmpl` or the `chezmoi apply` contract.
- Scheduling/automation — the command is run on demand.

## Decisions

### D1: zsh function in `dot_zshrc.tmpl`, not a `~/.local/bin` executable

Repo rule (mdview header, `project_customcommand_path_executable`): PATH executables are only for commands that non-interactive callers (lazygit/tv `sh -c`) must reach. `update-extra` is interactive-only → function in the aliases section, before the zoxide init (`dot_zshrc.tmpl:338`, must stay last). Rejected: executable — no non-interactive caller exists.

### D2: name `update-extra`

Ticket's suggestion; no collision in zshrc or omz (brew plugin ships `brewp`/`brews`/`brewsp`/`bubo`/`bubc`/`bubu`, different names). Guard with `unalias update-extra 2>/dev/null` before definition, per the `md()` precedent (`dot_zshrc.tmpl:226`). Rejected: `dotfiles-update` — confusable with `chezmoi update`, which README documents as the dotfiles-repo update flow.

### D3: one-line-per-tool step engine

Private helper `_update_extra_step <label> <command...>` prints the label, runs the command, prints `✓`/`✗`, increments a failure counter. The function body is then a flat list of `_update_extra_step` calls — adding a tool is a one-line mechanical edit, which is what makes the classification skill's job trivial. Output style: `✓` on success (wsh precedent), `✗` + stderr on failure, final `N ok, M failed` summary. Returns non-zero if any step failed.

### D4: step commands (verified against the repo and upstream)

| Step | Command | Source of truth |
|---|---|---|
| gh extensions | `gh extension upgrade --all` | installs at `run_onchange_install-packages.sh.tmpl:328-352` |
| you-should-use | `git -C "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/you-should-use" pull --ff-only` | clone at `:417-425` |
| skills.sh globals | `npx -y skills update -g -y` | subcommand verified in `skills --help` (alias `upgrade`) |
| plannotator | `curl -fsSL https://plannotator.ai/install.sh \| bash` | CLI has no update subcommand (v0.19.26); UI banner only notifies; installer is the official upgrade path and removes the old binary |
| Catppuccin themes | re-curl the 4 assets (bat `:247-248` + `bat cache --build`, delta `:267`, zsh-syntax-highlighting `:284`, atuin `:301`) | same URLs as the install script |
| tv channels | `tv update-channels` | `:221-224`; also runs when the onchange install script re-fires (content change), so `update-extra` is the only on-demand path |

### D5: skill `classify-tool-updates` as repo tooling

Lives at `.claude/skills/classify-tool-updates/SKILL.md` — same home as `update-manual`/`update-readme`. chezmoi ignores dot-prefixed source dirs automatically, so no `.chezmoiignore` change; the ticket's "repo tooling, not applied config" constraint is satisfied structurally. The skill encodes the **four-way** decision tree (brew / self-updating / repo-pinned / manual), not the ticket's three-way one — without the repo-pinned branch it would misclassify nvm, MCP pins, or tmux Catppuccin into `update-extra` and fight Renovate. Structure copied from `update-manual`: triggers / workflow / propose-then-confirm / guardrails. Docs updates are delegated to `update-manual`/`update-readme`, not duplicated. No companion `/command` wrapper in v1 — the skill auto-triggers; a wrapper can be added later if manual invocation is missed.

## Risks / Trade-offs

- [`curl | bash` re-run executes remote code] → same trust model and identical URLs as the existing install script; no new trust surface.
- [Upstream moves a theme file / installer URL] → that step fails, is reported, the rest continue; exit code flags it.
- [`npx -y skills` is unpinned] → consistent with how the install script invokes it (`:1064-1105`); failure is tolerated per-step.
- [`git pull` on a dirty you-should-use clone] → `--ff-only` fails loudly instead of merging; clone is stock so this should not occur.
- [Step list drifts from reality as tools come and go] → that is exactly what the classification skill exists to prevent; guardrail in the skill also covers tool *removal*.
- [Duplicate `tv update-channels` work vs `chezmoi apply`] → seconds of idempotent work; accepted for a complete single entry point.

## Migration Plan

Additive only. Rollback = delete the function block and the skill directory. After editing `dot_zshrc.tmpl`, the live machine needs `chezmoi update` (dev clone ≠ chezmoi source dir).

## Open Questions

None — scope, naming, and step list settled during exploration (DOT-28 thread).
