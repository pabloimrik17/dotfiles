# Delta: claude-user-preferences

## ADDED Requirements

### Requirement: IBKR order drafting tool is denied

The managed `permissions.deny` array in `dot_claude/modify_settings.json.tmpl` SHALL include the exact rule `mcp__ibkr__get_order_instructions`. Of the tools on the `ibkr` server (see `mcp-global-config`), this one alone creates something in the brokerage account: it drafts order instructions. IBKR asks for manual approval in its own app before a draft becomes an order. The deny goes further: no Claude Code session can create a draft at all.

The managed settings SHALL NOT deny any other `mcp__ibkr__` tool. Reading positions (`mcp__ibkr__get_account_positions`) and active orders (`mcp__ibkr__get_orders`) stays allowed. The managed settings SHALL NOT add an IBKR rule to `permissions.allow` or `permissions.ask`: the `stonks` plugin's `/stonks:sync` command pre-approves `mcp__ibkr__get_account_positions` and `mcp__ibkr__get_orders` itself, through its own `allowed-tools`, so the dotfiles need no global rule for them. No permission list in the managed settings SHALL contain an `mcp__ibkr__*` wildcard. In `deny` it would block those reads. In `allow` or `ask` it would also cover any tool IBKR adds to the server later.

The rule SHALL be present on every machine, with no chezmoi template conditional, matching the unconditional registration of the `ibkr` server. It SHALL be added alongside the rules required by "Deny rules block dangerous bash commands", which stay unchanged.

#### Scenario: Order drafting is denied

- **WHEN** a Claude Code session attempts to call `mcp__ibkr__get_order_instructions`
- **THEN** the deny rule SHALL match and the tool call SHALL be denied without prompting the user
- **AND** in auto mode the call SHALL NOT reach the safety classifier, because a matching deny rule resolves it first
- **AND** no order instruction SHALL be drafted in the IBKR account

#### Scenario: Position and order reads are not denied

- **WHEN** a Claude Code session calls `mcp__ibkr__get_account_positions` or `mcp__ibkr__get_orders`
- **THEN** no deny rule SHALL match the call

#### Scenario: The IBKR rule is exact

- **WHEN** the managed `permissions` object is inspected
- **THEN** `permissions.deny` SHALL contain `mcp__ibkr__get_order_instructions` and no other `mcp__ibkr__` rule
- **AND** no permission list SHALL contain an `mcp__ibkr__*` wildcard

#### Scenario: Bash deny rules are preserved

- **WHEN** the managed `permissions.deny` array is inspected
- **THEN** it SHALL still contain every rule required by "Deny rules block dangerous bash commands"

#### Scenario: A hand-removed rule is restored on apply

- **WHEN** the rule is deleted by hand from `~/.claude/settings.json` and `chezmoi apply` runs
- **THEN** the managed `permissions.deny` array SHALL be written back with `mcp__ibkr__get_order_instructions` in it
