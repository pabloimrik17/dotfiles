# cli-tool-expansion Specification

## Purpose

TBD - created by archiving change mac-dev-setup. Update Purpose after archive.
## Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 29 packages:

`git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`,
`lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`,
`uv`, `mas`, `wget`, `television`, `tarkah/tickrs/tickrs`, `achannarasappa/tap/ticker`,
`age`, `mole`, `aoe`, `glow`, `mdfried`, `AlexsJones/llmfit/llmfit`

Packages sourced from a third-party tap SHALL be listed by their fully-qualified name
(`<user>/<tap>/<formula>`), not by bare formula name. Homebrew 6 refuses to load a formula from an
untrusted tap when addressed by bare name, so a bare entry makes the package uninstallable on a
fresh host. Three entries are qualified — `tarkah/tickrs/tickrs`, `achannarasappa/tap/ticker` and
`AlexsJones/llmfit/llmfit` — and each needs a `BREW_TAPS` entry and its own `pkg_bin` arm, because
the identity mapping would probe for a binary named after the qualified formula.

`opencode` SHALL NOT appear in `BREW_PACKAGES`; it is installed via its official script
(see the `opencode-install` capability). Removing it also makes the `anomalyco/tap` tap
unnecessary for this array.

`glow` and `mdfried` are both in `homebrew/core`, so they require no `BREW_TAPS` entry, and both
use the identity `pkg_bin` mapping (binary name equals package name).

For llmfit the qualification also selects the channel: the bare name `llmfit` SHALL NOT be used,
because it resolves to the `homebrew/core` formula instead of the tap the `llmfit-install`
capability requires.

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 29 entries

#### Scenario: opencode absent from array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array does NOT contain `opencode`

#### Scenario: Tap-sourced packages are fully qualified

- **WHEN** the install script is loaded
- **THEN** every entry whose formula comes from a third-party tap is written as
  `<user>/<tap>/<formula>`, and no such entry appears as a bare formula name

#### Scenario: television listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `television`

#### Scenario: television maps to tv binary

- **WHEN** `pkg_bin "television"` is called
- **THEN** the function returns `tv`

#### Scenario: tickrs listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `tarkah/tickrs/tickrs`
- **AND** it does NOT contain the bare entry `tickrs`

#### Scenario: tickrs maps to its own binary name

- **WHEN** `pkg_bin "tarkah/tickrs/tickrs"` is called
- **THEN** the function returns `tickrs` (via a dedicated `case` arm, not the identity mapping)

#### Scenario: ticker listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `achannarasappa/tap/ticker`
- **AND** it does NOT contain the bare entry `ticker`

#### Scenario: ticker maps to its own binary name

- **WHEN** `pkg_bin "achannarasappa/tap/ticker"` is called
- **THEN** the function returns `ticker` (via a dedicated `case` arm, not the identity mapping)

#### Scenario: age listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `age`

#### Scenario: age maps to its own binary name

- **WHEN** `pkg_bin "age"` is called
- **THEN** the function returns `age` (via the default identity mapping)

#### Scenario: mole listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `mole`

#### Scenario: mole maps to its own binary name

- **WHEN** `pkg_bin "mole"` is called
- **THEN** the function returns `mole` (via the default identity mapping)

#### Scenario: aoe listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `aoe`

#### Scenario: aoe maps to its own binary name

- **WHEN** `pkg_bin "aoe"` is called
- **THEN** the function returns `aoe` (via the default identity mapping)

#### Scenario: glow listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `glow`

#### Scenario: glow maps to its own binary name

- **WHEN** `pkg_bin "glow"` is called
- **THEN** the function returns `glow` (via the default identity mapping)

#### Scenario: mdfried listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `mdfried`

#### Scenario: mdfried maps to its own binary name

- **WHEN** `pkg_bin "mdfried"` is called
- **THEN** the function returns `mdfried` (via the default identity mapping)

#### Scenario: llmfit listed in array under its tap-qualified name

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `AlexsJones/llmfit/llmfit`
- **AND** it does NOT contain the bare entry `llmfit`

#### Scenario: llmfit maps to its binary name

- **WHEN** `pkg_bin "AlexsJones/llmfit/llmfit"` is called
- **THEN** the function returns `llmfit` (via a dedicated `case` arm, not the identity mapping)

### Requirement: pkg_bin function maps all packages to their binary names

The `pkg_bin()` function SHALL map package names to their command-line binary names for idempotency checks. The following mappings SHALL exist:

