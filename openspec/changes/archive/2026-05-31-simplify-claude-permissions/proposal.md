## Why

The chezmoi-managed global allowlist (`dot_claude/settings.json.tmpl`) carries ~24 Bash rules that Claude Code already auto-allows via built-in read-only detection — noise that hides the grants that actually matter. It also allows arbitrary code execution (`bun run *`, `pnpm run *`) and silent GitHub mutation (`gh api *`), while omitting read-only commands used constantly (`openspec validate`, `chezmoi execute-template`, `gh search`). Separately, this repo's local `.claude/settings.local.json` has grown to ~110 uncurated entries (junk, duplicates, one-offs) that are the real source of prompt fatigue. And the strongest prompt-reducer Claude Code offers — `auto` permission mode — is not enabled by default.

## What Changes

**Global template (`dot_claude/settings.json.tmpl`, committed):**

- **Enable auto mode by default** — set `permissions.defaultMode: "auto"` so every session starts in auto mode: actions run without per-action prompts but route through Claude Code's safety classifier, while `deny` and the (now narrower) `allow` rules still take precedence. Only works in user scope — exactly what this template renders to.
- **Add** read-only rules: `openspec validate *`, `openspec verify *`, `chezmoi execute-template *`, `gh search *`.
- **Remove** redundant rules Claude Code already auto-allows: the read-only filesystem group, the read-only git group, and `node --version`.
- **BREAKING** Narrow `bun run *` / `pnpm run *` to named scripts (`typecheck`, `lint`, `build`, `test`). Unlisted scripts (e.g. `bun run dev`) are no longer blanket-allowed — in auto mode they route to the classifier, in default mode they prompt.
- **Remove** `gh api *` — GET stays auto-allowed by Claude Code; this re-introduces a prompt only for `gh api` writes (POST/DELETE).
- **Fix** `wt --help *` → `wt --help` (the trailing wildcard requires an argument and never matched bare `wt --help`).
- Keep broad `gh pr/issue/repo *` and the deny block unchanged.

**Project-local (`.claude/settings.local.json`, gitignored — operational, not committed):**

- Prune junk (`zsh:*`, `python3 -c` blobs, `rm`, shell-loop fragments), dedupe against the global allowlist and Claude Code auto-allows, keep stable local-only grants. ~110 → ~15 entries.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `claude-user-preferences`: the permission requirements change — `permissions.defaultMode: "auto"` added; two read-only allow groups removed as redundant; build/test narrowed; version-check, chezmoi, OpenSpec, worktrunk, and GitHub CLI rules adjusted.

## Impact

- `dot_claude/settings.json.tmpl` (tracked) — the only committed file change.
- `.claude/settings.local.json` (gitignored) — one-time local prune, no spec impact.
- Behavior: sessions start in auto mode (classifier-gated, far fewer prompts); fewer redundant rules; safer allow-list (no arbitrary `run`, no silent `gh api` writes); force-push / sudo / publish remain denied.
- Auto mode is user-scope-only and requires Claude Code ≥ 2.1.83 on Opus/Sonnet ≥ 4.6 via the Anthropic API; it is inert on Bedrock/Vertex/Foundry and older models (sessions fall back to default mode there).
