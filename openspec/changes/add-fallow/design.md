# Design: add-fallow

## Context

fallow ships as a single npm package (`fallow` 3.0.0, MIT) with three bins: `fallow` (CLI), `fallow-lsp`, `fallow-mcp`. The static layer is free; the runtime layer (Fallow Runtime) is paid and license-gated. The repo already has every integration pattern this change needs: npm-adjacent installs in `run_onchange_install-packages.sh.tmpl` (Group 6 bootstraps nvm/node), MCP registration via `claude mcp add --scope user`, Claude Code plugin marketplaces/plugins arrays, `update-extra` for manual-class updates, Renovate for repo pins, and bun devDependencies for repo tooling.

Research findings that shape this design (docs.fallow.tools, action.yml, npm registry):

- `fallow-mcp` shells out to the `fallow` CLI: `FALLOW_BIN` env var, else `fallow` from PATH. It never consults local `node_modules`.
- The official GitHub Action `fallow-rs/fallow` is a composite action that downloads its own binary and, when its `version` input is omitted, reads the version from the repo's `package.json` fallow dependency.
- fallow has built-in plugins for commitlint and lint-staged (activated by their packages being in devDependencies), so their config files are auto-detected entries. There is no oxfmt plugin → `oxfmt.config.ts` needs a manual `entry`.
- Telemetry is opt-in and off by default; nothing to disable.

## Goals / Non-Goals

**Goals:**

- fallow usable in any project on the machine (CLI + MCP + agent skill) — global layer.
- fallow wired into this repo like the rest of the JS tooling (devDep + config + script + CI) — project layer.
- Every version track has an owner: global → `update-extra`; devDep + action → Renovate.

**Non-Goals:**

- Paid runtime layer: no `fallow license`, `fallow coverage`, `FALLOW_LICENSE`/`FALLOW_API_*` anywhere.
- `fallow hooks install` (PreToolUse commit/push gate): too intrusive to enable machine-wide; per-project opt-in remains available manually.
- LSP/editor integration (VS Code extension): primary editor is WebStorm; `fallow-lsp` ships with the package but nothing configures it.
- Per-project `.mcp.json` override in this repo (see Risks).

## Decisions

### D1: Global install via `npm install -g fallow`, new group after NVM/Node

Docs-recommended path; one package delivers all three bins. Requires node, which Group 6 already bootstraps — the new group follows it and skips with a warning when node is absent. Alternatives: Homebrew (no formula exists), `cargo install fallow-cli` (CLI only, no bundled MCP), GitHub Releases binary (unmanaged updates, no bin bundle guarantee). Pre-scan idempotency: `command -v fallow`.

### D2: MCP registered from PATH binary, not an npx pin

`claude mcp add --scope user fallow -- fallow-mcp`. Unlike the other 13 stdio servers (`npx -y pkg@version`), the fallow entry carries no version: `fallow-mcp` and the CLI it shells out to come from the same global install, so they can never skew from each other. An npx-pinned entry (`npx -y -p fallow@3.0.0 fallow-mcp`) would be Renovate-managed but re-downloads a large Rust binary per session start and can skew against the global CLI. Consequence for the install script: the fallow entry participates only in presence detection, not in the `pkg@version` outdated-check loop.

### D3: Agent skill via official plugin, enabled in settings template

`claude plugin marketplace add fallow-rs/fallow-skills` + `claude plugin install fallow-skills@fallow-rs/fallow-skills` appended to the existing `CC_MARKETPLACES`/`CC_PLUGINS` arrays, plus `"fallow-skills@fallow-skills": true` in `dot_claude/settings.json.tmpl` `enabledPlugins` (exact key verified at implementation from `claude plugin list --json`, following the plannotator precedent). The skill invokes fallow via `npx fallow`, so it resolves a project-local devDep first and falls back to the registry — works with or without the global install.

### D4: `update-extra` step runs `npm install -g fallow@latest`

Per the classify-tool-updates taxonomy the global install is manual-class (not brew, not self-updating, not repo-pinned). `npm install -g fallow@latest` over `npm update -g fallow`: unambiguous target version, immune to `npm update -g` semver-range quirks, and idempotent. (Supersedes the `npm update -g fallow` shorthand in the proposal.)

### D5: devDep pinned exact, doubling as the CI version pin

`bun add -d --exact fallow` — matches the repo convention for tool CLIs (commitlint, lint-staged, oxfmt are exact; only type packages use ranges). Renovate manages it under the standard npm rules (14-day minimum release age). The CI action's `version` input is deliberately omitted so it reads this same pin — one version source for the project layer.

