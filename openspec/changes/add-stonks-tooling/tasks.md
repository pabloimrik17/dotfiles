# Tasks

Steps marked **USER** handle plaintext. Run them in your own terminal, outside any agent session. Do not use a `!`-prefixed command for them in Claude Code, because its output goes into the transcript. Agent steps only run checks that print `ok`, `match`, a file mode or a ciphertext header, never a configuration value. `$WT` is this worktree, `~/WebstormProjects/dotfiles-worktrees/feature-add-stonks-tooling`.

## 1. Frozen brew entry for `gws` (`cli-tool-expansion`, `googleworkspace-cli-install`)

- [ ] 1.1 Make these edits in `run_onchange_install-packages.sh.tmpl`:
  - add `googleworkspace-cli` to `BREW_PACKAGES` after `schpet/tap/linear`;
  - add the `pkg_bin` arm `googleworkspace-cli) echo "gws" ;;`;
  - add the row `"googleworkspace-cli|0.22.5"` to `BREW_VERSIONS` in alphabetical position, after `glow`.

  Add no `BREW_TAPS` entry and no `BREW_HOLDS` entry.

  Verify with a new `tests/googleworkspace-cli.test.ts`, which evaluates the real arrays with bash. It must check that:
  - `BREW_PACKAGES` has 32 entries, contains `googleworkspace-cli` and does not contain `gws`;
  - `pkg_bin googleworkspace-cli` prints `gws`;
  - `BREW_VERSIONS` has exactly one row for the formula;
  - no hold or tap mentions it.

  Also verify that `tests/brew-freeze.test.ts` passes with its coverage count raised from 36 to 37.
- [ ] 1.2 Write the consumer check from `googleworkspace-cli-install` into the comment block above `BREW_PACKAGES`, next to the `linear` checklist. It must contain:
  - the `gws sheets spreadsheets values get` command with `<spreadsheet-id>` and `<tab>` placeholders and `UNFORMATTED_VALUE`;
  - the expected `range` / `majorDimension` / `values` shape;
  - the tab-name-not-gid note;
  - the rule for raising the row: check, then `brew-upgrade-pinned googleworkspace-cli`, then bump.

  Verify with a test that asserts the block names each of these, and contains no real-looking spreadsheet ID (no token of 40 or more URL-safe characters).
- [ ] 1.3 Verify with a test that `update-extra` in `dot_zshrc.tmpl` mentions neither `gws` nor `googleworkspace-cli`.

## 2. `gws` guidance, summaries and docs (`googleworkspace-cli-install`)

- [ ] 2.1 Confirm the guidance inputs at 0.22.5 without logging in:
  - the client-configuration path (`~/.config/gws/client_secret.json`), which task 2.5 also targets;
  - the `--scopes` flag of `gws auth login`;
  - that plain `gws auth login` requests the broad default scopes.

  Use the pinned binary's `gws auth --help` / `gws auth login --help`, or upstream source at tag `v0.22.5`. Record the outcome in this task line. If the path differs, write the verified one in 2.2, and use it as the target path of the encrypted source in 2.5 and in the spec.
- [ ] 2.2 Add `print_gws_guidance` and call it right after `print_linear_cli_guidance` on both branches. Its content is fixed by the spec:
  - own GCP project and Sheets API enabled;
  - consent screen External and "In production", with the 7-day Testing expiry stated;
  - the project, consent screen and Desktop app client as a one-time-ever step, with its JSON going to `~/.config/gws/client_secret.json`;
  - that on a new machine `chezmoi apply` deploys the client file and only the login remains;
  - `gws auth login --scopes https://www.googleapis.com/auth/spreadsheets.readonly`;
  - Keychain storage of the refresh token;
  - the refresh-token caveats;
  - "never" lines for `gws auth export --unmasked` and `gws auth setup`.

  Verify with tests that render both branches with `chezmoi execute-template`. They must check that:
  - the guidance follows the linear CLI guidance and names every item above;
  - `gws auth login` appears only together with `--scopes`;
  - the only Google scope named is `spreadsheets.readonly`;
  - `--unmasked` appears only in a "never" line;
  - `bash -n` passes on both renders.
- [ ] 2.3 Add `gws` after `linear` to both closing `CLI tools:` lines and to the non-macOS manual `CLI tools:` list. Follow the list with the hint `brew install googleworkspace-cli` at the version in the `googleworkspace-cli` row of `BREW_VERSIONS`. Verify with tests that all three lines include `gws` and that the non-macOS render carries the hint.
- [ ] 2.4 Update `README.md` ("What's Included" row) and `docs/manual.html` (a `gws` section) through the `update-readme` and `update-manual` skills. Name:
  - the frozen formula and its row;
  - the drift a later formula release causes;
  - the consumer check beside the declaration;
  - the upgrade path (`brew-upgrade-pinned googleworkspace-cli` plus the row bump);
  - the one-time-ever Google setup, the encrypted client file and the per-machine login with the single read-only scope.

  Verify three things:
  - `grep -c 'apps.googleusercontent.com' README.md docs/manual.html` prints 0 for both;
  - neither file contains a spreadsheet ID;
  - the manual section renders in a browser.

  The README and the manual also add the `gws` client file to the encrypted-files documentation next to `~/.ticker.yaml`, with the `chezmoi edit ~/.config/gws/client_secret.json` flow. Verify with `grep -n 'client_secret.json' README.md docs/manual.html`, which matches both, and with no client ID or secret in either.
