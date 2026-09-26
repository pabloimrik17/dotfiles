# Delta: llmfit-install

## MODIFIED Requirements

### Requirement: llmfit follows the brew group's idempotency and failure contract

llmfit SHALL be installed with the same handling applied to every other entry in `BREW_PACKAGES`: a `command -v` skip check before installing, and a non-fatal error path.

Homebrew 6 gates non-official taps behind `brew trust`. The tap loop SHALL trust `AlexsJones/llmfit`
before registering it, as it does every `BREW_TAPS` entry (see `cli-tool-expansion`), so
`brew tap AlexsJones/llmfit` passes its post-tap audit on a fresh host and `brew outdated` reports
the formula. This replaces the earlier contract, which relied on `brew install
AlexsJones/llmfit/llmfit` registering the tap as a side effect and declined to add a `brew trust`
step.

#### Scenario: Idempotent re-run

- **WHEN** the brew packages group's install loop runs on a host where `command -v llmfit` already succeeds
- **THEN** the script logs `AlexsJones/llmfit/llmfit — already installed, skipping` and does NOT invoke `brew install`
- **AND** on a host where every entry is already present the pre-scan short-circuits before the loop, reporting `Brew packages: N/N installed` instead

#### Scenario: Installation failure is non-fatal

- **WHEN** `brew install AlexsJones/llmfit/llmfit` fails (e.g., release asset unavailable, network error)
- **THEN** the script increments the error counter, logs the failure, and continues with the remaining packages in `BREW_PACKAGES`

#### Scenario: Tap registration failure is non-fatal

- **WHEN** `brew trust --tap AlexsJones/llmfit` or `brew tap AlexsJones/llmfit` fails
- **THEN** the tap loop logs `Failed to trust tap AlexsJones/llmfit` or
  `Failed to tap AlexsJones/llmfit`, increments the error counter, and the script continues to the
  pre-scan and install loop

#### Scenario: Untrusted tap does not block the install

- **WHEN** the brew group runs on a Homebrew 6 host where `AlexsJones/llmfit` is neither trusted nor registered
- **THEN** `brew trust --tap AlexsJones/llmfit` records the tap in the trust store first, and
  `brew tap AlexsJones/llmfit` then registers it without the
  `Refusing to load formula … from untrusted tap` refusal
- **AND** `brew install AlexsJones/llmfit/llmfit` installs the binary from the registered tap
- **AND** on the next run both commands exit 0 without re-fetching the tap
