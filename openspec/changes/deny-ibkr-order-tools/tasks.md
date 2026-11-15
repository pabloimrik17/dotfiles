# Tasks

## 1. Confirm the catalog

- [ ] 1.1 In a Claude Code session with `ibkr` authenticated, list the server's tools in `/mcp` and record each order and saved-screener tool's read-only marker in `openspec/changes/deny-ibkr-order-tools/catalog-observation.md`; verify `submit_order`, `modify_order`, `cancel_order` and `answer_order_question` exist and `preview_order` is marked read-only, else stop and amend the spec before going on

## 2. Deny rules

- [ ] 2.1 Append `mcp__ibkr__submit_order`, `mcp__ibkr__modify_order`, `mcp__ibkr__cancel_order` and `mcp__ibkr__answer_order_question` after the two instruction rules in `permissions.deny` of `dot_claude/modify_settings.json.tmpl`
- [ ] 2.2 In `tests/ibkr-mcp.test.ts`, extend the "IBKR order instruction denies" suite: the six-rule exact list, the not-denied reads (`get_order_status`, `get_order_rules`, `get_flow_type`, `preview_order`) and saved-screener writes, and merge cases starting from a hand-removed `submit_order` and from the old two-rule deny; verify `bun test tests/ibkr-mcp.test.ts` passes
- [ ] 2.3 Run `chezmoi diff ~/.claude/settings.json` and verify the only change is the four added deny entries

## 3. Descriptions of the guard

- [ ] 3.1 Rewrite the IBKR line in "Manual Installation Required" of `run_onchange_install-packages.sh.tmpl` to name all six denied tools; update the installer-line assertions in `tests/ibkr-mcp.test.ts` to the new names and verify they pass
- [ ] 3.2 Reword the IBKR MCP note in `.agents/skills/sync-agent-config/parity.md` around the order-placement deny, keeping `only consumer` and `` `stonks` ``; update the parity assertion to `order-placement deny` and verify it passes
- [ ] 3.3 Update the ibkr row in `docs/manual.html` to list the six denied tools, and the README MCP table cell to "order placement and instruction writes denied"; verify with `grep -n "submit_order" docs/manual.html` and by reading the README row

## 4. Integration

- [ ] 4.1 Run `openspec validate deny-ibkr-order-tools --strict` and the full `bun test`; verify both pass
- [ ] 4.2 After `chezmoi apply`, verify `/permissions` in a live session lists the six IBKR denies and that `mcp__ibkr__get_account_positions` still runs; never call an order tool to test the deny, since a miss would place a real order

## Workflow follow-up

- Tell pabloimrik17/daily-agentic-task-force#31 the deny list landed, so the plugin can add the order tools to its known set.
- Archive the change after review.
