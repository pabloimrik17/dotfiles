## MODIFIED Requirements

### Requirement: Claude Code section documents claude-swap operations and boundaries

Section 11 of `docs/manual.html` SHALL document the pinned claude-swap integration within the existing 15-section structure. It SHALL cover machine-role policy, guided enrollment including the required `work2` and the optional `personal2`, native aliases, each machine type's trial rotation with its tiers, lines and simulation reference, the heavy-week hold-out, `cs-list`/`cs-current`/`cs-global`, global-versus-isolated behavior, dry-run, autoswitch activation and pause, LaunchAgent status, pin updates, credentials, recovery, and upstream limitations.

#### Scenario: Personal-machine operator follows the full workflow

- **WHEN** a personal-machine user reads the claude-swap subsection
- **THEN** they can enroll `personal`, `work` and `work2` without `/logout`, verify `personal` is active, run a dry-run, and install/check the menu service with autoswitch on
- **AND** they can enroll `personal2` with `claude-swap-setup --enroll personal2` and hold it out of rotation in unpaid months

#### Scenario: Work-machine operator avoids accidental rotation

- **WHEN** a work-machine user reads the subsection
- **THEN** they are told to keep only `work` and `work2`, that autoswitch rotates between those two, and to resolve an unexpected extra account explicitly rather than relying on automatic deletion

#### Scenario: Reader distinguishes global switching from session isolation

- **WHEN** the reader consults `cs-global` or `cswap switch`
- **THEN** the manual states that the default Claude Code identity changes globally
- **AND** it does not present `cswap run` as part of the managed workflow
- **AND** it states that a manual choice the engine would not make holds only while Auto-switch is paused

#### Scenario: Reader can recover safely

- **WHEN** account authentication, Keychain access, service startup, HTTP 429 usage telemetry, or an identity-affine feature fails
- **THEN** the subsection provides the corresponding supported status/manual/re-run recovery path
- **AND** it does not recommend committing credentials, using paid fallback, editing `menubar_settings.json`, or running a custom watcher

#### Scenario: Existing manual organization is preserved

- **WHEN** the manual is rendered after adding the subsection
- **THEN** Claude Code remains Section 11 and all existing sections retain their order through Agent Sessions as Section 15

#### Scenario: Reader sees the trial status

- **WHEN** a reader looks up why each machine type's rotation uses its tiers and lines
- **THEN** the subsection labels them a trial, lists the values of both machine types, and references the simulation in change `add-work2-rotation-policies`
- **AND** it explains that switch lines decide departure and landing but are not usage caps

#### Scenario: Reader plans a heavy work week

- **WHEN** a personal-machine user expects a work week above 1.5 times the measured work-Mac demand, or above that demand in a month without `personal2`
- **THEN** the subsection tells them to hold `work` and `work2` out with `cswap disable` from the weekend before and to re-enable them with `cswap enable` afterwards
