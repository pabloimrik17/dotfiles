## MODIFIED Requirements

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

## ADDED Requirements

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
