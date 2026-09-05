## 1. Managed Claude Code preference

- [ ] 1.1 Add the top-level `"tui": "fullscreen"` scalar to `MANAGED` in `dot_claude/modify_settings.json.tmpl`; render representative macOS arm64 and Linux contexts and verify that each produces the same unconditional preference without changing the merge engine or other managed values.
- [ ] 1.2 Execute the rendered modify script with temporary fixtures for empty settings, settings without `tui`, and `"tui": "default"` alongside an unmanaged preference; verify valid JSON, fullscreen enforcement, preservation of the unmanaged value, and byte-identical output on a second merge.

## 2. Documentation and parity

- [ ] 2.1 Add the fullscreen subsection proposed in `design.md` to Section 11 of `docs/manual.html`, following `update-manual` conventions; verify the rendered setting, built-in commands, search/scroll shortcuts, launch-specific override, chezmoi reapply behavior, persistent rollback, and tmux caveats, and confirm the subsection is discoverable through the existing search filter.
- [ ] 2.2 Add the fullscreen mapping proposed in `design.md` to `.agents/skills/sync-agent-config/parity.md` using `sync-agent-config`; verify all four agents have nonblank cells, the Junie setting gap is explicitly qualified, official source links accompany the mapping, and no other agent's configuration is modified.

## 3. Integration verification

- [ ] 3.1 Run `bun run lint:oxfmt`, `openspec validate add-claude-code-fullscreen-tui --strict`, and `git diff --check`; verify successful results and inspect the diff to confirm it contains only the intended configuration, documentation, parity, and change artifacts.
- [ ] 3.2 Perform a Claude Code interactive smoke check with isolated settings, or during the requested targeted rollout: verify `/tui` reports fullscreen in a supported direct terminal and ordinary tmux, transcript navigation works, and the launch-specific override selects classic rendering; record the tested version/terminals and any unavailable runtime checks separately from the completed fixture checks.
