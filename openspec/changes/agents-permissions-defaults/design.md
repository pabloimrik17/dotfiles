## Context

Claude Code and OpenCode are the two primary AI coding tools managed by this dotfiles repo via chezmoi. Both support granular permission models but with different syntaxes:

- **Claude Code** (`dot_claude/settings.json.tmpl`): uses `permissions.allow[]`, `permissions.deny[]` arrays with `Tool(pattern)` syntax
- **OpenCode** (`dot_config/opencode/opencode.jsonc`): uses `permission.bash.{pattern}: level`, `permission.edit: level`, `permission.webfetch: level` flat structure

Currently Claude Code has zero user-level permission rules (only project-local accumulations in `.claude/settings.local.json`). OpenCode has a basic set but lacks deny rules and several common allow patterns.

## Goals / Non-Goals

**Goals:**

- Define a curated, unified permission baseline at user level for both tools
- Same logical rule set adapted to each tool's syntax constraints
- Three-tier defense: deny (hard block) → allow (safe ops) → ask (default for everything else)
- Reduce noise from safe read-only operations while maintaining oversight on consequential actions

**Non-Goals:**

- Project-level permissions (those stay per-project in `.claude/settings.local.json` / project `opencode.json`)
- Auto mode configuration for Claude Code
- Hook-based permission validation (existing hooks are unaffected)
- OpenCode per-domain WebFetch or per-tool MCP rules (not supported by OpenCode's model)

## Decisions

### 1. Three-tier permission model with deny as hard safety net

Deny rules block operations that should never happen regardless of context (force push to remote, privilege escalation, remote code execution, accidental publishing). Ask remains the implicit default for everything not explicitly allowed or denied.

**Alternative considered:** Only allow + ask (no deny). Rejected because ask still allows accidental approval of catastrophic commands.

### 2. git push in allow, git commit in ask

Push is allowed because commit always requires confirmation first — the user reviews every commit message before it exists. Push without a reviewed commit can't happen in practice.

**Alternative considered:** Push in ask. Rejected because it adds friction without safety benefit given commit is already gated.

### 3. WebFetch domain allowlist and MCP tool allowlist (Claude Code only)

OpenCode's permission model doesn't support per-domain WebFetch or per-tool MCP rules, so these are Claude Code-specific additions. The domain list covers universal dev resources (GitHub, Anthropic docs, npm). MCP read-only tools are allowed; write tools stay in ask.

### 4. pnpm homonyms alongside bun commands

Build/test allow rules include both `bun` and `pnpm` variants (`pnpm run *`, `pnpm test *`, `pnpm install --frozen-lockfile`) for cross-project compatibility.

### 5. bun install only with --frozen-lockfile in allow

`bun install` without `--frozen-lockfile` modifies the lockfile and should require confirmation. Same for `pnpm install` without `--frozen-lockfile`.

## Risks / Trade-offs

- **`gh api *` in allow is broad** — covers POST/DELETE operations. Mitigated by the user's GitHub token being scope-limited. If token scopes change, this rule should be reconsidered.
- **Deny rules are absolute** — cannot be overridden at project level. This is intentional for safety but means a legitimate use of `sudo` would require editing user settings.
- **OpenCode lacks feature parity** — no per-domain WebFetch, no per-tool MCP, no WebSearch rule. These gaps mean OpenCode will prompt more often for operations Claude Code auto-allows. Acceptable trade-off given OpenCode's simpler model.
- **Pattern matching differences** — Claude Code uses `Bash(pattern *)` with word-boundary semantics; OpenCode uses `"pattern *": "level"`. Both support glob-style `*` but edge cases may differ.
