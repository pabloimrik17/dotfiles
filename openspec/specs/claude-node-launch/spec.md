# claude-node-launch Specification

## Purpose

A PATH shim named `claude` that resolves the project's Node version from `.nvmrc` (walk-up, then a repo-anchored walk-down) and launches the real `claude` under it via PATH-prepend, so claude and its subprocesses run on the project's pinned Node regardless of launcher (`wsc`/`wsh`, gh-dash `-x claude`, AoE, or a typed `claude`). Steady state never sources nvm; a cold/alias fallback sources nvm only when a pinned version isn't installed yet or the `.nvmrc` is an alias form.

## Requirements

### Requirement: Shim shadows `claude` on PATH and delegates to the real binary

A chezmoi-managed executable named `claude` SHALL be installed in a directory that appears on `$PATH` before the real Claude binary (`~/.local/bin/claude`). The shim SHALL invoke the real binary by absolute path so it never re-invokes itself, and SHALL preserve its exit status. Arguments SHALL be forwarded unchanged except for removing the matching initial review instruction when explicitly resuming a registered gh-dash review, as defined below.

#### Scenario: PATH resolves the shim first

- **WHEN** any context resolves `claude` via `$PATH` (typed interactively, `wt switch -x claude`, gh-dash or AoE)
- **THEN** the shim is resolved before `~/.local/bin/claude`

#### Scenario: Shim delegates to the real binary without recursion

- **WHEN** the shim finishes selecting the Node version for an invocation outside the managed-review resume case
- **THEN** it execs `$HOME/.local/bin/claude` by absolute path, forwarding all arguments unchanged
- **AND** it does not resolve `claude` via `$PATH`

#### Scenario: Exit status is preserved

- **WHEN** the real Claude binary exits with status N
- **THEN** the invoking process observes status N

### Requirement: Project Node is activated by PATH-prepend without sourcing nvm

When a version file resolves to an already-installed Node version, the shim SHALL prepend that version's `bin/` directory (`$NVM_DIR/versions/node/<version>/bin`) to `$PATH` and SHALL NOT source `nvm.sh` or invoke the `nvm` function. This keeps per-launch overhead negligible (benchmarked at ~0.4 ms, versus ~0.8 s for `source nvm.sh && nvm use`).

#### Scenario: Exact version pin

- **WHEN** the resolved `.nvmrc` contains an installed exact version (e.g. `24.12.0` or `v24.12.0`)
- **THEN** the shim prepends `$NVM_DIR/versions/node/v24.12.0/bin` to `$PATH`
- **AND** does not source `nvm.sh`

#### Scenario: Major-version prefix

- **WHEN** the resolved `.nvmrc` contains a prefix (e.g. `24`) that matches one or more installed versions
- **THEN** the shim selects the highest installed version matching that prefix and prepends its `bin/` directory

### Requirement: Version file discovery walks up then down

The shim SHALL read the project's Node version from a `.nvmrc` file only. It SHALL first walk **up** from the launch directory to the filesystem root (covering the worktree root and any ancestor), using shell builtin path manipulation, not per-level `dirname` subprocesses. If no `.nvmrc` is found above, it SHALL search **down** for a `.nvmrc`, anchored at the **repository root** (`git rev-parse --show-toplevel`) — never at the launch directory — at bounded depth and skipping `node_modules/` and `.git/`. The downward search SHALL run only when the launch directory is inside a git repository; outside a repository the shim SHALL NOT search down. Exactly one match below the repository root SHALL be selected; zero or more than one SHALL fall through to passthrough.

#### Scenario: `.nvmrc` at the worktree root

- **WHEN** the shim launches in a worktree whose root contains `.nvmrc`
- **THEN** the walk-up finds it and that version is selected

#### Scenario: `.nvmrc` in a single subdirectory

- **WHEN** the launch directory is inside a git repository whose root has no `.nvmrc` but exactly one exists in a subdirectory (e.g. `apps/web/.nvmrc`)
- **THEN** the downward search from the repository root finds that single file and selects its version

#### Scenario: Multiple `.nvmrc` below the repository root

- **WHEN** the repository root has no `.nvmrc` but more than one exists in subdirectories
- **THEN** the shim SHALL NOT select any of them; it prints a disambiguation warning to stderr and delegates under the ambient Node (passthrough)

### Requirement: Absent `.nvmrc` is a near-zero-cost passthrough

When no `.nvmrc` is discovered, the shim SHALL delegate to the real Claude binary without changing `$PATH`; the managed-review resume rule SHALL still apply independently of Node discovery. Unmanaged invocations SHALL keep their argument passthrough and negligible startup overhead. The upward probe SHALL use shell path manipulation rather than per-level `dirname` subprocesses. The downward search SHALL run only after the upward walk misses and only inside a git repository, so a launch directory above sibling repositories does not trigger a subtree scan.

