# Design: add-stonks-tooling

## Context

See proposal.md - Why. This design rests on these facts, checked on 2026-10-04.

**The repo today (`main` at `5b2496f`):**

- `run_onchange_install-packages.sh.tmpl` declares `BREW_PACKAGES` (`:132`, 31 entries), `BREW_VERSIONS` (`:137`, 36 rows) and `pkg_bin` (`:220`).
- The freeze from `brew-version-pins` does three things:
  - it pins every formula in `BREW_PACKAGES` after the install groups;
  - it compares each pin with its `BREW_VERSIONS` row and warns on drift;
  - it releases its pin when an entry is removed.
- `tests/brew-freeze.test.ts` asserts the coverage count (36). `brew-upgrade-pinned <pkg>` in `dot_zshrc.tmpl` unpins, upgrades and repins.
- Group 8.5 (`:1705`) registers `MCP_STDIO_SERVERS` (8) and `MCP_HTTP_SERVERS` (`:1721`, 8) with `claude mcp add --scope user`. It pre-scans `~/.claude.json` with `jq`. An HTTP entry counts as outdated when its stored config no longer contains the URL. The group never removes a server that leaves the arrays.
- The "Manual Installation Required" block (`:2200`) prints one OAuth line per HTTP server. It calls `print_linear_cli_guidance` on both branches (`:2213`, `:2244`).
- `dot_claude/modify_settings.json.tmpl` overlays a `MANAGED` blob onto the live file:
  - `permissions` is a merge container;
  - `permissions.allow`, `permissions.ask` and `permissions.deny` (`:416`) are leaves, replaced by the managed value on every apply;
  - `defaultMode` is `auto`, so deny and allow rules resolve first, and only unmatched calls reach the safety classifier.

**Upstream:**

- **`googleworkspace-cli` 0.22.5** (`brew info`):
  - It is in `homebrew/core` and installs the binary `gws`. Its license is Apache-2.0, and it declares `rust` as a build dependency.
  - Homebrew declares it in conflict with the unrelated `gws` formula 0.2.0 ("Manage workspaces composed of git repositories"): both install a `gws` binary.
  - On this Intel host a bottle pours.
  - Upstream is pre-1.0 and says it is "not an officially supported Google product". It has had no release since 2026-03-31, and Google has announced an official Workspace CLI.
  - Credentials are encrypted, and the key is kept in the macOS Keychain (strict since 0.22.3).
  - A plain `gws auth login` requests broad scopes (Drive, Sheets, Gmail, Calendar, Docs, Slides, Tasks). `--scopes <full-url>` passes scopes through verbatim. `gws auth setup` needs `gcloud`.
- **The IBKR MCP server** at `https://api.ibkr.com/v1/api/mcp-public` is official. IBKR launched it on 2026-06-01, and on 2026-07-28 opened it to any MCP client, naming Claude Code.
  - Its OAuth metadata advertises dynamic client registration and PKCE public clients.
  - The protected resource advertises the scopes `mcp.read` and `mcp.write`.
  - The authorization server also lists `mcp.orders.submit`, but no public tool uses it.
  - Its documented tools are `get_account_positions`, `get_orders`, `get_account_balances`, `get_account_summary`, `get_portfolio_allocation`, `get_trades`, `get_price_history`, `get_price_snapshot`, `search_contracts` and `get_order_instructions`. Only the last one writes anything: it drafts an instruction, which the user must approve in an IBKR app before it becomes an order.
  - Access is revocable under Client Portal → Settings → Manage Third-Party Consents.

**In-flight changes on `main` that also touch these capabilities:**

- `add-posthog-mcp` ADDs three requirements to `mcp-global-config` and MODIFIES `claude-user-preferences` "MCP read-only tools are allowed".
- `add-sentry-mcp` ADDs two requirements to `mcp-global-config` and MODIFIES `claude-user-preferences` "Default permission mode is auto" and "MCP read-only tools are allowed".

Both are implemented, and neither is archived yet.

## Goals / Non-Goals

**Goals:**

