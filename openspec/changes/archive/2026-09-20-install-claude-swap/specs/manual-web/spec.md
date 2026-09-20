## ADDED Requirements

### Requirement: Claude Code section documents claude-swap operations and boundaries

Section 11 of `docs/manual.html` SHALL document the pinned claude-swap integration within the existing 15-section structure. It SHALL cover machine-role policy, guided account enrollment, native account aliases, the 85% autoswitch policy, `cs-list`/`cs-current`/`cs-global`, global-versus-isolated behavior, dry-run, menu activation and pause, LaunchAgent status, pin-based updates, credential ownership, recovery, and accepted upstream limitations.

#### Scenario: Personal-machine operator follows the full workflow

- **WHEN** a personal-machine user reads the claude-swap subsection
- **THEN** they can enroll `personal` and `work` without `/logout`, verify `personal` is active, run a dry-run, install/check the menu service, and enable auto-switch from the supported menu toggle

#### Scenario: Work-machine operator avoids accidental rotation

- **WHEN** a work-machine user reads the subsection
- **THEN** they are told to retain only `work`, leave auto-switch disabled, and resolve an unexpected extra account explicitly rather than relying on automatic deletion

#### Scenario: Reader distinguishes global switching from session isolation

- **WHEN** the reader consults `cs-global` or `cswap switch`
- **THEN** the manual states that the default Claude Code identity changes globally
- **AND** it does not present `cswap run` as part of the managed workflow

#### Scenario: Reader can recover safely

- **WHEN** account authentication, Keychain access, service startup, HTTP 429 usage telemetry, or an identity-affine feature fails
- **THEN** the subsection provides the corresponding supported status/manual/re-run recovery path
- **AND** it does not recommend committing credentials, using paid fallback, editing `menubar_settings.json`, or running a custom watcher

#### Scenario: Existing manual organization is preserved

- **WHEN** the manual is rendered after adding the subsection
- **THEN** Claude Code remains Section 11 and all existing sections retain their order through Agent Sessions as Section 15
