# Delta: cli-tool-expansion

## MODIFIED Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 30 packages:

`git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`,
`lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`,
`uv`, `mas`, `wget`, `television`, `tarkah/tickrs/tickrs`, `achannarasappa/tap/ticker`,
`age`, `mole`, `aoe`, `glow`, `mdfried`, `AlexsJones/llmfit/llmfit`, `tuicr`

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

`tuicr` is also in `homebrew/core`, so it requires no `BREW_TAPS` entry, and it uses the identity
`pkg_bin` mapping.

For llmfit the qualification also selects the channel: the bare name `llmfit` SHALL NOT be used,
because it resolves to the `homebrew/core` formula instead of the tap the `llmfit-install`
capability requires.

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 30 entries

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
