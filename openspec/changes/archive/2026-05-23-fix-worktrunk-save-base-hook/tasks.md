## 1. Hook fix

- [x] 1.1 Update `dot_config/worktrunk/config.toml` `save-base` to render `{{ base_worktree_path | default(primary_worktree_path) }}`.
- [x] 1.2 Mirror to `~/.local/share/chezmoi/dot_config/worktrunk/config.toml` and `chezmoi apply`.
- [x] 1.3 Replace verbose comment with a 3-line rationale.

## 2. Verification

- [x] 2.1 `wt switch --create <new>` from main — hook runs, no template error.
- [x] 2.2 `wt switch <existing-branch>` — hook now succeeds (was the original failure).
- [x] 2.3 Stacked case `--create B --base A` writes A's path.

## 3. Spec deltas

- [x] 3.1 `worktrunk-config`: require the filter, add stacked + existing-branch scenarios.
- [x] 3.2 `claude-settings-writeback`: rename requirement to "Sync target path…", update to the filter.
- [x] 3.3 `worktree-file-sync`: update example to the filter; align `Gitignored files are copied on worktree creation` and `Hook is defined in project config` to `pre-start` (CodeRabbit flagged the phase mismatch vs `worktrunk-config`/`claude-settings-writeback`).
- [x] 3.4 `openspec validate fix-worktrunk-save-base-hook` passes.

## 4. Archive

- [ ] 4.1 `openspec archive fix-worktrunk-save-base-hook` to sync deltas into main specs.
- [ ] 4.2 `openspec validate` for each affected capability still passes.
