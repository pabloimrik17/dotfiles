## ADDED Requirements

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

### Requirement: App Store login is verified before attempting installs

Before attempting `mas install`, the script SHALL check whether the user is signed into the App Store. If not signed in, the script SHALL print instructions to sign in manually and skip the group.

#### Scenario: User is signed into App Store
- **WHEN** `mas account` returns successfully (non-empty output, zero exit code)
- **THEN** app installations proceed

#### Scenario: User is not signed into App Store
- **WHEN** `mas account` fails or returns empty
- **THEN** a warning is printed instructing the user to sign in via App Store, and the group is skipped

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
