## MODIFIED Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 29 packages:

`git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`,
`lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`,
`uv`, `mas`, `wget`, `television`, `tarkah/tickrs/tickrs`, `achannarasappa/tap/ticker`,
`age`, `mole`, `aoe`, `glow`, `mdfried`, `llmfit`

Packages sourced from a third-party tap SHALL be listed by their fully-qualified name
(`<user>/<tap>/<formula>`), not by bare formula name. Homebrew 6 refuses to load a formula from an
untrusted tap when addressed by bare name, so a bare entry makes the package uninstallable on a
fresh host and invisible to `brew outdated`.

`opencode` SHALL NOT appear in `BREW_PACKAGES`; it is installed via its official script
(see the `opencode-install` capability). Removing it also makes the `anomalyco/tap` tap
unnecessary for this array.

`glow` and `mdfried` are both in `homebrew/core`, so they require no `BREW_TAPS` entry, and both
use the identity `pkg_bin` mapping (binary name equals package name).

`llmfit` is in `homebrew/core` and requires no `BREW_TAPS` entry. It was previously an unmanaged
leaf installed by hand with no reference anywhere in the repo; it is adopted rather than removed.
Its install receipt records `homebrew/core` as its source tap, so the `alexsjones/llmfit` entry in
`~/.config/homebrew/trust.json` grants trust to a tap that no longer serves the formula and SHALL be
removed.

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

#### Scenario: tickrs maps to its own binary name

- **WHEN** `pkg_bin "tarkah/tickrs/tickrs"` is called
- **THEN** the function returns `tickrs`

#### Scenario: ticker listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `achannarasappa/tap/ticker`

#### Scenario: ticker maps to its own binary name

- **WHEN** `pkg_bin "achannarasappa/tap/ticker"` is called
- **THEN** the function returns `ticker`

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

#### Scenario: llmfit listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `llmfit`

#### Scenario: llmfit maps to its own binary name

- **WHEN** `pkg_bin "llmfit"` is called
- **THEN** the function returns `llmfit` (via the default identity mapping)

#### Scenario: Stale tap trust for llmfit is removed

- **WHEN** `~/.config/homebrew/trust.json` is read after this change
- **THEN** it contains no entry for `alexsjones/llmfit`, because the formula is served by
  `homebrew/core`

### Requirement: pkg_bin function maps all packages to their binary names

The `pkg_bin()` function SHALL map package names to their command-line binary names for idempotency checks. The following mappings SHALL exist:

| Package                     | Binary   |
| --------------------------- | -------- |
| `ripgrep`                   | `rg`     |
| `git-delta`                 | `delta`  |
| `television`                | `tv`     |
| `tarkah/tickrs/tickrs`      | `tickrs` |
| `achannarasappa/tap/ticker` | `ticker` |

All other packages SHALL map to their own name (identity mapping via the default `*` case).

Because tap-sourced entries are fully qualified in `BREW_PACKAGES`, the identity mapping no longer
produces a usable binary name for them — `command -v achannarasappa/tap/ticker` can never succeed —
so each qualified entry SHALL have an explicit mapping. Without it the idempotency check fails on
every run and the script reinstalls a package that is already present.

#### Scenario: git-delta maps to delta

- **WHEN** `pkg_bin "git-delta"` is called
- **THEN** the function returns `delta`

#### Scenario: Standard package maps to itself

- **WHEN** `pkg_bin "fd"` is called
- **THEN** the function returns `fd`

#### Scenario: Qualified tap entry maps to its bare binary name

- **WHEN** `pkg_bin` is called with a fully-qualified tap entry from `BREW_PACKAGES`
- **THEN** the function returns the bare binary name, so the `command -v` idempotency check can
  succeed

### Requirement: BREW_TAPS array registers third-party Homebrew taps before installs

The install script SHALL declare a `BREW_TAPS` array immediately above `BREW_PACKAGES` listing every third-party tap required by any package in `BREW_PACKAGES`. Before the BREW_PACKAGES pre-scan runs, the script SHALL iterate `BREW_TAPS` and run `brew tap "$tap"` for each entry. `brew tap` SHALL be considered idempotent — re-running on a host where the tap is already registered SHALL succeed without re-fetching.

The value of `BREW_TAPS` SHALL be `(tarkah/tickrs achannarasappa/tap)` — the taps currently required (for the `tickrs` and `ticker` formulas respectively).

Homebrew 6 additionally gates third-party taps behind a trust decision: an untrusted tap's formulae
are omitted from `brew outdated`, so a package can fall arbitrarily far behind without being
reported. The script SHALL therefore also grant trust to every entry in `BREW_TAPS`, and trust
SHALL be granted for the whole class rather than for individual formulae, so no tap in the array
runs on a weaker baseline than its siblings.

#### Scenario: Tap loop runs before package install loop

- **WHEN** the install script reaches the brew packages group
- **THEN** every entry in `BREW_TAPS` is tapped via `brew tap "$tap"` before any `brew install` invocation

#### Scenario: tarkah/tickrs is registered

- **WHEN** the install script is loaded
- **THEN** `BREW_TAPS` contains `tarkah/tickrs`

#### Scenario: achannarasappa/tap is registered

- **WHEN** the install script is loaded
- **THEN** `BREW_TAPS` contains `achannarasappa/tap`

#### Scenario: Re-running on a tapped host is a no-op

- **WHEN** the install script runs on a host where every entry in `BREW_TAPS` is already tapped
- **THEN** each `brew tap "$tap"` exits successfully without printing a warning and the script continues

#### Scenario: Every declared tap is trusted

- **WHEN** the install script has completed the tap loop
- **THEN** every entry in `BREW_TAPS` is trusted, and no entry is left untrusted while another is
  trusted

#### Scenario: Trusted taps appear in outdated reporting

- **WHEN** a formula from a `BREW_TAPS` entry has a newer version available
- **THEN** `brew outdated` reports it without requiring the fully-qualified name to be passed
  explicitly
