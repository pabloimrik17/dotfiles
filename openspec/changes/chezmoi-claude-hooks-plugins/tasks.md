## 1. Add plugins to enabledPlugins

- [x] 1.1 Add `"beads@beads-marketplace": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`
- [x] 1.2 Add `"code-simplifier@claude-plugins-official": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`

## 2. Add beads marketplace

- [x] 2.1 Add `beads-marketplace` entry to `extraKnownMarketplaces` with source `github`, repo `steveyegge/beads`, and `autoUpdate: true`

## 3. Add hooks

- [x] 3.1 Add top-level `hooks` key to `dot_claude/settings.json.tmpl` with `PreCompact` and `SessionStart` entries running `bd prime` with empty matcher

## 4. Install script updates

- [x] 4.1 Add `bd` to the `BREW_PACKAGES` array in `run_once_install-packages.sh.tmpl`
- [x] 4.2 Add beads marketplace registration (`claude plugin marketplace add steveyegge/beads`) to Claude Code plugin dependencies group
- [x] 4.3 Add beads plugin install (`claude plugin install beads@beads-marketplace`) to Claude Code plugin dependencies group
- [x] 4.4 Add code-simplifier plugin install (`claude plugin install code-simplifier@claude-plugins-official`) to Claude Code plugin dependencies group

## 5. Verification

- [ ] 5.1 Validate the resulting template produces valid JSON (no trailing commas, correct nesting)
- [ ] 5.2 Run `chezmoi diff` to confirm expected changes to `~/.claude/settings.json`
- [ ] 5.3 Verify `bd prime` runs without errors in a directory with `.beads/`
- [ ] 5.4 Verify `bd prime` no-ops without errors in a directory without `.beads/`
