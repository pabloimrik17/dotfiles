---
name: classify-tool-updates
description: Use when adding a new tool to the dotfiles or removing one — a brew formula/cask, a curl-installed binary, a cloned plugin, an npx-installed CLI in run_onchange_install-packages.sh.tmpl, a zshrc-initialized tool, or a new config under dot_config/. Classifies the tool by update mechanism (brew-managed / self-updating / repo-pinned / manual) and keeps the `update-extra` step list in dot_zshrc.tmpl in sync.
---

# Classify Tool Updates

Classify a new (or removed) dotfiles tool by update mechanism and maintain the `update-extra` step list.

## When This Activates

- A tool install is added to `run_onchange_install-packages.sh.tmpl` (brew, curl installer, git clone, npx)
- A tool is initialized in `dot_zshrc.tmpl` or gains a config under `dot_config/`
- A tool with an `update-extra` step is removed from the dotfiles
- The user asks how a tool gets updated

## Workflow

### Step 1: Identify the install path

From the diff or conversation: what installs the tool, and is its version pinned anywhere in the repo (Renovate config, hardcoded tag, pinned installer URL)?

### Step 2: Classify — exactly one class, first match wins

1. **brew-managed** — brew formula or cask → **no action**. `brew upgrade` (omz `bubu`) covers it.
2. **self-updating** — ships its own updater (opencode, CodeRabbit CLI, Claude Code, oh-my-zsh) → **no action**. Never wrap or duplicate a self-updater; several tools were deliberately moved off brew so their self-update works.
3. **repo-pinned** — version pinned in the repo: Renovate-managed pins (MCP servers), hardcoded installer tags (nvm, tmux Catppuccin) → update path is **pin bump + `chezmoi apply`**, never `update-extra`.
4. **manual** — none of the above → **add a step to `update-extra`** in `dot_zshrc.tmpl`.

Settled exclusions, do not re-litigate: mas apps (App Store auto-updates), Node LTS/nvm (runtime management), superpowers-opencode plugin, tmux Catppuccin (pinned by design).

### Step 3: Propose the update-extra edit (manual class only)

Propose the exact one-line step for the `update-extra` function body in `dot_zshrc.tmpl`:

```zsh
_update_extra_step "<label>" <update command...>
```

- Verify the update command against the tool's docs — never guess a subcommand.
- Multi-command updates get a private `_update_extra_<tool>` helper so the function body stays one line per tool (`_update_extra_catppuccin` precedent).
- On tool removal, propose deleting its step line (and helper, if any).
- Include the matching spec delta for the `extra-updates-command` capability (its step-list requirement) in a new OpenSpec change, so the main spec stays in sync.

**Wait for user confirmation before editing any files.**

### Step 4: Docs follow-up — delegate

Never edit `README.md` or `docs/manual.html` here. After an `update-extra` change, run the `update-manual` skill (and `update-readme` if tool-level) for documentation follow-up.

## Guardrails

- **Never edit `dot_zshrc.tmpl` without user confirmation**
- Every new tool gets exactly one class; when ambiguous (e.g. curl installer that also self-updates), ask instead of guessing
- `update-extra` must never invoke `brew`, a self-updater, or a repo-pinned tool's update path
- Step add/remove proposals always carry the matching `extra-updates-command` spec delta
- This skill is repo tooling: `.claude/` is never applied by chezmoi
