## 1. Lift save-base + sync-claude to global config

- [x] 1.1 Open `dot_config/worktrunk/config.toml` and locate the existing `[pre-start]` section (which today contains `copy = "wt step copy-ignored"`)
- [x] 1.2 Add a `save-base` key under `[pre-start]` with a guarded body: `[ -d .claude ] && echo '{{ base_worktree_path }}' > .claude/.worktree-base || true`
- [x] 1.3 Add a new `[pre-remove]` section with a `sync-claude` key whose body is the jq-deep-merge bash currently living in `.config/wt.toml` (preserve the atomic write, the array-union for `permissions.allow`/`permissions.deny`, the deny-empty-then-delete logic, and the `|| true` safety)
- [x] 1.4 Document the hook with the same comments currently in `.config/wt.toml` (purpose, why, how, requires jq)
- [x] 1.5 Run `chezmoi apply` and verify `~/.config/worktrunk/config.toml` contains the lifted hooks
- [x] 1.6 Run `wt config show` and confirm the `[pre-start]` and `[pre-remove]` keys are reported

## 2. Remove now-redundant project config

- [x] 2.1 Delete `.config/wt.toml` from the dotfiles repo root via `git rm .config/wt.toml`
- [x] 2.2 If `.config/` is now empty, leave the directory removal to git (no orphaned dir)

## 3. wsh handoff function

- [x] 3.1 Open `dot_zshrc.tmpl` and locate the worktrunk-related section (where `wsc` was added by the change `worktrunk-feature-activation`)
- [x] 3.2 Add the `wsh` zsh function with the signature documented in design.md (branch arg required, optional prompt, usage message on missing arg, attach hint on success)
- [x] 3.3 Run `chezmoi apply`, open a new shell, run `type wsh` and confirm "wsh is a shell function"

## 4. Smoke tests

- [x] 4.1 Inside the dotfiles repo: `wsc smoke-claude-integration` to create a worktree (depends on change A having been applied first; if not, fall back to `wt switch --create smoke-claude-integration --execute=claude`)
- [x] 4.2 In the spawned Claude session, accept any permission prompt to mutate `.claude/settings.local.json`
- [x] 4.3 Exit the Claude session, run `wt remove smoke-claude-integration`, then in the base worktree inspect `.claude/settings.local.json` and confirm the new permission entry was merged in
- [x] 4.4 Repeat 4.1–4.3 in the adjacent `monolab` repo (or any other Claude-using repo) to confirm the lift works outside this dotfiles tree
- [x] 4.5 Run `wsh test-handoff "list the largest files in this repo"` from inside this dotfiles repo, then `tmux attach -t test-handoff` and confirm Claude is running with the prompt loaded
- [x] 4.6 Detach and clean up: `wt remove test-handoff` (and `tmux kill-session -t test-handoff` if still alive)

## 5. OpenSpec validation

- [x] 5.1 Run `openspec validate worktrunk-claude-integration --strict` and resolve any reported issues
- [x] 5.2 Run `openspec show worktrunk-claude-integration` and confirm the deltas match intent
- [x] 5.3 If change A (`worktrunk-feature-activation`) has not yet been archived, confirm the two changes' deltas on `worktrunk-config` and `zsh-aliases` do not conflict (additive only — should be safe by design)
