## MODIFIED Requirements

### Requirement: tmux status line shows application and session

The status line SHALL display two modules on the right side:

- `@catppuccin_status_application`: shows the running application name
- `@catppuccin_status_session`: shows the tmux session name

The left side SHALL be empty. Status right length SHALL be 100.

`status-right` SHALL be assigned so that its format string is stored and expanded when the status
line is drawn, NOT expanded once at the moment the assignment runs. The Catppuccin plugin that
defines both `@catppuccin_status_*` variables is loaded later in the configuration, so an
assignment that expands eagerly resolves both references against variables that do not exist yet and
stores an empty string. This requirement has therefore gone unmet since the modules were added: the
two variables resolve correctly once the plugin is loaded, but `status-right` holds the empty result
that was baked before it.

#### Scenario: status bar content

- **WHEN** user is in a tmux session running vim
- **THEN** the right status bar shows the application name ("vim") and the session name, styled with
  Catppuccin Mocha colors and rounded separators

#### Scenario: status-right survives plugin load order

- **WHEN** the tmux configuration has been fully loaded, including the Catppuccin plugin
- **THEN** the stored value of `status-right` still contains both `@catppuccin_status_*` references
  rather than an expansion performed before the plugin defined them

#### Scenario: Empty status-right is detectable

- **WHEN** the effective value of `status-right` is inspected on a running server
- **THEN** it is non-empty, so a regression to eager expansion is observable instead of silently
  rendering a blank right-hand status bar
