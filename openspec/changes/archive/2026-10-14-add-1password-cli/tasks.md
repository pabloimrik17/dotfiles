# Tasks

## 1. Install and freeze the cask

- [x] 1.1 Declare `BREW_CLI_CASKS=(1password-cli)` beside `BREW_PACKAGES` with a one-line why
      (casks need `--cask` and a cask-kind freeze), add `"1password-cli|2.41.0"` as the first
      `BREW_VERSIONS` row, and name `BREW_CLI_CASKS` in the row-coverage comment. Verify
      `brew info --cask 1password-cli` reports 2.41.0.
- [x] 1.2 In Group 1, count each `BREW_CLI_CASKS` entry as pending unless
      `brew list --cask <token>` succeeds, include the casks in the `N/M installed` total, and
      install pending ones with `brew install --cask`, calling `error` on failure. Verify the
      macOS render passes `bash -n`.
- [x] 1.3 In `apply_brew_freeze`, add a `cask|<token>` entry for each `BREW_CLI_CASKS` entry,
      using `"${BREW_CLI_CASKS[@]:-}"` so bash 3.2 with `set -u` accepts an empty array.
- [x] 1.4 `tests/brew-freeze.test.ts`: the fixture emits `BREW_CLI_CASKS`, coverage includes it,
      and the cask test checks that an installed CLI cask gets `pin --cask 1password-cli` and is
      recorded as `cask 1password-cli`. Verify `bun test tests/brew-freeze.test.ts` passes.
- [x] 1.5 `tests/install-script.test.ts`: the Group 1 pre-scan counts the cask as pending when
      only an `op` outside Homebrew is on `PATH`, installs it with `brew install --cask`, and skips
      an installed cask. Verify `bun test tests/install-script.test.ts` passes.
- [x] 1.6 Add an `op` row to the README "What's Included" table (frozen at `2.41.0`) via the
      `update-readme` skill. Verify `bun run lint:oxfmt` passes.

## 2. Guidance and summaries

- [x] 2.1 Add `print_op_guidance`: unlock the 1Password app, then Settings → Developer →
      Integrate with 1Password CLI (Touch ID optional), and check with `op vault list`. Call it
      after `print_gws_guidance` on both branches.
- [x] 2.2 Add `op` after `gws` on all three `CLI tools:` lines, and an `op` hint after the `gws`
      hint on the non-macOS branch, linking https://developer.1password.com/docs/cli/get-started.
- [x] 2.3 Add a 1Password CLI section to `docs/manual.html` via the `update-manual` skill: app
      integration steps and `brew-upgrade-pinned 1password-cli` plus the row bump. Verify the page
      renders in a browser with no broken anchors in the table of contents.

## 3. Integration checks

- [x] 3.1 Run `bun test`, `openspec validate add-1password-cli --strict` and
      `bunx @fission-ai/openspec@1.2.0 validate --changes`. All pass.
- [x] 3.2 On the Intel host, render the macOS installer from this worktree and run it. Verify it
      installs nothing for `1password-cli`, `brew list --pinned --versions` shows
      `1password-cli 2.41.0`, the freeze record lists `cask 1password-cli`, and no drift warning
      prints.
- [x] 3.3 Run `brew-upgrade-pinned 1password-cli` on the Intel host. Verify it exits 0 and the
      cask is still pinned.

## Workflow follow-up

- Commit on `feature/add-1password-cli` and open a PR (no Claude co-author lines).
- Archive the change after the PR merges.
