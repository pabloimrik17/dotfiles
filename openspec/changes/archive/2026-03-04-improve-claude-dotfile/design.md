## Context

This dotfiles repo uses chezmoi to manage user configuration. Claude Code settings live in `dot_claude/settings.json.tmpl` and deploy to `~/.claude/settings.json`. The file is a chezmoi template (it references `{{ .chezmoi.homeDir }}`). It currently manages environment variables, a status line plugin (claude-hud), and a list of enabled plugins.

Plannotator is a visual plan review tool for AI coding agents. It provides a browser-based UI to annotate, approve, or request changes on agent plans before implementation. It integrates with Claude Code as a plugin (`plannotator@plannotator` from the `backnotprop/plannotator` marketplace).

## Goals / Non-Goals

**Goals:**

- Add Plannotator to the enabled plugins list so it's active on every managed machine
- Automate Plannotator CLI installation via the chezmoi run_once install script

**Non-Goals:**

- Configuring Plannotator-specific settings (it works with defaults)
- Adding Plannotator to OpenCode config (`opencode.json`) — that's a separate concern

## Decisions

**Append to existing `enabledPlugins` map**: Add `"plannotator@plannotator": true` as a new entry in the existing JSON object. No structural changes to the file. The key format `<plugin>@<marketplace-source>` matches the existing convention (e.g., `claude-hud@claude-hud`, `typescript-lsp@claude-plugins-official`).

**No chezmoi template changes needed for settings**: The new entry is a static string with no machine-specific values. The file remains a `.tmpl` only because of the existing `{{ .chezmoi.homeDir }}` reference in `statusLine`.

**New install group in run_once script**: Add a Group 5 ("Claude Code plugin dependencies") to `run_once_install-packages.sh.tmpl`. The group uses `curl | bash` from `https://plannotator.ai/install.sh`, matching the official install instructions. It checks `command -v plannotator` to skip if already installed, and is gated behind a `confirm` prompt like all other groups.

**Plannotator appears in two groups**: Group 4 (OpenCode plugins) and Group 5 (Claude Code plugin dependencies) both install plannotator because it serves both tools. Group 4 is gated behind `command -v opencode`, so on machines without OpenCode, only Group 5 installs it. Both groups have idempotency checks (`command -v plannotator`) to prevent double-install.

## Risks / Trade-offs

**Plugin not installed** → If the user declines the install prompt or Plannotator CLI isn't installed, the `enabledPlugins` entry is inert. Claude Code ignores plugin references that aren't installed. No error, no impact.

**Marketplace plugin not added** → The user must also run `/plugin marketplace add backnotprop/plannotator` and `/plugin install plannotator@plannotator` in Claude Code for the entry to take effect. This is a one-time manual step per machine.

**curl | bash trust** → The install script is fetched from `plannotator.ai`. This follows the same pattern as oh-my-zsh installation in Group 3. The interactive confirmation prompt mitigates accidental execution.
