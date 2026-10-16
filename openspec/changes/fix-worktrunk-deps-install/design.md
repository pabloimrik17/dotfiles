# Design

## Context

See `proposal.md` for motivation and `specs/worktrunk-config/spec.md` for the behavior contract. The current multiline TOML hook invokes each package manager without checking its status and finishes with an unconditional echo. `dot_zshrc.tmpl` seeds PATH with the highest installed nvm Node; the hook has no project-specific override.

The Claude launcher at `dot_local/bin/shims/executable_claude` already normalizes `.nvmrc` and resolves installed numeric versions. Its PATH changes affect only its own process tree, so they cannot fix this independent post-start hook. The manual explicitly describes post-start as background and non-blocking. Existing Bun subprocess tests provide temporary-directory and executable-stub patterns; CI runs `bun test` on macOS.

The main spec conflicts internally: its no-JS scenario requires a silent exit while its phase-marker requirement mandates no-op diagnostics. The implementation already prints diagnostics. This delta explicitly keeps those diagnostics and reserves `done` for an actual successful install.

## Goals / Non-Goals

**Goals:** Keep the fix self-contained in the managed hook, retain portable shell syntax, expose actual outcomes, and exercise the deployed hook body rather than a test-only copy.

**Non-Goals:** Change the Claude launcher, install Node or package managers automatically, resolve nvm aliases, infer Node from `engines`, search nested projects, change lockfile support, or make dependency installation block worktree creation or agent startup.

## Decisions

### Resolve installed numeric Node versions inline

For a recognized lockfile, read the root `.nvmrc` as data, trim surrounding whitespace/CR, and remove one leading `v`. Accept numeric major, major.minor, and major.minor.patch forms. Resolve from `${NVM_DIR:-$HOME/.nvm}/versions/node`: exact pins must match exactly; partial pins select the highest matching installed numeric version with executable `bin/node`, using version ordering rather than lexical ordering. Quote directory paths, including custom nvm locations containing spaces. Prepend the selected bin directory before checking package-manager availability and log the selected version.

Adapt the launcher's small fast path without extracting a shared helper: the launcher has broader traversal and cold-install responsibilities, and changing its deployment/test contract would enlarge this fix. Validate numeric components before constructing candidate patterns so aliases and malformed values do not act as globs. No `.nvmrc` or a whitespace-only file leaves PATH unchanged. A nonempty unsupported or unavailable pin warns and uses ambient PATH; this compatibility choice follows the issue discussion and leaves the install command responsible for engine validation. No `nvm.sh` loading or Node download occurs.

Alternatives: a literal `v$(cat .nvmrc)` path misses prefixed/partial pins and CRLF; sourcing nvm adds startup work and permits automatic environment changes; failing on every unresolved pin would prevent otherwise compatible installs.

### Handle install exit status explicitly

Retain Bun > pnpm > npm precedence and existing install commands. Capture the exit status immediately on failure, print a prefixed message naming the package manager and status to stderr, and exit with that same status. Explicit checks are preferable to relying solely on `set -e`, which makes shell conditional behavior harder to audit. Preserve install stdout/stderr for diagnosis.

Reach `[install-deps] done` only after an install returns zero. No recognized lockfile produces a detection/skip log and exit zero. An unavailable selected manager warns and exits zero without trying a lower-priority manager. These paths must not fall through to `done`. Correct the adjacent `[post-start].deps` comment to reference `install-deps`.

### Test observable subprocess behavior from the TOML source

Add `tests/worktrunk-install-deps.test.ts`. Parse the real configuration with Bun's TOML support and retrieve the `install-deps` entry from the post-start array. Execute that decoded command in `/bin/sh` with a temporary worktree, isolated HOME/NVM_DIR and a controlled PATH. Stub package managers capture their arguments and child Node selection, optionally create a dependency sentinel, and return configurable statuses. Stub Node binaries identify their version. Do not run real package-manager installs in these tests.

Cover normalized exact pins, numeric ordering for major/minor pins, custom/default nvm homes, paths with spaces, unavailable/unusable versions, unsupported aliases, absent/empty `.nvmrc`, and successful/failing fallback. Assert package-manager selection and exact nonzero exit propagation for all three managers, marker order, skipped cases, and lockfile precedence. Include a pnpm stub that rejects ambient Node 24 but accepts selected 22.21.0 and creates a `node_modules` sentinel. This is a regression test for environment propagation, not a substitute for the real eci-av acceptance check.

### Proposed manual update

Section 5's Hooks table currently describes post-start only as installing dependencies in the background. Replace that row with the following concrete content during implementation, subject to the `update-manual` skill's confirmation rule if not already authorized by the user's apply request:

```html
<tr>
    <td>post-start</td>
    <td>
        Installs deps via the detected package manager using an installed Node
        matching the root <code>.nvmrc</code> when available (background &mdash;
        non-blocking). Unresolved pins warn and use ambient Node. Check
        <code>wt wtlog user:post-start:install-deps</code> for progress:
        <code>done</code> means installation succeeded; skips and failures are
        logged separately.
    </td>
</tr>
```

Follow the file's surrounding indentation when applying. The existing `wt wtlog` row already documents log access and needs no separate change. README and tool-update classification are unaffected because no tool is added, removed, or upgraded.

## Risks / Trade-offs

- A package-manager wrapper can hardcode another Node executable → inspect actual selected Node and install outcome in the real pnpm acceptance run; PATH selection alone cannot rewrite external wrappers.
- Missing numeric versions or alias pins still use ambient Node → warning plus truthful failure logging makes this visible; automatic provisioning stays outside this fix.
- Shell quoting inside TOML can corrupt the deployed command → parse and execute the actual TOML string in regression tests.
- Version ordering must work on the supported macOS environment → exercise major/minor selection in the existing macOS CI test job.
- Background execution can race an agent launch → documentation must tell users to wait for a successful log outcome; this change does not add a readiness barrier.
- Local duplication of the resolver can diverge from the launcher → keep the limited supported forms explicit and covered by tests.

## Migration Plan

After implementation and checks, apply the managed Worktrunk config through the normal chezmoi workflow. There is no data migration or worktree relocation. Confirm the effective hook with `wt config show` and that config migration proposes no changes. Roll back by reverting the hook/manual change and reapplying the managed config; existing dependency directories remain untouched.

For integration acceptance, use a disposable eci-av worktree with its required Node already installed and ambient Node 24. Wait for the background hook to finish, verify populated dependencies and the selected-version/success log, then test a forced install failure in an isolated fixture with a manager stub returning a known status. Never remove a real installed Node to manufacture failure. Smoke-check representative Bun projects (iot, recupera, grupo) when available, recording any unavailable projects as validation limitations. Inspect how the installed Worktrunk surfaces background failure without assuming the foreground `wt switch` returns the hook's status.