- `gws` installs and is pinned on every macOS host, through the same freeze path as every other brew package.
- The `gws` OAuth client file reaches every host from an age-encrypted source, so a new machine needs only `gws auth login`.
- `ibkr` is registered at user scope on every host, with no credential anywhere in the repo.
- No Claude Code session can draft an IBKR order. Reading positions and orders keeps working.
- The three in-flight changes on `mcp-global-config` archive in any order without losing each other's edits.

**Non-Goals:**

- Measuring the IBKR refresh-token lifetime, or whether `get_orders` exposes trailing-stop type and trail %. These are first-connect checks that belong to `add-stonks-plugin`, which captures fictionalised fixtures from them.
- Narrowing IBKR's OAuth grant to `mcp.read`. See Open Questions.
- Managing the `gws` refresh token or any credential `gws` writes after login.
- Write access to the sheet, and any Google tooling beyond `gws`.
- Managing claude.ai connectors. They live on the claude.ai account, not in this repo.

## Decisions

### D1. `gws` is a frozen homebrew/core formula

`googleworkspace-cli` joins `BREW_PACKAGES` with the row `googleworkspace-cli|0.22.5`, like `tuicr` and `linear`. "Pinned the way this repo pins brew packages" means the freeze: a fresh host installs the package, then pins it in the same run.

Alternatives:

- **A declared hold.** Rejected. A hold refuses to install a missing package, and it is meant for a version brew would install that is itself wrong. Neither applies here.
- **The npm package `@googleworkspace/cli` through `update-extra`.** Rejected. It adds a second install and update path next to the freeze.
- **`gcloud` plus `fetch`.** Rejected. It is a heavy cask with no Sheets commands, and it stores the token as a plaintext JSON file.
- **Sheets API v4 with the plugin's own OAuth code.** This is a plugin-side swap. The plugin keeps `gws` behind a one-file adapter so the backend can change later, and if it does, this change's entry is removed and the freeze releases the pin.

### D2. A renamed-binary `pkg_bin` arm, and the `gws` name clash

The pre-scan probes `command -v "$(pkg_bin "$pkg")"`. The formula's binary is `gws`, so it needs an arm `googleworkspace-cli) echo "gws" ;;`, in the same shape as `ripgrep` → `rg`.

The unrelated `gws` formula installs a binary with the same name. On a host that had it, the pre-scan would count `googleworkspace-cli` as installed and the plugin would call the wrong program. Neither formula is on any managed host today.

The spec excludes `gws` from `BREW_PACKAGES`. The manual verification step checks that the binary on PATH is the Google Workspace CLI.

Alternative: probe with `brew list googleworkspace-cli`, as the `git` exception does. Rejected. The `git` exception exists for a collision every Mac has (`/usr/bin/git`). Here the collision is hypothetical, and special-casing the loop for it would be a second exception to maintain.

### D3. The consumer check sits beside the declaration

As for `linear` (add-linear-cli D3), a comment above `BREW_PACKAGES` records three things:

- the one read command the stonks adapter relies on, written with `<spreadsheet-id>` and `<tab>` placeholders;
- its expected JSON shape;
- the rule for raising the row: run the check on the candidate, then `brew-upgrade-pinned googleworkspace-cli`, then bump the row.

The check cannot go inside `BREW_VERSIONS`, because the freeze test reads that array as plain tokens.

The check is read-only, and it runs against a sheet the user owns. It addresses the tab by name, because A1 ranges do not accept a `gid`.

### D4. The Google setup is printed guidance, and nothing is managed

A new function, `print_gws_guidance`, is called right after `print_linear_cli_guidance` on both branches. It keeps this capability's text in one place, like add-linear-cli D6. The content is fixed by the `googleworkspace-cli-install` spec. The reasons behind each step:

- **"In production", not "Testing".** An External app in Testing gets refresh tokens that expire after 7 days. That would force a weekly re-login, and each re-login also pushes toward the 100-token-per-client cap.
- **External user type.** The sheet belongs to a personal Google account. Internal exists only inside a Workspace organisation.
- **Desktop app client.** `gws auth login` runs a loopback flow, and a Desktop client is the client type built for that.
- **The exact `--scopes` URL** rather than `--readonly -s sheets`. The decision names the scope URL. A reviewer can check it by reading, and it does not depend on how a later `gws` release maps its service aliases.
- **No `gws auth setup`.** It shells out to `gcloud`, which these dotfiles do not install.

