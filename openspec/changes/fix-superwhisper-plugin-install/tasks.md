## 1. Settings template

- [ ] 1.1 In `dot_claude/settings.json.tmpl`, wrap the `"superwhisper@superwhisper": true` line in `enabledPlugins` with `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}`, keeping the leading comma inside the conditional so the JSON stays valid when the block is dropped.
- [ ] 1.2 In the same file, wrap the `"superwhisper": { ... }` block inside `extraKnownMarketplaces` with the same `darwin/arm64` guard, again keeping the leading comma inside the conditional.
- [ ] 1.3 Render the template both ways and validate the output JSON: `chezmoi cat ~/.claude/settings.json | jq .` should succeed on Apple Silicon and the same command (or `chezmoi execute-template` with `arch=amd64`) should succeed on Intel.

## 2. Install script

- [ ] 2.1 In `run_onchange_install-packages.sh.tmpl`, remove `"superultrainc/superwhisper-claude-code"` from the `CC_MARKETPLACES` array.
- [ ] 2.2 In the same file, remove `"superwhisper@superwhisper"` from the `CC_PLUGINS` array.
- [ ] 2.3 Add a dedicated step after the existing Claude Code plugin dependencies group, wrapped in `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}`:
    - Skip with a warning if `command -v claude` fails.
    - Skip with a warning if `/Applications/superwhisper.app` is missing.
    - Skip with an "already installed" message if `claude plugin list 2>/dev/null | grep -q "superwhisper@superwhisper"`.
    - Otherwise, prompt with `confirm "Install SuperWhisper Claude Code plugin via superwhisper.com?"` and on `Y` run `curl -fsSL https://superwhisper.com/install-claude-code.sh | bash`, routing failure through the existing `error` helper.
- [ ] 2.4 Smoke-test the bash on `darwin/arm64` by running `chezmoi execute-template` over the file and piping the output through `shellcheck`.

## 3. Spec sync

- [ ] 3.1 Confirm the delta file at `openspec/changes/fix-superwhisper-plugin-install/specs/claude-code-plugins/spec.md` covers every scenario listed in the design.
- [ ] 3.2 Run `openspec validate fix-superwhisper-plugin-install` and resolve any errors.

## 4. Local verification

- [ ] 4.1 On this Intel host: run `chezmoi diff` and confirm the rendered `~/.claude/settings.json` drops the two SuperWhisper entries cleanly (no syntactic damage to the surrounding JSON).
- [ ] 4.2 On the maintainer's Apple Silicon host: run `chezmoi apply`, accept the SuperWhisper prompt once, and verify `claude plugin list` shows `superwhisper@superwhisper`. Re-run `chezmoi apply` and confirm the SuperWhisper step reports "already installed" and skips.
- [ ] 4.3 Confirm no Intel session emits `Bad CPU type in executable: /Applications/superwhisper.app/Contents/Resources/claude-hook` after `chezmoi apply` (the hook is gone because the plugin is no longer enabled).

## 5. One-shot cleanup on this Intel machine (outside chezmoi)

- [ ] 5.1 Run `claude plugin uninstall superwhisper@superwhisper`.
- [ ] 5.2 Run `claude plugin marketplace remove superultrainc/superwhisper-claude-code`.
- [ ] 5.3 Leave the `superwhisper` cask installed — the dictation app keeps working standalone.
