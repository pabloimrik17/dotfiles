## Context

See proposal.md — Why. OpenCode is installed via official script to `~/.opencode/bin` so built-in auto-update works (`opencode-install`). Config lives in `dot_config/opencode/opencode.jsonc` and is validated against `https://opencode.ai/config.json`. Schema accepts `autoupdate` as `true` | `false` | `"notify"`.

## Goals / Non-Goals

**Goals:**

- Declare `"autoupdate": true` at the root of the managed OpenCode config
- Align the `opencode-user-config` spec with that explicit setting

**Non-Goals:**

- Changing install method, PATH, or update-extra classification
- Switching to `"notify"` or `false`
- Manual/docs updates beyond what apply verification needs

## Decisions

1. **Value = `true` (not `"notify"` or `false`)**
   - Rationale: Off-brew install exists so auto-update can run; `true` is the coherent choice and matches OpenCode’s default under that install.
   - Alternatives: `"notify"` (user updates manually — weaker than the install intent); `false` (contradicts migrating off brew).

2. **Placement: top-level key next to other root settings**
   - Rationale: Schema defines `autoupdate` on Config root; keep it near `model` / `shell` for readability.
   - Alternatives: Nested under a custom section — invalid against schema.

3. **Spec change is MODIFIED on existing main-config requirement**
   - Rationale: Behavior of the same file/capability changes; full requirement rewrite preserves archive merge fidelity.
   - Alternatives: ADDED-only requirement — would leave the old “omit autoupdate” text conflicting.

## Risks / Trade-offs

- **[Risk] Schema rejection / startup warning if value type is wrong** → Use boolean `true` exactly as schema allows; verify with `chezmoi apply` and OpenCode start.
- **[Trade-off] Explicit default is slightly more config surface** → Acceptable for intent documentation and future default changes upstream.

## Migration Plan

1. Edit source `dot_config/opencode/opencode.jsonc`
2. `chezmoi diff` to confirm only the new key
3. `chezmoi apply` and start OpenCode; confirm no schema warnings
4. Rollback: remove the key (reverts to implicit default `true` under official install)
