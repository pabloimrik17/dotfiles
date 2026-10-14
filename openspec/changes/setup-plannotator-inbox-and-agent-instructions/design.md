# Design

## Context

See [proposal.md](proposal.md) for motivation and scope. Read-only discovery on 2026-10-14 found:

| Surface | Observed state | Consequence |
| --- | --- | --- |
| Plannotator | `0.28.19`, absolute binary under `~/.local/bin`; Inbox help has the required guide marker | No installation or upgrade is needed on this machine today |
| Inbox | `inbox/inbox.json` exists | Previously initialized; this is not proof of current process health or successful reply delivery |
| Codex | `codex mcp get plannotator-inbox --json` reports the correct enabled stdio entry | Live registration is already satisfied; bootstrap still lacks reproducibility |
| Plannotator config | `inboxTool.opencode` is true | Preserve it; add a default for fresh machines |
| Claude Code | Version `2.1.299`; repo enables `plannotator@plannotator` | Reuse native integration, verify actual tool discovery during onboarding |
| OpenCode | Repo includes `@plannotator/opencode@latest` with the OpenCode 1 `plugin` key | No package or schema migration is necessary for this change |
| Junie | Merge template manages DeepWiki, JetBrains and Linear only | Add one stdio entry to this existing surface |
| Repository instructions | `AGENTS.md` and `CLAUDE.md` are identical regular files | Keep one body and one compatibility import |
| User instructions | No managed user `CLAUDE.md`, and no live `~/.claude/CLAUDE.md` | No user instruction body currently needs migration |
| Existing notes | `~/.codex/AGENTS.md` and `~/.claude/rules/plannotator-inbox.md` contain upstream marked notes, unmanaged by chezmoi | Preserve runtime ownership and existing text |

The existing installer Group 7 only checks PATH and runs the installer without arguments. `_update_extra_plannotator` already downloads the installer into a temporary file and runs it. Existing Codex reconciliation only handles HTTP servers. Junie's merge script buffers validated JSON and preserves unrelated keys. Tests in `tests/install-script.test.ts` use rendered templates and isolated command stubs.

## Goals / Non-Goals

**Goals:** Keep configuration reproducible while treating Inbox conversations, human consent and instruction-note edits as runtime state. Prove first-message delivery separately from configuration correctness. Keep changes narrow enough to coexist with the pending Sentry and PostHog work.

**Non-Goals:** Implement an alternative Inbox service, add a launch agent, connect every detected editor, copy conversations into Git, manage all Codex settings, migrate OpenCode versions, or create a new shared global instruction hierarchy where none exists.

## Decisions

### 1. Capability-based installation and one update path

Resolve `command -v plannotator`, then the executable at `$HOME/.local/bin/plannotator`; retain an absolute path. Run version and Inbox help checks without starting a server. Use the successful help marker as the compatibility test rather than pinning the observed version. Distinguish a release without Inbox support from a permissions or execution error.

For missing/old installations, reuse Group 7's consent and reporting pattern. Download `https://plannotator.ai/install.sh` to a temporary file and invoke `bash <file> --non-interactive`; append `--skip-skills` only without git. This retains the official installer while making its failure observable before execution. Verify the installed CLI afterward. Change the existing update helper to use the same arguments and preserve its failure propagation.

Classification remains **manual**: the existing `update-extra` step is sufficient. No brew formula, Renovate pin or new updater is introduced. Simply running the upstream install prompt on this host would not fix reproducibility in the repository.

### 2. Concrete agent parity

**Claude Code — existing integration, verify at runtime.** Source surfaces: `CC_MARKETPLACES`/`CC_PLUGINS` and `dot_claude/modify_settings.json.tmpl`. Retain `plannotator@plannotator`; add no `MCP_STDIO_SERVERS` entry. Its native tool requires a compatible interactive Claude session (the installed guide names 2.1.287+ on macOS/Linux). Document stdio as a fallback for unsupported host sessions, without registering both paths automatically.

**Codex — proposed bootstrap, already satisfied locally.** Surface: the install script driving runtime-owned `codex mcp`. Add a narrowly scoped stdio reconciliation path alongside the HTTP module, not a fake HTTP declaration. Inspect JSON first; for an absent entry, run `codex mcp add plannotator-inbox -- <absolute-binary> inbox mcp` within the existing confirmation pattern, then verify it. Matching entries are no-ops. Disabled entries, differing commands/transports and invalid discovery output are preserved and reported. Do not manage `dot_codex/config.toml`, remove entries or change tool permissions.