The repo manages one file under `~/.config/gws/`: the OAuth client JSON, as an age-encrypted source `dot_config/gws/encrypted_private_client_secret.json.age` that deploys to `~/.config/gws/client_secret.json` with mode 600. This follows `ticker-config` and `add-plugin-configs`. The repo is public, and the client JSON names the user's own GCP project and carries a client secret, so it is committed only as ciphertext, and the `private_` prefix gives it mode 600.

- **What stays out.** The refresh token and the credentials `gws` writes after login are never managed. They stay in `gws`'s encrypted `credentials.enc` store, with its encryption key in the macOS Keychain.
- **What the guidance becomes.** Creating the GCP project, the consent screen ("In production") and the Desktop client is a one-time-ever step, whose output is the file that gets encrypted. On a new machine `chezmoi apply` deploys the client file, and only `gws auth login --scopes https://www.googleapis.com/auth/spreadsheets.readonly` remains.
- **How the file is created.** The user runs `chezmoi --source "<worktree>" add --encrypt ~/.config/gws/client_secret.json` from their own terminal during implementation, never through a `!`-prefixed command in an agent session, so the contents never reach a transcript. Agent-side checks print only `ok`, `match`, a file mode or a ciphertext header. The user-run steps follow the wording of `add-plugin-configs`.
- **Opaque to chezmoi.** Chezmoi decrypts and writes the file without parsing it, and the dotfiles add no apply-time validation.
- **Why not leave it unmanaged.** Per-machine copying of a client JSON is the step most likely to be skipped on a new host, and the encrypted-file mechanism already exists and is reviewed.

### D5. IBKR is registered through `MCP_HTTP_SERVERS`, for Claude Code only

The entry `ibkr:https://api.ibkr.com/v1/api/mcp-public` is appended to `MCP_HTTP_SERVERS`, which brings the group to 17. The existing loop handles the rest: pre-scan, skip if already registered, replace on a URL change. It never passes `--header`, `--client-id`, `--client-secret` or `--callback-port`. IBKR's authorization server supports dynamic client registration with PKCE, so Claude Code registers itself on first use. The grant then stays in Claude Code's credential storage.

Why the name `ibkr` is fixed: the plugin's tool calls and the deny rule are both written as `mcp__ibkr__<tool>`. A rename that missed the deny would leave the drafting tool callable, so the spec requires the two to move together.

Alternatives:

- **The plugin's own `.mcp.json`.** Rejected. The tools would become `mcp__plugin_stonks_ibkr__*`, which breaks the contract and the deny rule. The daily-agentic-task-force repo also configures no MCP servers.
- **The claude.ai "Interactive Brokers" connector.** Rejected. It binds the brokerage to the claude.ai account rather than to this machine, and its tools surface under a `claude_ai_` prefix that this deny does not cover.
- **Also registering in Codex, OpenCode and Junie.** Rejected. The deny is a Claude Code permission rule, so those agents would reach the same account with the drafting tool open, and the plugin is Claude Code only. The parity table records the gap with that reason.

The manual-instructions line covers three things:

- authentication through `/mcp`;
- IBKR's own steps (login with 2FA, its AI agreements, one account);
- the revocation path, and the fact that drafting is denied.

### D6. An exact deny, as a new `claude-user-preferences` requirement

`mcp__ibkr__get_order_instructions` is appended to `permissions.deny`.

- **Why exact.** A `mcp__ibkr__*` deny would also block the reads the plugin needs.
- **Why deny rather than `ask`.** A prompt can be approved by mistake, and the decision is that no session can draft orders.
- **Why a new requirement.** "Deny rules block dangerous bash commands" is about bash categories, and an MCP rule would change its subject. It is also the requirement any future bash-deny change will modify. A separate ADDED requirement also keeps clear of the two in-flight changes, which both MODIFY other requirements of this capability.

`permissions.deny` is a leaf in the merge, so `chezmoi apply` restores a rule that was removed by hand.

