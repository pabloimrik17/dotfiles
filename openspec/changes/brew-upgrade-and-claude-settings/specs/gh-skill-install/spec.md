## MODIFIED Requirements

### Requirement: gh agent skill install

The chezmoi install script SHALL install the official `gh` and `gh-stack` agent skills for Claude Code inside the existing gh CLI extensions confirmable group, using `gh skill install cli/cli gh --agent claude-code --scope user --force` and `gh skill install github/gh-stack gh-stack --agent claude-code --scope user --force`.

Detection SHALL be structured — `gh skill list --scope user --json skillName --jq '.[].skillName'` matched exactly against the skill name — not grepping human-readable output.

Detection SHALL NOT filter by `--agent`, even though the install side needs it to pick the destination. gh installs these skills into `~/.claude/skills` but reports that directory's skills under the agent hosts `cline, universal, warp` unless the `SKILL.md` carries a Claude-specific key such as `allowed-tools`. `cli/cli`'s `gh` skill does not, so an `--agent`-filtered check never matched: the script reinstalled on every run and `gh skill install` stopped at its "already exists, overwrite?" prompt, which died on the terminal's OSC 11 reply. That error exited non-zero, so chezmoi never recorded the `run_onchange` state and `chezmoi diff` never came back clean.

The check SHALL remain restricted to user scope, since `gh skill list` defaults to both project and user scope and an unscoped check would let a project-scoped skill mask a missing user-scoped one.

Install SHALL pass `--force` as a second line of defence: if detection ever misses again, the install overwrites silently instead of blocking on a prompt that cannot be answered through chezmoi's stdio.

#### Scenario: Fresh install of an agent skill

- **WHEN** chezmoi apply runs, the user confirms the gh extensions group, and the skill is not yet installed
- **THEN** the script runs `gh skill install` for that skill with `--agent claude-code --scope user --force`

#### Scenario: Agent skill already installed

- **WHEN** chezmoi apply runs and `gh skill list --scope user --json skillName` already contains the skill name
- **THEN** the script skips installation and reports it as already installed

#### Scenario: Detection does not filter by agent host

- **WHEN** a skill is installed into `~/.claude/skills` but reported under a non-Claude agent host
- **THEN** detection SHALL still match it, and the script SHALL NOT reinstall

#### Scenario: Install failure is non-fatal

- **WHEN** `gh skill install` fails (offline, auth expired)
- **THEN** the script records the error via the standard `error` helper and continues with the remaining groups