- [ ] 2.5 Create the encrypted OAuth client file.
  - **Agent precondition:** after 2.1 confirms the path, check the identity on this host matches the committed recipient: `[ "$(age-keygen -y ~/.config/chezmoi/key.txt)" = "$(grep -o 'age1[a-z0-9]*' "$WT/.chezmoi.toml.tmpl")" ] && echo match` prints `match`, and `chezmoi managed | grep -c 'client_secret.json'` prints `0`, so the live file stays untouched until this change lands.
  - **USER:** download the Desktop app client JSON from the Google Cloud project to `~/.config/gws/client_secret.json` (creating the project, consent screen "In production" and client first if this is the first time), then `chmod 600 ~/.config/gws/client_secret.json`. `chezmoi add` derives `private_` from the mode.
  - **USER:** `chezmoi --source "$WT" add --encrypt ~/.config/gws/client_secret.json`. `--source` writes into this worktree, not the `main` clone at `~/.local/share/chezmoi`. Fallback: `age --encrypt --armor -r <recipient> -o "$WT/dot_config/gws/encrypted_private_client_secret.json.age" ~/.config/gws/client_secret.json`.
  - **Agent verify**, printing only these results:
    - `stat -f %Lp ~/.config/gws/client_secret.json` prints `600`.
    - `head -c 34 "$WT/dot_config/gws/encrypted_private_client_secret.json.age"` shows an age header.
    - `chezmoi --source "$WT" status ~/.config/gws/client_secret.json` prints nothing.
    - `chezmoi --source "$WT" cat ~/.config/gws/client_secret.json | cmp -s - ~/.config/gws/client_secret.json && echo identical` prints `identical`.
    - `git -C "$WT" ls-files -co --exclude-standard | grep 'dot_config/gws/'` lists only `encrypted_private_client_secret.json.age`.
  - Add to `tests/googleworkspace-cli.test.ts` the guard for the encrypted source: its directory holds exactly that file, it starts with an age header, no other source (plaintext, template, `create_` or `modify_` variant, `run_` script) targets `.config/gws`, and applying into a temporary home (`--config`, `--destination`, `--persistent-state`) whose `[age] identity` points at a missing file exits non-zero with stderr naming `client_secret.json` and creates no target. It uses no real value. Verify: the test fails only before this task's `.age` file exists, and passes after.

## 3. IBKR MCP server and order-drafting deny (`mcp-global-config`, `claude-user-preferences`)

- [ ] 3.1 Append `"ibkr:https://api.ibkr.com/v1/api/mcp-public"` to `MCP_HTTP_SERVERS` after `jetbrains`. Leave the registration loop, the pre-scan and the counters untouched: `TOTAL_MCP` follows the array and becomes 17. Add nothing to `CODEX_HTTP_MCP_SERVERS`, `dot_config/opencode/opencode.jsonc` or `dot_junie/mcp/modify_mcp.json.tmpl`.

  Verify with a new `tests/ibkr-mcp.test.ts`, which evaluates the real arrays with bash. It must check that:
  - `MCP_HTTP_SERVERS` holds exactly one entry named `ibkr`, at that URL;
  - the two MCP arrays together hold 17 entries;
  - none of the other three agents' sources mention `ibkr` or `api.ibkr.com`.
- [ ] 3.2 Add an IBKR line to "Manual Installation Required", next to the other OAuth lines. It names:
  - `/mcp` → authenticate `ibkr`;
  - IBKR's login with 2FA, its AI agreements and the single-account choice;
  - revocation under Client Portal → Settings → Manage Third-Party Consents;
  - that `get_order_instructions` is denied in the managed settings.

  Verify with a test on the macOS render that the line names each item and carries no account identifier.
- [ ] 3.3 Append `"mcp__ibkr__get_order_instructions"` to `permissions.deny` in `dot_claude/modify_settings.json.tmpl`. Add no IBKR rule to `permissions.allow` or `permissions.ask` (design D6).

  Verify with `tests/ibkr-mcp.test.ts`, which renders the template with `chezmoi execute-template` and parses the `MANAGED` JSON. It must check that:
  - `permissions.deny` contains the exact rule and every bash rule required by "Deny rules block dangerous bash commands";
  - no other `mcp__ibkr__` string appears in `allow`, `ask` or `deny`, and no `mcp__ibkr__*` wildcard exists;
  - the server name in `MCP_HTTP_SERVERS` and the `mcp__<name>__` prefix of the deny rule agree. This is the rename guard from `mcp-global-config`.
