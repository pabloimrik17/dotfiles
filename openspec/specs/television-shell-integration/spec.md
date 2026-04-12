# Capability: television-shell-integration

## Purpose

Television shell initialization in zshrc with ordering constraints relative to fzf and atuin.

## Requirements

### Requirement: tv init is sourced in zshrc between fzf and atuin

The `.zshrc` SHALL include `eval "$(tv init zsh)"` positioned after `source <(fzf --zsh)` and before `eval "$(atuin init zsh --disable-up-arrow)"`. This ordering ensures tv's Ctrl+T overwrites fzf's, and atuin's Ctrl+R overwrites tv's.

#### Scenario: Ctrl+T launches tv smart autocomplete

- **WHEN** the user opens a new shell and presses Ctrl+T
- **THEN** tv smart autocomplete launches (not fzf's file search)

#### Scenario: Ctrl+R launches atuin history

- **WHEN** the user opens a new shell and presses Ctrl+R
- **THEN** atuin history search launches (not tv's shell history)

#### Scenario: Alt+C launches fzf directory jump

- **WHEN** the user opens a new shell and presses Alt+C
- **THEN** fzf directory jump launches (unchanged behavior)

### Requirement: tv init has an explanatory comment

The `eval "$(tv init zsh)"` line SHALL be preceded by a comment explaining what television provides and why it is positioned between fzf and atuin.

#### Scenario: Comment explains init ordering

- **WHEN** a user reads `dot_zshrc.tmpl`
- **THEN** there is a comment above the tv init line explaining that tv provides smart autocomplete (Ctrl+T) and that it must come after fzf (to override Ctrl+T) and before atuin (so atuin keeps Ctrl+R)
