## 1. Config Change

- [x] 1.1 Add `[pre-start]` section with `copy = "wt step copy-ignored"` to `dot_config/worktrunk/config.toml`, placed before the existing `[post-start]` section

## 2. Verification

- [x] 3.1 Verify TOML syntax is valid and config renders correctly (chezmoi dry-run not available in worktree — validated by reading rendered file)
- [x] 3.2 Confirm the `[pre-start]` section appears before `[post-start]` in the rendered config
