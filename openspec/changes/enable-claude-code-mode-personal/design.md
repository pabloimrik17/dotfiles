# Design

## Context

See proposal.md, Why. Current state:

- `dot_claude/modify_settings.json.tmpl` overlays a MANAGED document onto the live `~/.claude/settings.json`. `env` is a MERGE_CONTAINER: keys added by hand survive, and keys the source stops declaring are not removed. Only `REMOVE` deletes them.
- MANAGED `env` declares only `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. The template has no conditional today: #271 dropped the darwin/arm64 superwhisper gate, which was the pattern to follow (the comma inside the conditional, and a negated condition in `REMOVE`).
- `machineType` (`personal` | `work`) comes from `.chezmoi.toml.tmpl`. Other templates read it as `get . "machineType" | default ""`.
- Existing tests render the template with `chezmoi execute-template --override-data` and run the merge on a temporary file (`tests/knowledge-base-settings.test.ts`). None of them checks `env`.
- Observed on the personal machine (2026-11-27, Claude Code 2.1.332, native build): the live file already carries the key by hand. An interactive session launched by AoE with the full managed plugin set runs with Code Mode on. `claude -p` with the key set finishes normally.

## Goals / Non-Goals

**Goals:**

- Personal machines get Code Mode from `chezmoi apply`. Work machines never keep it.

**Non-Goals:**

- A managed-settings `"0"` block on work. The task asks for absence, not an organization-level ban.
- A shell export. User settings already reach every launch path.
- Changing subagent `tools` lists or AoE profiles.

## Decisions

### D1. Gate on `machineType == "personal"`

The key renders only when `(get . "machineType" | default "") == "personal"`.

- Rejected: hostname, OS or arch. `machine-type-config` forbids inferring the role from host details, and both Macs are darwin/arm64.
- An unset machine type counts as not personal (fail closed).

### D2. Remove the key on every non-personal machine

`REMOVE` gets `("env", "CLAUDE_CODE_EXPERIMENTAL_CODE_MODE")` under the negated condition, as the template's own comment and the `claude-settings-merge` rule require.

- Rejected: omitting the key only. The work machine would keep a key added by hand forever, which is how 2026-11-19 started.
- Trade-off: you can no longer turn Code Mode on by hand on the work machine; the next apply removes it. For a one-off session, use `CLAUDE_CODE_EXPERIMENTAL_CODE_MODE=1 claude` in the shell.

### D3. Comma inside the conditional

`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` stays the last unconditional entry. The conditional emits `,` plus the new entry, so both renders are valid JSON. Whitespace trimming (`{{-`) must not join the comma to the wrong line. The merge program's `json.loads` would fail at apply time, and the tests run both renders.

### D4. User settings, not the shell

Claude Code reads the key from user settings, managed settings or the shell, never from project settings. `~/.claude/settings.json` is already chezmoi's file, and every launch reads it: an interactive terminal, AoE in tmux, autonomous attempts, and `claude -p` helpers. A zsh export would miss launches that do not start from zsh.

### D5. Blocker audit (for the PR)

Checked against the managed config (template, zsh config, the install script) and the docs at https://code.claude.com/docs/en/code-mode:

| Blocker | Status |
| --- | --- |
| `apiKeyHelper`, `ANTHROPIC_AUTH_TOKEN`, auth headers in `ANTHROPIC_CUSTOM_HEADERS` | Not set anywhere. `ANTHROPIC_API_KEY` exists only as a CI secret in `.github/workflows/pullfrog.yml`, and it is no blocker. |
| `CLAUDE_CODE_ENABLE_TELEMETRY`, OTel export, tracing, `DISABLE_TELEMETRY` | Not set. |
| Gateway, `ANTHROPIC_BASE_URL`, Bedrock, Vertex, Foundry | Not set. A first-party subscription. |
| Agent teams | Managed on, so Claude Code must be ≥ 2.1.326. Installed: 2.1.332. |
| Mods or plugins that hook tool calls | The managed `PreToolUse`/`PostToolUse` entries are AoE settings hooks, not mods. Live evidence: the managed plugin set runs in Code Mode (Context). |
| Model | Opus/Sonnet/Haiku 5.5 or Fable 5.2. AoE passes `--model opus`, and the observed session runs with Code Mode on. |
| Installation | Native build. Code Mode needs it. |
| `PreToolUse` hooks | Not a blocker. The managed hook sets no `onFailure`, so a hook that does not finish (timeout) gets the call refused. The hook exits 0 on every path, so the risk is low. |
| Agent teams in split panes | Not a blocker. Teammates in split panes start without Code Mode; in-process teammates keep it. |

Surfaces without Code Mode (`claude -p`, Agent SDK, VS Code, Desktop, cloud) fall back to normal tools. Observed for `claude -p`, which the autonomous plugin's helpers use. The docs do not say this for `-p` or the SDK.

## Risks / Trade-offs

- [Code Mode is experimental and may change or go away] → One managed key, removed by deleting the line. Claude Code falls back to normal tools whenever Code Mode cannot run.
- [A future plugin or mod turns it off] → Claude Code says why at startup and in `/status`. It is no apply failure, and the manual names `/status`.
- [Chrome, computer use and Remote Control are gone on personal] → Accepted by the task. The manual points to Playwright or chrome-devtools MCP.
- [A session that ran in Code Mode resumes only with Code Mode on] → Applies to personal sessions only, because work never had the key except on 2026-11-19.

## Migration Plan

- Personal: `chezmoi apply`. The key is already live, so the diff shows no Code Mode line.
- Work: `chezmoi diff ~/.claude/settings.json` shows no Code Mode change.
- Rollback: revert the commit. On personal, the key then stays until it is deleted by hand, because `env` is a merge container.

## Assumptions (AFK)

- An unset `machineType` counts as not personal (D1).
- The work machine's live file has no Code Mode key today, based on the task's history (2026-11-19). If a key turns up there, D2 removes it, and `chezmoi diff` shows that removal once.
- The manual is the only doc that lists managed Claude settings. README lists tools, not settings, so it is unchanged.
- No ADR or glossary entry: one gated key that follows an existing pattern.
