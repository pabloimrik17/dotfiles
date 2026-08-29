# Agent config parity

One row per user-scope capability, added by the `sync-agent-config` skill as mappings are established. A cell is never blank: `none` plus a reason in notes records a confirmed gap.

| capability | Claude Code | Codex | OpenCode | Junie | notes |
| ---------- | ----------- | ----- | -------- | ----- | ----- |
| Matt Pocock skills | Official namespaced `mattpocock-skills@claude-plugins-official` plugin | `none` (not targeted by skills.sh) | 24 scoped `mattpocock/skills` skills via skills.sh | 24 scoped `mattpocock/skills` skills via skills.sh | Standalone scope is OpenCode/Junie only; Matt's `code-review` is excluded so flat `code-review` remains CodeRabbit-owned |
