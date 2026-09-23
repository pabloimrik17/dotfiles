## 1. Claude Code plugin

- [x] 1.1 Add `typesafe-ai/skills` to `CC_MARKETPLACES` and `typesafe@typesafe-ai` to `CC_PLUGINS` in `run_onchange_install-packages.sh.tmpl`. Verify with `grep -n typesafe run_onchange_install-packages.sh.tmpl` (2 hits in Group 8).
- [x] 1.2 In `dot_claude/modify_settings.json.tmpl`, add `"typesafe@typesafe-ai": true` to `enabledPlugins` and a `typesafe-ai` marketplace (`github`, `typesafe-ai/skills`, `autoUpdate: true`) to `extraKnownMarketplaces`, both in alphabetical position. Verify with `chezmoi execute-template` output piped to `jq '.enabledPlugins["typesafe@typesafe-ai"], .extraKnownMarketplaces["typesafe-ai"]'`.

## 2. skills.sh install

- [x] 2.1 Add `install_skill "typesafe-ai/skills" "typesafe-ai" "opencode junie codex"` to Group 9. Verify: the rendered script (`chezmoi execute-template < run_onchange_install-packages.sh.tmpl | bash -n`) parses, and the line is present.
- [x] 2.2 Add the two `claude plugin` commands and `npx -y skills add typesafe-ai/skills --skill typesafe-ai -g -y --agent opencode junie codex` to the non-macOS fallback. Verify with `grep -n 'typesafe' run_onchange_install-packages.sh.tmpl` (3 fallback hits).

## 3. Shell secrets

- [x] 3.1 Add a guarded `[[ -r "$XDG_CONFIG_HOME/zsh/secrets.zsh" ]] && source "$XDG_CONFIG_HOME/zsh/secrets.zsh"` after the `# User configuration` exports in `dot_zshrc.tmpl`. Verify: `zsh -n` on the rendered template passes, and `zsh -i -c exit` with the file absent prints nothing.
- [x] 3.2 USER: write `~/.config/zsh/secrets.zsh` with `export TYPESAFE_API_KEY=...`, then run `! chezmoi add --encrypt ~/.config/zsh/secrets.zsh` so the plaintext never reaches the agent. Verify: `dot_config/zsh/encrypted_private_secrets.zsh.age` exists in the dev clone, starts with `age-encryption.org/v1`, and `git grep` finds no key prefix in tracked files.
- [x] 3.3 Verify end to end: after `chezmoi apply`, `stat -f %Lp ~/.config/zsh/secrets.zsh` prints `600`, and `zsh -i -c '[[ -n $TYPESAFE_API_KEY ]] && echo ok'` prints `ok`.

## 4. Docs and apply

- [x] 4.1 Update the README and `docs/manual.html` (via the update-readme / update-manual skills): list the TypeSafe skill with its agents, and document the secrets file (path, `chezmoi edit` to add keys, rotation). Verify the entries render.
- [x] 4.2 Run the install groups on this machine. Verify that `claude plugin list --json` includes `typesafe@typesafe-ai` and that `npx -y skills list -g --json | jq '.[] | select(.name=="typesafe-ai") | .agents'` shows OpenCode, Junie, and Codex but not Claude Code.
- [x] 4.3 Run `openspec validate add-typesafe-skill --strict` and confirm it passes.
