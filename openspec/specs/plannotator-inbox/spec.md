# plannotator-inbox Specification

## Purpose

Provide reproducible local Plannotator Inbox availability and explicit onboarding so agents can exchange questions, attachments and replies with the user.

## Requirements

### Requirement: Setup recognizes Inbox-capable installations

Setup SHALL resolve Plannotator from PATH or `~/.local/bin/plannotator` and check the installed Inbox guide before installing or upgrading. A compatible installation SHALL be reused. Missing or outdated installations SHALL use the official non-interactive installer within the existing installation consent flow.

#### Scenario: Compatible binary is outside PATH

- **WHEN** `~/.local/bin/plannotator inbox --help` succeeds and starts with `# Plannotator Inbox: a guide for agents`
- **THEN** setup SHALL reuse that absolute binary path without reinstalling

#### Scenario: Missing binary or old release

- **WHEN** no usable binary exists or its successful help output lacks the Inbox guide marker
- **AND** installation or upgrade is accepted
- **THEN** setup SHALL run the official installer with `--non-interactive`; Git is a setup prerequisite
- **AND** it SHALL verify the resulting binary and Inbox help before reporting readiness

#### Scenario: Unexpected command failure

- **WHEN** capability detection or installation fails due to permissions, sandboxing or network access
- **THEN** setup SHALL report the failing command and leave the step incomplete
- **AND** agent-led onboarding SHALL stop and provide the exact command for the user's terminal

### Requirement: OpenCode native Inbox activation is manual

The setup SHALL reuse the existing OpenCode plugin without adding a duplicate MCP transport. Plannotator configuration SHALL remain application-owned. Documentation SHALL instruct the user to enable the OpenCode Inbox tool in Inbox Settings once per machine.

#### Scenario: Fresh machine

- **WHEN** the user completes OpenCode Inbox onboarding
- **THEN** they SHALL enable the native tool in Inbox Settings and restart OpenCode
- **AND** chezmoi SHALL NOT manage `~/.plannotator/config.json`

### Requirement: Interactive onboarding stays separate from automatic apply

Automatic apply SHALL configure availability without opening a browser, sending messages, waiting for replies, or installing instruction notes. Agent-led onboarding SHALL identify its host, reuse completed setup, start Inbox locally, and open its window without automatically connecting additional unselected agents.

#### Scenario: User opens Inbox during onboarding

- **WHEN** onboarding starts the Inbox and opens its UI
- **THEN** it SHALL use `plannotator inbox --background` followed by `PLANNOTATOR_INBOX_CONNECT=0 plannotator inbox`
- **AND** it SHALL print the returned URL if the browser cannot open
- **AND** it SHALL explain that newly registered connections require a new agent session

#### Scenario: Local lifecycle

- **WHEN** setup or an agent starts Inbox
- **THEN** the Inbox SHALL bind to loopback using Plannotator's own lifecycle
- **AND** the setup SHALL NOT enable Tailscale, pin a port, install a background service, stop processes, run uninstall or delete Inbox data

### Requirement: Instruction notes require host-specific consent

Onboarding SHALL present the installed guide's exact agent IDs and instruction paths before running `plannotator inbox --notes`. It SHALL run that command only for explicitly selected supported IDs after consent in chat. Existing notes and unrelated user instructions SHALL be preserved; user note files SHALL remain outside chezmoi ownership in this change.

#### Scenario: User chooses only Codex

- **WHEN** the user approves only Codex after seeing the paths
- **THEN** onboarding SHALL run `plannotator inbox --notes codex` and no other host ID

#### Scenario: No selection or unsupported host

- **WHEN** no approval is given or the guide lists no note target for a host
- **THEN** onboarding SHALL leave that host's instruction files untouched and document the limitation

### Requirement: Onboarding verifies a real reply

Onboarding SHALL send one idempotent first question using the native Inbox tool when available or stdio MCP otherwise. It SHALL confirm success only after receiving and quoting the user's reply, then resolve that first thread. Further work attachments SHALL be sent only when the reply requests them.

#### Scenario: First exchange

- **WHEN** the user sends an answer to the first question
- **THEN** onboarding SHALL receive it in the sending session, quote it back and resolve the thread using its identifier
- **AND** any follow-up SHALL concern actual project work with attached files where referenced

#### Scenario: Setup was already run

- **WHEN** the idempotency key identifies an existing first message
- **THEN** onboarding SHALL read that thread, reuse its reply if present and avoid a duplicate question

#### Scenario: Reply has not arrived

- **WHEN** a polling host receives a waiting result
- **THEN** it SHALL retain the returned cursor and use waits of at most 45 seconds
- **AND** after about five minutes it SHALL report the reply check as pending, without inventing an answer or resolving the thread

### Requirement: Documentation describes delivery and storage accurately

User documentation SHALL describe local storage, opening the Inbox later, browser notification preferences, new-session activation and host-specific reply delivery. It SHALL distinguish successful configuration from a completed message/reply check.

#### Scenario: User consults the manual

- **WHEN** the user reads the Inbox workflow
- **THEN** it SHALL explain `plannotator inbox`, default data under `~/.plannotator/inbox/`, and browser notifications controlled in Inbox Settings
- **AND** it SHALL distinguish native automatic delivery for supported Claude Code/OpenCode sessions from `wait_for_reply` for Codex, Junie and OpenCode 1
