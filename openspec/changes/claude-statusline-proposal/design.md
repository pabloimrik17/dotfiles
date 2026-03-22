## Context

The claude-hud plugin stores its configuration at `~/.claude/plugins/claude-hud/config.json`. This file is managed by the plugin itself (via `/claude-hud:configure`), not by chezmoi. The current config has conservative defaults that hide useful information.

## Goals / Non-Goals

**Goals:**

- Surface git ahead/behind and file stats in the statusline
- Show rate limit usage earlier (5h at 60%, 7d at 70%)

**Non-Goals:**

- Managing claude-hud config via chezmoi templates
- Changing layout mode, element ordering, or other display settings
- Porting features from claude-statusline (effort level, extra $)

## Decisions

**Direct config edit over chezmoi management**: The claude-hud config is plugin-managed and has its own setup/configure commands. Adding chezmoi management would conflict with the plugin's own config flow. Direct edit is simpler and correct.

**Threshold values (60/70)**: The 5h threshold at 60% gives ~30 minutes of awareness before hitting typical limits. The 7d at 70% surfaces weekly usage as it becomes relevant without constant noise.

## Risks / Trade-offs

- **More visual noise on the statusline** → Mitigated by the fact that git stats only appear when there's actual state (dirty/ahead/behind), and usage only appears above thresholds
- **Plugin updates may reset config** → Low risk; claude-hud preserves user config across updates
