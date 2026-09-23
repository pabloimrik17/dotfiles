## Why

The TypeSafe skill (`typesafe-ai/skills`) gives agents the context to build with TypeSafe's System One API. We want it in every agent we maintain, installed the way the rest of our skills are. Its experiment flow expects `TYPESAFE_API_KEY` in the environment, and dotfiles has no way to deliver a secret env var to a shell today.

## What Changes

- Claude Code: register the `typesafe-ai` marketplace (`typesafe-ai/skills`) and install `typesafe@typesafe-ai`. The marketplace goes in `CC_MARKETPLACES`/`CC_PLUGINS` and in `modify_settings.json.tmpl` (`extraKnownMarketplaces` + `enabledPlugins`).
- OpenCode, Junie, Codex: install the `typesafe-ai` skill through skills.sh (`--agent opencode junie codex`), leaving out `claude-code`. Upstream says to use one install method per agent.
- Non-macOS fallback prints the plugin and skills.sh install commands.
- New age-encrypted shell secrets file at `~/.config/zsh/secrets.zsh` (source `dot_config/zsh/encrypted_private_secrets.zsh.age`), mode 600. It exports `TYPESAFE_API_KEY`, and future keys go in the same file.
- `dot_zshrc.tmpl` sources the secrets file when it exists.

## Capabilities

### New Capabilities

- `typesafe-skill-install`: TypeSafe plugin (Claude Code) and skills.sh skill (OpenCode, Junie, Codex), with idempotent installs and a manual fallback.
- `shell-secrets`: age-encrypted zsh file of secret env var exports, deployed with mode 600 and sourced by zshrc. It carries `TYPESAFE_API_KEY`.

### Modified Capabilities

None. Both follow existing contracts (`claude-code-plugins` arrays/pre-scan, `skills-global-install` `install_skill`, `chezmoi-encryption` naming) without changing their requirements.

## Impact

- `run_onchange_install-packages.sh.tmpl`: Group 8 arrays, Group 9 `install_skill` call, non-macOS fallback.
- `dot_claude/modify_settings.json.tmpl`: one marketplace and one plugin key.
- `dot_zshrc.tmpl`: guarded `source` line.
- New `dot_config/zsh/encrypted_private_secrets.zsh.age`: ciphertext in a public repo, and apply needs `~/.config/chezmoi/key.txt`, which ticker already requires.
- README / `docs/manual.html`: skill listing and secrets file.