- [ ] 3.4 Run the `sync-agent-config` skill on the `MCP_HTTP_SERVERS` change, and decline replication to Codex, OpenCode and Junie (design D5). Record an `IBKR MCP` row in `.agents/skills/sync-agent-config/parity.md`: Codex, OpenCode and Junie are `none`, and the note gives the reason (the order-drafting deny exists only in Claude Code; the only consumer is the Claude Code `stonks` plugin). Verify with a test that asserts the row and its three `none` cells.
- [ ] 3.5 Update `README.md` ("MCP Servers": count 16 → 17 and an `ibkr` row) and the Claude Code "MCP servers" table of `docs/manual.html` (not the OpenCode tables) through the `update-readme` and `update-manual` skills. Each row says:
  - read access to positions and orders, for the `stonks` plugin;
  - OAuth on first use through `/mcp`;
  - order drafting denied;
  - Claude Code only.

  Verify three things:
  - the README sentence states 17 servers;
  - `grep -n 'ibkr' README.md docs/manual.html` shows the new rows;
  - neither file contains an account number or token.

## 4. Integration

- [ ] 4.1 Run `bun test`, `bun run lint:oxfmt`, `bun run lint:fallow` and `openspec validate add-stonks-tooling --strict`. Verify that all exit 0.
- [ ] 4.2 Run the freeze pass of the rendered install script against this host's brew, twice. Verify on this host:
  - `brew list --pinned --versions` lists `googleworkspace-cli 0.22.5`;
  - `~/.local/state/dotfiles/brew-freezes` has the line `formula googleworkspace-cli`;
  - the run prints no drift warning for it;
  - `command -v gws` resolves under `$(brew --prefix)/bin`;
  - `gws --help` identifies the Google Workspace CLI and not the unrelated git-workspaces tool;
  - the second run prints nothing and changes no pin.
- [ ] 4.3 Run the MCP group (Group 8.5) of the rendered install script on this host, twice. Verify three things:
  - `claude mcp get ibkr` reports an HTTP server at `https://api.ibkr.com/v1/api/mcp-public`;
  - `jq '.mcpServers.ibkr' ~/.claude.json` shows no `headers` or OAuth client fields;
  - the second run reports `MCP servers: 17/17 registered (all up to date)`.
- [ ] 4.4 Round trip the client file into a temporary home with the real identity: `chezmoi --source "$WT" --destination "$TMP" --persistent-state "$TMP/state.boltdb" apply "$TMP/.config/gws/client_secret.json"`. Verify: the file has mode 600, `cmp` against the live file prints `identical`, `$TMP/.config/gws/` was created, a deleted target is restored on re-apply, and `rm -rf "$TMP"` leaves nothing behind. Then check for leaks: `git -C "$WT" status --porcelain` lists only the `.age` source, the tests, the docs, the install script, the settings template, the parity row and this change directory, and no file in the diff outside the `.age` source contains JSON taken from the client file.
- [ ] 4.5 Run `chezmoi diff` against the worktree and confirm that the only settings change is the new deny line. After `chezmoi apply`, verify by inspection only:
  - `jq '.permissions.deny' ~/.claude/settings.json` contains `mcp__ibkr__get_order_instructions`;
  - `/permissions` in a new Claude Code session lists it under Deny.

  Do not call `get_order_instructions` to test the deny (design D8).

## 5. First use (user-run, needs the user's own accounts)

- [ ] 5.1 With the client file deployed by task 2.5 (or by `chezmoi apply` on another host), run `gws auth login --scopes https://www.googleapis.com/auth/spreadsheets.readonly` with the personal Google account. The Google Cloud setup is not repeated here: it was done once ever in 2.5. Verify four things:
  - the recorded read command returns `range`, `majorDimension` and `values` for the tracking-sheet tab (IDs typed locally, never committed);
  - the consent screen reads "In production";
  - the Google account's third-party access page lists only read access to Sheets for the app;
  - no file under the chezmoi source changed, and the refresh token is only in the Keychain, never in the repo.
- [ ] 5.2 In Claude Code, run `/mcp` and authenticate `ibkr`: IBKR login with 2FA, the AI agreements, one account. Verify five things:
  - `/mcp` shows the server connected, and no other IBKR server, for example a claude.ai connector, is present. Disconnect any that is.
  - The tool list matches the ten documented tools. If any other tool can create, modify, cancel or submit orders, stop and open a follow-up that denies it before the server is used again.
  - One `mcp__ibkr__get_account_positions` call returns the account's positions.
  - One `mcp__ibkr__get_orders` call returns the active orders.
  - No IBKR value is written to any repository.
- [ ] 5.3 Hand the first-connect observations to `add-stonks-plugin`, where they are recorded with fictionalised fixtures: the IBKR re-login interval, and whether `get_orders` exposes trailing-stop type and trail %. Verify that nothing about them is added to this repository.
