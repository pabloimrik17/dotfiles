## Context

Repo manages dotfiles via chezmoi for macOS (primary) and Linux (fallback). Includes zsh, git, starship, ghostty, tmux, CLI tools, Claude Code plugins, and OpenCode config. No README exists.

## Goals / Non-Goals

**Goals:**

- Shield-wall badges reflecting repo identity (chezmoi, macOS, Linux, zsh, Catppuccin Mocha)
- Hero screenshot placeholder with documented manual capture steps
- Brief intro (what this repo is)
- "What's Included" tool overview table
- Step-by-step setup guide using chezmoi official API
- Two daily workflow sections: pull/apply and edit/push
- All chezmoi commands use official CLI API (no raw git inside source dir)

**Non-Goals:**

- Auto-generating screenshots (manual task)
- Documenting every alias or config option
- Troubleshooting / FAQ section
- Contributing guide

## Decisions

**Badge style**: `for-the-badge` — larger, more visual impact for shield wall. Alternatives: flat (too small for hero area), flat-square (decent but less striking).

**Badge selection**: chezmoi (blue), macOS (apple logo), Linux (tux logo), zsh, Catppuccin Mocha (official purple #cba6f7), Starship, Ghostty. Kept to tools that define the repo identity, not every installed package.

**Screenshot placement**: `assets/` directory at repo root, ignored by chezmoi. Alternative: `.github/` (convention for GitHub-specific assets) — chose `assets/` for simplicity and broader hosting compatibility.

**README language**: English.

**Workflow documentation**: Two flows only — "catch up" (chezmoi update) and "make changes" (chezmoi edit/re-add + git push). Covers 99% of daily use without overwhelming.

## Risks / Trade-offs

[Screenshots require manual effort] → Documented as explicit manual task with exact steps. README uses placeholder path that works once image exists.

[chezmoi re-add doesn't work with .tmpl files] → Document `chezmoi add` as the universal alternative alongside `re-add`.
