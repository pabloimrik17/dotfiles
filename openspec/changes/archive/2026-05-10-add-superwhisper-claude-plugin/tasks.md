## 1. Settings template

- [x] 1.1 Add `"superwhisper@superwhisper": true` to the `enabledPlugins` object in `dot_claude/settings.json.tmpl` (append after `code-simplifier@claude-plugins-official`)
- [x] 1.2 Add a `superwhisper` entry to `extraKnownMarketplaces` in `dot_claude/settings.json.tmpl` with `source.source: "github"`, `source.repo: "superultrainc/superwhisper-claude-code"`, and `autoUpdate: true`

## 2. Install script

- [x] 2.1 Append `"superultrainc/superwhisper-claude-code"` to the `CC_MARKETPLACES` array in `run_onchange_install-packages.sh.tmpl`
- [x] 2.2 Append `"superwhisper@superwhisper"` to the `CC_PLUGINS` array in `run_onchange_install-packages.sh.tmpl`

## 3. Verification

- [x] 3.1 Render the template with `chezmoi cat ~/.claude/settings.json` and validate with `jq .` (no parse errors)
- [x] 3.2 Confirm `chezmoi diff` shows only the four expected additions (one plugin, one marketplace, two install-script entries)
- [x] 3.3 Run `claude plugin marketplace list --json | jq '.[] | select(.repo // .source.repo == "superultrainc/superwhisper-claude-code")'` and confirm the marketplace is registered after `chezmoi apply`
- [x] 3.4 Run `claude plugin list --json | jq '.[] | select(.id == "superwhisper@superwhisper")'` and confirm the plugin is installed after `chezmoi apply`
- [x] 3.5 Re-run `chezmoi apply`; confirm the install script reports the marketplace and plugin as already registered/installed (idempotency)

## 4. OpenSpec validation

- [x] 4.1 Run `openspec validate add-superwhisper-claude-plugin --strict` and resolve any reported issues
