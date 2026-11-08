# Design

## Context

Claude Code 2.1.319 builds its Bash tool snapshot as follows: it runs `zsh -c -l` with
`CLAUDECODE=1` in the environment, sources `~/.zshrc` with stdin from `/dev/null`, then writes
the result to a snapshot file. The file holds functions, `setopt` state and aliases. Each Bash
call sources that snapshot and then runs the command through `eval`. Claude Code appends its own
`grep` and `find` functions after the user's state. Seen in the snapshot code inside the binary
and in `~/.claude/shell-snapshots/`.

Two consequences:

- Changing options or aliases in `~/.zshrc` reaches the agent shell through the final state of
  the sourced file.
- That state is captured once per session. A running session keeps its old snapshot.

## Goals / Non-Goals

**Goals:**

- One guarded block that holds every agent shell setting.
- A hermetic test that runs that block in CI (`macos-26`, `bun test`).

**Non-Goals:**

- Changing `grep`/`find` (Claude Code owns them).
- Adding `timeout` or GNU `sed`.
- Shell scripts and non-shell subprocesses: aliases and options only affect commands the agent
  types.

## Decisions

### Guard: `CLAUDECODE` set and shell not interactive

`[[ -n ${CLAUDECODE-} && ! -o interactive ]]`. The snapshot shell matches both conditions. An
interactive shell that inherited `CLAUDECODE`, such as a tmux server started from an agent, keeps
the human defaults.

Alternative: `CLAUDECODE` alone. Rejected, because that leaked environment would change human
terminals.

### Place the block at the very end of the zshrc

The snapshot captures the final state, so placement only decides what else in the zshrc runs
under the new options. At the end, after `zoxide init`, nothing in the zshrc runs under them, and
no later line can re-add `ls`/`cat`. The block only touches options and aliases, never
`chpwd_functions`, so zoxide's "must be last" constraint (about hooks) still holds. Update that
comment to name the exception.

Alternative: place it right after the eza/bat aliases. Rejected: zoxide's init and later `eval`s
would then run with `sh_word_split` and `noequals`.

### Only remove and reset, add no commands

The block changes options and removes aliases. It adds no command names.

Alternative: alias `timeout` and `sed` to GNU `gtimeout`/`gsed` from brew `coreutils`/`gnu-sed`.
Rejected: on this Intel host (Homebrew Tier 3) brew builds both from source, and they add two
freeze pins. The gain is small: the Bash tool has its own timeout, and agents retry `sed -i ''`.

### Test by extracting the block

Follow `tests/brew-upgrade-pinned.test.ts`: find the block in `dot_zshrc.tmpl` by its delimiting
comment lines and run it under `zsh -f`, in two modes:

- Agent mode: `CLAUDECODE=1 zsh -f -c`.
- Interactive mode: `zsh -f -i -c`.

Each run predefines the `ls` and `cat` aliases and uses `PATH=/usr/bin:/bin`. The spec scenarios
map one-to-one to assertions. CI needs no oh-my-zsh, plugins or chezmoi.

## Risks / Trade-offs

- [`sh_word_split` changes functions that the snapshot replays: omz helpers, nvm, zoxide's `cd`]
  → Most omz helpers use `emulate -L zsh`, and nvm targets POSIX sh. Verify `node -v`,
  `nvm current`, `cd` into a path with spaces and `git` aliases in a fresh session before closing.
- [Running sessions keep the old snapshot] → Restart Claude Code after `chezmoi apply`; note it in
  the handoff.
- [A future Claude Code changes how it builds the snapshot (env, `-i`)] → The guard fails closed
  and agents get today's behavior. The test documents the assumption.

## Migration Plan

`chezmoi apply`, then start a new Claude Code session. To roll back, revert the commit and run
`chezmoi apply`.
