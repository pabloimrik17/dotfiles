## Context

The claude-hud plugin stores its configuration at `~/.claude/plugins/claude-hud/config.json`. This dotfiles repo manages it via chezmoi so the config is reproducible across machines. The current config has conservative defaults that hide useful information.

## Goals / Non-Goals

**Goals:**

- Surface git ahead/behind and file stats in the statusline
- Show rate limit usage earlier (5h at 60%, 7d at 70%)

**Non-Goals:**

- Using chezmoi templates (plain JSON is sufficient, no templating needed)
- Changing layout mode, element ordering, or other display settings
- Porting features from claude-statusline (effort level, extra $)

## Decisions

**Chezmoi-managed config**: The config is stored as `dot_claude/plugins/claude-hud/config.json` in the dotfiles repo. Chezmoi deploys it to `~/.claude/plugins/claude-hud/config.json`, making it reproducible across machines and consistent with how the rest of `~/.claude/` is managed.

**Threshold values (60/70)**: The 5h threshold at 60% gives ~30 minutes of awareness before hitting typical limits. The 7d at 70% surfaces weekly usage as it becomes relevant without constant noise.

## Risks / Trade-offs

- **More visual noise on the statusline** → Mitigated by the fact that git stats only appear when there's actual state (dirty/ahead/behind), and usage only appears above thresholds
- **Plugin updates may reset config** → Mitigated by chezmoi; running `chezmoi apply` restores the desired config