### D6: Config is `.fallowrc.jsonc`, tuned for signal over noise

```jsonc
{
    "$schema": "https://raw.githubusercontent.com/fallow-rs/fallow/main/schema.json",
    // commitlint + lint-staged configs are auto-detected by built-in plugins;
    // oxfmt has no fallow plugin, so its config must be an explicit entry
    "entry": ["oxfmt.config.ts"],
    "ignorePatterns": ["**/*.tmpl", "dot_config/**", "dot_claude/**", "dot_local/**", "Library/**", "assets/**", "docs/**", "openspec/**"],
    "ignoreDependencies": ["@types/bun"],
    "rules": {
        // the repo's only exports are tool-config default exports consumed by
        // the tools themselves, not by imports
        "unused-exports": "off",
        "unused-types": "off"
    }
}
```

`.jsonc` extension over `.fallowrc.json` (both parsed as JSONC, lookup positions 1–2): the extension signals comments to editors and to oxfmt via lint-staged, which formats `"*"`. If oxfmt still mishandles it, the file goes into `.oxfmtignore` (established pattern). Discovery is verified at implementation with `bunx fallow list` (expected: commitlint/lint-staged plugins active, `oxfmt.config.ts` an entry, zero unused-file findings).

### D7: CI as a separate `fallow.yml` workflow using the official action

```yaml
on: pull_request
permissions: { contents: read, checks: write, pull-requests: write }
steps:
    - actions/checkout@v4 with fetch-depth: 0
    - fallow-rs/fallow@v3 with { command: audit, gate: new-only, comment: true, comment-layout: compact }
```

Separate file rather than a job in `ci.yml`: the action needs write permissions (`checks`, `pull-requests`) that the existing workflow doesn't have and shouldn't gain. No setup-bun/`bun install` in this job — the action is self-contained. `@v3` (tag exists; npm 3.0.0 matches; the `@v2` in doc examples is lag) — Renovate's `config:best-practices` pins it to a digest and manages bumps. `gate: new-only` is ratchet semantics: only findings introduced by the PR fail (exit 1 / verdict `fail`); pre-existing findings report but pass. `fallow review` is never used as a gate (always exits 0). SARIF upload stays off (action default).

### D8: package.json script `lint:fallow` = `fallow audit`

Matches the `lint:oxfmt` naming. Runs the same analysis CI runs (local invocation resolves the devDep via bun's script PATH). Full-repo one-shots stay ad-hoc (`bunx fallow`, `bunx fallow dead-code`, …) and are documented in the manual instead of multiplying scripts.

## Risks / Trade-offs

- [Global/local version skew: user-scope `fallow-mcp` always runs the global CLI, even inside this repo where the devDep pin may differ] → Accepted. Both tracks stay current (update-extra / Renovate); docs document no incompatibility. Escape hatch if it ever bites: project `.mcp.json` entry `{"command": "bunx", "args": ["fallow-mcp"]}` shadowing the user-scope name.
- [nvm switching node versions orphans the global fallow (globals are per-node-version)] → Same exposure as every npm global under nvm; re-running the install script or `update-extra` restores it. Known, not new.
- [oxfmt (lint-staged `"*"`) may corrupt or reject `.fallowrc.jsonc`] → Verified during implementation; `.oxfmtignore` entry if needed (precedent: chezmoi modify_/run_ scripts).
- [First CI runs may annotate pre-existing findings in touched files] → `gate: new-only` keeps them non-blocking; the tuned config plus a `bunx fallow list` verification pass minimizes false positives before the workflow lands.
- [Action inputs differ between doc pages (v2 vs v3 staleness)] → Inputs used here (`command`, `gate`, `comment`, `comment-layout`) verified against `action.yml` on `main`; re-verify against the `v3` tag at implementation.

## Migration Plan

Forward: single PR; machine-side effects land on next `chezmoi apply` + install script run (new group, MCP add, plugin install). Rollback: revert the PR; manual cleanup on affected machines — `npm rm -g fallow`, `claude mcp remove fallow -s user`, `claude plugin uninstall fallow-skills@fallow-skills`.

## Open Questions

None blocking. Implementation-time verifications (tracked as tasks): exact `enabledPlugins` key for fallow-skills, oxfmt behavior on `.fallowrc.jsonc`, `bunx fallow list` discovery output, action input names against the `v3` tag.
