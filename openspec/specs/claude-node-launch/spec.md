# claude-node-launch Specification

## Purpose

A PATH shim named `claude` that resolves the project's Node version from `.nvmrc` (walk-up, then a repo-anchored walk-down) and launches the real `claude` under it via PATH-prepend, so claude and its subprocesses run on the project's pinned Node regardless of launcher (`wsc`/`wsh`, gh-dash `-x claude`, AoE, or a typed `claude`). Steady state never sources nvm; a cold/alias fallback sources nvm only when a pinned version isn't installed yet or the `.nvmrc` is an alias form.

## Requirements

### Requirement: Shim shadows `claude` on PATH and delegates to the real binary

A chezmoi-managed executable named `claude` SHALL be installed in a directory that appears on `$PATH` **before** the real claude binary (`~/.local/bin/claude`). The shim SHALL invoke the real binary by absolute path so it never re-invokes itself, and SHALL forward all arguments and the exit status unchanged.

#### Scenario: PATH resolves the shim first

- **WHEN** any context resolves the command `claude` via `$PATH` (typed interactively, `wt switch -x claude`, gh-dash, or AoE)
- **THEN** the shim is resolved before `~/.local/bin/claude`

#### Scenario: Shim delegates to the real binary without recursion

- **WHEN** the shim finishes selecting the Node version
- **THEN** it SHALL `exec "$HOME/.local/bin/claude"` (the installer-maintained symlink) by absolute path, forwarding all arguments
- **AND** the shim SHALL NOT resolve `claude` via `$PATH` (which would re-enter the shim)

#### Scenario: Exit status is preserved

- **WHEN** the real claude binary exits with status N
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

When no `.nvmrc` is discovered, the shim SHALL `exec` the real claude binary unchanged without touching `$PATH`. The upward probe SHALL add negligible overhead (benchmarked at ~+1.6 ms over the bare-process floor; the dirname-fork form added ~+29 ms and SHALL NOT be used). The downward search SHALL run only after the upward walk misses and only inside a git repository, so a launch directory that is not inside a repository (e.g. a directory that merely holds sibling project checkouts) SHALL passthrough after a single `git rev-parse` probe without scanning the tree.

#### Scenario: Non-Node directory

- **WHEN** the shim launches where the directory tree above has no `.nvmrc`, and either the launch directory is not inside a git repository or its repository contains no `.nvmrc`
- **THEN** it execs the real claude binary without modifying `$PATH`

#### Scenario: Directory above sibling projects

- **WHEN** the shim launches from a directory that is not itself inside a git repository but contains subdirectories that are separate repositories, each with its own `.nvmrc`
- **THEN** the shim SHALL NOT activate any of those versions; it execs the real claude binary under the ambient Node without scanning the subtree

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
