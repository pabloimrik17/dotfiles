# Add stonks tooling

## Why

The `stonks` plugin in the `daily-agentic-task-force` marketplace (change `add-stonks-plugin`) runs `/stonks:sync`, a report-only comparison of the user's brokerage against the mirrors they keep by hand. Two of its inputs depend on things that only the machine can provide:

- **IBKR positions and active orders.** The plugin reads them from Interactive Brokers' official MCP server, with Claude Code as the client.
- **The tracking sheet**, a tab of the user's own Google Sheet on a personal Google account. The plugin reads it with the `gws` CLI.

Neither is on the machine today. The plugin must also never be able to draft an order: the IBKR server has a tool that drafts order instructions, and no session should be able to call it.

This change delivers those three things through the same mechanisms the repo already uses for every brew package, global MCP server and permission rule. The plugin PR merges after this one.

## What Changes

- **`gws` as a frozen brew package.**
  - Add `googleworkspace-cli` (homebrew/core, binary `gws`) to `BREW_PACKAGES`, with a `pkg_bin` arm `googleworkspace-cli` → `gws` and the row `googleworkspace-cli|0.22.5` in `BREW_VERSIONS`.
  - The freeze from `brew-version-pins` pins it after install and warns on drift, as it does for every other package. It is not a declared hold.
  - Record beside the declaration the one read command the stonks adapter relies on. Raising the row is a reviewed change made after that check passes on the candidate.
- **The `gws` OAuth client file, age-encrypted.**
  - The source `dot_config/gws/encrypted_private_client_secret.json.age` deploys to `~/.config/gws/client_secret.json` with mode 600, through the same age mechanism and convention as `ticker-config` and `add-plugin-configs`. The plaintext never appears in the repo.
  - The user creates the encrypted file from their own terminal during implementation, so its contents never reach an agent transcript. Agent-side checks print only `ok`, `match`, a file mode or a ciphertext header.
  - The file holds the client definition only. The refresh token stays in `gws`'s encrypted credential store, with its encryption key in the macOS Keychain, and is never in the repo.
- **One-time Google setup guidance, printed by the install script and documented in the README and the manual:**
  - On a new machine, with the client file deployed by `chezmoi apply`, the only remaining step is `gws auth login --scopes https://www.googleapis.com/auth/spreadsheets.readonly` with the personal Google account.
  - Creating your own GCP project with the Google Sheets API enabled, an OAuth consent screen set to **"In production"** (in "Testing", Google issues refresh tokens that expire after 7 days) and a **Desktop app** OAuth client is a one-time-ever step, not a per-machine one. Its output is the file that gets encrypted.
