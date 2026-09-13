# Verification

Executed on 2026-09-07. Source changes are prepared; no live chezmoi apply was run.

## Rendered settings and merge fixtures

- Rendered the actual modify template with `chezmoi execute-template --override-data`
  for macOS arm64 and Linux amd64, using a temporary home path and UID.
- Compared both rendered scripts with the same contexts rendered from `HEAD`:
  the only difference was the unconditional top-level `"tui": "fullscreen"`.
  Both scripts passed `sh -n`.
- Executed each rendered script with empty input, `{"theme":"dark"}` without
  `tui`, and `{"theme":"light","tui":"default"}`. All six cases produced valid
  JSON with fullscreen selected, preserved the unmanaged theme where present,
  and produced byte-identical output on a second merge.

## Documentation and integration

- Loaded the manual in headless Google Chrome with Playwright. The six control
  rows and the managed setting, rollback, and compatibility text were present.
  Searches for `fullscreen`, `/tui`, `transcript`, and
  `claude_code_disable_alternate_screen` kept the subsection and matching rows
  visible; clearing search restored all six rows. No browser JavaScript errors.
- Checked all six parity-table cells, the qualified Junie setting gap, and four
  official source links. No other agent's configuration changed.
- `bun run lint:oxfmt`,
  `openspec validate add-claude-code-fullscreen-tui --strict`, and
  `git diff --check` passed. The diff contains only the intended settings,
  manual, parity, and change artifacts.

## Interactive runtime smoke checks

Claude Code **2.1.263** on macOS. Launched with `--safe-mode`,
`--setting-sources ''`, `--settings '{"tui":"fullscreen"}'`,
`--strict-mcp-config`, and an empty MCP configuration. These launches isolated
the settings under test and disabled customizations while using the existing
login. Only built-in local commands were submitted; no model request was made.

| Terminal | Result |
| --- | --- |
| Direct `xterm-256color` PTY, 80 × 24 | Entered the alternate screen; `/tui` reported `Current renderer: fullscreen`. |
| Ordinary tmux 3.7b, private socket, `tmux-256color` pane, 100 × 30, mouse on | `/tui` reported fullscreen and tmux reported `alternate_on=1`. No `-CC` integration. |
| Direct PTY with `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` and the same fullscreen setting | `/tui` reported `Current renderer: default`. |

In both fullscreen sessions, `Ctrl+o` opened transcript mode and `/` opened its
search bar. `PgUp` moved to earlier content and `PgDn` returned to later content;
tmux captures additionally confirmed that paging down restored the original
viewport. All smoke-test sessions exited with `/exit`.

Runtime limits: these were PTY checks, not visual checks in a GUI terminal.
Mouse-wheel behavior and GUI terminal compatibility were not exercised. The
local-command-only transcript returned `no matches` in search, so matching and
jumping through model-response search results were not verified. These limits
are separate from the successful rendering and merge-fixture checks.
