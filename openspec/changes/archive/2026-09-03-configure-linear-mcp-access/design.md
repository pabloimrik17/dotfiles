## Context

See `proposal.md` for motivation and `specs/linear-mcp-access/spec.md` for the cross-client contract.

Claude Code already registers `linear:https://mcp.linear.app/mcp` in the install script's `MCP_HTTP_SERVERS` array and stores the resulting user entry in runtime-owned `~/.claude.json`. OpenCode's managed config currently contains `expect`, PostHog, and Sentry but no Linear entry. Codex is installed and has an official MCP CLI with structured `list --json`, `add --url`, and `login` commands; the repository deliberately does not own its whole `~/.codex/config.toml`. The repository manages no Junie user config today. Current Junie releases support a user-scope `~/.junie/mcp/mcp.json`, remote HTTP servers, and interactive OAuth from `/mcp`, but a controlled test with Junie 26.8.17 reproduced a Linear token-exchange failure: `400 Bad Request` with `Client must not use multiple authentication methods`.

Linear documents `https://mcp.linear.app/mcp` as the read-write Streamable HTTP endpoint and OAuth 2.1 with dynamic client registration as the interactive default. Current OpenCode supports native remote MCP and OAuth, including a dedicated authentication command and client-owned credential store, so no stdio compatibility bridge is required.

## Goals / Non-Goals

**Goals:**

- Keep exactly one user-level Linear definition per client, all targeting the official read-write endpoint.
- Reuse each client's supported ownership boundary: Claude Code and Codex CLI state, OpenCode's chezmoi-managed config, and a merge-preserved Junie MCP file.
- Make registration idempotent and authentication explicit without putting secrets in source state.
- Use OpenCode's native remote transport so Linear adds no package dependency or update lifecycle.
- Provide an observable acceptance path that proves both project reads and issue writes from Claude Code, OpenCode, and Codex.
- Keep Junie's current interoperability gap visible, credential-free, and reproducible so it can be revisited after a future client update.

**Non-Goals:**

- Managing Linear workspace IDs, project IDs, OAuth tokens, refresh tokens, or API keys.
- Adding project-level `.mcp.json`, `.codex/config.toml`, `opencode.json`, or `.junie/mcp/mcp.json` files to this repository.
- Adding a local stdio compatibility bridge for a client that supports the hosted server natively.
- Managing Codex preferences other than reconciling the single `linear` MCP entry through the official CLI.
- Creating a shared OAuth grant across clients; each client authenticates and stores credentials independently.

## Decisions

### Keep Claude Code on its existing native HTTP registration

No second Claude definition is added. Group 8.5 already registers `linear` through `claude mcp add --scope user --transport http`, which is the current Claude Code and Linear-recommended shape. The implementation changes only the printed and long-form documentation to name a deterministic login path (`claude mcp login linear` or `/mcp`) and a connection check.

Adding an `mcp-remote` stdio entry for Claude was rejected because Claude Code supports Streamable HTTP and OAuth natively; it would duplicate the existing server and introduce an unnecessary local dependency.

### Configure OpenCode as a native remote OAuth server

`dot_config/opencode/opencode.jsonc` gains one enabled `mcp.linear` entry:

```json
{
    "type": "remote",
    "url": "https://mcp.linear.app/mcp",
    "enabled": true
}
```

Authentication uses `opencode mcp auth linear`, and `opencode mcp list` provides the status check. OpenCode retains the OAuth grant in its native `~/.local/share/opencode/mcp-auth.json` state outside chezmoi. No headers, API key, token, command array, package runner, or package coordinate are placed in `opencode.jsonc`.

A local `mcp-remote` stdio bridge was considered because Linear documents it as a compatibility option, but rejected once the confirmed design was revisited: current OpenCode already implements the required remote transport and OAuth flow. Native transport removes the extra process, cold package download, pin, Renovate rule, and separate credential store while matching the same user-level endpoint contract.

### Reconcile Codex through its official CLI, not a managed config.toml

A small confirmation-gated Codex MCP setup block runs after Codex installation is available. It reads `codex mcp list --json`, selects `.[] | select(.name == "linear")`, and compares the reported HTTP transport URL with the desired endpoint:

- missing: run `codex mcp add linear --url https://mcp.linear.app/mcp`;
- matching: report already registered and do nothing;
- mismatched: remove only `linear`, verify its absence, then add the desired endpoint.

The block uses the install script's existing non-fatal error accounting and guards for `codex` and `jq`. Current Codex may initiate OAuth immediately from `codex mcp add`, so the command runs only inside the confirmed setup group. If add exits non-zero, the block re-queries `codex mcp list --json`: a matching entry already written before OAuth was cancelled is preserved and reported with `codex mcp login linear` as the recovery path, while an absent entry produces a non-fatal warning. A matching entry is never removed solely because authentication is incomplete. Registration and OAuth do not write credentials into the repository.

Direct management of `~/.codex/config.toml` is supported by Codex, but is rejected here as a repository ownership choice because Codex and the user may own unrelated preferences in the same file. A CLI-driven narrow mutation follows the repository's existing runtime-ownership precedent for Codex plugins and preserves every other key without adding a TOML merge dependency.

### Merge only mcpServers.linear into Junie's user file

The new chezmoi source is `dot_junie/mcp/modify_mcp.json.tmpl`, targeting `~/.junie/mcp/mcp.json`. It follows the fail-closed pattern already used by `dot_claude/modify_settings.json.tmpl`: capture stdin, parse with Python's standard `json` module through the already-provisioned `uv`, merge only this managed fragment, validate the output, and preserve the target on failure.

