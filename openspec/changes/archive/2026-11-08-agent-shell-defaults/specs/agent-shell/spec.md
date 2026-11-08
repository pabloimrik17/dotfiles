# Spec Delta

## Purpose

Gives coding agents a shell with bash-like word handling and plain command names, while the
interactive zsh keeps its human-oriented options and aliases.

## ADDED Requirements

### Requirement: Agent shell detection

The zshrc SHALL apply the agent shell settings only when `CLAUDECODE` is set and the shell is not
interactive, which is how Claude Code sources `~/.zshrc` to build its Bash tool snapshot. Every
other shell SHALL get the interactive defaults.

#### Scenario: Claude Code snapshot gets agent settings

- **WHEN** a Claude Code session starts and builds its shell snapshot
- **THEN** the Bash tool's shell has the agent shell settings

#### Scenario: Interactive shell with inherited CLAUDECODE keeps defaults

- **GIVEN** `CLAUDECODE=1` is in the environment
- **WHEN** an interactive zsh starts
- **THEN** it keeps `nomatch`, `equals`, the eza `ls` alias and the bat `cat` alias

### Requirement: Unmatched globs pass through literally

In an agent shell a glob that matches no file SHALL be passed to the command as written, not abort
the command.

#### Scenario: Unquoted include pattern

- **WHEN** an agent runs `echo --include=*.zzz` where no file matches
- **THEN** the output is `--include=*.zzz` and the exit status is 0

### Requirement: Leading equals signs are literal

In an agent shell a word starting with `=` SHALL NOT expand to a command path.

#### Scenario: Separator line

- **WHEN** an agent runs `echo ======`
- **THEN** the output is `======` and the exit status is 0

### Requirement: Unquoted parameters split on whitespace

In an agent shell an unquoted parameter expansion SHALL split into words on `IFS`, as in bash.

#### Scenario: File list in a variable

- **WHEN** an agent runs `f="a b"; printf "%s\n" $f`
- **THEN** the output is two lines, `a` and `b`

### Requirement: Plain ls and cat

In an agent shell `ls` and `cat` SHALL resolve to the system commands, not to eza or bat.

#### Scenario: ls is not aliased

- **WHEN** an agent runs `type ls`
- **THEN** the output names `/bin/ls` and contains no `eza`

#### Scenario: cat is not aliased

- **WHEN** an agent runs `type cat`
- **THEN** the output names `/bin/cat` and contains no `bat`

### Requirement: Interactive shell unchanged

An interactive zsh SHALL keep `nomatch` and `equals` on, `sh_word_split` off, `ls` as the eza alias
and `cat` as the bat alias.

#### Scenario: Human terminal

- **WHEN** the user opens a new interactive terminal
- **THEN** `echo *.zzz` fails with `no matches found`
- **AND** `type ls` names eza and `type cat` names bat
