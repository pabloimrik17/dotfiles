# Tasks

## 1. Managed setting

- [x] 1.1 Add the `pluginConfigs` entry to the managed key set and list `pluginConfigs`, the plugin entry and `options` in `MERGE_CONTAINERS`.
- [x] 1.2 Add `tests/claude-agents-md.test.ts` covering an absent key, preserved sibling entries/options with an overwritten value, an empty live file and idempotence.
- [x] 1.3 Add a manual note in the Claude Code section.

## 2. Validation

- [x] 2.1 `bun test tests/claude-agents-md.test.ts`, `bun test`, `bun run lint:oxfmt`, `openspec validate add-claude-agents-md-instruction-files --strict --no-interactive`, `git diff --check`.
