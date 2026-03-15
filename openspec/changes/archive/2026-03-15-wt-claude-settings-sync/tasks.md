## 1. Hook Configuration

- [x] 1.1 Add `save-base` command to `[post-create]` in `.config/wt.toml`:
    ```toml
    save-base = "echo '{{ base_worktree_path }}' > .claude/.worktree-base"
    ```
- [x] 1.2 Add `[pre-remove]` section with `sync-claude` hook:
    ```toml
    [pre-remove]
    sync-claude = "bash -c 'BASE_WT=$(cat .claude/.worktree-base 2>/dev/null || echo); [ -n \"$BASE_WT\" ] && [ -f .claude/settings.local.json ] && [ -d \"$BASE_WT\" ] && { if [ -f \"$BASE_WT/.claude/settings.local.json\" ]; then jq -s \".[0] as \\$b | .[1] as \\$w | (\\$b * \\$w) | .permissions.allow = ([(\\$b.permissions.allow // [])[], (\\$w.permissions.allow // [])[]] | unique) | .permissions.deny = ([(\\$b.permissions.deny // [])[], (\\$w.permissions.deny // [])[]] | unique) | if .permissions.deny == [] then del(.permissions.deny) else . end\" \"$BASE_WT/.claude/settings.local.json\" .claude/settings.local.json > \"$BASE_WT/.claude/settings.local.json.tmp\" && mv \"$BASE_WT/.claude/settings.local.json.tmp\" \"$BASE_WT/.claude/settings.local.json\" || echo \"warn: claude settings merge failed\" >&2; else mkdir -p \"$BASE_WT/.claude\" && cp .claude/settings.local.json \"$BASE_WT/.claude/settings.local.json\"; fi; } || true'"
    ```
- [x] 1.3 Add `.claude/.worktree-base` to `.gitignore`

## 2. Verification

- [x] 2.1 Create a test worktree, verify `.claude/.worktree-base` contains correct base path
- [x] 2.2 Modify `.claude/settings.local.json` in test worktree, remove it, verify base worktree has merged settings
- [x] 2.3 Verify edge cases: no settings file, no base file, missing base worktree — all exit silently
