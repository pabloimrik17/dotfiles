## ADDED Requirements

### Requirement: Notify on long-running command completion when terminal is unfocused

The Ghostty config SHALL include `notify-on-command-finish = unfocused` to send a notification when a command finishes and the terminal is not focused.

#### Scenario: Long command finishes while user is in another app

- **WHEN** a command running longer than the configured threshold finishes and the Ghostty window is not focused
- **THEN** a macOS notification is sent indicating the command has completed

#### Scenario: Quick command does not trigger notification

- **WHEN** a command completes in under 10 seconds
- **THEN** no notification is sent regardless of focus state

#### Scenario: Focused terminal does not notify

- **WHEN** a long-running command finishes and the Ghostty window is focused
- **THEN** no notification is sent (the user can already see the output)

### Requirement: Notification threshold is 10 seconds

The Ghostty config SHALL include `notify-on-command-finish-after = 10s` to only notify for commands that run longer than 10 seconds.

#### Scenario: Command at threshold boundary

- **WHEN** a command runs for exactly 10 seconds or longer
- **THEN** the notification threshold is met and notification behavior applies
