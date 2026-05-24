## 1. Settings template

- [x] 1.1 In `dot_claude/settings.json.tmpl`, wrap the `"superwhisper@superwhisper": true` line in `enabledPlugins` with `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}`, keeping the leading comma inside the conditional so the JSON stays valid when the block is dropped.
- [x] 1.2 In the same file, wrap the `"superwhisper": { ... }` block inside `extraKnownMarketplaces` with the same `darwin/arm64` guard, again keeping the leading comma inside the conditional.
- [x] 1.3 Render the template both ways and validate the output JSON: `chezmoi cat ~/.claude/settings.json | jq .` should succeed on Apple Silicon and the same command (or `chezmoi execute-template` with `arch=amd64`) should succeed on Intel.

## 2. Install script

- [x] 2.1 In `run_onchange_install-packages.sh.tmpl`, remove `"superultrainc/superwhisper-claude-code"` from the `CC_MARKETPLACES` array.
- [x] 2.2 In the same file, remove `"superwhisper@superwhisper"` from the `CC_PLUGINS` array.
- [x] 2.3 Add a dedicated step after the existing Claude Code plugin dependencies group, wrapped in `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}`:
    - Skip with a warning if `command -v claude` fails.
    - Skip with a warning if `/Applications/superwhisper.app` is missing.
    - Skip with an "already installed" message if `claude plugin list 2>/dev/null | grep -q "superwhisper@superwhisper"`.
    - Otherwise, prompt with `confirm "Install SuperWhisper Claude Code plugin via superwhisper.com?"` and on `Y` run `curl -fsSL https://superwhisper.com/install-claude-code.sh | bash`, routing failure through the existing `error` helper.
- [x] 2.4 Smoke-test the bash on `darwin/arm64` by running `chezmoi execute-template` over the file and piping the output through `shellcheck`. (Shellcheck unavailable on this Intel host and brew install was denied; validated via `bash -n` instead — maintainer should run shellcheck before merge.)

## 3. Spec sync

- [x] 3.1 Confirm the delta file at `openspec/changes/fix-superwhisper-plugin-install/specs/claude-code-plugins/spec.md` covers every scenario listed in the design.
- [x] 3.2 Run `openspec validate fix-superwhisper-plugin-install` and resolve any errors.

## 4. Local verification

- [x] 4.1 On this Intel host: run `chezmoi diff` and confirm the rendered `~/.claude/settings.json` drops the two SuperWhisper entries cleanly (no syntactic damage to the surrounding JSON).
- [ ] 4.2 On the maintainer's Apple Silicon host: run `chezmoi apply`, accept the SuperWhisper prompt once, and verify `claude plugin list` shows `superwhisper@superwhisper`. Re-run `chezmoi apply` and confirm the SuperWhisper step reports "already installed" and skips.
- [x] 4.3 Confirm no Intel session emits `Bad CPU type in executable: /Applications/superwhisper.app/Contents/Resources/claude-hook` after `chezmoi apply` (the hook is gone because the plugin is no longer enabled). (Verified equivalently via tasks 5.1/5.2 on this Intel host: `claude --print` session at `~/.claude/projects/-private-tmp/8ca0754a-f7ac-4f28-adf7-68266938d38c.jsonl` shows zero hook events and no "Bad CPU type" entries. The cached plugin is marked `.orphaned_at` and its `Stop`/`Notification`/`PreToolUse`/`PermissionRequest` hooks are no longer loaded.)

## 5. One-shot cleanup on this Intel machine (outside chezmoi)

- [x] 5.1 Run `claude plugin uninstall superwhisper@superwhisper`.
- [x] 5.2 Run `claude plugin marketplace remove superwhisper`. (The marketplace identifier is the local name from `marketplace.json`, not the GitHub repo path.)
- [x] 5.3 Leave the `superwhisper` cask installed — the dictation app keeps working standalone. (No-op — `ALL_CASKS` in `run_onchange_install-packages.sh.tmpl` is untouched.)
