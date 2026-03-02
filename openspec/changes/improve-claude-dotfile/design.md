## Context

This dotfiles repo uses chezmoi to manage user configuration. Claude Code settings live in `dot_claude/settings.json.tmpl` and deploy to `~/.claude/settings.json`. The file is a chezmoi template (it references `{{ .chezmoi.homeDir }}`). It currently manages environment variables, a status line plugin (claude-hud), and a list of enabled plugins.

Plannotator is a visual plan review tool for AI coding agents. It provides a browser-based UI to annotate, approve, or request changes on agent plans before implementation. It integrates with Claude Code as a plugin (`plannotator@plannotator` from the `backnotprop/plannotator` marketplace).

## Goals / Non-Goals

**Goals:**

- Add Plannotator to the enabled plugins list so it's active on every managed machine

**Non-Goals:**

- Managing the Plannotator CLI installation (that's a separate `curl` install, outside chezmoi's scope for now)
- Configuring Plannotator-specific settings (it works with defaults)
- Adding Plannotator to OpenCode config (`opencode.json`) — that's a separate concern

## Decisions

**Append to existing `enabledPlugins` map**: Add `"plannotator@plannotator": true` as a new entry in the existing JSON object. No structural changes to the file. The key format `<plugin>@<marketplace-source>` matches the existing convention (e.g., `claude-hud@claude-hud`, `typescript-lsp@claude-plugins-official`).

**No chezmoi template changes needed**: The new entry is a static string with no machine-specific values. The file remains a `.tmpl` only because of the existing `{{ .chezmoi.homeDir }}` reference in `statusLine`.

## Risks / Trade-offs

**Plugin not installed** → If Plannotator CLI isn't installed on a machine, the `enabledPlugins` entry is inert. Claude Code ignores plugin references that aren't installed. No error, no impact.

**Marketplace plugin not added** → The user must also run `/plugin marketplace add backnotprop/plannotator` and `/plugin install plannotator@plannotator` in Claude Code for the entry to take effect. This is a one-time manual step per machine.
