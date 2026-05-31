## 1. Update global template (`dot_claude/settings.json.tmpl`)

- [x] 1.1 Remove the read-only filesystem allow rules: `ls *`, `cat *`, `head *`, `tail *`, `wc *`, `pwd`, `echo *`, `which *`, `file *`, `find *`, `rg *`, `du *`, `tree *`, `stat *`
- [x] 1.2 Remove the read-only git allow rules: `git status *`, `git diff *`, `git log *`, `git show *`, `git branch *`, `git remote *`, `git stash list *`, `git ls-tree *`, `git rev-parse *`, `git config --get *`
- [x] 1.3 Replace `bun run *` with `bun run typecheck`, `bun run lint`, `bun run build`, `bun run test`; replace `pnpm run *` with the same four `pnpm run` names (keep `bun test *`, `pnpm test *`, and the `--frozen-lockfile` installs)
- [x] 1.4 Remove `node --version` (keep `bun --version`, `npm --version`)
- [x] 1.5 Add `chezmoi execute-template *` to the chezmoi read group
- [x] 1.6 Add `openspec validate *` and `openspec verify *` to the OpenSpec read group
- [x] 1.7 Change `wt --help *` to `wt --help`
- [x] 1.8 Remove `gh api *`; add `gh search *` (keep `gh issue *`, `gh pr *`, `gh repo *`)
- [x] 1.9 Confirm JSON stays valid and the Go-template guards (darwin/arm64 blocks), `deny` array, and key ordering are untouched
- [x] 1.10 Add `"defaultMode": "auto"` as the first key of the `permissions` object

## 2. Verify global behavior

- [x] 2.1 `chezmoi diff dot_claude/settings.json.tmpl` shows only the intended allow-rule changes
- [x] 2.2 Render the template (`chezmoi cat ~/.claude/settings.json`) and confirm valid JSON
- [x] 2.3 Confirm a removed read still runs without prompt (`find . -name '*.ts'`, `git status`); if `git ls-tree HEAD` prompts, re-add `Bash(git ls-tree *)` and amend the spec
- [x] 2.4 Confirm `bun run typecheck` runs without prompt and `bun run dev` now prompts
- [x] 2.5 Confirm `gh api repos/...` (GET) runs without prompt and `gh api -X DELETE ...` prompts
- [x] 2.6 After `chezmoi apply`, start a fresh session and confirm it begins in auto mode (mode indicator shows auto; a rule-unmatched action runs via the classifier with no prompt)

## 3. Prune project-local allowlist (operational — `.claude/settings.local.json` is gitignored)

- [x] 3.1 Remove junk/unsafe entries: `zsh:*`, `do echo:*`, `done`, `for f:*`, `while read:*`, every `python3 -c ...` blob, `rm ~/.config/...`, `tee /tmp/...`, `bunx oxfmt:*`
- [x] 3.2 Remove entries now covered by the global template or Claude Code auto-allow (e.g. `ls:*`, `du:*`, `git log:*`, `find ...`, `chezmoi diff:*`, `npm info:*`, `bunx openspec:*`, `claude plugin:*`, `brew list:*`)
- [x] 3.3 Remove hyper-specific one-offs (full `curl "https://..."` URLs, cross-worktree `git -C ...` commands, absolute-path `find`/`ls`/`bash -n`)
- [x] 3.4 Keep genuinely-local grants absent from the global template (stable `WebFetch(domain:...)` doc domains, `mcp__linear__*`, repo-specific `Read(...)` globs) and preserve `enabledMcpjsonServers`
- [x] 3.5 Confirm the pruned file is valid JSON

## 4. Validate change

- [x] 4.1 `openspec validate simplify-claude-permissions --strict` passes
- [x] 4.2 If permission defaults are documented in `docs/manual.html`, update them (run `/docs:manual`)
