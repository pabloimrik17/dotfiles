# Agent config parity

One row per user-scope capability, added by the `sync-agent-config` skill as mappings are established. A cell is never blank: `none` plus a reason in notes records a confirmed gap.

| capability | Claude Code | Codex | OpenCode | Junie | notes |
| ---------- | ----------- | ----- | -------- | ----- | ----- |
| Matt Pocock skills | Official namespaced `mattpocock-skills@claude-plugins-official` plugin | 24 `mattpocock/skills` skills via the shared `~/.agents/skills` | 24 scoped `mattpocock/skills` skills via skills.sh | 24 scoped `mattpocock/skills` skills via skills.sh | skills.sh is told `opencode junie`; Codex is a universal agent, so it resolves the same canonical dir without being a target. Claude Code stays on the plugin channel only, and the standalone set excludes `code-review` so the flat name remains CodeRabbit-owned. |
| Superpowers | `superpowers@superpowers-marketplace` | `superpowers@openai-curated` | `superpowers@git+https://github.com/obra/superpowers.git` | none | The installer's `CODEX_PLUGINS` group runs `codex plugin add`; the plugin state stays runtime-owned and no Codex plugin file is managed by chezmoi. No supported Junie user-scope counterpart exists. |
