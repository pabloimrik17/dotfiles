## Purpose

Install the llmfit CLI — the terminal tool that scores which LLM models fit this machine's RAM, CPU and GPU — from its upstream Homebrew tap so every host gets a prebuilt binary, and keep it a purely on-demand tool: no chezmoi-managed configuration, no automated invocation, no automated migration of a pre-existing install.

## ADDED Requirements

### Requirement: llmfit is installed from the upstream Homebrew tap

The install script `run_onchange_install-packages.sh.tmpl` SHALL install llmfit from the `AlexsJones/llmfit` tap, not from `homebrew/core`. Two coordinated entries are required under the `{{ if eq .chezmoi.os "darwin" }}` branch:

- `BREW_TAPS` SHALL contain `AlexsJones/llmfit`, so the tap is registered by the existing tap loop before the `BREW_PACKAGES` pre-scan runs.
- `BREW_PACKAGES` SHALL contain the fully-qualified formula name `AlexsJones/llmfit/llmfit` and SHALL NOT contain the bare name `llmfit`.

The qualified name is normative, not stylistic, for two independent reasons. First, `brew install llmfit` resolves to the `homebrew/core` formula, which declares `rust` as a build dependency and publishes no `x86_64` macOS bottle, so on an Intel host it compiles from source on install and on every upgrade. Second, Homebrew 6 refuses to resolve a *bare* name into a non-official tap at all (`Refusing to load formula … from untrusted tap`); only the fully-qualified reference is exempt. The tap formula downloads the prebuilt release tarball for the running OS/arch, pinned by `sha256`, and installs a single binary with no build or runtime dependencies.

#### Scenario: Tap registered before the pre-scan

- **WHEN** the brew packages group runs on a macOS host
- **THEN** `brew tap AlexsJones/llmfit` has been executed before any `brew install` invocation of the group

#### Scenario: Package listed under its fully-qualified name

- **WHEN** the install script is loaded on a macOS host
- **THEN** the `BREW_PACKAGES` array contains `AlexsJones/llmfit/llmfit`
- **AND** it does NOT contain the bare entry `llmfit`

#### Scenario: Fresh install pulls a prebuilt binary

- **WHEN** the brew packages group runs on a host where `command -v llmfit` fails AND the user confirms the group prompt
- **THEN** `brew install AlexsJones/llmfit/llmfit` is executed, `llmfit` becomes available on PATH, and no Rust toolchain is fetched or invoked

#### Scenario: Core formula is not the install channel

- **WHEN** the dotfiles source tree is inspected after this change is applied
- **THEN** no script, template or documented automated step installs the `homebrew/core` `llmfit` formula

### Requirement: pkg_bin maps the qualified formula to the llmfit binary

The `pkg_bin()` function SHALL contain a dedicated `case` arm returning `llmfit` for `AlexsJones/llmfit/llmfit`. Without it the default identity mapping would probe for a binary literally named `AlexsJones/llmfit/llmfit`, so the pre-scan would count llmfit as pending and the install loop would re-run `brew install` on every host, forever.

#### Scenario: Qualified formula maps to its binary

- **WHEN** `pkg_bin "AlexsJones/llmfit/llmfit"` is called
- **THEN** the function returns `llmfit`

#### Scenario: Pre-scan counts llmfit correctly

- **WHEN** the pre-scan runs on a host where `llmfit` is already on PATH
- **THEN** llmfit does NOT contribute to the `BREW_PENDING` count

### Requirement: llmfit follows the brew group's idempotency and failure contract

llmfit SHALL be installed with the same handling applied to every other entry in `BREW_PACKAGES`: a `command -v` skip check before installing, and a non-fatal error path.

Homebrew 6 gates non-official taps behind `brew trust`. Registering the tap and installing from it are gated differently, and the group SHALL rely only on the ungated path: `brew tap AlexsJones/llmfit` fails on a host where the tap is neither trusted nor already registered, while `brew install AlexsJones/llmfit/llmfit` resolves the formula and registers the tap as a side effect. The `BREW_TAPS` entry is therefore an optimisation, not a precondition, and the change SHALL NOT add a `brew trust` step.

#### Scenario: Idempotent re-run

- **WHEN** the brew packages group's install loop runs on a host where `command -v llmfit` already succeeds
- **THEN** the script logs `AlexsJones/llmfit/llmfit — already installed, skipping` and does NOT invoke `brew install`
- **AND** on a host where every entry is already present the pre-scan short-circuits before the loop, reporting `Brew packages: 29/29 installed` instead

#### Scenario: Installation failure is non-fatal

- **WHEN** `brew install AlexsJones/llmfit/llmfit` fails (e.g., release asset unavailable, network error)
- **THEN** the script increments the error counter, logs the failure, and continues with the remaining packages in `BREW_PACKAGES`

#### Scenario: Tap registration failure is non-fatal

- **WHEN** `brew tap AlexsJones/llmfit` fails
- **THEN** the existing tap loop logs `Failed to tap AlexsJones/llmfit`, increments the error counter, and the script continues to the pre-scan and install loop

