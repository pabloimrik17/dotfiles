## Context

The `2026-05-10-add-superwhisper-claude-plugin` change wired the SuperWhisper Claude Code plugin into chezmoi unconditionally: `superwhisper@superwhisper` lives in `enabledPlugins`, the `superultrainc/superwhisper-claude-code` marketplace lives in `extraKnownMarketplaces`, and Group 8 of `run_onchange_install-packages.sh.tmpl` installs both via the generic `claude plugin marketplace add` / `claude plugin install` loop.

That design assumed the plugin was portable across Mac architectures. It isn't. The plugin's hook binary at `/Applications/superwhisper.app/Contents/Resources/claude-hook` is a Mach-O `arm64`-only executable (verified with `lipo -info`), so on Intel Macs every Claude Code session ends with three `Stop hook error: ... Bad CPU type in executable` entries. The macOS app itself is a universal binary (x86_64 + arm64) — it's only the Claude Code hook binary that is arm64-only.

Separately, the upstream landing page at https://superwhisper.com/claude-code documents a single supported install path: `curl -fsSL https://superwhisper.com/install-claude-code.sh | bash`. The previous design rejected that command, citing the `permissions.deny` block in `dot_claude/settings.json` — but that block constrains the Claude Code agent, not `chezmoi apply`, which runs the install script directly in the user's shell. The constraint does not apply here.

## Goals / Non-Goals

**Goals:**

- Stop emitting the broken `superwhisper@superwhisper` configuration on Intel Macs at the chezmoi-template level — no runtime probing.
- Install the plugin on Apple Silicon via the same one-liner the upstream team documents, so plugin updates and integration changes track whatever SuperWhisper ships next.
- Guard the install against the case where the user declined the `superwhisper` cask, so we never call into a non-existent app.

**Non-Goals:**

- Touching the `superwhisper` cask itself — it works on Intel and stays in `ALL_CASKS` for users who want the dictation app without the Claude Code integration.
- Reverse-engineering and re-implementing `install-claude-code.sh` natively — the upstream installer is short, official, and HTTPS-served; replicating it would add maintenance with no benefit.
- Cross-platform support — SuperWhisper is macOS-only; nothing changes for Linux.
- OpenCode integration — out of scope.

## Decisions

### 1. Gate at the chezmoi-template level with `.chezmoi.arch`

Both `dot_claude/settings.json.tmpl` and `run_onchange_install-packages.sh.tmpl` wrap the SuperWhisper-specific blocks with:

```
{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") -}}
```

This is the most native chezmoi mechanism: `.chezmoi.arch` returns `amd64` on Intel and `arm64` on Apple Silicon, and is computed by chezmoi at apply-time from the host. No runtime probing in bash, no separate config flag.

**Alternative considered:** Add a `superwhisperEnabled` boolean to `.chezmoi.toml.tmpl` and let the user opt in. Rejected — adds a configuration knob for a fact chezmoi already knows. The arch check is cheaper and self-correcting if a user migrates from Intel to Apple Silicon.

**JSON comma handling:** the SuperWhisper entries are currently the last items in both `enabledPlugins` and `extraKnownMarketplaces`. To keep the template valid on both architectures, the conditional block carries the leading comma:

```
"code-simplifier@claude-plugins-official": true{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }},
    "superwhisper@superwhisper": true{{ end }}
```

### 2. Install via the upstream `curl | bash` one-liner

`run_onchange_install-packages.sh.tmpl` gains a dedicated arm64-only step that runs:

```bash
curl -fsSL https://superwhisper.com/install-claude-code.sh | bash
```

`chezmoi apply` executes scripts directly in the user's shell — the `permissions.deny` rules in `dot_claude/settings.json` only apply when the Claude Code agent is shelling out. The constraint that motivated the previous design's rejection does not exist in this context.

**Alternative considered:** Keep the marketplace + plugin install path. Rejected — the upstream team treats `install-claude-code.sh` as the supported entry point and may evolve it (URL handler registration, hook wiring, settings injection) in ways the generic `claude plugin install` flow would not pick up.

**Alternative considered:** Inspect the installer, then replicate it natively in bash. Rejected — extra maintenance with no benefit; if the installer changes, our replication drifts silently.

### 3. Prerequisite check on `/Applications/superwhisper.app`

Before invoking the installer, the new step checks for `/Applications/superwhisper.app`. If absent (user declined the cask), the step prints a warning and skips. This avoids leaving Claude Code wired to a non-existent app and matches the inert-on-missing posture used elsewhere.

We do not check architecture inside the script — that gating already happens at template-render time. If the script reaches the SuperWhisper block, the host is Apple Silicon by construction.

### 4. Idempotency via `claude plugin list`

The new step pre-checks `claude plugin list 2>/dev/null | grep -q "superwhisper@superwhisper"` and skips when the plugin is already installed. This matches the pre-scan pattern used by Group 8 and keeps re-runs cheap on machines where the install already happened.

### 5. Remove from `CC_MARKETPLACES` / `CC_PLUGINS`

`superultrainc/superwhisper-claude-code` and `superwhisper@superwhisper` are removed from those arrays. The dedicated step replaces them. Leaving them in would either (a) install the plugin twice or (b) require an inline `if` inside the loop — both are uglier than a separate block.

### 6. Keep the cask unchanged

The `superwhisper` entry in `ALL_CASKS` stays as-is on every architecture. Intel users may want SuperWhisper as a standalone dictation app even if they cannot use the Claude Code plugin. Removing it on Intel would be a regression for that workflow.

## Risks / Trade-offs

- **Upstream installer changes break things** → Mitigation: the script captures the exit status; failures bubble through the existing `ERRORS` accumulator like every other group. The installer is short and HTTPS-served by the SuperWhisper team, so the risk is comparable to any other curl-based step (oh-my-zsh, plannotator).
- **Pipe-to-shell in chezmoi context** → Mitigation: `chezmoi apply` already executes other curl-based installers (oh-my-zsh, plannotator, nvm). The pattern is established; the SuperWhisper step uses the same shape.
- **User on Apple Silicon declines the cask** → Mitigation: the `/Applications/superwhisper.app` check warns and skips. No partial state.
- **Existing Intel machines still have the plugin enabled in `~/.claude/settings.json` until they apply** → Mitigation: documented in `tasks.md`; the maintainer runs `claude plugin uninstall` + `claude plugin marketplace remove` on the local Intel machine outside the chezmoi pipeline.

## Migration Plan

1. Land the template edits and spec delta.
2. On Apple Silicon: run `chezmoi apply` → installer one-liner runs once → `claude plugin list` shows `superwhisper@superwhisper`. Re-runs report "already installed".
3. On Intel: run `chezmoi apply` → the SuperWhisper entries disappear from `~/.claude/settings.json`. The plugin and marketplace records inside the Claude Code config directory persist until manually removed (one-shot cleanup, out of scope of chezmoi).
4. Rollback: revert the commit. The previous unconditional template returns; no data needs to migrate back.

## Open Questions

_None._