**OpenCode — existing plugin plus default activation.** Surface: existing `dot_config/opencode/opencode.jsonc` plugin registration and a new `dot_plannotator/modify_config.json` script. Use the existing plugin and default only the absent `inboxTool.opencode` preference. Preserve scalar `inboxTool: true/false`, explicit per-host values and all unrelated keys. Buffer and validate output using the repo's merge-script pattern; malformed input fails without replacing the live file. Missing `uv` follows the existing prerequisite passthrough convention and is reported, not called a successful activation. After Inbox has run once, restart OpenCode to discover the tool. No duplicate `mcp.plannotator-inbox` entry is added.

**Junie — proposed configuration, supported stdio transport.** Surface: `dot_junie/mcp/modify_mcp.json.tmpl`, targeting `~/.junie/mcp/mcp.json`. Add an absent `mcpServers.plannotator-inbox` object with `command: <absolute-binary>` and `args: ["inbox", "mcp"]`. Resolve the binary at apply time; do not hardcode this user's home or rely on a GUI PATH. Preserve matching entries with their extra options, conflicting entries, unrelated values and any client-owned disabled state. Missing/incompatible Plannotator skips only this addition with a visible warning. Preserve the existing merge failure contract. Verify tools through Junie's `/mcp` in a new session; JetBrains AI Assistant settings are a separate surface and are not substituted for Junie settings.

Add one Inbox parity row covering these four integrations, and note the separate instruction-discovery/notes situation. Native delivery and MCP polling are different capabilities: Codex/Junie poll, OpenCode 1 polls, supported native Claude/OpenCode 2 sessions receive replies automatically. Do not upgrade OpenCode just to gain automatic delivery.

### 3. AGENTS.md is canonical; user-scope migration is conditional on actual files

For this repository, retain the existing Bun policy in `AGENTS.md` and replace root `CLAUDE.md`'s duplicated body with `@AGENTS.md`. This is the reviewable default proposed after asking about compatibility; it is not recorded as an explicit user choice. Current Claude Code supports native AGENTS discovery, but an import also works for older versions, a disabled built-in AGENTS plugin, or CLAUDE-only instruction selection. Both root files remain excluded by `.chezmoiignore.tmpl`.

Do not turn this into an indiscriminate search/rename across home, plugin caches, external skills or archived OpenSpec documents. The managed-source inventory is the migration boundary. No managed user body exists now. Recheck before apply to catch changes since planning; if one appears, preserve all content, use a same-scope canonical `AGENTS.md`, and retain a documented host entry point. Conflicting content requires a decision, not overwrite.

Global discovery differs by host: Codex uses its home `AGENTS.md` unless overridden; OpenCode uses `~/.config/opencode/AGENTS.md` ahead of the Claude fallback; Junie CLI supports `~/.junie/AGENTS.md`; Claude's documented global entry point remains `~/.claude/CLAUDE.md` or rules. A user-level canonical AGENTS body therefore needs a verified adapter for Claude, not just a filename change. No such global tree is introduced when there is nothing to migrate.

### 4. Let Plannotator own its instruction notes

User-scope notes are deliberately not dotfiles templates. This preserves edited notes and prevents a later apply from recreating a note removed through Inbox Settings. Current guide targets on this machine:

| ID | Path / status |
| --- | --- |
| `claude-code` | `~/.claude/rules/plannotator-inbox.md`, existing marked section |
| `codex` | `~/.codex/AGENTS.md`, existing marked section |
| `gemini` | `~/.gemini/GEMINI.md`, would create a file; outside managed agent scope |
| `pi` | `~/.pi/agent/AGENTS.md`, would create a file; outside managed agent scope |
| `opencode` | No current target; guide refuses to create a new AGENTS file that could hide the Claude fallback |
| Junie | No supported `--notes` ID; MCP works, automatic note installation is a documented gap |

At onboarding, refresh this list from the installed guide and ask only for missing notes the user wants. Existing notes need no rewrite. Never invent a Junie note ID or create an OpenCode file merely to make `--notes` accept it. Authoring a future user instruction file is a separate scoped change, not evidence that it already exists.

### 5. Explicit onboarding and delivery check

Keep onboarding as a documented agent-led workflow, not a shell routine that blocks `chezmoi apply` on human replies. The active host is Codex in this session.

After configuration, re-read the installed guide, start with `plannotator inbox --background`, then open with `PLANNOTATOR_INBOX_CONNECT=0 plannotator inbox`. The scoped environment override intentionally suppresses broad editor auto-connection; the selected four integrations are handled above. It does not persist a global opt-out. Offer the printed URL when a browser is unavailable.

