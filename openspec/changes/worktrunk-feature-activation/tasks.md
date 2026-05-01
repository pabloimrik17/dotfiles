## 1. Worktrunk user config — list & picker

- [ ] 1.1 Add `[list]` table with `summary = true` to `dot_config/worktrunk/config.toml`
- [ ] 1.2 Add `[switch.picker]` table with `pager = "delta --paging=never"` to the same file
- [ ] 1.3 Sanity-check ordering: keep `[list]` near the top of the file (before hooks) for readability

## 2. Exclude list update

- [ ] 2.1 Append `.stryker-tmp/` to `[step.copy-ignored].exclude` in `dot_config/worktrunk/config.toml`
- [ ] 2.2 Verify ordering inside the array (group with build/cache entries, not Python ones)

## 3. Install-deps hook rename + phased echoes

- [ ] 3.1 Rename `[post-start].deps` key to `[post-start].install-deps` in `dot_config/worktrunk/config.toml`
- [ ] 3.2 Add `echo '[install-deps] detecting package manager…'` at the top of the bash body
- [ ] 3.3 Add `echo '[install-deps] detected bun → installing'` (and equivalent for pnpm, npm) before each `<pm> install`
- [ ] 3.4 Add `echo '[install-deps] no recognised lockfile, skipping'` in the implicit no-op branch (else clause)
- [ ] 3.5 Add a final `echo '[install-deps] done'` after the conditional
- [ ] 3.6 Preserve the existing skip-with-warning behaviour when a lockfile is present but the binary is missing

## 4. Worktrunk aliases

- [ ] 4.1 Add `[aliases]` table to `dot_config/worktrunk/config.toml`
- [ ] 4.2 Define `wtlog = "tail -f \"$(wt config state logs get --hook={{ args.0 }})\""` (or template equivalent that accepts the hook id as the first positional arg)
- [ ] 4.3 Define `wtci = "wt list --full --branches"`
- [ ] 4.4 Define `mc` whose body sets `WORKTRUNK_COMMIT__GENERATION__COMMAND` to the editor-based command from worktrunk tip #7 (mktemp + commented diff context + `${EDITOR:-vi}`) and then runs `wt merge`
- [ ] 4.5 Verify each alias resolves by running `wt <alias>` against a throwaway worktree

## 5. Shell alias `wsc`

- [ ] 5.1 Open `dot_zshrc.tmpl` and locate the worktrunk-related section (or create one near other tool aliases)
- [ ] 5.2 Add `alias wsc='wt switch --create --execute=claude'`
- [ ] 5.3 Verify the alias does not collide with any existing alias, function, or binary on PATH (`type wsc` should return "not found" before the change)

## 6. Apply, verify, smoke-test

- [ ] 6.1 Run `chezmoi apply` and inspect the diff for `~/.config/worktrunk/config.toml` and `~/.zshrc`
- [ ] 6.2 Run `wt config show` and confirm the new `[list]`, `[switch.picker]`, extended `[step.copy-ignored].exclude`, and `[aliases]` are reported
- [ ] 6.3 Open a fresh shell, run `type wsc` and verify it resolves to the alias
- [ ] 6.4 Run `wt list` in a repo with multiple branches; confirm LLM summary lines appear (may take seconds for first call)
- [ ] 6.5 Run `wsc smoke-feature-activation` against this dotfiles repo (or another safe target); confirm worktree creation, then `wt config state logs get --hook=user:post-start:install-deps` and grep for `[install-deps]` markers
- [ ] 6.6 Run `wt wtci` and confirm output matches `wt list --full --branches`
- [ ] 6.7 In a worktree with staged changes, run `wt mc` and confirm `$EDITOR` opens with the diff commented out; save and confirm the squash message reaches the merge
- [ ] 6.8 Run `wt remove smoke-feature-activation` to clean up

## 7. OpenSpec validation

- [ ] 7.1 Run `openspec validate worktrunk-feature-activation --strict` and resolve any reported issues
- [ ] 7.2 Run `openspec diff worktrunk-feature-activation` and confirm the delta is what was intended
