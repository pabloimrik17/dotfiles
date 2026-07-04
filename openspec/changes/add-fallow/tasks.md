# Tasks: add-fallow

## 1. Project layer

- [x] 1.1 `bun add -d --exact fallow` and verify `bunx fallow --version` reports 3.x
- [x] 1.2 Create `.fallowrc.jsonc` per design D6 (entry `oxfmt.config.ts`, chezmoi ignorePatterns, `ignoreDependencies: ["@types/bun"]`, `unused-exports`/`unused-types` off)
- [x] 1.3 Verify oxfmt handles `.fallowrc.jsonc` (run `bun run lint:oxfmt` / stage the file); add to `.oxfmtignore` if it corrupts or rejects it
- [x] 1.4 Verify discovery: `bunx fallow list` shows commitlint/lint-staged plugins active and `oxfmt.config.ts` as entry; `bunx fallow` reports no unused-file findings; tune config if not
- [x] 1.5 Add `"lint:fallow": "fallow audit"` script to `package.json`
- [x] 1.6 Create `.github/workflows/fallow.yml` per design D7, verifying input names (`command`, `gate`, `comment`, `comment-layout`) against the `v3` tag's `action.yml`

## 2. Global layer

- [x] 2.1 Add fallow install group to `run_onchange_install-packages.sh.tmpl` after the NVM/Node group (pre-scan `command -v fallow`, confirm prompt, `npm install -g fallow`, skip+warn without node)
- [x] 2.2 Add `"fallow:fallow-mcp"` to `MCP_STDIO_SERVERS` and confirm the existing loop registers it bare (no npx, no pin) and treats it as presence-check only in the outdated pre-scan
- [x] 2.3 Add `fallow-rs/fallow-skills` to `CC_MARKETPLACES` and the fallow-skills plugin to `CC_PLUGINS`; verify the exact plugin id (`fallow-skills@<marketplace-name>`) after a manual install via `claude plugin list --json` — verified against the marketplace manifest instead (live install denied by permissions): plugin name is `fallow`, so the id is `fallow@fallow-skills`
- [x] 2.4 Add the fallow-skills entry to `enabledPlugins` in `dot_claude/settings.json.tmpl` with the verified key (`fallow@fallow-skills`)
- [x] 2.5 Add step 7 to `update-extra` in `dot_zshrc.tmpl`: `_update_extra_step "fallow" npm install -g fallow@latest`

## 3. Docs

- [x] 3.1 Update `docs/manual.html` via the update-manual skill (fallow CLI commands — combined run, `dead-code`, `dupes`, `health`, `audit`, `fix --dry-run`; MCP server; update-extra step; free-tier note)
- [x] 3.2 Update `README.md` via the update-readme skill (What's Included entry for fallow)

## 4. Verification

- [ ] 4.1 Sync chezmoi source and run the install script end-to-end on this machine (`chezmoi update` + apply flow); confirm the fallow group, MCP registration, and plugin install behave idempotently on a second run
- [ ] 4.2 Smoke-test the global layer: `fallow --version`, `claude mcp list` shows `fallow` connected, fallow skill visible in Claude Code
- [ ] 4.3 Run `update-extra` and confirm the fallow step succeeds
- [ ] 4.4 Open a PR and confirm `fallow.yml` runs, posts the compact sticky comment, and passes on a no-findings diff
