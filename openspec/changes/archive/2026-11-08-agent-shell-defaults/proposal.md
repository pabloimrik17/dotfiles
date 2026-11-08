# Proposal

## Why

Claude Code's Bash tool replays a snapshot of the shell built by sourcing `~/.zshrc`. So agents
inherit zsh options and aliases meant for humans, and these break routine commands:

- `nomatch` aborts an unquoted `grep --include=*.ts` (37 of 1,356 calls, 2.7 %).
- `equals` expands `======` and aborts the command.
- zsh does not split `$FILES`, so a list arrives as one argument.
- `ls` resolves to `eza --icons`: `ls -lt` breaks and a bare `ls` hung the tool for 120 s.
- `cat` resolves to `bat`.

Tracked as Beads `agentic-task-wmqd.2`.

## What Changes

- Add a block at the end of `dot_zshrc.tmpl` that runs only when the shell is
  sourced for an agent snapshot (`CLAUDECODE` set and the shell not interactive). It:
  - turns off `nomatch` and `equals`, and turns on `sh_word_split`;
  - removes the `ls` and `cat` aliases.
- Interactive shells keep `nomatch`, `equals`, eza and bat unchanged.
- Out of scope:
  - `timeout` (missing on macOS) and BSD `sed -i`: both need GNU tools from brew, which builds
    them from source on this Intel host. The Bash tool has its own timeout, and agents retry
    `sed -i ''` on their own.
  - The `grep` → ugrep shell function: Claude Code appends it to the snapshot after it sources
    `~/.zshrc`, so the zshrc cannot remove it.
  - The `_omz_nvm_setup_completion` noise: it no longer reproduces (`node -v`, `npm -v` and
    `nvm current` were clean on 2026-11-07).
  - Codex: its snapshot also sources `~/.zshrc`, but sets no Codex marker at that point. A
    follow-up Beads task (`agentic-task-wmqd.17`) tracks finding one.

## Capabilities

### New Capabilities

- `agent-shell`: zsh options and command names in the shell that coding agents replay, kept
  apart from the interactive shell.

### Modified Capabilities

None.

## Impact

- `dot_zshrc.tmpl`: new guarded block at the end, after `zoxide init`.
- `tests/`: a new test that extracts the block and checks agent and interactive shells.
- Existing Claude Code sessions keep their old snapshot until they restart.
