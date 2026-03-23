## Why

The dotfiles repo manages Claude Code plugin installation via `run_once_install-packages.sh.tmpl` and plugin configuration via `dot_claude/settings.json.tmpl`. The skills.sh CLI (`npx skills add --skill <name> -g -y`) installs individual global skills that enhance Claude Code (and other agents) without touching `settings.json` — it only creates files in `~/.agents/skills/` (source) and symlinks in `~/.claude/skills/`. This makes it safe to add to the `run_once` script with zero conflict with chezmoi-managed files.

## What Changes

- Add a new section to `run_once_install-packages.sh.tmpl` that installs 10 individual global skills via `npx -y skills add <repo> --skill <name> -g -y`
- Use `npx -y skills list -g --json` to detect already-installed skills and skip them
- Skills to install:
    - `vercel-labs/skills` → find-skills
    - `vercel-labs/agent-skills` → vercel-react-best-practices, web-design-guidelines, vercel-composition-patterns
    - `anthropics/skills` → frontend-design, skill-creator, pdf, pptx, docx, xlsx

## Capabilities

### New Capabilities

- `skills-global-install`: Installation of individual skills.sh global skills via the `run_once` script, with per-skill idempotency checks using the CLI's `list --json` output

### Modified Capabilities

- `claude-code-plugins`: The `run_once` script gains a new group for skills.sh alongside the existing plugin marketplace/install section

## Impact

- `run_once_install-packages.sh.tmpl`: New install group added
- `.chezmoiignore.tmpl`: May need entries for `dot_agents/` if chezmoi picks up the `~/.agents/` directory
- No changes to `dot_claude/settings.json.tmpl` — verified empirically that `npx skills add` does not modify `settings.json`
