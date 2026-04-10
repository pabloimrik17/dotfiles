## Context

The `dot_claude/settings.json.tmpl` chezmoi template defines the `statusLine.command` that Claude Code uses to invoke the claude-hud plugin. The plugin runs as a subprocess where `process.stdout.columns` is unavailable, causing it to fall back to 40 characters and wrap the output across multiple lines. Setting `COLUMNS=200` in the command's environment fixes the wrapping.

Currently the template does not include `COLUMNS=200`, so every `chezmoi apply` reverts the manual fix.

## Goals / Non-Goals

**Goals:**

- Persist the `COLUMNS=200` workaround in the chezmoi template so it survives `chezmoi apply`
- Minimal, single-line change to `dot_claude/settings.json.tmpl`

**Non-Goals:**

- Fixing the upstream plugin (tracked at jarrodwatts/claude-hud#404)
- Changing the claude-hud plugin configuration or thresholds
- Modifying any other chezmoi-managed settings

## Decisions

### Inject COLUMNS=200 via bash -c wrapper

**Choice**: Prefix the bun invocation with `COLUMNS=200` inside the existing `bash -c` wrapper.

**Current command**:

```bash
bash -c '"{{ .chezmoi.homeDir }}/.bun/bin/bun" "$(ls -td ~/.claude/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null | head -1)src/index.ts"'
```

**New command**:

```bash
bash -c 'COLUMNS=200 "{{ .chezmoi.homeDir }}/.bun/bin/bun" "$(ls -td ~/.claude/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null | head -1)src/index.ts"'
```

**Rationale**: This is the simplest approach — a single environment variable prefix. It requires no extra shell wrapper, no chezmoi template logic, and matches the exact workaround documented in the issue.

**Alternative considered**: Using `env COLUMNS=200 ...` — functionally identical but more verbose; the bash inline variable assignment is idiomatic and shorter.

## Risks / Trade-offs

- **[Upstream fix makes this redundant]** → Once jarrodwatts/claude-hud#404 is resolved, the `COLUMNS=200` prefix becomes dead weight. Mitigation: low-cost removal (single line edit), and the prefix is harmless if present after a fix.
- **[Hardcoded 200 may not suit all terminals]** → 200 is generous enough for any reasonable statusline. The plugin truncates output to fit, so overshooting is harmless.
