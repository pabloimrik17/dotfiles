## 1. Inspect and rebind

- [x] 1.1 Identify the installed gh-dash version and available keys; verify module v4.26.2 against upstream universal, PR, issue, branch, notification key tables and section-mode dispatch.
- [x] 1.2 Move lazygit to `J` and CI checks to `i`/`I`; verify YAML parsing, no contextual built-in collisions or duplicate custom keys, and exact preservation of all seven command/name pairs and unrelated configuration.

## 2. Align documentation

- [x] 2.1 Update the gh-dash manual and both capability specs; verify the key mapping matches the YAML, collision exceptions are removed, and the version-specific key selection evidence is documented.
- [x] 2.2 Record the completed work in proposal, design, delta specs, and this checklist; verify all four artifact types exist and match the implementation.

## 3. Validate and hand off

- [x] 3.1 Validate rendered shell commands and nested tmux payloads with shell syntax checks; verify every unchanged command parses without executing it.
- [x] 3.2 Run focused gh-dash integration tests, formatting checks, and `git diff --check`; verify two tests pass with 11 assertions and no formatting or whitespace errors.
- [x] 3.3 Record the worktree, AoE session, results, and limitations in Beads; verify task notes identify worktree `fix-WebstormProjects-bts-gh-dash-keys` and AoE session `19aabad44be3471a`.

## Validation limitations

All implementation tasks above are complete. Interactive checks have NOT been performed: the help menu, actual `J`/`i`/`I` launches and dashboard return, built-in `t`/`L`, and `Ctrl+s n/x` remain pending manual verification. No host-wide dotfiles application was performed. Beads was closed locally, but its prior push timed out after five minutes; tracker publication is not claimed as completed by this checklist.