No IBKR rule is added to `permissions.allow` or `permissions.ask`, and that is deliberate. The `stonks` plugin's `/stonks:sync` command pre-approves `mcp__ibkr__get_account_positions` and `mcp__ibkr__get_orders` through its own `allowed-tools`. The approval therefore lives with the one command that needs the reads, and no other session gets it. A missing global allow rule is not an omission. "Stays allowed" in the decision record means not blocked.

Outside `/stonks:sync`, an unmatched IBKR read reaches the safety classifier under `defaultMode: auto`, like every other unlisted MCP tool. If a global pre-approval is ever wanted, it should be two exact rules, never a wildcard. A wildcard would also cover any tool IBKR adds later.

The exact deny leaves one gap: a drafting tool added to the server later, under another name, would not match it. IBKR's OAuth already advertises an `mcp.orders.submit` scope that no public tool uses. The mitigation is in the plugin: `/stonks:sync` warns at runtime when any `mcp__ibkr__*` tool outside the ten documented ones appears. The warning is not a deny. It tells the user to add a deny rule in a follow-up change, and task 5.2's first-connect tool-list check does the same once by hand.

### D7. Delta strategy and ordering with in-flight changes

| Capability | add-posthog-mcp | add-sentry-mcp | this change |
| --- | --- | --- | --- |
| `mcp-global-config` | ADDED ×3 | ADDED ×2 | MODIFIED "Global MCP servers are registered via Claude CLI in install script" and "Template uses no machine-specific conditionals for MCP"; ADDED ×4 (IBKR) |
| `claude-user-preferences` | MODIFIED "MCP read-only tools are allowed" | MODIFIED "MCP read-only tools are allowed", "Default permission mode is auto" | ADDED "IBKR order drafting tool is denied" |
| `cli-tool-expansion` | — | — | MODIFIED `BREW_PACKAGES`, `pkg_bin` |

No requirement is touched by more than one of these changes, except the one the other two share with each other. So this change can archive before, between or after them. The deltas are written against the current `main` spec.

The PostHog and Sentry requirements state that their own server adds nothing to the install-script count ("unchanged by this capability"). They stay true once the count reads 17, because neither server is in the arrays.

The rule if that stops holding: if any open change is revised to MODIFY the server-table requirement, or a new one does, whichever archives second rebases its MODIFIED block onto the archived text. That means:

- keep the other change's rows;
- recompute the server count, the "Nth server" scenarios and the `TOTAL_MCP` figure;
- never overwrite.

The same rule applies to `BREW_PACKAGES`, as add-linear-cli did after add-tuicr.

The table's stdio versions are copied verbatim from `main`. They already lag the script, because Renovate bumps the pins without spec deltas, and refreshing them is outside this change.

### D8. Offline tests; live checks are user-run, and the deny is never tested by calling the tool

Tests:

- **`tests/googleworkspace-cli.test.ts`**, in the style of `tests/linear-cli.test.ts`, evaluates the real arrays with bash and runs `pkg_bin`. It renders both branches and checks:
  - the guidance, its forbidden strings and the summary lines;
  - that `bash -n` passes;
  - the encrypted client file: `dot_config/gws/` holds only `encrypted_private_client_secret.json.age`, it starts with an age header, no other source targets `~/.config/gws/`, and applying it against a temporary home whose age identity is missing exits non-zero without creating the target.
- **`tests/brew-freeze.test.ts`** raises its coverage count to 37.
- **`tests/ibkr-mcp.test.ts`** checks four things:
  - `MCP_HTTP_SERVERS` holds exactly one `ibkr` entry at the URL;
  - `CODEX_HTTP_MCP_SERVERS`, `dot_config/opencode/opencode.jsonc` and the Junie merge template carry no `ibkr`;
  - the rendered settings template's `permissions.deny` holds the exact rule plus every bash rule;
  - no `mcp__ibkr__` entry appears anywhere else in the permission lists.

The live checks need the user's own accounts and run after merge. The deny is verified by inspection, through `/permissions` and `jq` on `~/.claude/settings.json`, never by invoking `get_order_instructions`. If the deny were misconfigured, a test call would draft a real instruction.

