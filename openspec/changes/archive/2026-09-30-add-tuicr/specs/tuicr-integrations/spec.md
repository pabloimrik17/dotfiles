# Capability: tuicr-integrations

## Purpose

tuicr entry points from tools whose specs it does not own — currently the lazygit working-tree self-review binding (precedent: markdown-viewer owns its lazygit customCommand).

## ADDED Requirements

### Requirement: Lazygit working-tree review binding

`dot_config/lazygit/config.yml.tmpl` SHALL define a `customCommands` entry in the `files` context bound to `V` that runs `tuicr -w` with `output: terminal`, so the user can self-review uncommitted changes before committing. The key SHALL NOT shadow a lazygit built-in: `V` is unbound in both the `universal` and `files` sections of `lazygit --config` (unlike `W`, which is the universal `diffingMenu`); global `R` refresh is left untouched.

#### Scenario: Self-review from lazygit

- **WHEN** the user presses `V` in the lazygit files panel
- **THEN** lazygit suspends and tuicr opens on the working-tree diff, and quitting tuicr returns to lazygit

#### Scenario: Help menu shows the binding

- **WHEN** the user opens lazygit's keybindings menu in the files context
- **THEN** the `V` entry appears with a descriptive label mentioning tuicr
