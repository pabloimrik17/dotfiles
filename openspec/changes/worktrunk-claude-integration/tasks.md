## 1. Lift save-base + sync-claude to global config

- [ ] 1.1 Open `dot_config/worktrunk/config.toml` and locate the existing `[pre-start]` section (which today contains `copy = "wt step copy-ignored"`)
- [ ] 1.2 Add a `save-base` key under `[pre-start]` with a guarded body: `[ -d .claude ] && echo '{{ base_worktree_path }}' > .claude/.worktree-base || true`
- [ ] 1.3 Add a new `[pre-remove]` section with a `sync-claude` key whose body is the jq-deep-merge bash currently living in `.config/wt.toml` (preserve the atomic write, the array-union for `permissions.allow`/`permissions.deny`, the deny-empty-then-delete logic, and the `|| true` safety)
- [ ] 1.4 Document the hook with the same comments currently in `.config/wt.toml` (purpose, why, how, requires jq)
- [ ] 1.5 Run `chezmoi apply` and verify `~/.config/worktrunk/config.toml` contains the lifted hooks
- [ ] 1.6 Run `wt config show` and confirm the `[pre-start]` and `[pre-remove]` keys are reported

## 2. Remove now-redundant project config

- [ ] 2.1 Delete `.config/wt.toml` from the dotfiles repo root via `git rm .config/wt.toml`
- [ ] 2.2 If `.config/` is now empty, leave the directory removal to git (no orphaned dir)

## 3. Marker hooks in Claude Code settings

- [ ] 3.1 Open `dot_claude/settings.json.tmpl`
- [ ] 3.2 Inside the existing `hooks.SessionStart[0].hooks` array (which currently has only `bd prime`), append a second command entry: `command -v wt >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1 && wt config state marker set "🤖" || true`
- [ ] 3.3 Add a new `hooks.Stop` block with the same hook shape (matcher empty), containing one command entry that sets the marker to `💬` with the same guards
- [ ] 3.4 Add a new `hooks.Notification` block with the same shape and the `💬` marker command
- [ ] 3.5 Verify the resulting JSON template still renders to valid JSON via `chezmoi execute-template < dot_claude/settings.json.tmpl > /tmp/settings.json && jq . /tmp/settings.json >/dev/null`
- [ ] 3.6 Run `chezmoi apply` and confirm `~/.claude/settings.json` reflects the new hooks

## 4. wsh handoff function

- [ ] 4.1 Open `dot_zshrc.tmpl` and locate the worktrunk-related section (where `wsc` was added by the change `worktrunk-feature-activation`)
- [ ] 4.2 Add the `wsh` zsh function with the signature documented in design.md (branch arg required, optional prompt, usage message on missing arg, attach hint on success)
- [ ] 4.3 Run `chezmoi apply`, open a new shell, run `type wsh` and confirm "wsh is a shell function"

## 5. Smoke tests

- [ ] 5.1 Inside the dotfiles repo: `wsc smoke-claude-integration` to create a worktree (depends on change A having been applied first; if not, fall back to `wt switch --create smoke-claude-integration -x claude`)
- [ ] 5.2 In the spawned Claude session, accept any permission prompt to mutate `.claude/settings.local.json`
- [ ] 5.3 Confirm `wt list` shows `🤖` on the `smoke-claude-integration` row while Claude is working
- [ ] 5.4 Type a message and observe the marker flip to `💬` once the turn ends
- [ ] 5.5 Exit the Claude session, run `wt remove smoke-claude-integration`, then in the base worktree inspect `.claude/settings.local.json` and confirm the new permission entry was merged in
- [ ] 5.6 Repeat 5.1–5.5 in the adjacent `monolab` repo (or any other Claude-using repo) to confirm the lift works outside this dotfiles tree
- [ ] 5.7 Run `wsh test-handoff "list the largest files in this repo"` from inside this dotfiles repo, then `tmux attach -t test-handoff` and confirm Claude is running with the prompt loaded
- [ ] 5.8 Detach and clean up: `wt remove test-handoff` (and `tmux kill-session -t test-handoff` if still alive)

## 6. OpenSpec validation

- [ ] 6.1 Run `openspec validate worktrunk-claude-integration --strict` and resolve any reported issues
- [ ] 6.2 Run `openspec diff worktrunk-claude-integration` and confirm the deltas match intent
- [ ] 6.3 If change A (`worktrunk-feature-activation`) has not yet been archived, confirm the two changes' deltas on `worktrunk-config` and `zsh-aliases` do not conflict (additive only — should be safe by design)
