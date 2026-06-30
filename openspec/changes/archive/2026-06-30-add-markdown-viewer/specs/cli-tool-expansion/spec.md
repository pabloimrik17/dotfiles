## MODIFIED Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 28 packages:

`git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`,
`lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`,
`uv`, `mas`, `wget`, `television`, `tickrs`, `ticker`, `age`, `mole`, `aoe`,
`glow`, `mdfried`

`opencode` SHALL NOT appear in `BREW_PACKAGES`; it is installed via its official script
(see the `opencode-install` capability). Removing it also makes the `anomalyco/tap` tap
unnecessary for this array.

`glow` and `mdfried` are both in `homebrew/core`, so they require no `BREW_TAPS` entry, and both
use the identity `pkg_bin` mapping (binary name equals package name).

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 28 entries

#### Scenario: opencode absent from array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array does NOT contain `opencode`

#### Scenario: television listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `television`

#### Scenario: television maps to tv binary

- **WHEN** `pkg_bin "television"` is called
- **THEN** the function returns `tv`

#### Scenario: tickrs listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `tickrs`

#### Scenario: tickrs maps to its own binary name

- **WHEN** `pkg_bin "tickrs"` is called
- **THEN** the function returns `tickrs` (via the default identity mapping)

#### Scenario: ticker listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `ticker`

#### Scenario: ticker maps to its own binary name

- **WHEN** `pkg_bin "ticker"` is called
- **THEN** the function returns `ticker` (via the default identity mapping)

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

### Requirement: Non-macOS fallback includes all new packages

The non-macOS branch of the install script SHALL list its brew packages in the manual
installation instructions. opencode SHALL be listed under the official-script install
instructions (not the brew package list), consistent with the macOS branch.

The CLI-tools list in the non-macOS branch SHALL include `glow` and `mdfried`. The `mdfried` entry
SHALL note that its image / `mermaid` / Big-Header rendering requires a terminal that supports a
graphics protocol (Kitty, iTerm2, or Sixel) and otherwise degrades to character rendering.

#### Scenario: Non-macOS instructions are complete

- **WHEN** the script runs on a non-macOS system
- **THEN** the printed instructions include `fd`, `gh`, `git-delta`, `git`, `tmux`, `uv`, and `wget` alongside the original packages (excluding `mas`, which is macOS-only), and opencode appears under the official-installer instructions (`curl -fsSL https://opencode.ai/install | bash`) rather than the brew package list

#### Scenario: New Markdown viewers listed in non-macOS instructions

- **WHEN** the script runs on a non-macOS system
- **THEN** the printed CLI-tools instructions include `glow` and `mdfried`, with `mdfried` annotated as requiring a graphics-capable terminal
