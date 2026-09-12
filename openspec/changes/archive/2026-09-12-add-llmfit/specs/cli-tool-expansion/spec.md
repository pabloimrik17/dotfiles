## MODIFIED Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 29 packages:

`git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`,
`lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`,
`uv`, `mas`, `wget`, `television`, `tickrs`, `ticker`, `age`, `mole`, `aoe`,
`glow`, `mdfried`, `AlexsJones/llmfit/llmfit`

`opencode` SHALL NOT appear in `BREW_PACKAGES`; it is installed via its official script
(see the `opencode-install` capability). Removing it also makes the `anomalyco/tap` tap
unnecessary for this array.

`glow` and `mdfried` are both in `homebrew/core`, so they require no `BREW_TAPS` entry, and both
use the identity `pkg_bin` mapping (binary name equals package name).

`AlexsJones/llmfit/llmfit` is the only entry written as a fully-qualified formula name. The bare
name `llmfit` SHALL NOT be used, because it resolves to the `homebrew/core` formula instead of the
tap the `llmfit-install` capability requires. Being tap-qualified, it needs an `AlexsJones/llmfit`
entry in `BREW_TAPS` and its own `pkg_bin` arm (the identity mapping would probe for a binary named
`AlexsJones/llmfit/llmfit`).

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 29 entries

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

#### Scenario: llmfit listed in array under its tap-qualified name

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `AlexsJones/llmfit/llmfit`
- **AND** it does NOT contain the bare entry `llmfit`

#### Scenario: llmfit maps to its binary name

- **WHEN** `pkg_bin "AlexsJones/llmfit/llmfit"` is called
- **THEN** the function returns `llmfit` (via a dedicated `case` arm, not the identity mapping)

### Requirement: pkg_bin function maps all packages to their binary names

The `pkg_bin()` function SHALL map package names to their command-line binary names for idempotency checks. The following mappings SHALL exist:

| Package                    | Binary   |
| -------------------------- | -------- |
| `ripgrep`                  | `rg`     |
| `git-delta`                | `delta`  |
| `worktrunk`                | `wt`     |
| `beads`                    | `bd`     |
| `television`               | `tv`     |
| `AlexsJones/llmfit/llmfit` | `llmfit` |

All other packages SHALL map to their own name (identity mapping via the default `*` case).

The `worktrunk` and `beads` rows are not new: both arms already exist in the script and were
missing from this table, which claimed they fell under the identity mapping.

The `AlexsJones/llmfit/llmfit` mapping exists for a different reason than the others: the binary is
not renamed, the package name is tap-qualified (see the `llmfit-install` capability). Any future
tap-qualified entry SHALL likewise get its own arm.

#### Scenario: git-delta maps to delta

- **WHEN** `pkg_bin "git-delta"` is called
- **THEN** the function returns `delta`

#### Scenario: Standard package maps to itself

- **WHEN** `pkg_bin "fd"` is called
- **THEN** the function returns `fd`

#### Scenario: Tap-qualified package maps to its unqualified binary

- **WHEN** `pkg_bin "AlexsJones/llmfit/llmfit"` is called
- **THEN** the function returns `llmfit`, so the `command -v` skip check probes the real binary name

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

### Requirement: BREW_TAPS array registers third-party Homebrew taps before installs

The install script SHALL declare a `BREW_TAPS` array immediately above `BREW_PACKAGES` listing every third-party tap required by any package in `BREW_PACKAGES`. Before the BREW_PACKAGES pre-scan runs, the script SHALL iterate `BREW_TAPS` and run `brew tap "$tap"` for each entry. `brew tap` SHALL be considered idempotent — re-running on a host where the tap is already registered SHALL succeed without re-fetching.

The value of `BREW_TAPS` SHALL be `(tarkah/tickrs achannarasappa/tap AlexsJones/llmfit)` — the taps currently required (for the `tickrs`, `ticker` and `llmfit` formulas respectively).

Homebrew 6 refuses to load formulae from a tap that is not listed in `brew trust`'s store. This
splits the loop's behaviour by host state, and the array SHALL be treated as an optimisation rather
than a precondition:

- On a host where the tap is **already registered**, `brew tap "$tap"` exits 0 without re-fetching
  the tap, though Homebrew may still refresh its API data on the first call of a session — the
  idempotency guarantee above still holds.
- On a host where it is **not**, `brew tap "$tap"` clones, fails its post-tap formula audit with
  `Refusing to load formula … from untrusted tap`, rolls the clone back and exits non-zero. The
  loop's existing `error` path absorbs it; the script continues.

Installing by **fully-qualified** name is not gated, so `brew install AlexsJones/llmfit/llmfit`
resolves the formula and registers the tap as a side effect. Bare names that would resolve into a
third-party tap **are** gated: on an untrusted host `brew install tickrs` and `brew install ticker`
now fail. That is a pre-existing defect of those two entries, not introduced here, and is out of
scope for this change.

No `brew trust` step SHALL be added by this change.

#### Scenario: Tap loop runs before package install loop

- **WHEN** the install script reaches the brew packages group
- **THEN** every entry in `BREW_TAPS` is tapped via `brew tap "$tap"` before any `brew install` invocation

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

- **WHEN** the install script runs on a host where every entry in `BREW_TAPS` is already tapped
- **THEN** each `brew tap "$tap"` exits successfully without printing a warning and the script continues

#### Scenario: Untrusted tap fails the loop without failing the run

- **WHEN** the tap loop runs on a Homebrew 6 host where a `BREW_TAPS` entry is neither trusted nor already registered
- **THEN** `brew tap "$tap"` exits non-zero, the tap is left unregistered, the loop logs `Failed to tap $tap` and increments the error counter
- **AND** the script continues to the pre-scan and install loop rather than aborting

#### Scenario: Fully-qualified install bypasses the trust gate

- **WHEN** the install loop runs `brew install AlexsJones/llmfit/llmfit` on that same host
- **THEN** the formula resolves from the `alexsjones/llmfit` tap, the binary installs, and the tap becomes registered as a side effect
- **AND** no `brew trust` invocation is required or performed
