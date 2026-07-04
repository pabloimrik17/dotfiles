# Proposal: add-extra-updates-command

Linear: [DOT-28](https://linear.app/monolab/issue/DOT-28/comando-custom-de-actualizacion-de-herramientas-no-brew-no)

## Why

Tools that are neither brew-managed nor self-updating each need their own manual update command, and there is no single entry point — they get forgotten. `brew upgrade` (omz `bubu`) covers brew; self-updating tools cover themselves; the rest rots.

## What Changes

- New zsh function `update-extra` in `dot_zshrc.tmpl` that runs, in sequence, the update commands for the no-brew / no-self-updating group:
  - gh extensions → `gh extension upgrade --all`
  - you-should-use (omz custom plugin) → `git -C "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/you-should-use" pull --ff-only`
  - skills.sh global skills → `npx -y skills update -g -y`
  - plannotator CLI → re-run `https://plannotator.ai/install.sh` (official upgrade path; CLI has no update subcommand)
  - Catppuccin theme assets (bat + `bat cache --build`, delta, zsh-syntax-highlighting, atuin) → re-curl
  - television channels → `tv update-channels`
- Resilient execution: a failing step reports and continues; final summary with error count (pattern from `run_onchange_install-packages.sh.tmpl`).
- New project skill `.claude/skills/classify-tool-updates/` — when a tool is added to the dotfiles, classify it by update mechanism and decide the action:
  - brew → nothing (covered by `brew upgrade`)
  - self-updating → nothing (deliberate prior decision, e.g. opencode/CodeRabbit off-brew migration)
  - repo-pinned (Renovate-managed pins, pinned installers) → pin bump + `chezmoi apply`, never `update-extra`
  - none of the above → add a step to `update-extra`
- The skill is repo tooling: `.claude/` is never applied by chezmoi, so no `.chezmoiignore` change needed.

Explicitly out of scope: mas apps (App Store auto-updates), Node LTS/nvm (runtime management, installer pinned in repo), superpowers-opencode plugin (user decision), tmux Catppuccin (pinned by design), anything self-updating or Renovate-managed.

## Capabilities

### New Capabilities

- `extra-updates-command`: the `update-extra` zsh function — step list, per-step output, failure resilience, summary.
- `classify-tool-updates-skill`: project skill that classifies new tools by update mechanism (brew / self-updating / repo-pinned / manual) and maintains the `update-extra` step list.

### Modified Capabilities

_None. The function and skill are additive; no existing spec requirements change._

## Impact

- `dot_zshrc.tmpl`: new function in the aliases section (before the zoxide init); unconditional `unalias update-extra 2>/dev/null` guard (`md()` precedent).
- `.claude/skills/classify-tool-updates/SKILL.md`: new skill, following the `update-manual` structure (triggers / workflow / confirmation / guardrails).
- Docs follow-up during implementation via existing `update-manual` / `update-readme` skills (manual §8 gains the `update-extra` workflow).
- No changes to `run_onchange_install-packages.sh.tmpl`, Renovate config, or any install spec.
