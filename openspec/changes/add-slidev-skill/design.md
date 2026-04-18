## Context

This dotfiles repo provisions external agent skills through `skills.sh` during machine setup. The existing capability `skills-global-install` declares a single group in `run_onchange_install-packages.sh.tmpl` (Group 9, around lines 952–999) that installs ten skills from `vercel-labs`, `anthropics`, and related sources, each via the helper `install_skill <repo> <name>` that expands to `npx -y skills add <repo> --skill <name> -g -y`. The helper is idempotent (consults `npx -y skills list -g --json` up-front), gated by a user confirmation, and tolerates individual failures via an error counter.

Empirical check during exploration: `skills.sh` stores skill payloads in `~/.agents/skills/<name>/` and symlinks per-agent. On this machine, all ten current skills symlink into `~/.claude/skills/` but **not** into `~/.config/opencode/skills/` — meaning the current command's default agent resolution covers Claude Code but not OpenCode. That asymmetry is accepted: DOT-3 is the sibling ticket that addresses OpenCode separately.

**Mid-implementation revision:** an earlier draft of this design argued for an explicit `--agent claude-code` flag on the Slidev install, with the helper extended to accept an optional third `<agent>` argument. When we executed that path we observed that `skills.sh` handles agent-scoped installs differently from default installs: instead of staging under `~/.agents/skills/` and symlinking, it writes the skill directly into `~/.claude/skills/slidev/`. That diverges from the uniform layout of the other ten skills, bypasses the shared store that `skills.sh update -g` uses, and produces the opposite of the "reads-more-precisely" benefit the flag was meant to deliver. We reverted: Slidev uses the same two-argument `install_skill <repo> <name>` call as the other ten skills, and the helper was restored to its two-argument form. DOT-3 will decide its own shape for OpenCode (likely `--agent opencode`) without needing symmetry on the Claude side.

Linear ticket DOT-2 scopes the work to Claude Code. DOT-3 is the sibling ticket for OpenCode and is out of scope here.

## Goals / Non-Goals

**Goals:**

- Make the Slidev skill available globally to Claude Code on every fresh `chezmoi apply`.
- Keep the install idempotent, failure-tolerant, and non-destructive to chezmoi-managed files, on par with the existing ten-skill pattern.
- Use the same call shape as the existing ten skills — one fewer variant to maintain, uniform layout under `~/.agents/skills/`.
- Preserve parity on non-macOS (manual-instructions branch gets the Slidev command too).

**Non-Goals:**

- Installing the Slidev skill into OpenCode. That is DOT-3's scope and will require either widening the `--agent` flag or vendoring the skill into `.opencode/skills/` — a decision best made in that ticket's design.
- Adding any Slidev CLI (`@slidev/cli`), npm package, brew formula, or shell alias.
- Modifying the existing `skills-global-install` capability. Its ten skills and their behavior stay untouched.
- Auto-updating the skill. `skills.sh update` is already a separate workflow the user runs manually.
- Retrofitting the existing ten skills with explicit `--agent` flags. Their implicit default resolution is already battle-tested.

## Decisions

### Decision 1: New capability `slidev-skill-install`, not a delta on `skills-global-install`

The user explicitly requested a separate spec. A dedicated capability also lets the Slidev-specific OpenCode-deferred note live in its own requirements block without touching the generic ten-skill list. When DOT-3 lands, it can either extend this capability or introduce its own OpenCode counterpart cleanly.

**Alternative considered:** Delta-add Slidev to `skills-global-install` (one-line change). Rejected to respect the user's separation preference and to keep the OpenCode-deferred note scoped.

### Decision 2: Use the same two-argument `install_skill <repo> <name>` shape as the other ten skills

The Slidev install uses `install_skill "slidevjs/slidev" "slidev"` — identical in shape to the existing ten calls. No `--agent` flag, no helper extension, no dedicated comment.

**Rationale:**

1. **Uniform layout.** Default-scope installs stage under `~/.agents/skills/<name>/` with a symlink at `~/.claude/skills/<name>`. Every current skill follows this layout, and `skills.sh update -g` manages them uniformly. An agent-scoped install bypasses the shared store and produces a direct directory under `~/.claude/skills/`, which is a regression in consistency.
2. **Same user-visible outcome.** On this machine, default resolution already targets Claude Code only (no OpenCode symlink is created), so the explicit flag adds nothing functional.
3. **Less code.** No third helper argument, no branching, no explanatory comment. The diff is one call that reads exactly like the others.
4. **DOT-3 independence.** OpenCode support can add its own explicit `--agent opencode` call (or a vendored copy) without needing the Claude side to be explicit for symmetry. Asymmetry on the OpenCode side is a fact of this machine; pretending otherwise on the Claude side costs maintenance without gain.

**Alternative considered:** Explicit `--agent claude-code` with a helper extension. Rejected — see Context revision above. The behavior we observed (direct directory, no shared-store entry) made the "explicit-reads-better" argument moot because the resulting layout is worse than the uniform pattern.

### Decision 3: Idempotency uses the same `skills list -g --json` lookup as Group 9

The existing Group 9 caches `skills list -g --json` at the top of the block and each `install_skill` call greps that cache. The Slidev install reuses that same cache (no separate query), which means it must be placed **inside** Group 9's `if confirm … ; then … fi` block rather than as a new Group. This keeps one confirmation prompt, one cache, and one error counter.

**Alternative considered:** Standalone Group 10 for Slidev. Rejected — adds a second user prompt for a single skill, which is friction without benefit.

### Decision 4: Non-macOS branch gets the literal command (not a reference)

The macOS failure/manual block (lines 1048+) lists each skill install verbatim. Slidev's line mirrors that: `npx -y skills add slidevjs/slidev --skill slidev -g -y`. Copy-paste instructions win over indirection.

### Decision 5: Documentation updates are proposed, not forced

The spec does not require a README or manual change. Instead, the tasks file instructs the implementer to run the `update-readme` and `update-manual` skills, which evaluate whether an update is warranted and surface proposals to the user. This respects those skills' own trigger criteria ("adding a new tool to setup" for README, "CLI tool configuration change" for manual) without double-prescribing.

## Risks / Trade-offs

- **[Risk] `slidevjs/slidev` repo layout changes could break `--skill slidev` resolution** → _Mitigation:_ `skills.sh add` fails loudly; the existing error counter lets the rest of Group 9 continue. User re-runs after upstream fix.
- **[Risk] OpenCode users on this machine miss the skill until DOT-3 ships** → _Accepted._ DOT-3 is the dedicated ticket; conflating scopes would defeat the separation the user asked for.
- **[Trade-off] No explicit agent scope in the code** → _Accepted._ Implicit resolution matches the existing ten skills and produces the canonical `skills.sh` layout; the explicit-flag variant proved to break that layout in practice.

## Migration Plan

No migration needed — this is additive. Rollback: revert the change; `skills.sh remove slidev -g -y` cleans the existing install.

## Open Questions

None blocking. Post-implementation, reconsider whether the ten existing skills (and Slidev) should eventually gain explicit `--agent` flags once `skills.sh` behavior for agent-scoped installs becomes uniform with default installs — tracked separately, not in this change.
