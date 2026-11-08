# Tasks

## 1. Agent shell block

- [x] 1.1 Write `tests/agent-shell.test.ts`, which extracts the delimited block from `dot_zshrc.tmpl` and runs it in agent mode (`CLAUDECODE=1 zsh -f -c`) and interactive mode (`zsh -f -i -c`) with `PATH=/usr/bin:/bin`. Cover every scenario in `specs/agent-shell/spec.md`. Verify that `bun test tests/agent-shell.test.ts` fails because the block is missing.
- [x] 1.2 Add the block at the end of `dot_zshrc.tmpl`, after `zoxide init`, guarded by `[[ -n ${CLAUDECODE-} && ! -o interactive ]]`. It runs `unsetopt nomatch equals`, `setopt sh_word_split` and `unalias ls cat`. Reword the zoxide "MUST be last" comment to name this exception. Verify that `bun test tests/agent-shell.test.ts` passes.

## 2. Integration

- [x] 2.1 Run `bun test`, `bun run lint:oxfmt`, `bun run lint:fallow` and `openspec validate agent-shell-defaults --strict`. Verify that all four pass.
- [x] 2.2 Run `chezmoi diff --source "$PWD"`, then apply from this worktree. Verify that the diff only touches the zshrc, and that `chezmoi apply` exits 0.
- [x] 2.3 In a fresh Claude Code session, run these checks and verify every expected result:
  - `echo --include=*.zzz` prints the literal argument.
  - `echo ======` prints `======`.
  - `f="a b"; printf "%s\n" $f` prints two lines.
  - `type ls` and `type cat` name `/bin`.
  - `node -v`, `nvm current` and `cd` into a directory with a space all work without errors.
- [x] 2.4 In a new interactive terminal, verify that `echo *.zzz` fails with `no matches found`, `type ls` names eza, and `type cat` names bat.

## Workflow follow-up

- Codex agent shell: Beads `agentic-task-wmqd.17` (child of `agentic-task-wmqd`). Codex sources `~/.zshrc` for its snapshot but sets no Codex marker there.
- Close Beads `agentic-task-wmqd.2` and move its Board card when the change merges, then archive the change.