#### Scenario: Non-Node directory

- **WHEN** the directory tree above has no `.nvmrc` and either the launch directory is not inside a repository or its repository contains no `.nvmrc`
- **THEN** the shim execs the real Claude binary without modifying `$PATH`

#### Scenario: Directory above sibling projects

- **WHEN** the shim launches outside a git repository in a directory containing separate repositories with their own `.nvmrc` files
- **THEN** it does not activate any of those versions or scan the subtree
- **AND** it delegates under the ambient Node

#### Scenario: Managed review without a Node project

- **WHEN** a registered gh-dash review resumes from a worktree with no `.nvmrc`
- **THEN** the matching initial review prompt is still omitted
- **AND** the Node path remains unchanged

### Requirement: Cold and alias cases fall back to nvm install/use

When the resolved version is not yet installed (a strict project's pinned version on first use) or the `.nvmrc` is an alias form (`lts/*`, `lts/<name>`, `node`, `stable`) that PATH-prepend cannot resolve from the filesystem, the shim SHALL fall back to sourcing `nvm.sh` and running `nvm install` / `nvm use` before delegating. This slow path is a one-time cost; subsequent launches use the fast PATH-prepend path.

#### Scenario: Pinned version not yet installed

- **WHEN** `.nvmrc` resolves to a version with no directory under `$NVM_DIR/versions/node/`
- **THEN** the shim sources `nvm.sh`, runs `nvm install` for that version, then delegates with the new version active

#### Scenario: Alias version specifier

- **WHEN** `.nvmrc` contains an alias form such as `lts/*` or `node`
- **THEN** the shim sources `nvm.sh` and uses `nvm` to resolve and activate the version before delegating

### Requirement: claude child processes inherit the project Node

After the shim selects the project's Node version, the launched claude process and the subprocesses it spawns (the Bash tool, hooks, and any `node`/`npm`/`bun` invocation) SHALL resolve the project's Node version via the inherited `$PATH`.

#### Scenario: Tool subprocess resolves project Node

- **WHEN** claude (launched via the shim in a worktree pinned to a non-default version) spawns a subprocess that runs `node --version`
- **THEN** the reported version is the project's pinned version, not the nvm default

### Requirement: Registered gh-dash reviews omit the bootstrap prompt on explicit resume

The shim SHALL apply review-specific argument handling only when `AOE_PROFILE` and `AOE_INSTANCE_ID` identify a registered managed review for the current worktree. On an explicit `--resume` of that review, it SHALL remove only the matching `/review-team owner/repo#N` instruction, whether represented as two arguments or one combined argument, and preserve every other argument and its boundaries. A fresh first launch using `--session-id` SHALL retain its initial instruction. The shim SHALL NOT substitute `--continue` for the explicit resume target.

If a previously started managed review is being reopened but AoE substitutes a fresh launch because the conversation is missing, the integration SHALL stop with a resumption diagnostic rather than repeat the bootstrap prompt.

#### Scenario: Resume with the current two-argument bootstrap

- **WHEN** a registered review for `owner/repo#123` receives `/review-team`, `owner/repo#123`, `--resume` and its conversation ID as separate arguments
- **THEN** only the first two matching prompt arguments are omitted
- **AND** the explicit resume flag, conversation ID and other arguments remain unchanged

#### Scenario: Resume with a combined bootstrap argument

- **WHEN** a registered review resumes with one argument equal to `/review-team owner/repo#123`
- **THEN** that exact argument is omitted without splitting or changing other arguments

#### Scenario: First launch still reviews

- **WHEN** a registered review is launched for the first time with `--session-id`
- **THEN** its matching initial review instruction is preserved

#### Scenario: Unmanaged or mismatched invocation

- **WHEN** the AoE identity is absent, the invocation is not a registered review, or its worktree or PR reference does not match
- **THEN** arguments are forwarded unchanged
- **AND** a normal session, another AoE session or a manual Claude invocation is not affected

#### Scenario: Resume keeps project Node activation

- **WHEN** a registered review resumes in a worktree with an installed pinned Node version
- **THEN** its initial review prompt is omitted and its explicit conversation resumes
- **AND** Claude and its subprocesses inherit the pinned Node path as before

#### Scenario: Previously started review would become a fresh conversation

- **WHEN** a known previously started review is being reopened and AoE supplies a fresh launch in place of the missing conversation
- **THEN** the launch is rejected with a resumption diagnostic
- **AND** the review command is not submitted to a new conversation
