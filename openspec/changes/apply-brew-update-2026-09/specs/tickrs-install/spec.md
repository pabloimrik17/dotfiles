## MODIFIED Requirements

### Requirement: tickrs is installed via the tarkah/tickrs Homebrew tap

The install script SHALL install the `tickrs` binary on macOS by tapping `tarkah/tickrs`, granting that tap trust, and then running `brew install tarkah/tickrs/tickrs`. The tap step SHALL run unconditionally on every script invocation, relying on `brew tap`'s native idempotency — re-runs SHALL exit 0 without re-fetching the tap. The install step SHALL participate in the existing brew packages group's confirm prompt and idempotency logic — re-runs on a host with `tickrs` already in PATH SHALL skip the install with an informational `already installed, skipping` message.

The formula SHALL be addressed by its fully-qualified name, for the same reason as `ticker`: Homebrew 6 refuses to load a bare-named formula from an untrusted tap, and omits untrusted taps from `brew outdated`.

#### Scenario: Fresh macOS install adds the tap and installs tickrs

- **WHEN** the install script runs on a macOS host where `tickrs` is not in PATH and `tarkah/tickrs` is not yet tapped, and the user accepts the brew packages group prompt
- **THEN** the script taps `tarkah/tickrs`, grants it trust, runs `brew install tarkah/tickrs/tickrs`, and the `tickrs` binary becomes available in PATH

#### Scenario: tickrs already installed is skipped

- **WHEN** the install script runs and `command -v tickrs` returns success
- **THEN** the script logs `tickrs — already installed, skipping` and does not run the install again

#### Scenario: Tap is idempotent across runs

- **WHEN** the install script runs and `tarkah/tickrs` is already tapped
- **THEN** `brew tap tarkah/tickrs` exits 0 without re-fetching the tap and the script continues without warning

#### Scenario: Bare formula name is not used

- **WHEN** the install script's tickrs install command is read
- **THEN** it addresses the formula as `tarkah/tickrs/tickrs`, not as `tickrs`
