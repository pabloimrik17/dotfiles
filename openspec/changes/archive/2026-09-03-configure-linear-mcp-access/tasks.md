## 1. Confirm cross-client configuration ownership

- [x] 1.1 Present the `sync-agent-config` four-tool proposal from `proposal.md`/`design.md` (Claude Code native user registration, OpenCode native remote OAuth, Codex runtime-owned CLI entry, Junie merged user file) and obtain confirmation before editing config or running runtime mutation commands; verify the confirmation covers all four clients and the parity-table row.
- [x] 1.2 Re-check current official Linear, Claude Code, OpenCode, Codex, and Junie MCP documentation before implementation and verify `https://mcp.linear.app/mcp`, Streamable HTTP/OAuth support, CLI/config syntax, and user-scope paths have not changed; update the artifacts first if any authoritative behavior has drifted.

## 2. Configure OpenCode native remote OAuth

- [x] 2.1 Add one enabled native `mcp.linear` remote entry to `dot_config/opencode/opencode.jsonc` with `url: https://mcp.linear.app/mcp`; verify the rendered JSONC contains exactly one Linear entry with `type: remote` and no command array, package coordinate, credential, or header field.
- [x] 2.2 Remove the now-obsolete `mcp-remote` regex manager from `renovate.json`; verify `bunx --package renovate@43.227.0 renovate-config-validator --strict renovate.json` succeeds and every unrelated custom manager is preserved.
- [x] 2.3 Remove the compatibility-bridge update classification and leave `dot_zshrc.tmpl`/`update-extra` unchanged; verify the implementation diff contains no `mcp-remote`, package runner, global package installation, or update-extra step for Linear.

## 3. Merge Junie user-level MCP configuration

- [x] 3.1 Add `dot_junie/mcp/modify_mcp.json.tmpl` to merge only `mcpServers.linear.url = https://mcp.linear.app/mcp` into `~/.junie/mcp/mcp.json`, following the existing fail-closed `modify_` pattern; verify the rendered script is executable shell syntax and contains no token, API key, or Authorization header.
- [x] 3.2 Exercise the Junie modifier in temporary fixtures for an absent file, an existing file with another server and unknown top-level key, an outdated Linear URL, and a second idempotent run; verify valid JSON output, preservation of unrelated data, convergence of only `mcpServers.linear`, and byte-stable output on the second run.
- [x] 3.3 Exercise failure cases with invalid live JSON, an unavailable merge engine, and invalid generated output; verify an existing target is left untouched and an absent target never becomes empty or malformed.
- [x] 3.4 Verify chezmoi maps the source to `~/.junie/mcp/mcp.json` and that `chezmoi diff --source "$PWD"` shows only the intended Linear fragment for Junie rather than replacing unrelated live MCP entries.

## 4. Reconcile Codex and preserve Claude Code

- [x] 4.1 Add a confirmation-gated Codex MCP registration block to `run_onchange_install-packages.sh.tmpl` that guards on `codex` and `jq`, validates `codex mcp list --json`, and reconciles only `linear`; verify stubbed missing, matching, mismatched, unreadable, command-failure, and cancelled-immediate-OAuth cases respectively add, skip, remove/re-add, skip safely, continue non-fatally, and preserve a matching entry written before cancellation while directing the user to `codex mcp login linear`.
- [x] 4.2 Keep the existing Claude Code `linear:https://mcp.linear.app/mcp` entry and its `claude mcp add --scope user --transport http` loop unchanged; verify the Claude MCP array still contains exactly one Linear endpoint and its total remains 14.
- [x] 4.3 Update macOS and non-macOS manual install output with reproducible Linear registration/authentication/status guidance for Claude Code, OpenCode, and Codex plus Junie's current unsupported status; verify rendered output names the three supported login commands, identifies Junie's reproduced OAuth failure and future revalidation path, and contains no literal secret or unsafe workaround.
- [x] 4.4 Render `run_onchange_install-packages.sh.tmpl` with chezmoi and run `bash -n` on the result; verify both templating and shell syntax succeed after the Codex block and documentation changes.

## 5. Record parity and documentation routing

- [x] 5.1 Add a complete `Linear MCP` row to `.agents/skills/sync-agent-config/parity.md`; verify the three functional client columns identify their native registration, the Junie column explicitly says `none — Linear OAuth currently unsupported`, and notes retain the managed merge path, reproduced failure, shared endpoint, and client-owned credential boundaries for future revalidation.
- [x] 5.2 Update `.agents/skills/update-manual/SKILL.md` so `dot_junie/**` triggers analysis of Section 14 (Junie), then update `.claude/commands/docs/manual.md` and `.junie/commands/docs/manual.md` with functionally identical instructions; verify the canonical skill and both command copies agree after frontmatter/slash-command differences are excluded.
- [x] 5.3 Read `.agents/skills/update-manual/references/html-conventions.md`, run the `update-manual` workflow, and present the exact proposed Claude Code, OpenCode, Codex, Junie, sidebar, numbering, and print changes before editing `docs/manual.html`; verify explicit approval is recorded for the selected changes.
- [x] 5.4 Run the `update-readme` workflow and present the proposed Junie AI Tooling row plus three-client Linear MCP support matrix and Junie compatibility warning before editing `README.md`; verify explicit approval is recorded and no compatibility package is proposed as a standalone What's Included tool.

