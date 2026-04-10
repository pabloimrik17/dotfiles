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

**Implemented command** (after merge conflict resolution in `6a61140`):

```bash
bash -c 'export COLUMNS=200; plugin_dir=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/claude-hud/claude-hud/*/ 2>/dev/null | awk -F/ '"'"'{ print $(NF-1) "\t" $(0) }'"'"' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n | tail -1 | cut -f2-); exec "{{ .chezmoi.homeDir }}/.bun/bin/bun" --env-file /dev/null "${plugin_dir}src/index.ts"'
```

The original PR (#111) used an inline `COLUMNS=200` prefix on the bun invocation. A subsequent merge conflict resolution (`6a61140`) restructured the command to use version-sorted plugin resolution instead of time-sorted `ls -td`, while preserving the COLUMNS fix as `export COLUMNS=200;`.

**Rationale**: `export COLUMNS=200` at the start of the bash subshell sets the variable for the entire command, including the `exec`'d bun process. Functionally equivalent to the inline prefix approach.

## Risks / Trade-offs

- **[Upstream fix makes this redundant]** → Once jarrodwatts/claude-hud#404 is resolved, the `COLUMNS=200` prefix becomes dead weight. Mitigation: low-cost removal (single line edit), and the prefix is harmless if present after a fix.
- **[Hardcoded 200 may not suit all terminals]** → 200 is generous enough for any reasonable statusline. The plugin truncates output to fit, so overshooting is harmless.
