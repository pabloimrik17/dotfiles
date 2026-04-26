## Context

The Claude Code harness reads `~/.claude/settings.json` for user preferences. That file is owned by chezmoi via `dot_claude/settings.json.tmpl`. Three top-level pref keys had drifted between template and live state, and one key (`skipAutoPermissionPrompt`) was present live but missing from the template, so a `chezmoi apply` would silently regress behavior. The change exists to converge the template on the intentional state and prevent future regressions.

## Goals / Non-Goals

**Goals:**

- Make `chezmoi apply` produce the user's intended Claude Code preference state on first run on a clean machine.
- Encode the desired values (`effortLevel: "xhigh"`, `skipAutoPermissionPrompt: true`) as spec requirements so future drift is a spec violation, not a silent change.
- Establish a canonical key order for the user-preference block to keep template ↔ live diffs readable.

**Non-Goals:**

- Defending against Claude Code's UI-driven rewrites of `~/.claude/settings.json` (those happen at runtime, after `chezmoi apply`, and may reorder keys or normalize values regardless of what we write).
- Modeling every top-level key in `~/.claude/settings.json`. Only the user-preference subset (the 5 keys in this block) is in scope; permissions, hooks, plugins, and statusLine are governed by separate requirements.
- Adding `effortLevel: "max"` support — the Claude Code schema explicitly excludes `"max"` from persistable values; it is session-only.

## Decisions

### Decision: Use lowercase `"xhigh"` for effortLevel

The user initially asked for `xHigh` (capital H). The Claude Code settings docs list the enum as `"low" | "medium" | "high" | "xhigh"` — lowercase only. Empirical evidence on the live machine confirms: `xHigh` was rejected and normalized to `"high"`, which is exactly the drift this change repairs. We commit to lowercase `"xhigh"` because:

- It is the only value the schema accepts.
- The `/effort xHigh` command tolerates either case as input but writes lowercase to disk.
- Any other casing creates a guaranteed round-trip failure.

**Alternative considered:** Encode `xHigh` to match the user's verbal spec. Rejected — would re-introduce the exact regression the issue reports.

### Decision: `skipAutoPermissionPrompt` is encoded despite light official documentation

The official Claude Code settings table does not list `skipAutoPermissionPrompt` (only `skipDangerousModePermissionPrompt`). However, Anthropic's own auto-mode engineering post and several tracked GitHub issues reference it as a real, working setting. It is currently present in the live config and is the user's intentional state. We encode it because:

- Removing it would re-introduce a permission prompt the user deliberately disabled.
- The risk of a future Claude Code release deprecating the key is small and would surface as a noisy `chezmoi apply` rather than silent data loss.

**Alternative considered:** Wait for it to be added to the official docs table. Rejected — the user's working preference is the source of truth, not the doc table's coverage.

### Decision: Encode canonical key order as a spec requirement

JSON object key order has no semantic meaning, so encoding order in a spec is unusual. We do it anyway because the _purpose_ of the spec is to govern what the chezmoi template writes — and the template is a text file where order does matter for diff readability. The canonical order is the order in which the keys appear in the live `~/.claude/settings.json` after the user's most recent intentional toggle: `alwaysThinkingEnabled`, `skipDangerousModePermissionPrompt`, `skipAutoPermissionPrompt`, `voiceEnabled`, `effortLevel`.

**Alternative considered:** Leave order unspecified, accept whatever order the template author picks. Rejected — without a fixed order, future template edits will reshuffle keys and produce noisy `chezmoi apply` diffs that make it hard to spot real changes.

## Risks / Trade-offs

- **Risk:** Claude Code rewrites `~/.claude/settings.json` on UI toggles (toggling voice mode, changing effort level, etc.) and may scramble key order, partially undoing the canonical ordering between `chezmoi apply` runs.
  → **Mitigation:** Spec governs only what the template writes. Round-trip stability with the live runtime is best-effort and out of scope.

- **Risk:** `skipAutoPermissionPrompt` is renamed or removed in a future Claude Code release.
  → **Mitigation:** Failure mode is loud (a re-introduced permission prompt or an unrecognized-key warning), not silent. Detect and update the spec when it happens.

- **Trade-off:** Encoding key order in a spec couples the spec to a presentational concern. We accept this because the alternative — silent reshuffling — is worse for diff hygiene.
