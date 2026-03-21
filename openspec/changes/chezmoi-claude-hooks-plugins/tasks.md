## 1. Add plugins to enabledPlugins

- [ ] 1.1 Add `"beads@beads-marketplace": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`
- [ ] 1.2 Add `"code-simplifier@claude-plugins-official": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`

## 2. Add beads marketplace

- [ ] 2.1 Add `beads-marketplace` entry to `extraKnownMarketplaces` with source `github`, repo `steveyegge/beads`, and `autoUpdate: true`

## 3. Add hooks

- [ ] 3.1 Add top-level `hooks` key to `dot_claude/settings.json.tmpl` with `PreCompact` and `SessionStart` entries running `bd prime` with empty matcher

## 4. Verification

- [ ] 4.1 Validate the resulting template produces valid JSON (no trailing commas, correct nesting)
- [ ] 4.2 Run `chezmoi diff` to confirm expected changes to `~/.claude/settings.json`
