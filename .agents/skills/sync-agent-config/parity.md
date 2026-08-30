# Agent config parity

One row per user-scope capability, added by the `sync-agent-config` skill as mappings are established. A cell is never blank: `none` plus a reason in notes records a confirmed gap.

| capability | Claude Code | Codex | OpenCode | Junie | notes |
| ---------- | ----------- | ----- | -------- | ----- | ----- |
| Superpowers | `superpowers@superpowers-marketplace` | `superpowers@openai-curated` | `superpowers@git+https://github.com/obra/superpowers.git` | none | The installer's `CODEX_PLUGINS` group runs `codex plugin add`; the plugin state stays runtime-owned and no Codex plugin file is managed by chezmoi. No supported Junie user-scope counterpart exists. |
