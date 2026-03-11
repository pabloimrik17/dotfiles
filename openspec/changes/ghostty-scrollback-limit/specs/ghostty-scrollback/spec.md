## ADDED Requirements

### Requirement: Scrollback buffer is set to 50MB

The Ghostty config SHALL include `scrollback-limit = 50000000` to provide ~50MB of scrollback per terminal surface, sufficient for extended AI coding sessions.

#### Scenario: Scrollback limit is configured

- **WHEN** the Ghostty config is applied
- **THEN** `dot_config/ghostty/config` contains `scrollback-limit = 50000000` in the Operational section

### Requirement: Scrollback unit is documented inline

The Ghostty config SHALL include an inline comment on the scrollback-limit line clarifying that the unit is bytes and allocation is lazy.

#### Scenario: Comment prevents unit confusion

- **WHEN** a contributor reads the scrollback-limit line
- **THEN** a same-line inline comment on the `scrollback-limit` entry states the value is in bytes and memory is allocated lazily
