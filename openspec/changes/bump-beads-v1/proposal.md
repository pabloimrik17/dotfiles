## Why

Beads 0.62.0 → 1.0.3 is the only outdated brew package excluded from `bump-brew-deps` because it carries a one-way Dolt schema migration to v11, an upstream repo move (`steveyegge/beads` → `gastownhall/beads`), and a default-behavior change for `bd dolt push` (auto-push disabled). Bundling it with the rest of the brew bumps would block that proposal's archive on a higher-risk migration that runs across multiple machines on different days. Isolating it here lets the schema migration soak per-machine before archive, while also unlocking three features the user wants to adopt as habits: `bd batch` (atomic multi-op transactions), `bd config apply` (multi-machine drift remediation after `bd dolt pull`), and `bd ready --exclude-label` (filter out spike/wip issues).

## What Changes

### Brew upgrade

- `brew upgrade beads` from 0.62.0 → **directly to 1.0.3** (skip 1.0.0 and 1.0.1 which had a missing `started_at` column bug; 1.0.3 ships an automatic repair for installs that traversed those versions)

### Schema migration (one-way, automatic on first `bd` invocation per machine)

- Dolt schema migrates from current to **v11** which adds normalized `custom_statuses` and `custom_types` tables and promotes `spike`, `story`, `milestone` to first-class issue types
- **BREAKING (operational, not config)**: schema is one-way; rollback requires restoring a `.beads/` backup
- v1.0.3 includes the `started_at` column repair for installs upgrading from 0.62/0.63 directly

### Multi-machine sync routine (new capability)

- After every `bd dolt pull` on a machine, the user SHALL run `bd config apply` to remediate drift in three system-state domains: git hooks, Dolt remote URL (`federation.remote`), and Dolt server state (`dolt.shared-server`)
- This routine becomes the default cross-machine workflow once 1.0.3 is installed on every machine

### Auto-push opt-in decision

- `bd dolt push` auto-push is **disabled by default** in 1.0.3 (was enabled in 0.62)
- **Decision required after upgrade**: re-enable explicitly via beads config or accept the new explicit-push-only default

### Repo upstream move

- Beads upstream moves from `github.com/steveyegge/beads` → `github.com/gastownhall/beads`
- Homebrew formula and the `beads@beads-marketplace` Claude plugin both auto-redirect; no repo edits required

### `bd setup claude` semantics change (verification only)

- v1.0.0 made `bd setup claude` project-local by default and auto-runs in `bd init`
- v1.0.3 added `fix(setup): skip duplicate hooks when beads plugin is installed` — verifies that a stale global `bd setup claude` invocation does not duplicate hooks now that the `beads@beads-marketplace` plugin is installed
- Existing `claude-hooks` spec (`bd prime` on SessionStart and PreCompact) is **not affected** — `bd prime` is still the canonical name in 1.0+

### Adopt features unlocked by 1.0 (habits, no enforced spec)

- `bd batch` for bulk creates/edits from the Claude beads plugin
- `bd ready --exclude-label wip` (after labeling spikes/in-progress issues with `wip`)
- bd type `spike` for time-boxed exploration issues

### Rejected commands (verification only)

- `bd config set issue-prefix` is rejected in 1.0.3 — confirm no scripts or chezmoi templates invoke this; replacement is `bd rename-prefix`

## Capabilities

### New Capabilities

- `beads-multi-machine-sync`: Documents the `bd dolt pull` → `bd config apply` routine that converges hooks/remote/server state on the secondary machine after a config change pushed from another machine

### Modified Capabilities

_(none — `claude-hooks` already uses `bd prime` which is unchanged in 1.0; `cli-tool-expansion` already lists `beads` in `BREW_PACKAGES`; the upgrade is operational, not a requirement change)_

## Impact

### Affected files

_(no chezmoi-managed files changed — this proposal is operational + new spec)_

- `openspec/specs/beads-multi-machine-sync/spec.md` (new spec, created on archive)

### Affected systems

- Local Homebrew installation: `beads` formula upgraded
- Per-machine `.beads/` Dolt databases: schema v11 migration on first `bd` invocation post-upgrade
- Claude Code beads plugin: hooks may be re-installed cleanly via `bd init` (deduplication handled by 1.0.3 fix)
- Multi-machine sync routine: new manual step (`bd config apply`) added after every `bd dolt pull`

### Out of scope

- Re-enabling `bd dolt push` auto-push as a default (decision recorded in design.md, but adoption is per-user opt-in not enforced by this proposal)
- `bd config drift` as a routine command (only `apply` enters the routine; `drift` remains an informational diagnostic)
- bd `story` and `milestone` first-class types (overkill for solo single-user beads usage)
- Documentation updates to README.md / docs/manual.html (handled separately by `/docs:readme` and `/docs:manual`)