| Package                     | Binary   |
| --------------------------- | -------- |
| `ripgrep`                   | `rg`     |
| `git-delta`                 | `delta`  |
| `worktrunk`                 | `wt`     |
| `beads`                     | `bd`     |
| `television`                | `tv`     |
| `tarkah/tickrs/tickrs`      | `tickrs` |
| `achannarasappa/tap/ticker` | `ticker` |
| `AlexsJones/llmfit/llmfit`  | `llmfit` |

All other packages SHALL map to their own name (identity mapping via the default `*` case).

The three qualified rows exist for a different reason than the others: the binary is not renamed,
the package name is tap-qualified. `command -v achannarasappa/tap/ticker` can never succeed, so
without an explicit arm the idempotency check fails on every run and the script reinstalls a package
that is already present. Any future tap-qualified entry SHALL likewise get its own arm.

#### Scenario: git-delta maps to delta

- **WHEN** `pkg_bin "git-delta"` is called
- **THEN** the function returns `delta`

#### Scenario: Standard package maps to itself

- **WHEN** `pkg_bin "fd"` is called
- **THEN** the function returns `fd`

#### Scenario: Tap-qualified package maps to its unqualified binary

- **WHEN** `pkg_bin` is called with any tap-qualified entry of `BREW_PACKAGES`
  (`tarkah/tickrs/tickrs`, `achannarasappa/tap/ticker`, `AlexsJones/llmfit/llmfit`)
- **THEN** the function returns the bare binary name (`tickrs`, `ticker`, `llmfit`), so the
  `command -v` skip check probes the real binary

### Requirement: git formula uses brew-specific installation check

For the `git` package specifically, the script SHALL NOT use `command -v git` for the skip check (because system git at `/usr/bin/git` would always match). Instead, it SHALL check whether brew's git is installed via `brew list git`.

#### Scenario: Only system git present

- **WHEN** `/usr/bin/git` exists but `brew list git` fails
- **THEN** `brew install git` is executed

#### Scenario: Brew git already installed

- **WHEN** `brew list git` succeeds
- **THEN** git installation is skipped with informational message

### Requirement: Atuin history imported on fresh machines

After brew packages are installed, the script SHALL check if atuin has zero history entries. If so, `atuin import auto` SHALL be run to import existing shell history (from `~/.zsh_history` or similar). This ensures autosuggestions work immediately on fresh machines.

#### Scenario: Fresh machine with existing zsh history

- **WHEN** atuin is installed and has no history entries
- **THEN** `atuin import auto` is executed

#### Scenario: History already present

- **WHEN** atuin already has history entries
- **THEN** the import step is skipped

### Requirement: Non-macOS fallback includes all new packages

The non-macOS branch of the install script SHALL list its brew packages in the manual
installation instructions. opencode SHALL be listed under the official-script install
instructions (not the brew package list), consistent with the macOS branch.

The CLI-tools list in the non-macOS branch SHALL include `glow` and `mdfried`. The `mdfried` entry
SHALL note that its image / `mermaid` / Big-Header rendering requires a terminal that supports a
graphics protocol (Kitty, iTerm2, or Sixel) and otherwise degrades to character rendering.

The CLI-tools list SHALL also include `llmfit`, listed by binary name rather than by its
tap-qualified formula name, and SHALL NOT annotate it as macOS-only: upstream publishes Linux
binaries. Its annotated entry SHALL name `brew install AlexsJones/llmfit/llmfit` and a brew-free
fallback (`uv tool install -U llmfit`).

#### Scenario: Non-macOS instructions are complete

- **WHEN** the script runs on a non-macOS system
- **THEN** the printed instructions include `fd`, `gh`, `git-delta`, `git`, `tmux`, `uv`, and `wget` alongside the original packages (excluding `mas`, which is macOS-only), and opencode appears under the official-installer instructions (`curl -fsSL https://opencode.ai/install | bash`) rather than the brew package list

#### Scenario: New Markdown viewers listed in non-macOS instructions

- **WHEN** the script runs on a non-macOS system
- **THEN** the printed CLI-tools instructions include `glow` and `mdfried`, with `mdfried` annotated as requiring a graphics-capable terminal

#### Scenario: llmfit listed in non-macOS instructions

- **WHEN** the script runs on a non-macOS system
- **THEN** the printed CLI-tools instructions include `llmfit` with its tap install and brew-free fallback, and no macOS-only notice

### Requirement: tv update-channels runs after brew packages group

After the brew packages group completes, if `tv` is available in PATH, the install script SHALL run `tv update-channels` to download community cable channels. This step SHALL be guarded by a `command -v tv` check and SHALL NOT fail the script if the download fails.

#### Scenario: Cable channels downloaded on fresh install