Use the upstream first-message subject/body and host-scoped idempotency key. Prefer the native tool; otherwise write one-line JSON-RPC through a file-writing API to a unique temporary file and feed it to `<absolute-binary> inbox mcp` from the project folder. Pass a stable `agent_session` for shell calls because generic MCP processes otherwise have different session identities. Retain the returned thread ID and cursor. Never treat a JSON-RPC error as delivery.

Reuse an existing first thread when the idempotency key was already used. Poll in calls of at most 45 seconds on Codex; after about five minutes record the handshake as pending. On a real reply, quote it and resolve the initial thread. If the user selected yes, send one or two relevant project artifacts/questions with context and attachments; if no, stop. For native automatic delivery, yield instead of polling. A successful static check is not evidence that a person replied.

### 6. Documentation changes are specific

- **README, What's Included:** add `[Plannotator](https://plannotator.ai/)` under AI Tooling with description `Local plan/code reviews and an async Inbox for agent questions and files`.
- **README, setup:** add a short `plannotator inbox` onboarding step, new-session requirement, and a link to the manual workflow; no screenshot change is required.
- **Manual section 11:** add a `Plannotator Inbox` subsection covering open/background/help commands, native Claude tool, note consent, notifications and local data. Keep upstream command names that genuinely refer to CLAUDE.md; explain the repo's canonical AGENTS import rather than globally replacing names in prose.
- **Manual section 12:** describe plugin activation via `inboxTool.opencode`, restart after first Inbox start, and the OpenCode 1 polling limitation.
- **Manual sections 13–14:** add stdio command/args, registration ownership, restart, `wait_for_reply`, and no-Junie-note-installer distinction. Clarify that Codex MCP is runtime-owned even if instruction files are discussed separately.
- **Manual update-extra row:** retain the existing Plannotator step and describe its non-interactive installer. Preserve sections/numbering and existing HTML conventions.
- **Parity table:** add Inbox transport/delivery row and instruction discovery/note ownership row; no blank agent cells.

## Risks / Trade-offs

- **Upstream installer side effects** → Use documented non-interactive flags, review its current behavior during apply, preserve existing connections and report side effects. No direct execution during proposal creation.
- **chezmoi file/script ordering on a fresh host** → Junie's merge may run before Group 7 installs the binary. Skip only the missing Inbox entry, report it, and perform a targeted second apply after installation; verify convergence on the second pass.
- **User-selected opt-outs differ from defaults** → Preserve explicit false/disabled values and describe the resulting inactive host; do not silently declare all hosts active.
- **Native plugin prerequisites drift** → Treat the installed guide as authoritative and verify in fresh sessions. Do not claim native discovery from enabled-plugin configuration alone.
- **A compatibility import retains the CLAUDE filename** → It removes duplicate maintenance while supporting older host modes; the proposal makes this distinction explicit for review.
- **Another change touches MCP/docs** → Keep deltas additive and preserve Sentry/PostHog entries and all existing permission policies.

## Migration Plan

1. Implement and test repository changes without mutating live state. Reconcile current instruction content before replacing the duplicate body.
2. Render installer/templates and inspect targeted chezmoi diffs; run focused Bun behavior tests in temporary homes.
3. During the apply workflow, deploy the selected configuration and run the existing installer groups. Reapply the Junie target after binary installation if initially skipped.
4. Perform explicit onboarding, note selection and the real reply check; record configuration success separately from pending human verification.
5. To roll back source changes, restore the previous tracked templates and duplicate instruction file if needed. Previously added runtime connections remain until explicitly changed by the user; do not run uninstall, stop processes, delete notes or purge Inbox data as rollback automation.

## Evidence

- Local evidence: `plannotator --version`, complete `plannotator inbox --help`, `codex mcp get plannotator-inbox --json`, `codex mcp add --help`, `claude --version`, selected configuration keys and managed-file inventory; checked 2026-10-14.
- [Inbox overview and setup](https://plannotator.ai/inbox/) and the user-provided upstream setup prompt.
- [Claude instruction discovery and compatibility imports](https://code.claude.com/docs/en/memory#agentsmd).
- [Codex global and project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- [OpenCode rules and precedence](https://opencode.ai/docs/rules/).
- [Junie MCP configuration](https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html) and [global guidelines](https://junie.jetbrains.com/docs/guidelines-and-memory.html).
