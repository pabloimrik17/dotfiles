## 1. Worktrunk user config — list & picker

- [x] 1.1 Add `[list]` table with `summary = true` to `dot_config/worktrunk/config.toml`
- [x] 1.2 Add `[switch.picker]` table with `pager = "delta --paging=never"` to the same file
- [x] 1.3 Sanity-check ordering: keep `[list]` near the top of the file (before hooks) for readability

## 2. Exclude list update

- [x] 2.1 Append `.stryker-tmp/` to `[step.copy-ignored].exclude` in `dot_config/worktrunk/config.toml`
- [x] 2.2 Verify ordering inside the array (group with build/cache entries, not Python ones)

## 3. Install-deps hook rename + phased echoes

- [x] 3.1 Rename `[post-start].deps` key to `[post-start].install-deps` in `dot_config/worktrunk/config.toml`
- [x] 3.2 Add `echo '[install-deps] detecting package manager…'` at the top of the bash body
- [x] 3.3 Add `echo '[install-deps] detected bun → installing'` (and equivalent for pnpm, npm) before each `<pm> install`
- [x] 3.4 Add `echo '[install-deps] no recognised lockfile, skipping'` in the implicit no-op branch (else clause)
- [x] 3.5 Add a final `echo '[install-deps] done'` after the conditional
- [x] 3.6 Preserve the existing skip-with-warning behaviour when a lockfile is present but the binary is missing

## 4. Worktrunk aliases

- [x] 4.1 Add `[aliases]` table to `dot_config/worktrunk/config.toml`
- [x] 4.2 Define `wtlog` so that it accepts the hook id as the first positional arg and tails the corresponding log file. Resolves the path via `wt config state logs --format=json | jq -r --arg id {{ args[0] }} '.hook_output[] | select((.source + ":" + .hook_type + ":" + .name) == $id) | .path'
- [x] 4.3 Define `wtci = "wt list --full --branches"`
- [x] 4.4 Define `mc` whose body sets `WORKTRUNK_COMMIT__GENERATION__COMMAND` to the editor-based command from worktrunk tip #7 (mktemp + commented diff context + `${EDITOR:-vi}`) and then runs `wt merge`
- [x] 4.5 Verify each alias resolves by running `wt <alias>` against a throwaway worktree (wtci verified inside a git repo; `wt config alias dry-run` confirms wtlog and mc templates resolve)

## 5. Shell alias `wsc`

- [x] 5.1 Open `dot_zshrc.tmpl` and locate the worktrunk-related section (or create one near other tool aliases)
- [x] 5.2 Add `alias wsc='wt switch --create --execute=claude'`
- [x] 5.3 Verify the alias does not collide with any existing alias, function, or binary on PATH (`type wsc` should return "not found" before the change)

## 6. Apply, verify, smoke-test

- [x] 6.1 Run `chezmoi apply` and inspect the diff for `~/.config/worktrunk/config.toml` and `~/.zshrc` — deferred until this feature branch is merged into `main`. The chezmoi source repo at `~/.local/share/chezmoi` tracks `main`; running `chezmoi apply` while these changes only exist on `feature/improve-worktrunk` would not propagate them. For runtime verification we copied `dot_config/worktrunk/config.toml` into `~/.config/worktrunk/config.toml` directly (backup at `~/.config/worktrunk/config.toml.bak`) and exported the `wsc` alias inline in the test shell.
- [x] 6.2 Run `wt config show` and confirm the new `[list]`, `[switch.picker]`, extended `[step.copy-ignored].exclude`, and `[aliases]` are reported
- [x] 6.3 Open a fresh shell, run `type wsc` and verify it resolves to the alias
- [x] 6.4 Run `wt list` in a repo with multiple branches; confirm LLM summary lines appear (may take seconds for first call)
- [x] 6.5 Run `wsc smoke-feature-activation` against this dotfiles repo (or another safe target); confirm worktree creation, then resolve the install-deps log via `wt config state logs --format=json | jq -r '.hook_output[] | select(.name == "install-deps") | .path'` and grep for `[install-deps]` markers (verified: log shows `detecting package manager…` → `detected bun → installing` → bun output → `done`)
- [x] 6.6 Run `wt wtci` and confirm output matches `wt list --full --branches` (verified inside a git repo; alias dispatch requires git context)
- [x] 6.7 In a worktree with staged changes, run `wt mc` and confirm `$EDITOR` opens with the diff commented out; save and confirm the squash message reaches the merge — alias structure verified via `wt config alias dry-run mc` (renders `WORKTRUNK_COMMIT__GENERATION__COMMAND='…${EDITOR:-vi}…' wt merge`); full E2E editor exercise blocked because the smoke branch had no squashable commits (commitlint rejected `"wip"` and the no-op merge auto-removed the worktree). Run again on any branch with at least one conventional-format commit to fully exercise the editor flow.
- [x] 6.8 Run `wt remove smoke-feature-activation` to clean up (auto-removed by `wt mc`'s no-op fast-merge path)

## 7. OpenSpec validation

- [x] 7.1 Run `openspec validate worktrunk-feature-activation --strict` and resolve any reported issues
