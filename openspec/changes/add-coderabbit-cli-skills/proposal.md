## Why

The dotfiles already install agent skills from Vercel and Anthropic (Group 9 in the install script), enabling AI coding agents like Claude Code to discover and invoke specialized capabilities. CodeRabbit is an AI-powered code review tool that can catch bugs, security issues, and logic errors before code is committed. Adding its CLI skills lets any AI agent trigger code review directly from the terminal via `coderabbit --agent`, closing the loop between writing code and reviewing it — without leaving the terminal or opening a PR first.

GitHub issue: pabloimrik17/dotfiles#113

## What Changes

- Install `coderabbit` as a brew cask (alongside Claude, Ollama, etc. in the `ALL_CASKS` array)
- Add two CodeRabbit agent skills via `skills.sh` (Group 9):
    - `code-review` — triggers full AI review on uncommitted changes
    - `autofix` — fetches unresolved PR review comments and applies fixes
- Add `coderabbit auth login` as a manual instruction (alongside Adobe, 1Password, etc.) since authentication is interactive and requires a browser

## Capabilities

### New Capabilities

- `coderabbit-install`: Installation of CodeRabbit CLI via brew cask and agent skills via skills.sh
- `coderabbit-skills`: Agent skills (code-review, autofix) available globally for AI coding agents

### Modified Capabilities

_None — this is a new tool addition with no changes to existing specs._

## Impact

- **Files modified**: `run_onchange_install-packages.sh.tmpl` only (three insertions: cask entry, two skill installs, one manual instruction line)
- **Dependencies**: `brew` (already installed), `npx` (already available for Group 9 skills)
- **No new config files** — CodeRabbit has no global config (`~/.coderabbit.yaml` does not exist); config is per-project only
- **No new aliases** — `cr` is already provided by the CLI as a built-in shorthand
- **No breaking changes** to existing configuration
