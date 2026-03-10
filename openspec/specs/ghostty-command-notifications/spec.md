# Capability: ghostty-command-notifications

## Purpose

Configure Ghostty to send macOS desktop notifications when long-running commands complete while the terminal is unfocused, enabling awareness of background task completion.

## Requirements

### Requirement: Notify on long-running command completion when terminal is unfocused

The Ghostty config SHALL include `notify-on-command-finish = unfocused` to send a notification when a command finishes and the terminal is not focused.

#### Scenario: Long command finishes while user is in another app

- **WHEN** a command running longer than the configured threshold finishes and the Ghostty window is not focused
- **THEN** a macOS notification is sent indicating the command has completed

#### Scenario: Quick command does not trigger notification

- **WHEN** a command completes in less than 10 seconds (< 10s)
- **THEN** no notification is sent regardless of focus state

#### Scenario: Focused terminal does not notify

- **WHEN** a long-running command finishes and the Ghostty window is focused
- **THEN** no notification is sent (the user can already see the output)

### Requirement: Notification action is macOS desktop notification

The Ghostty config SHALL include `notify-on-command-finish-action = notify` to use macOS desktop notifications instead of the default bell-only action.

#### Scenario: Desktop notification appears

- **WHEN** a command-finish notification is triggered
- **THEN** a macOS desktop notification is displayed (not just a terminal bell)

### Requirement: Notification threshold is 10 seconds

The Ghostty config SHALL include `notify-on-command-finish-after = 10s` to only notify for commands that run for 10 seconds or longer (>= 10s).

#### Scenario: Command at threshold boundary

- **WHEN** a command runs for 10 seconds or longer (>= 10s)
- **THEN** the notification threshold is met and notification behavior applies
