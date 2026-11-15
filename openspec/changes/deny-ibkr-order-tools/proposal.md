# Proposal

## Why

IBKR's MCP server dropped `create_order_instruction` and `delete_order_instruction` and added real order tools (github:pabloimrik17/dotfiles#228). The two managed `mcp__ibkr__` denies now match nothing. `submit_order`, `modify_order`, `cancel_order` and `answer_order_question` sit behind the normal prompt, and in auto mode the safety classifier decides on them without asking.

This must land before pabloimrik17/daily-agentic-task-force#31 adds the order tools to the `stonks` known set. That would silence the plugin's only warning about them.

## What Changes

- Add four exact rules to the managed `permissions.deny`: `mcp__ibkr__submit_order`, `mcp__ibkr__modify_order`, `mcp__ibkr__cancel_order`, `mcp__ibkr__answer_order_question`.
- Keep the two obsolete instruction denies. They cost nothing and cover a return of those tools.
- Keep the exact-set rule: no other `mcp__ibkr__` tool is denied and no list holds a `mcp__ibkr__*` wildcard. Name the tools that stay undenied: account and order reads, `preview_order`, `get_order_status`, `get_order_rules`, `get_flow_type`, and the saved-screener writes together with the alert, watchlist and feedback writes.
- Restate the rationale. IBKR's in-app approval no longer stands between Claude and an order; these tools place, change or cancel real orders.
- Update the guard's descriptions: installer post-install line, parity note, manual row, README MCP table cell.
- Extend `tests/ibkr-mcp.test.ts` to the six-rule set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-user-preferences`: the IBKR deny requirement covers order placement, change, cancellation and question answers, and names the tools that stay undenied.
- `mcp-global-config`: the `ibkr` name contract, rename, parity and manual-instruction scenarios list the full deny set instead of the two instruction tools.

## Impact

- `dot_claude/modify_settings.json.tmpl` (`permissions.deny`). `deny` is replaced as a whole leaf on merge, so existing machines need no migration.
- `tests/ibkr-mcp.test.ts`
- `run_onchange_install-packages.sh.tmpl` (IBKR line in "Manual Installation Required")
- `.agents/skills/sync-agent-config/parity.md` (IBKR MCP row)
- `docs/manual.html` (ibkr row), `README.md` (MCP table)
- Downstream: pabloimrik17/daily-agentic-task-force#31 rewrites the `stonks-sync` managed-settings scenario against this deny list.