```json
{
    "mcpServers": {
        "linear": {
            "url": "https://mcp.linear.app/mcp"
        }
    }
}
```

Existing Junie servers and unknown top-level keys pass through unchanged. Invalid live JSON causes a non-zero exit so chezmoi leaves the target untouched; an absent target with an unavailable merge engine yields a valid `{}` and self-heals on a later apply.

A controlled `/mcp` authorization attempt against the managed URL reaches Linear's OAuth flow but fails during token exchange with `Client must not use multiple authentication methods`. The same result with a minimal Linear-only Junie configuration rules out interference from another configured server. Therefore Junie is marked as not currently supported for Linear, no functional acceptance issue is created from it, and the managed endpoint remains in place solely to make a future compatibility retest straightforward. A future Junie release qualifies for support only after the same controlled check completes, the server reports Active, and the read/write acceptance flow passes.

A whole-file `dot_junie/mcp/mcp.json` was rejected because the same user-level file can contain servers added through Junie's installation assistant. Replacing it would erase runtime-authored configuration unrelated to Linear. API-key headers, bearer tokens, shared OAuth grants, and compatibility bridges were rejected because they would expand the secret-management or dependency surface without fixing the native OAuth defect safely.

### Record one four-tool parity row

`.agents/skills/sync-agent-config/parity.md` gains a `Linear MCP` row containing the three functional surfaces: Claude Code's user-scope CLI registration, Codex's runtime-owned `codex mcp` entry, and OpenCode's managed native remote entry. The Junie cell uses the parity table's explicit capability-gap form, `none — Linear OAuth currently unsupported`. Notes retain the managed/merged user MCP path for future revalidation, identify the reproduced error, and state that credentials remain client-owned.

This is an established mapping for three clients and an explicit capability gap for Junie. No main `sync-agent-config-skill` requirement changes because the row and its documented reason fulfill the existing parity contract.

### Document Junie as its own manual section

The interactive manual currently has dedicated Claude Code, OpenCode, and Codex sections but no Junie section. Junie becomes Section 14 and Agent Sessions moves to Section 15. The update-manual skill and its command-facing copies gain `dot_junie/**` as a trigger mapped to the Junie section. README adds Junie to AI Tooling as managed configuration (not an installer claim), labels its Linear access as not currently supported, and rewrites the Linear MCP description so it no longer implies Claude's registration is automatically shared by every client.

No compatibility package receives a What's Included row because OpenCode uses its built-in remote transport; the Linear setup details document the native auth command instead.

### Verify writes with disposable, attributable issues

Each supported client is tested independently after OAuth. The verifier first asks the client to list projects and selects the project named `dotfiles` from returned data rather than hard-coding an ID. It then creates an issue with a unique title such as `[MCP verification][Codex][2026-08-31]`, records the returned issue ID and project, and closes or cancels the issue after evidence is captured.

One shared issue cannot prove that all three supported clients possess create permission, so each creates its own disposable issue. Junie creates no issue while OAuth remains unsupported. Creating permanent product work or deleting unrelated issues is out of scope.

## Risks / Trade-offs

- **OpenCode's native OAuth state becomes stale** → document `opencode mcp logout linear` followed by `opencode mcp auth linear` as the recovery path and verify status with `opencode mcp list`.
- **Codex JSON output changes** → validate that the output is an array before selecting the entry; treat unreadable output as a non-fatal skip rather than rewriting config blindly.
- **`codex mcp add` initiates OAuth and the user cancels it** → re-query structured state, preserve a matching entry if registration already landed, and document `codex mcp login linear` as the deterministic recovery path.
- **A stale Codex URL repair clears an old OAuth grant** → limit removal to a mismatched `linear` entry and require `codex mcp login linear` afterward.
- **Junie's live MCP JSON is malformed** → fail closed and leave it untouched; do not attempt lossy repair inside the modifier.
- **Junie's native OAuth remains incompatible with Linear** → label the capability as not currently supported, keep its managed entry credential-free, preserve the exact failure evidence, and rerun the controlled authorization harness after a future Junie update.
- **Three write checks leave noise in Linear** → use uniquely attributable titles, capture IDs, and immediately close or cancel only those test issues.
- **Manual grows beyond its print target** → keep the Junie section focused on managed MCP behavior and rerun the reference print check after renumbering to 15 sections.

## Migration Plan

1. Add the native OpenCode remote entry with no package or Renovate change.
2. Add the merge-preserving Junie modifier and exercise it against absent, valid populated, invalid, and idempotent inputs.
3. Add the Codex MCP reconciliation block and update the existing Linear manual-install output for the three supported clients plus Junie's explicit compatibility warning; leave Claude's existing server array unchanged.
4. Add the four-client parity row with Junie marked as not currently supported.
5. Apply the update-manual and update-readme workflows: add Junie Section 14, move Agent Sessions to 15, document the three supported registration/auth/status paths, and preserve the Junie revalidation procedure.
6. Run static/template validation, perform OAuth and read/write acceptance checks in Claude Code, OpenCode, and Codex, and record the controlled Junie OAuth failure without creating an issue.

Rollback removes the OpenCode entry, Junie managed fragment, Codex reconciliation block, parity row, and documentation. It does not delete OAuth credentials or runtime-owned client state automatically; users can explicitly log out or remove the `linear` entry with each client's supported UI/CLI if desired.
