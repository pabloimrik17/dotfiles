# Spec Delta

## Purpose

Install the Greptile CLI (`greptile`) on every machine so agents and the review team can run local Greptile reviews, keeping its own update path and an explicit login instruction.

## ADDED Requirements

### Requirement: Greptile CLI installed globally through npm

The install script SHALL install the Greptile CLI with `npm install -g greptile` in a confirmation-gated group placed after the NVM/Node group. The group SHALL skip with an informational message when `greptile` is already on PATH, and skip with a warning when `node` or `npm` is unavailable or Node is older than 22.

#### Scenario: Fresh machine install

- **WHEN** the install script runs with Node 22 or newer, `greptile` absent, and the user confirms the group
- **THEN** `npm install -g greptile` runs and `greptile --version` succeeds afterwards

#### Scenario: Already installed

- **WHEN** `greptile` is already on PATH
- **THEN** the group reports it as installed and installs nothing

#### Scenario: Node unavailable or too old

- **WHEN** `node` or `npm` is not on PATH, or `node` is older than 22
- **THEN** the group skips with a warning and the script continues

#### Scenario: Install fails

- **WHEN** `npm install -g greptile` exits non-zero
- **THEN** the failure is logged, the error counter is incremented, and later groups still run

### Requirement: Greptile CLI stays out of Homebrew

The Greptile CLI SHALL NOT be installed through Homebrew: no `greptileai/tap` entry in `BREW_TAPS`, no `greptile` entry in `BREW_PACKAGES`, and no `greptile` row in `BREW_VERSIONS`. The tap formula depends on Homebrew's `node`, which installs a second Node; on the Intel host it lands in `/usr/local/bin` and shadows nvm in non-interactive shells.

#### Scenario: Rendered brew arrays are inspected

- **WHEN** the macOS install script is rendered
- **THEN** no brew tap, package or version row names Greptile

### Requirement: Greptile CLI updates itself

The Greptile CLI SHALL update through its own `greptile update`. The dotfiles SHALL NOT add a Greptile step to `update-extra`, a Renovate pin, or a re-install on later runs.

#### Scenario: Update configuration is inspected

- **WHEN** the install script, `update-extra` and Renovate configuration are inspected
- **THEN** none of them updates or pins Greptile

### Requirement: Greptile login instruction displayed

The install script SHALL print a Greptile line in the manual instructions block: sign in with `greptile login`, or set `GREPTILE_API_KEY` for non-interactive use.

#### Scenario: Install script finishes on macOS

- **WHEN** the install script completes on macOS
- **THEN** the manual instructions block contains the `greptile login` line

### Requirement: Non-macOS instructions include the Greptile CLI

The non-macOS manual instructions SHALL list `npm install -g greptile`, noting that it needs Node 22 or newer.

#### Scenario: Install script renders for Linux

- **WHEN** the install script runs on a non-macOS host
- **THEN** the manual package list includes `npm install -g greptile`