## Risks / Trade-offs

- [`gws` upstream is idle, pre-1.0 and may be superseded by Google's announced official CLI] → The freeze holds 0.22.5 still. The plugin's adapter makes a backend swap a one-file change. Here, removing the entry releases the pin on the next run.
- [The unrelated `gws` formula, or another `gws` on PATH] → The pre-scan would skip the install (D2). The verification task checks the binary's identity, and the spec keeps `gws` out of `BREW_PACKAGES`.
- [Intel host: the bottle pours today from residual stock] → On `amd64`, a future upgrade of `googleworkspace-cli` is a source build that pulls in `rust` as a build dependency. That cost is an `amd64` statement per `brew-version-pins`. `arm64` keeps pouring.
- [Consent screen left in "Testing"] → Refresh tokens die after 7 days. The guidance names "In production" explicitly, and the symptom is a weekly forced re-login.
- [A plain `gws auth login` grants Drive, Gmail and more] → The guidance names only the `--scopes` form. Recovery: revoke the app's access in the Google account, then log in again with the single scope.
- [IBKR's server is new, so its tools and output shapes may change. The authorization server already lists `mcp.orders.submit`.] → An exact deny covers exactly one tool by design, because a wildcard would block the reads. On first connect, the verification task compares the server's tool list with the ten documented tools. Any new tool that can create, modify, cancel or submit orders gets its own deny rule, in a follow-up change, before the server is used again. At runtime, `/stonks:sync` warns whenever an unknown `mcp__ibkr__*` tool shows up (D6).
- [An IBKR server reachable under another prefix, such as the claude.ai connector or a hand-added entry] → Its drafting tool would not be denied. The verification task checks that `/mcp` shows IBKR only as `ibkr`, and any other IBKR entry is disconnected.
- [Renaming `ibkr`] → The deny would silently match nothing. The spec ties a rename to moving the deny, and `tests/ibkr-mcp.test.ts` asserts both.
- [Registered on every host, work machines included] → This follows the no-conditionals requirement. The server holds no account data until the user completes OAuth on that host, and that login is a per-host choice.
- [Auto mode routes IBKR reads to the safety classifier] → The classifier could refuse a read. The plugin's documented fallback (pasted screenshots, confirmed by the user) still works, and the plugin's `/stonks:sync` pre-approves the two reads itself (D6).

## Migration Plan

1. Merge, then run `chezmoi update` on each host. The brew group installs and pins `googleworkspace-cli`. The MCP group reports one pending server and registers `ibkr` (17 total). The settings merge writes the deny rule.
2. The user does the one-time steps. Once ever, the Google setup and encrypting the client file (done during implementation). On each host, `gws auth login`, then the IBKR login through `/mcp`.
3. Archive in any order relative to `add-posthog-mcp` and `add-sentry-mcp` (D7).
4. Cross-repo: `add-stonks-plugin` merges after this change and after `add-plugin-configs`. Those two dotfiles changes touch disjoint files and can merge in either order.

Rollback:

1. Revert the change. On the next run the freeze releases its `googleworkspace-cli` pin, and the settings merge drops the deny rule.
2. The install script never removes a server that leaves the arrays, so run `claude mcp remove ibkr -s user` by hand.
3. Revoke the IBKR consent in Client Portal and the app's access in the Google account. The encrypted client file stays in history, so rotate the client secret in the Google Cloud console if it must be treated as compromised.
4. Run `brew uninstall googleworkspace-cli`.

Revoke IBKR access before the deny disappears, or leave the server unauthenticated.

## Open Questions

- Can Claude Code be made to request only IBKR's `mcp.read` scope for a user-scope HTTP server? If it can, a follow-up narrows the grant. The deny stays either way, so neither the specs nor the tasks here change.
- Does the client-configuration path `~/.config/gws/client_secret.json` hold at 0.22.5? It comes from the upstream README. Task 2.1 confirms it with `gws auth --help` before the guidance is written and before the encrypted file is created (task 2.5), and the spec words the path as "where `gws` reads its client configuration". If upstream uses another path at 0.22.5, the encrypted source's target path follows it.
