# claude-settings-merge Specification

## Purpose
Produce `~/.claude/settings.json` by merging chezmoi-managed keys into the live file rather than replacing it, so that keys written by Claude Code and Agent of Empires survive `chezmoi apply` instead of being clobbered on every run.
## Requirements
### Requirement: Settings are merged, not replaced

The chezmoi source SHALL produce `~/.claude/settings.json` by overlaying a defined set of managed keys onto the live on-disk file, rather than emitting the whole file from a template. Keys present in the live file that are not in the managed set SHALL be preserved with their values intact.

Three independent writers touch this file: chezmoi, Claude Code (via `/config` and its own settings writes) and Agent of Empires (via its hook installer). Whole-file templating loses the other two writers' keys on every apply.

#### Scenario: Unmanaged key written by Claude Code survives apply

- **WHEN** Claude Code has written a top-level key that the managed set does not include (for example `theme` or `skipWorkflowUsageWarning`)
- **AND** `chezmoi apply` runs
- **THEN** that key SHALL still be present in `~/.claude/settings.json` with its original value

#### Scenario: Managed key is enforced over a divergent live value

- **WHEN** the live file holds a value for a managed key that differs from the chezmoi-managed value
- **AND** `chezmoi apply` runs
- **THEN** the managed value SHALL win

#### Scenario: Re-apply is quiet

- **WHEN** every managed key already holds its managed value and `chezmoi diff` runs again
- **THEN** no changes SHALL be reported, including after Claude Code or AoE has rewritten only their own keys

### Requirement: The merge never emits an empty or invalid file

The merge SHALL never replace `~/.claude/settings.json` with empty or malformed content. If the merge engine is unavailable, exits non-zero, or produces output that is not valid JSON, the process SHALL emit the unmodified live file instead — and where there is no live file to emit, a valid empty JSON object.

This is a hard requirement rather than a nicety: chezmoi writes a modify-script's standard output to the target verbatim, and a script that exits zero having written nothing causes chezmoi to REMOVE the target — losing the user's entire Claude Code configuration. A script that exits non-zero is the safe case: chezmoi leaves the target untouched and reports the status. The requirement therefore binds on the zero-exit path.

Passing the live file through is only a fallback where a live file exists. On a machine that has none, the modify-script's standard input is empty, so echoing it back is not a no-op — it *is* the zero-byte case the paragraph above forbids, reached silently on a zero exit with nothing on stderr.

#### Scenario: Merge engine is not installed

- **WHEN** the merge engine binary is absent from `PATH`
- **AND** `~/.claude/settings.json` already exists
- **AND** `chezmoi apply` runs
- **THEN** `~/.claude/settings.json` SHALL be left byte-identical to its previous contents
- **AND** the apply SHALL NOT fail

#### Scenario: A fallback path has no live file to pass through

- **WHEN** any fallback path is taken — the merge engine is absent, exits non-zero, or emits output that is not valid JSON
- **AND** no `~/.claude/settings.json` exists, so there is nothing to pass through
- **THEN** the process SHALL emit a valid empty JSON object rather than zero bytes
- **AND** the managed keys SHALL land on the next apply, once the merge engine is available

#### Scenario: Merge engine exits non-zero

- **WHEN** the merge engine is present but exits with a non-zero status
- **THEN** the live file SHALL be passed through unchanged

#### Scenario: Merge output is not valid JSON

- **WHEN** the merge engine exits zero but its output does not parse as JSON
- **THEN** the live file SHALL be passed through unchanged rather than written

### Requirement: Fresh machines produce a valid baseline

On a machine where `~/.claude/settings.json` does not yet exist, the merge SHALL produce a valid JSON file containing exactly the managed keys. Where the merge engine is not yet installed, the file SHALL still parse as JSON; the managed keys arrive on the next apply.

#### Scenario: No live file exists

- **WHEN** `chezmoi apply` runs on a machine with no `~/.claude/settings.json`
- **AND** the merge engine is available
- **THEN** the file SHALL be created and SHALL parse as JSON
- **AND** it SHALL contain every managed key

#### Scenario: Cold start self-heals

- **WHEN** an apply produced the empty JSON object because no live file existed and the merge engine was absent
- **AND** a later `chezmoi apply` runs with the merge engine installed
- **THEN** the resulting file SHALL contain every managed key

### Requirement: Host-conditional keys are removed as well as added

Where the managed set is conditional on host facts (operating system and architecture), the merge SHALL remove a conditional key on hosts where its condition is false, not merely omit it from the overlay.

Without this, a key added on one host would persist forever in the live file of a host whose condition no longer holds.

#### Scenario: Conditional plugin entry on a non-matching host

- **WHEN** the live file contains a plugin entry that is managed only for `darwin`/`arm64`
- **AND** `chezmoi apply` runs on a host that is not `darwin`/`arm64`
- **THEN** that entry SHALL be absent from the resulting file

### Requirement: Managed key set is explicit

The managed key set SHALL be declared explicitly in the source, so that a reader can determine which keys chezmoi owns without executing the merge.

#### Scenario: Reader inspects ownership

- **WHEN** a maintainer reads the chezmoi source for the settings file
- **THEN** the set of keys chezmoi enforces SHALL be enumerable from the source text alone

