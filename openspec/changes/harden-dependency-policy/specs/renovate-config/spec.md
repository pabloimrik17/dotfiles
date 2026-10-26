## MODIFIED Requirements

### Requirement: npm release-age floor is preserved

`renovate.json` SHALL retain a top-level `minimumReleaseAge` of `14 days`, override npm major/minor updates to `14 days`, and set patch updates across datasources to `3 days`. The local rules SHALL preserve the inherited null-age exemptions and PR notes for pin, replacement, and lockFileMaintenance. The security preset SHALL NOT be removed with `ignorePresets`.

#### Scenario: Top-level floor raised

- **WHEN** `renovate.json` is inspected
- **THEN** the top-level `minimumReleaseAge` is `"14 days"`

#### Scenario: npm window re-asserted

- **WHEN** an npm major or minor update is evaluated
- **THEN** a local rule matching npm and only major/minor sets the effective age to `14 days` after preset rules

#### Scenario: Patch window applies across datasources

- **WHEN** a routine patch update is evaluated
- **THEN** the local patch rule sets its release age to `3 days` without a datasource filter

#### Scenario: Preset exemptions survive

- **WHEN** an npm pin, replacement, or lockFileMaintenance update is evaluated
- **THEN** the inherited null-age exemption and PR notes remain effective
- **AND** weekly lockfile maintenance remains enabled

## ADDED Requirements

### Requirement: OSV supplies vulnerability-fix alerts

`renovate.json` SHALL enable `osvVulnerabilityAlerts`. Security updates SHALL preserve Renovate's default age bypass and existing vulnerability PR limit overrides, without requiring Dependabot alerts to be enabled.

#### Scenario: Direct dependency has an available security fix

- **WHEN** OSV reports a supported direct dependency vulnerability with an available fix
- **THEN** Renovate is configured to propose a vulnerability-fix update
- **AND** Renovate's routine release-age window does not delay the security update

#### Scenario: Scope of protection is explicit

- **WHEN** this configuration's coverage is documented
- **THEN** it covers supported direct dependencies without claiming transitive vulnerability scanning