- **The official IBKR MCP server, registered at user scope as `ibkr`:**
  - a new `MCP_HTTP_SERVERS` entry runs `claude mcp add --scope user --transport http ibkr https://api.ibkr.com/v1/api/mcp-public`;
  - the install-script server count goes from 16 to 17;
  - OAuth happens on first use through `/mcp` (IBKR's login screen with 2FA, its AI agreements, one account). No secret is stored in the repo.
  - A manual-instructions line covers the login and how to revoke access.
  - The server is registered for Claude Code only. Codex, OpenCode and Junie get no entry, because the order-drafting deny exists only in Claude Code's settings.
- **The order-drafting tool is denied.** `permissions.deny` in `dot_claude/modify_settings.json.tmpl` gains the exact rule `mcp__ibkr__get_order_instructions`, so no session can draft an order. No other IBKR tool is denied, so reading positions and orders stays allowed, and no `mcp__ibkr__*` wildcard is used.
- **No global allow rule for the IBKR reads, on purpose.** The `stonks` plugin's `/stonks:sync` command pre-approves `mcp__ibkr__get_account_positions` and `mcp__ibkr__get_orders` through its own `allowed-tools`. The dotfiles add nothing to `permissions.allow` or `permissions.ask` for IBKR, so a reader should not take the missing rule for an omission. The approval is scoped to that command and does not apply in any other session.
- **Docs and parity.**
  - README: a "What's Included" row for `gws`, an `ibkr` row in the MCP Servers table, and the count raised to 17.
  - `docs/manual.html`: matching updates.
  - `.agents/skills/sync-agent-config/parity.md`: an `IBKR MCP` row that records why the other three agents have none.

Out of scope:

- The `stonks` plugin itself, its config file and its tests, which live in `daily-agentic-task-force`.
- The age-encrypted `~/.config/stonks/config.json`, handled by the separate dotfiles change `add-plugin-configs`.
- Any write scope for the sheet. `spreadsheets.readonly` is the only scope, because the plugin never writes to any source.
- `gcloud`, Google's Workspace MCP servers and the claude.ai Google connectors.
- Pre-approving the IBKR read tools in `permissions.allow`. The plugin's `/stonks:sync` command does it for itself through `allowed-tools`.
- Registering IBKR for Codex, OpenCode or Junie.

## Capabilities

### New Capabilities

- `googleworkspace-cli-install`: covers these parts of the Google Workspace CLI (`gws`):
  - the frozen brew entry and its update path, including the consumer check recorded beside the declaration;
  - the age-encrypted OAuth client file, deployed to `~/.config/gws/client_secret.json`;
  - the one-time Google setup guidance, which keeps every plaintext credential out of the repo;
  - the summary lines and the non-macOS hint.

### Modified Capabilities

- `cli-tool-expansion`: `BREW_PACKAGES` lists 32 packages, with `googleworkspace-cli` added and the unrelated `gws` formula excluded, and `pkg_bin` gains the `googleworkspace-cli` → `gws` arm. `BREW_TAPS` is unchanged because the formula is in homebrew/core.
- `mcp-global-config`:
  - The server-table requirement grows to 17 servers, with an `ibkr` http row.
  - The no-conditionals requirement's count goes to 17.
  - New requirements cover IBKR:
    - Claude Code only, with the name `ibkr` fixed as a contract;
    - OAuth on first use with no stored credential;
    - the manual-instructions line;
    - no local update lifecycle.
- `claude-user-preferences`: a new requirement denies `mcp__ibkr__get_order_instructions` exactly, leaves every other IBKR tool undenied and forbids an `mcp__ibkr__*` wildcard. The existing bash deny requirement is not modified.

The `brew-version-pins` rules already cover a new homebrew/core formula, so that capability does not change.

## Impact

- **Files touched by the implementation:**
  - `dot_config/gws/encrypted_private_client_secret.json.age`: the encrypted OAuth client file, created by the user (design D4).
  - `run_onchange_install-packages.sh.tmpl`: `BREW_PACKAGES`, `pkg_bin`, `BREW_VERSIONS`, the consumer-check comment, a `gws` guidance function called on both branches, `MCP_HTTP_SERVERS`, the manual-instructions IBKR line, the two closing `CLI tools:` lines and the non-macOS list with its hint.
  - `dot_claude/modify_settings.json.tmpl`: one `permissions.deny` entry.
  - Tests: `tests/brew-freeze.test.ts`, where the coverage count goes from 36 to 37, and a new `tests/googleworkspace-cli.test.ts`, which also guards the encrypted client file.
  - Docs: `README.md`, `docs/manual.html` and `.agents/skills/sync-agent-config/parity.md`.
- **Dependencies:**
  - Homebrew formula `googleworkspace-cli` 0.22.5. Its upstream is pre-1.0, says it is "not an officially supported Google product", and has had no release since 2026-03-31. Google has announced an official Workspace CLI, which could replace it.
  - The hosted IBKR endpoint. IBKR launched it in June 2026, so its tool names and output shapes may still change.
- **Manual, one-time user steps:**
  - once ever: the Google Cloud setup, then encrypting the resulting client file into the repo from the user's own terminal;
  - per machine: `gws auth login`, and the IBKR OAuth login through `/mcp`.

  The repo stores no plaintext credential and no token. The client file is in it only as age ciphertext.
- **Ordering with in-flight changes:**
  - `add-posthog-mcp` and `add-sentry-mcp`, both open on `main`, only add requirements to `mcp-global-config`. Neither modifies the server-table requirement this change modifies, so the three can archive in any order. See design D7 for the rule if that stops being true.
  - Both in-flight changes modify `claude-user-preferences` "MCP read-only tools are allowed". This change only adds a separate requirement there, so it does not collide with them.
- **Cross-repo contract:**
  - the MCP server name `ibkr`, which makes the tools `mcp__ibkr__get_account_positions`, `mcp__ibkr__get_orders` and `mcp__ibkr__get_order_instructions`;
  - `gws` on `PATH`.

  The `add-stonks-plugin` PR merges after this change and after `add-plugin-configs`. This change and `add-plugin-configs` touch disjoint files and can merge in either order.
