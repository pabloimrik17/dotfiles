# Delta: cli-tool-expansion

## MODIFIED Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 32 packages:

`git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`,
`lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`,
`uv`, `mas`, `wget`, `television`, `tarkah/tickrs/tickrs`, `achannarasappa/tap/ticker`,
`age`, `mole`, `aoe`, `glow`, `mdfried`, `AlexsJones/llmfit/llmfit`, `tuicr`,
`schpet/tap/linear`, `googleworkspace-cli`

Packages sourced from a third-party tap SHALL be listed by their fully-qualified name
(`<user>/<tap>/<formula>`), not by bare formula name. Homebrew 6 refuses to load a formula from an
untrusted tap when addressed by bare name, so a bare entry makes the package uninstallable on a
fresh host. Four entries are qualified — `tarkah/tickrs/tickrs`, `achannarasappa/tap/ticker`,
`AlexsJones/llmfit/llmfit` and `schpet/tap/linear` — and each needs a `BREW_TAPS` entry and its own
`pkg_bin` arm, because the identity mapping would probe for a binary named after the qualified
formula.

`opencode` SHALL NOT appear in `BREW_PACKAGES`; it is installed via its official script
(see the `opencode-install` capability). Removing it also makes the `anomalyco/tap` tap
unnecessary for this array.

`glow` and `mdfried` are both in `homebrew/core`, so they require no `BREW_TAPS` entry, and both
use the identity `pkg_bin` mapping (binary name equals package name).

`tuicr` is also in `homebrew/core`, so it requires no `BREW_TAPS` entry, and it uses the identity
`pkg_bin` mapping.

`googleworkspace-cli` is also in `homebrew/core`, so it requires no `BREW_TAPS` entry. Its binary is
`gws`, not the package name, so it needs its own `pkg_bin` arm. The unrelated `homebrew/core`
formula named `gws` SHALL NOT appear in `BREW_PACKAGES`: it installs a different `gws` binary, and
Homebrew declares the two formulae as conflicting.

For llmfit the qualification also selects the channel: the bare name `llmfit` SHALL NOT be used,
because it resolves to the `homebrew/core` formula instead of the tap the `llmfit-install`
capability requires.

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 32 entries

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

#### Scenario: tuicr listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `tuicr`

#### Scenario: tuicr maps to its own binary name

- **WHEN** `pkg_bin "tuicr"` is called
- **THEN** the function returns `tuicr` (via the default identity mapping)

#### Scenario: linear listed in array under its tap-qualified name

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `schpet/tap/linear`
- **AND** it does NOT contain the bare entry `linear`

#### Scenario: linear maps to its binary name

- **WHEN** `pkg_bin "schpet/tap/linear"` is called
- **THEN** the function returns `linear` (via a dedicated `case` arm, not the identity mapping)

#### Scenario: googleworkspace-cli listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `googleworkspace-cli`
- **AND** it does NOT contain the unrelated formula `gws`

#### Scenario: googleworkspace-cli maps to the gws binary

- **WHEN** `pkg_bin "googleworkspace-cli"` is called
- **THEN** the function returns `gws` (via a dedicated `case` arm, not the identity mapping)

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
| `schpet/tap/linear`         | `linear` |
| `googleworkspace-cli`       | `gws`    |

All other packages SHALL map to their own name (identity mapping via the default `*` case).

The four qualified rows exist for a different reason than the others: the binary is not renamed,
the package name is tap-qualified. `command -v achannarasappa/tap/ticker` can never succeed, so
without an explicit arm the idempotency check fails on every run and the script reinstalls a package
that is already present. Any future tap-qualified entry SHALL likewise get its own arm.

The `googleworkspace-cli` row is a renamed binary, like `ripgrep` → `rg`: the formula installs a
binary called `gws`, so `command -v googleworkspace-cli` can never succeed.

#### Scenario: git-delta maps to delta

- **WHEN** `pkg_bin "git-delta"` is called
- **THEN** the function returns `delta`

#### Scenario: Standard package maps to itself

- **WHEN** `pkg_bin "fd"` is called
- **THEN** the function returns `fd`

#### Scenario: Tap-qualified package maps to its unqualified binary

- **WHEN** `pkg_bin` is called with any tap-qualified entry of `BREW_PACKAGES`
  (`tarkah/tickrs/tickrs`, `achannarasappa/tap/ticker`, `AlexsJones/llmfit/llmfit`,
  `schpet/tap/linear`)
- **THEN** the function returns the bare binary name (`tickrs`, `ticker`, `llmfit`, `linear`), so
  the `command -v` skip check probes the real binary

#### Scenario: googleworkspace-cli maps to gws

- **WHEN** `pkg_bin "googleworkspace-cli"` is called
- **THEN** the function returns `gws`, so the `command -v` skip check probes the real binary
