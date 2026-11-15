## RENAMED Requirements

- FROM: `### Requirement: IBKR order instruction creation and deletion are denied`
- TO: `### Requirement: IBKR order and order instruction writes are denied`

## MODIFIED Requirements

### Requirement: IBKR order and order instruction writes are denied

The managed `permissions.deny` array in `dot_claude/modify_settings.json.tmpl` SHALL include these six exact rules, in this order:

- `mcp__ibkr__create_order_instruction`
- `mcp__ibkr__delete_order_instruction`
- `mcp__ibkr__submit_order`
- `mcp__ibkr__modify_order`
- `mcp__ibkr__cancel_order`
- `mcp__ibkr__answer_order_question`

The last four can place, change or cancel a real order in the IBKR account; `answer_order_question` confirms the questions IBKR raises before it places an order. No approval inside IBKR's app stands between these calls and the order. The two instruction rules stay so the guard holds if IBKR restores those tools.

The managed settings SHALL NOT deny any other `mcp__ibkr__` tool. That includes the reads `mcp__ibkr__get_account_positions`, `mcp__ibkr__get_account_orders`, `mcp__ibkr__get_order_instructions`, `mcp__ibkr__get_order_status`, `mcp__ibkr__get_order_rules` and `mcp__ibkr__get_flow_type`, and `mcp__ibkr__preview_order`, which places no order. Applying the settings SHALL remove the obsolete deny for `mcp__ibkr__get_order_instructions`. Alert, watchlist, feedback and saved-screener writes (`create_saved_screener`, `update_saved_screener`, `delete_saved_screener`) are outside these order guards. The managed settings SHALL NOT add an IBKR rule to `permissions.allow` or `permissions.ask`: command-specific read pre-approvals belong to the `stonks` plugin's own `allowed-tools`. No permission list in the managed settings SHALL contain an `mcp__ibkr__*` wildcard. In `deny` it would block the reads; in `allow` or `ask` it would also cover future tools.

All six rules SHALL be present on every machine, with no chezmoi template conditional, matching the unconditional registration of the `ibkr` server. They SHALL be added alongside the rules required by "Deny rules block dangerous bash commands", which stay unchanged.

#### Scenario: Order drafting is denied

- **WHEN** a Claude Code session attempts to call `mcp__ibkr__create_order_instruction`
- **THEN** the deny rule SHALL match and the tool call SHALL be denied without prompting the user
- **AND** in auto mode the call SHALL NOT reach the safety classifier, because a matching deny rule resolves it first
- **AND** no order instruction SHALL be drafted in the IBKR account

#### Scenario: Order instruction deletion is denied

- **WHEN** a Claude Code session attempts to call `mcp__ibkr__delete_order_instruction`
- **THEN** the exact deny rule SHALL deny the call without prompting the user
- **AND** no order instruction SHALL be deleted in the IBKR account

#### Scenario: Order submission is denied

- **WHEN** a Claude Code session attempts to call `mcp__ibkr__submit_order`
- **THEN** the deny rule SHALL match and the tool call SHALL be denied without prompting the user
- **AND** in auto mode the call SHALL NOT reach the safety classifier, because a matching deny rule resolves it first
- **AND** no order SHALL be placed in the IBKR account

#### Scenario: Order changes, cancellations and question answers are denied

- **WHEN** a Claude Code session attempts to call `mcp__ibkr__modify_order`, `mcp__ibkr__cancel_order` or `mcp__ibkr__answer_order_question`
- **THEN** the exact deny rule for that tool SHALL deny the call without prompting the user
- **AND** no order SHALL be changed, cancelled or confirmed in the IBKR account

#### Scenario: Position and order reads are not denied

- **WHEN** a Claude Code session calls `mcp__ibkr__get_account_positions`, `mcp__ibkr__get_account_orders`, `mcp__ibkr__get_order_instructions`, `mcp__ibkr__get_order_status`, `mcp__ibkr__get_order_rules`, `mcp__ibkr__get_flow_type` or `mcp__ibkr__preview_order`
- **THEN** no deny rule SHALL match the call

#### Scenario: Saved-screener writes are not denied

- **WHEN** a Claude Code session calls `mcp__ibkr__create_saved_screener`, `mcp__ibkr__update_saved_screener` or `mcp__ibkr__delete_saved_screener`
- **THEN** no deny rule SHALL match the call

#### Scenario: The IBKR rules are exact

- **WHEN** the managed `permissions` object is inspected
- **THEN** its only `mcp__ibkr__` denies SHALL be the six rules listed above, in that order
- **AND** no permission list SHALL contain an `mcp__ibkr__*` wildcard

#### Scenario: Bash deny rules are preserved

- **WHEN** the managed `permissions.deny` array is inspected
- **THEN** it SHALL still contain every rule required by "Deny rules block dangerous bash commands"

#### Scenario: A hand-removed rule is restored on apply

- **WHEN** any of the six IBKR rules, such as `mcp__ibkr__submit_order`, is deleted by hand from `~/.claude/settings.json` and `chezmoi apply` runs
- **THEN** the managed `permissions.deny` array SHALL be written back with all six exact rules in it

#### Scenario: The obsolete read-tool deny is removed on apply

- **WHEN** `~/.claude/settings.json` denies `mcp__ibkr__get_order_instructions` and `chezmoi apply` runs
- **THEN** the obsolete deny SHALL be replaced by the six exact IBKR denies
- **AND** unrelated unmanaged settings SHALL be preserved
- **AND** a second apply SHALL leave the settings unchanged

#### Scenario: A machine with only the two instruction denies converges

- **WHEN** `~/.claude/settings.json` denies only `mcp__ibkr__create_order_instruction` and `mcp__ibkr__delete_order_instruction` and `chezmoi apply` runs
- **THEN** the managed `permissions.deny` array SHALL hold all six exact IBKR rules
- **AND** a second apply SHALL leave the settings unchanged
