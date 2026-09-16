## MODIFIED Requirements

### Requirement: The merge never emits an empty or invalid file

The merge SHALL never replace `~/.claude/settings.json` with empty or malformed content. If the merge engine is unavailable, the process SHALL emit the unmodified live file instead — and where there is no live file to emit, a valid empty JSON object. If the merge engine exits non-zero, or produces no output or output that is not valid JSON, the process SHALL exit non-zero with nothing on standard output and name the target on standard error (`managed-step-failure-visibility`).

This is a hard requirement rather than a nicety: chezmoi writes a modify-script's standard output to the target verbatim, and a script that exits zero having written nothing causes chezmoi to REMOVE the target — losing the user's entire Claude Code configuration. A script that exits non-zero is the safe case: chezmoi leaves the target untouched and reports the status. The requirement therefore binds on the zero-exit path.

Passing the live file through is only a fallback where a live file exists. On a machine that has none, the modify-script's standard input is empty, so echoing it back is not a no-op — it *is* the zero-byte case the paragraph above forbids, reached silently on a zero exit with nothing on stderr.

#### Scenario: Merge engine is not installed

- **WHEN** the merge engine binary is absent from `PATH`
- **AND** `~/.claude/settings.json` already exists
- **AND** `chezmoi apply` runs
- **THEN** `~/.claude/settings.json` SHALL be left byte-identical to its previous contents
- **AND** the apply SHALL NOT fail

#### Scenario: A fallback path has no live file to pass through

- **WHEN** the fallback path is taken because the merge engine is absent from `PATH`
- **AND** no `~/.claude/settings.json` exists, so there is nothing to pass through
- **THEN** the process SHALL emit a valid empty JSON object rather than zero bytes
- **AND** the managed keys SHALL land on the next apply, once the merge engine is available

#### Scenario: Merge engine exits non-zero

- **WHEN** the merge engine is present but exits with a non-zero status
- **THEN** the process SHALL exit non-zero with nothing on standard output, whether or not a live file exists
- **AND** standard error SHALL name `~/.claude/settings.json` as the file that was not merged

#### Scenario: Merge output is not valid JSON

- **WHEN** the merge engine exits zero but its output is empty or does not parse as JSON
- **THEN** the process SHALL exit non-zero with nothing on standard output rather than writing that output
- **AND** standard error SHALL name `~/.claude/settings.json` as the file that was not merged