#### Scenario: Untrusted tap does not block the install

- **WHEN** the brew group runs on a Homebrew 6 host where `AlexsJones/llmfit` is neither trusted nor registered
- **THEN** `brew tap AlexsJones/llmfit` exits non-zero with `Refusing to load formula … from untrusted tap`, leaves the tap unregistered, and is absorbed by the tap loop's error path
- **AND** `brew install AlexsJones/llmfit/llmfit` still resolves the tap formula, installs the binary and registers the tap, because a fully-qualified reference is not gated
- **AND** on the next run `brew tap AlexsJones/llmfit` exits 0 without output

### Requirement: A pre-existing llmfit install is never modified automatically

The install script SHALL NOT uninstall, unlink, relink or otherwise rewrite an `llmfit` already present on the host, including one installed from `homebrew/core`. Because the group's skip check is `command -v llmfit`, such a host is left exactly as it is and the tap formula is not installed there.

Switching an existing core install over to the tap SHALL be documented as a manual, one-time step in the install script's "Manual Installation Required" section, naming both commands (`brew uninstall llmfit`, then `brew install AlexsJones/llmfit/llmfit`) and the reason (the core formula builds from source where no bottle is published for the host's OS/arch).

#### Scenario: Host already carrying the core formula

- **WHEN** the brew packages group runs on a host where `llmfit` from `homebrew/core` is installed and linked
- **THEN** the group reports llmfit as already installed and performs no install, uninstall, unlink or relink
- **AND** no formula conflict or link collision is produced

#### Scenario: Migration is documented, not performed

- **WHEN** the install script prints its "Manual Installation Required" section
- **THEN** it includes an llmfit entry describing the one-time switch from the `homebrew/core` formula to `AlexsJones/llmfit/llmfit`, and the switch is left to the user

### Requirement: Closing summary line lists llmfit

The install script's final `info` line that enumerates installed CLI tools (printed under the macOS branch) SHALL include `llmfit` after `mdfried` in the comma-separated CLI tools list. The summary SHALL use the binary name `llmfit`, not the qualified formula name.

#### Scenario: Summary mentions llmfit

- **WHEN** the macOS branch of the install script completes successfully
- **THEN** the closing `info "Installation complete!"` block's `CLI tools:` line includes the token `llmfit`

### Requirement: Non-macOS branch documents llmfit as cross-platform

The `{{ else -}}` (non-macOS) branch SHALL include `llmfit` in its CLI-tools list and SHALL NOT mark it macOS-only — unlike `mole` and `aoe`, upstream ships Linux binaries. Its annotated entry SHALL name the tap install (`brew install AlexsJones/llmfit/llmfit`) and at least one brew-free fallback (`uv tool install -U llmfit`, which needs no new dependency because `uv` is already installed).

#### Scenario: Linux instructions include llmfit

- **WHEN** the install script runs on a non-macOS system
- **THEN** the printed CLI-tools list includes `llmfit`
- **AND** an annotated entry names both the tap install and a brew-free fallback
- **AND** no "macOS-only" notice is printed for it

### Requirement: No chezmoi-managed configuration is shipped for llmfit

The dotfiles source tree SHALL NOT contain a chezmoi-managed llmfit configuration file: no `dot_config/llmfit/`, no `custom_models.json`, no encrypted variant. No template SHALL export `LLMFIT_CUSTOM_MODELS` or `OLLAMA_CONTEXT_LENGTH` on llmfit's behalf. llmfit reads no dotfile; hardware detection is automatic and every override is a command-line flag.

#### Scenario: Source tree has no llmfit config

- **WHEN** the dotfiles source tree is inspected after this change is applied
- **THEN** llmfit appears only in the install script's tap/package/summary/manual lines and in user-facing documentation, and no managed config target exists for it

#### Scenario: No llmfit environment variables are exported

- **WHEN** `chezmoi apply` runs and a new interactive shell starts
- **THEN** neither `LLMFIT_CUSTOM_MODELS` nor `OLLAMA_CONTEXT_LENGTH` is set by any deployed file

### Requirement: llmfit is invoked only on demand, never automatically

The dotfiles SHALL NOT invoke `llmfit` from any script, alias, chezmoi `run_*` script, git hook, agent hook or shell startup file. This covers the whole surface, but matters most for the subcommands with side effects: `download` (multi-gigabyte GGUF pulls), `run` and `serve` (start inference processes), `bench` (saturates the machine) and `update` (refreshes the catalog from HuggingFace).

`update-extra` SHALL NOT gain an llmfit step. Its remit is tools brew does not own; the binary is brew-managed via the tap, and a catalog refresh is a deliberate user action rather than routine maintenance.

#### Scenario: No automated llmfit invocation

- **WHEN** the dotfiles source tree is searched for `llmfit` used as a command invocation
- **THEN** zero matches are found outside the install script's package lists, summary and manual-instruction strings, and the documentation

#### Scenario: update-extra leaves llmfit alone

- **WHEN** the user runs `update-extra`
- **THEN** no llmfit step executes and no model catalog is fetched
