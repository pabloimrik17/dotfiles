## Context

This dotfiles repo provisions external agent skills through `skills.sh` during machine setup. The existing capability `skills-global-install` declares a single group in `run_onchange_install-packages.sh.tmpl` (Group 9, around lines 952–999) that installs ten skills from `vercel-labs`, `anthropics`, and related sources, each via the helper `install_skill <repo> <name>` that expands to `npx -y skills add <repo> --skill <name> -g -y`. The helper is idempotent (consults `npx -y skills list -g --json` up-front), gated by a user confirmation, and tolerates individual failures via an error counter.

Empirical check during exploration: `skills.sh` stores skill payloads in `~/.agents/skills/<name>/` and symlinks per-agent. On this machine, all ten current skills symlink into `~/.claude/skills/` but **not** into `~/.config/opencode/skills/` — meaning the current command's default agent resolution covers Claude Code but not OpenCode. That asymmetry is load-bearing for this design.

Linear ticket DOT-2 scopes the work to Claude Code. DOT-3 is the sibling ticket for OpenCode and is out of scope here.

## Goals / Non-Goals

**Goals:**

- Make the Slidev skill available globally to Claude Code on every fresh `chezmoi apply`.
- Keep the install idempotent, failure-tolerant, and non-destructive to chezmoi-managed files, on par with the existing ten-skill pattern.
- Make the Claude-Code-only scope **explicit in the implementation**, not implicit via skills.sh defaults — so the intent is readable and DOT-3 can add an OpenCode counterpart symmetrically.
- Preserve parity on non-macOS (manual-instructions branch gets the Slidev command too).

**Non-Goals:**

- Installing the Slidev skill into OpenCode. That is DOT-3's scope and will require either widening the `--agent` flag or vendoring the skill into `.opencode/skills/` — a decision best made in that ticket's design.
- Adding any Slidev CLI (`@slidev/cli`), npm package, brew formula, or shell alias.
- Modifying the existing `skills-global-install` capability. Its ten skills and their behavior stay untouched.
- Auto-updating the skill. `skills.sh update` is already a separate workflow the user runs manually.

## Decisions

### Decision 1: New capability `slidev-skill-install`, not a delta on `skills-global-install`

The user explicitly requested a separate spec. Rationale beyond that preference: Slidev has an **explicit agent scope** (`claude-code` only until DOT-3 lands) that differs from the ten-skill block, which relies on `skills.sh`'s default agent resolution. Co-locating them would either force the ten-skill block to declare an explicit agent (churn, not this ticket's job) or leave Slidev's scope implicit (losing the benefit of separation). A dedicated capability captures the Slidev-specific requirement — explicit `--agent claude-code` — without contaminating the generic list.

**Alternative considered:** Delta-add Slidev to `skills-global-install` (one-line change). Rejected because it hides the agent-scope distinction and would need a second delta the moment DOT-3 is implemented.

### Decision 2: Install with explicit `--agent claude-code`

Use `npx -y skills add slidevjs/slidev --skill slidev --agent claude-code -g -y` rather than the default-resolution form. Two reasons:

1. The spec reads more precisely — "Slidev is installed for Claude Code" maps to code that says exactly that.
2. DOT-3 will mirror this with `--agent opencode`; explicit scoping on both sides makes the pair reviewable at a glance.

**Alternative considered:** Reuse the existing `install_skill` helper unchanged (which omits `--agent`) for uniformity with the ten-skill block. Rejected for the reasons above; the cost is introducing a second call shape, but the second shape is documentation-in-code for a real scope difference.

**Implementation shape (deferred to apply):** Either (a) extend `install_skill` to accept an optional third `<agent>` argument (preferred — backward-compatible, reuses idempotency check and error handling), or (b) add a dedicated `install_skill_for_agent` helper. The spec does not mandate either shape; it only requires the end-effect and the `--agent claude-code` flag in the executed command.

### Decision 3: Idempotency uses the same `skills list -g --json` lookup as Group 9

The existing Group 9 caches `skills list -g --json` at the top of the block and each `install_skill` call greps that cache. The Slidev install reuses that same cache (no separate query), which means it must be placed **inside** Group 9's `if confirm … ; then … fi` block rather than as a new Group. This keeps one confirmation prompt, one cache, and one error counter.

**Alternative considered:** Standalone Group 10 for Slidev. Rejected — adds a second user prompt for a single skill, which is friction without benefit.

### Decision 4: Non-macOS branch gets the literal command (not a reference)

The macOS failure/manual block (lines 1048+) lists each skill install verbatim. Slidev's line mirrors that: `npx -y skills add slidevjs/slidev --skill slidev --agent claude-code -g -y`. Copy-paste instructions win over indirection.

### Decision 5: Documentation updates are proposed, not forced

The spec does not require a README or manual change. Instead, the tasks file instructs the implementer to run the `update-readme` and `update-manual` skills, which evaluate whether an update is warranted and surface proposals to the user. This respects those skills' own trigger criteria ("adding a new tool to setup" for README, "CLI tool configuration change" for manual) without double-prescribing.

## Risks / Trade-offs

- **[Risk] Non-uniform call shape inside Group 9** (ten default-scope calls + one explicit-scope call) → _Mitigation:_ comment in the install script above the Slidev line explains why the scope is explicit; design.md (this file) preserves the rationale long-term.
- **[Risk] `slidevjs/slidev` repo layout changes could break `--skill slidev` resolution** → _Mitigation:_ `skills.sh add` fails loudly; the existing error counter lets the rest of Group 9 continue. User re-runs after upstream fix.
- **[Risk] OpenCode users on this machine miss the skill until DOT-3 ships** → _Accepted._ DOT-3 is the dedicated ticket; conflating scopes would defeat the separation the user asked for.
- **[Trade-off] Specless alternative — a one-line delta on `skills-global-install`** would have been ~5 minutes of work but would lose the scope-explicit documentation and force a second delta later.

## Migration Plan

No migration needed — this is additive. Rollback: revert the change; `skills.sh remove slidev -g -y` cleans the existing install.

## Open Questions

None blocking. Post-implementation, reconsider whether the ten existing skills should also gain explicit `--agent` flags (tracked separately, not in this change).