## 6. Update README and interactive manual

- [x] 6.1 Update `README.md` to list Junie as managed configuration rather than an installed binary, describe the official endpoint plus registration/auth ownership for Claude Code, OpenCode, and Codex, and mark Junie as not currently supported; verify the text no longer implies Claude's generic MCP list is automatically shared and directs readers to the future Junie revalidation procedure.
- [x] 6.2 Update the Claude Code manual subsection with user-scope registration, `claude mcp login linear`/`/mcp`, status checks, project listing, and disposable issue verification; verify all commands match the existing Claude CLI registration.
- [x] 6.3 Update the OpenCode manual subsection with the managed native remote entry, `opencode mcp auth linear`, `opencode mcp list`, native credential ownership, project listing, and disposable issue verification; verify it contains no local bridge or package runner instructions.
- [x] 6.4 Update the Codex manual subsection with idempotent `codex mcp` registration, login, status, project listing, and disposable issue verification while preserving the statement that other `~/.codex` state is unmanaged; verify the old blanket claim that Codex MCP is unmanaged is removed.
- [x] 6.5 Add Section 14 (Junie) documenting `~/.junie/mcp/mcp.json`, merge ownership, the reproduced `/mcp` OAuth failure, explicit not-currently-supported status, and the criterion for future Active/project/issue revalidation; keep Agent Sessions as Section 15 and verify sidebar links, section labels, anchors, search-visible content, and order all agree.
- [x] 6.6 Update print expectations for 15 sections and print `docs/manual.html` with the reference Chrome/A4 settings; verify Junie and its unsupported status are included, interactive-only elements remain hidden, and output stays within approximately 2-4 pages.

## 7. Static and security verification

- [x] 7.1 Run `bun run lint:oxfmt` and `bun run lint:fallow`; verify both repository checks pass or document any pre-existing unrelated finding without changing unrelated files.
- [x] 7.2 Run targeted searches across managed config, README, manual, and install output for Linear secrets, deprecated endpoints, obsolete bridge references, and misleading Junie support claims; verify there is no real API key/token/Authorization header, no `/sse`, no `/mcp/readonly`, no `mcp-remote`, and exactly the intended official endpoint occurrences.
- [x] 7.3 Run `chezmoi diff --source "$PWD"` and inspect every target; verify OpenCode gains one native remote entry, Junie gains one credential-free merged server despite its explicit support gap, Codex/Claude runtime files are not whole-file managed, and unrelated user configuration is preserved.
- [x] 7.4 Run `openspec validate configure-linear-mcp-access --strict` and `openspec status --change configure-linear-mcp-access`; verify validation passes and all planning artifacts remain complete and coherent after implementation edits.

## 8. Runtime authentication and Linear acceptance

- [x] 8.1 Apply the approved configuration and registration groups, then rerun them; verify Claude Code, OpenCode, Codex, and Junie each expose exactly one user-level Linear server and the second apply performs no duplicate registration or unrelated rewrite.
- [x] 8.2 Authenticate Claude Code with `claude mcp login linear` or `/mcp`, list projects, create a uniquely titled disposable issue in the discovered `dotfiles` project, record its ID/client/project, and close or cancel only that issue; verify `claude mcp get linear` reports the official endpoint and connected auth.
- [x] 8.3 Authenticate OpenCode with `opencode mcp auth linear`, verify connection with `opencode mcp list`, list projects, create a uniquely titled disposable issue in `dotfiles`, record its ID/client/project, and close or cancel only that issue; verify native OAuth state stays outside the repo.
- [x] 8.4 Authenticate with `codex mcp login linear`, list projects, create a uniquely titled disposable issue in `dotfiles`, record its ID/client/project, and close or cancel only that issue; verify `codex mcp list --json` reports the official endpoint and authenticated status without altering other Codex entries.
- [x] 8.5 Record Junie's current unsupported state: a controlled `/mcp` OAuth attempt with Junie 26.8.17 and a minimal Linear-only configuration reproduces `400 Bad Request: Client must not use multiple authentication methods`; verify no Junie acceptance issue was created, the managed entry remains credential-free, unrelated Junie servers remain present, and documentation defines a future revalidation criterion.
- [x] 8.6 Summarize the three successful acceptance records plus Junie's deferred status in the implementation handoff; verify the Claude Code, OpenCode, and Codex issues are canceled, no Junie issue was created, and no disposable issue remains open unintentionally.
