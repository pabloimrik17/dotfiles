# Tasks

## 1. Managed key and its tests

- [x] 1.1 Add `tests/claude-code-mode.test.ts`: render the template for `personal` and `work` (`chezmoi execute-template --override-data`, as in `tests/knowledge-base-settings.test.ts`), merge onto `{}` and onto live files, and assert every scenario in `specs/claude-user-preferences/spec.md` and the machine-type scenario in `specs/claude-settings-merge/spec.md`. Verify the new tests fail before 1.2.
- [x] 1.2 In `dot_claude/modify_settings.json.tmpl`, declare `"CLAUDE_CODE_EXPERIMENTAL_CODE_MODE": "1"` in MANAGED `env` behind `eq (get . "machineType" | default "") "personal"`, with the comma inside the conditional (D3). Under the negated condition, add `("env", "CLAUDE_CODE_EXPERIMENTAL_CODE_MODE")` to `REMOVE` (D2). Verify that `bun test tests/claude-code-mode.test.ts` passes.
- [x] 1.3 Verify that `bun test` (the whole suite, including `claude-settings-hooks`, `knowledge-base-settings` and `ibkr-mcp`) passes, and that `openspec validate enable-claude-code-mode-personal --strict` passes.

## 2. Docs

- [x] 2.1 Add a "Code Mode" entry to `docs/manual.html` next to "Fullscreen TUI": personal machines only, removed on work by apply, it turns off Chrome, computer use and Remote Control (use Playwright or chrome-devtools MCP), the one-time opt-in prompt, `/status` for the reason when it is off, and `CLAUDE_CODE_EXPERIMENTAL_CODE_MODE=0 claude` to skip it for one launch. Use the `update-manual` skill. Verify that `bun run lint:oxfmt` passes.

## 3. Integration checks

- [ ] 3.1 On the personal machine, verify that `chezmoi diff ~/.claude/settings.json` from the branch's source shows no Code Mode line (the key is already live), and that the rendered `env` holds both keys.
- [ ] 3.2 With `machineType=work` rendered locally (`--override-data`), merge a copy of the personal live file and verify that the Code Mode key is gone and that every other key matches.
- [ ] 3.3 Write the D5 blocker audit and the `claude -p` fallback into the PR body.

## Workflow follow-up

- On the work machine after merge, `chezmoi diff ~/.claude/settings.json` shows no Code Mode change (human check).
- On the personal machine after apply, a new interactive `claude` shows "Code Mode (experimental) is on" (human check; the opt-in prompt was already answered).
- Archive the change once both checks pass.