- **WHEN** television is newly installed via brew and the brew packages group completes
- **THEN** `tv update-channels` runs successfully

#### Scenario: tv not installed skips channel update

- **WHEN** the user skipped the brew packages group and `tv` is not in PATH
- **THEN** the `tv update-channels` step is skipped entirely

### Requirement: BREW_TAPS array registers third-party Homebrew taps before installs

The install script SHALL declare a `BREW_TAPS` array immediately above `BREW_PACKAGES` listing every
third-party tap required by any package in `BREW_PACKAGES`. Before the `BREW_PACKAGES` pre-scan
runs, the script SHALL iterate `BREW_TAPS` and, for each entry, grant it trust with
`brew trust --tap "$tap"` and then register it with `brew tap "$tap"`. Both commands SHALL be
considered idempotent — re-running on a host where the tap is already trusted and registered SHALL
succeed without re-fetching.

The value of `BREW_TAPS` SHALL be `(tarkah/tickrs achannarasappa/tap AlexsJones/llmfit)` — the taps
currently required (for the `tickrs`, `ticker` and `llmfit` formulas respectively).

Homebrew 6 gates third-party taps behind `brew trust`'s store. An untrusted tap's formulae are
refused when addressed by bare name and omitted from `brew outdated`, so a package can fall
arbitrarily far behind without being reported. `brew tap` is gated as well: on a host where the tap
is neither trusted nor registered, its post-tap audit fails with
`Refusing to load formula … from untrusted tap`, rolls the clone back and exits non-zero. The script
SHALL therefore trust every entry in `BREW_TAPS`, for the whole class rather than for individual
formulae, so no tap in the array runs on a weaker baseline than its siblings.

Trust SHALL be granted before the tap is registered. `brew trust --tap` only writes the trust store
and succeeds for a tap that is not registered yet, so trusting first lets `brew tap` pass its audit
on the first run on a fresh host.

This supersedes the `add-llmfit` decision not to add a `brew trust` step, which left the tap loop
failing once per fresh host and the three taps on two baselines — two trusted by hand, one not.
Trusting a tap grants it the right to run arbitrary Ruby on every host these dotfiles provision.
That is accepted for the taps declared in `BREW_TAPS` and for no other tap.

#### Scenario: Tap loop runs before package install loop

- **WHEN** the install script reaches the brew packages group
- **THEN** every entry in `BREW_TAPS` is trusted via `brew trust --tap "$tap"` and then tapped via
  `brew tap "$tap"`, before any `brew install` invocation

#### Scenario: tarkah/tickrs is registered

- **WHEN** the install script is loaded
- **THEN** `BREW_TAPS` contains `tarkah/tickrs`

#### Scenario: achannarasappa/tap is registered

- **WHEN** the install script is loaded
- **THEN** `BREW_TAPS` contains `achannarasappa/tap`

#### Scenario: AlexsJones/llmfit is registered

- **WHEN** the install script is loaded
- **THEN** `BREW_TAPS` contains `AlexsJones/llmfit`

#### Scenario: Re-running on a tapped host is a no-op

- **WHEN** the install script runs on a host where every entry in `BREW_TAPS` is already trusted and
  tapped
- **THEN** each `brew trust --tap "$tap"` and `brew tap "$tap"` exits successfully without
  re-fetching the tap, and the script continues

#### Scenario: Untrusted tap fails the loop without failing the run

- **WHEN** `brew trust --tap "$tap"` or `brew tap "$tap"` exits non-zero for a `BREW_TAPS` entry
- **THEN** the loop logs `Failed to trust tap $tap` or `Failed to tap $tap` and increments the error
  counter, and a tap whose trust failed is not tapped
- **AND** the script continues to the pre-scan and install loop rather than aborting

#### Scenario: Fully-qualified install bypasses the trust gate

- **WHEN** the tap loop runs on a Homebrew 6 host where `AlexsJones/llmfit` is neither trusted nor
  registered
- **THEN** the tap is trusted before `brew tap AlexsJones/llmfit` runs, the tap registers without an
  untrusted-tap refusal, and `brew install AlexsJones/llmfit/llmfit` resolves from it
- **AND** the install no longer depends on whether a fully-qualified reference is exempt from the gate

#### Scenario: Every declared tap is trusted

- **WHEN** the install script has completed the tap loop
- **THEN** every entry in `BREW_TAPS` is trusted, and no entry is left untrusted while another is
  trusted

#### Scenario: Trusted taps appear in outdated reporting

- **WHEN** a formula from a `BREW_TAPS` entry has a newer version available
- **THEN** `brew outdated` reports it without requiring the fully-qualified name to be passed
  explicitly
