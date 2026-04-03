# appstore-install Specification

## Purpose

TBD - created by archiving change mac-dev-setup. Update Purpose after archive.

## Requirements

### Requirement: App Store apps are installed via mas CLI

The script SHALL define a list of Mac App Store apps with their numeric IDs and human-readable names:

- `6714467650` Perplexity
- `1568924476` Mela

The script SHALL use `mas install <id>` to install each app.

#### Scenario: App Store apps installed on fresh Mac

- **WHEN** the user confirms the App Store group and is signed into the App Store
- **THEN** Perplexity and Mela are installed via `mas install`

#### Scenario: App already installed from App Store

- **WHEN** an app is already installed (e.g., Perplexity is in `/Applications/`)
- **THEN** `mas install` succeeds idempotently (mas skips already-installed apps)

### Requirement: App Store group has its own confirmation prompt

The MAS installation group SHALL be gated by a single `confirm()` prompt.

#### Scenario: User confirms App Store group

- **WHEN** the user confirms the MAS group
- **THEN** all listed App Store apps are installed

#### Scenario: User declines App Store group

- **WHEN** the user declines the MAS confirmation
- **THEN** no App Store apps are installed

### Requirement: App Store install failures hint at sign-in

If `mas install` fails, the error message SHALL hint that the user may need to sign in to the App Store. The script SHALL NOT use `mas account` for pre-checking sign-in status (broken on macOS 12+).

#### Scenario: mas install fails

- **WHEN** `mas install <id>` returns a non-zero exit code
- **THEN** an error is logged with a hint to check App Store sign-in, and the script continues

### Requirement: Manual install instructions are printed at script end

The script SHALL print informational messages at the end listing apps that require manual installation:

- Last.fm Scrobbler (https://last.fm/about/trackmymusic)
- CleanMyMac (requires license)
- Adobe CC suite (requires Creative Cloud login)
- 1Password for Safari (App Store extension)

These messages SHALL always be printed regardless of which groups the user confirmed.

#### Scenario: Manual instructions printed

- **WHEN** the install script reaches its final section
- **THEN** all four manual install instructions are printed to stdout with URLs where applicable
