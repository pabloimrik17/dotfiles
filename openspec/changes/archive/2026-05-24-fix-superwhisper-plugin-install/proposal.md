## Why

The chezmoi-managed Claude Code config enables `superwhisper@superwhisper` on every Mac, but the plugin ships an ARM64-only hook binary (`/Applications/superwhisper.app/Contents/Resources/claude-hook`). On Intel Macs the hook crashes every stop with `Bad CPU type in executable`, polluting every Claude Code session. The current install method also diverges from the upstream-recommended installer at https://superwhisper.com/claude-code, which the plugin's own docs advertise as the supported path.

## What Changes

- Gate the SuperWhisper Claude Code plugin behind `darwin/arm64` using chezmoi's native `.chezmoi.os` + `.chezmoi.arch` template variables, in both `dot_claude/settings.json.tmpl` and `run_onchange_install-packages.sh.tmpl`. **BREAKING** for Intel Macs: the plugin and marketplace entries disappear from `~/.claude/settings.json` and the install script no longer installs them.
- Remove `superultrainc/superwhisper-claude-code` from `CC_MARKETPLACES` and `superwhisper@superwhisper` from `CC_PLUGINS` — the plugin is no longer installed via `claude plugin install`.
- Add a dedicated install step (gated `darwin/arm64`) that runs the upstream installer `curl -fsSL https://superwhisper.com/install-claude-code.sh | bash`, after confirming `/Applications/superwhisper.app` exists. This aligns with the install path documented at https://superwhisper.com/claude-code.
- Leave the `superwhisper` cask in `ALL_CASKS` unchanged — the macOS app itself is a universal binary and Intel users may still want dictation outside Claude Code.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `claude-code-plugins`: SuperWhisper plugin enablement, marketplace registration, and install-script handling become conditional on Apple Silicon (`darwin/arm64`), and the install method switches from the generic `claude plugin install` flow to the upstream installer with an `/Applications/superwhisper.app` prerequisite check.

## Impact

- **Files**:
    - `dot_claude/settings.json.tmpl` — wrap the `superwhisper@superwhisper` entry in `enabledPlugins` and the `superwhisper` block in `extraKnownMarketplaces` with an `arm64` template guard.
    - `run_onchange_install-packages.sh.tmpl` — drop the two SuperWhisper entries from `CC_MARKETPLACES` / `CC_PLUGINS`; add a new arm64-gated install block that calls the upstream installer when `superwhisper.app` is present.
- **Dependencies**: relies on the upstream installer at `https://superwhisper.com/install-claude-code.sh` staying available. The `claude` CLI is still required (the installer calls it).
- **Runtime behavior**: Intel Macs no longer see the plugin enabled and no longer try to install it; Apple Silicon Macs go through the same path the SuperWhisper team supports.
- **Reversibility**: full — rollback is a single revert; no data migration.
