# Delta: claude-user-preferences

## ADDED Requirements

### Requirement: IBKR order instruction creation and deletion are denied

The managed `permissions.deny` array in `dot_claude/modify_settings.json.tmpl` SHALL include the exact rules `mcp__ibkr__create_order_instruction` and `mcp__ibkr__delete_order_instruction`. They block creation and deletion of order instructions. IBKR requires manual approval in its own app before an instruction becomes an order; these denies prevent Claude Code from creating or deleting those instructions at all.

The managed settings SHALL NOT deny any other `mcp__ibkr__` tool, including the read-only `mcp__ibkr__get_order_instructions`. Applying the settings SHALL remove the obsolete deny for that read tool. Reading positions (`mcp__ibkr__get_account_positions`) and active orders (`mcp__ibkr__get_account_orders`) stays unblocked. Alert, watchlist and feedback writes are outside these instruction guards. The managed settings SHALL NOT add an IBKR rule to `permissions.allow` or `permissions.ask`: command-specific read pre-approvals belong to the `stonks` plugin's own `allowed-tools`. No permission list in the managed settings SHALL contain an `mcp__ibkr__*` wildcard. In `deny` it would block the reads; in `allow` or `ask` it would also cover future tools.

Both rules SHALL be present on every machine, with no chezmoi template conditional, matching the unconditional registration of the `ibkr` server. They SHALL be added alongside the rules required by "Deny rules block dangerous bash commands", which stay unchanged.

#### Scenario: Order drafting is denied

- **WHEN** a Claude Code session attempts to call `mcp__ibkr__create_order_instruction`
- **THEN** the deny rule SHALL match and the tool call SHALL be denied without prompting the user
- **AND** in auto mode the call SHALL NOT reach the safety classifier, because a matching deny rule resolves it first
- **AND** no order instruction SHALL be drafted in the IBKR account

#### Scenario: Order instruction deletion is denied

- **WHEN** a Claude Code session attempts to call `mcp__ibkr__delete_order_instruction`
- **THEN** the exact deny rule SHALL deny the call without prompting the user
- **AND** no order instruction SHALL be deleted in the IBKR account

#### Scenario: Position and order reads are not denied

- **WHEN** a Claude Code session calls `mcp__ibkr__get_account_positions`, `mcp__ibkr__get_account_orders` or `mcp__ibkr__get_order_instructions`
- **THEN** no deny rule SHALL match the call

#### Scenario: The IBKR rules are exact

- **WHEN** the managed `permissions` object is inspected
- **THEN** its only `mcp__ibkr__` denies SHALL be `mcp__ibkr__create_order_instruction` and `mcp__ibkr__delete_order_instruction`
- **AND** no permission list SHALL contain an `mcp__ibkr__*` wildcard

#### Scenario: Bash deny rules are preserved

- **WHEN** the managed `permissions.deny` array is inspected
- **THEN** it SHALL still contain every rule required by "Deny rules block dangerous bash commands"

#### Scenario: A hand-removed rule is restored on apply

- **WHEN** either instruction-write rule is deleted by hand from `~/.claude/settings.json` and `chezmoi apply` runs
- **THEN** the managed `permissions.deny` array SHALL be written back with both exact rules in it

#### Scenario: The obsolete read-tool deny is removed on apply

- **WHEN** `~/.claude/settings.json` denies `mcp__ibkr__get_order_instructions` and `chezmoi apply` runs
- **THEN** the obsolete deny SHALL be replaced by both exact instruction-write denies
- **AND** unrelated unmanaged settings SHALL be preserved
- **AND** a second apply SHALL leave the settings unchanged
