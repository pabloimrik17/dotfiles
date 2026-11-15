# Design

## Context

See proposal.md for the problem. The managed `permissions.deny` is a whole leaf in the settings merge: every apply writes the template's array over the live one. Adding rules to the template is enough to converge existing machines. The guard is described in five places besides the template: the two specs, the installer's post-install line, the parity note and the manual/README. `tests/ibkr-mcp.test.ts` pins the template, the installer line and the parity note.

## Goals / Non-Goals

**Goals:**

- No IBKR tool that can place, change, cancel or confirm an order is callable from Claude Code in any permission mode.
- The reads `stonks` needs stay unprompted by any deny.

**Non-Goals:**

- The `stonks` plugin's known-tool set, its warnings and its `stonks-sync` spec. Those move in pabloimrik17/daily-agentic-task-force#31, after this lands.
- Guarding non-order writes (alerts, watchlists, feedback, saved screeners).
- Detecting future IBKR catalog changes from dotfiles.

## Decisions

**Exact names, no wildcard.** A `mcp__ibkr__*` deny would block the reads; a pattern such as `mcp__ibkr__*_order` is not a supported rule form and would miss `answer_order_question`. Alternative rejected: an `ask` rule for the order tools. In auto mode, `ask` still reaches the user, but a mis-click places a real order. Deny is the only form with no approval path.

**Append the four rules after the two instruction rules.** That keeps the existing order and gives tests one fixed six-item sequence. The two obsolete rules stay: a deny for a missing tool is inert, and it covers IBKR restoring them.

**Deny `answer_order_question`.** It confirms the questions IBKR raises before placing an order, so it is the last step before execution. Denying it is a second barrier if IBKR adds another submit-like tool that the list misses.

**Leave `preview_order` undenied.** It returns what an order would do without placing it. A deny would break the rule that every IBKR deny covers a tool that changes the account. The spec names it as undenied, so a reversal is an explicit spec change.

**Saved-screener writes stay outside the guard,** like alerts and watchlists. They touch no position or order.

**Tests keep reading the server prefix from `MCP_HTTP_SERVERS`.** Extend the rule list and the not-denied list; add a merge case that hand-removes `submit_order` and one that starts from the old two-rule deny. The parity assertion moves from `order-drafting deny` to `order-placement deny`.

## Risks / Trade-offs

- [IBKR adds another order tool under a new name] → It lands behind the normal prompt until someone adds a rule. The `stonks` unknown-tool warning, with the order-capable tier proposed in pabloimrik17/daily-agentic-task-force#31, is the signal. `answer_order_question` stays denied as a backstop.
- [`preview_order` is not actually read-only] → Its read-only marker was not checked while this proposal was written (the `ibkr` server was not connected). Task 1.1 records the markers before any edit. If `preview_order` is not read-only, stop and amend the spec to deny it.
- [Tool names change again] → The deny matches nothing, as now. Same mitigation as above.

## Migration Plan

`chezmoi apply` rewrites `permissions.deny` on each machine. Rollback: revert the commit and apply again.
