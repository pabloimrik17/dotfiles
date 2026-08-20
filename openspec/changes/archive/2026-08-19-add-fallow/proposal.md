# Add fallow (DOT-22)

## Why

[fallow](https://fallow.tools/) is codebase intelligence for TS/JS (dead code, duplication, circular deps, complexity, architecture boundaries) — Rust-native, sub-second, MIT. The dev environment has no graph-level analysis tool wired in for agents or humans; fallow fills that gap alongside eslint/knip MCP servers already registered. Free static layer only — the paid runtime layer (Fallow Runtime) stays out of scope.

## What Changes

Dual integration:

**Global layer** (machine setup — usable in any project):

- Install `fallow` globally via npm in `run_onchange_install-packages.sh.tmpl` (one package ships the three bins: `fallow`, `fallow-lsp`, `fallow-mcp`).
- Register `fallow` MCP server user-scope via `claude mcp add --scope user fallow -- fallow-mcp` (stdio, PATH binary — no npx pin; version tracked by the global install).
- Install the `fallow-skills` Claude Code plugin (marketplace `fallow-rs/fallow-skills`, plugin `fallow@fallow-skills`) and enable it in `dot_claude/settings.json.tmpl`.
- Add a `fallow` step to `update-extra` (`npm install -g fallow@latest`).

**Project layer** (this repo, same pattern as commitlint/lint-staged/oxfmt):

- `bun add -d fallow` — Renovate-managed pin; also the version source for CI (the official action reads the `package.json` dependency).
- `.fallowrc.jsonc` tuned for this repo: `entry: ["oxfmt.config.ts"]` (only config without a built-in fallow plugin; commitlint/lint-staged are auto-detected), ignore chezmoi surface (`**/*.tmpl`, `dot_*/`, etc.), `unused-exports`/`unused-types` off.
- `package.json` script `lint:fallow` (`fallow audit`).
- New `.github/workflows/fallow.yml` using the official `fallow-rs/fallow@v3` composite action (`command: audit`, `gate: new-only`, compact sticky PR comment; self-contained — no setup-bun in that job).

Docs (README What's Included + manual) updated via the `update-readme`/`update-manual` skills as implementation tasks; no spec-level docs changes.

## Capabilities

### New Capabilities

- `fallow-install`: global fallow installation — npm global install group in the install script, idempotency, and the three bundled binaries available on PATH.
- `fallow-project-config`: fallow as a devDependency of this repo with `.fallowrc.jsonc` config and `lint:fallow` script.
- `fallow-ci`: PR-gated fallow audit workflow in GitHub Actions via the official action.

### Modified Capabilities

- `mcp-global-config`: MCP server table grows from 13 to 14 — new `fallow` stdio server registered from the PATH binary (first non-npx-pinned stdio entry; update-path requirement must account for it).
- `claude-code-plugins`: new marketplace (`fallow-rs/fallow-skills`) and plugin (`fallow-skills`) in the install script arrays; `enabledPlugins` entry in `dot_claude/settings.json.tmpl`.
- `extra-updates-command`: step list gains a `fallow` step (`npm install -g fallow@latest`).

## Impact

- **Files**: `run_onchange_install-packages.sh.tmpl`, `dot_zshrc.tmpl`, `dot_claude/settings.json.tmpl`, `package.json` + `bun.lock`, new `.fallowrc.jsonc`, new `.github/workflows/fallow.yml`, `README.md`, `docs/manual.html`. Possibly `.oxfmtignore` (verify oxfmt vs JSONC comments before committing `.fallowrc.jsonc`).
- **Dependencies**: `fallow` 3.x (npm, global + devDep), `fallow-rs/fallow@v3` action, `fallow-rs/fallow-skills` plugin. Renovate manages the devDep pin and the action natively; the global install updates via `update-extra`.
- **Known trade-off**: user-scope `fallow-mcp` always resolves the global `fallow` from PATH; inside this repo the devDep pin may skew from the global version. Accepted — both tracks stay current (Renovate / update-extra), and `.mcp.json` project override via `bunx fallow-mcp` remains available as an escape hatch.
- **Free tier only**: no `FALLOW_LICENSE`, no cloud/coverage env vars, no `fallow license`/`coverage` usage anywhere.
