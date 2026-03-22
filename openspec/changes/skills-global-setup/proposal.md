## Why

The dotfiles repo manages Claude Code plugin installation via `run_once_install-packages.sh.tmpl` and plugin configuration via `dot_claude/settings.json.tmpl`. The skills.sh CLI (`npx skills add -g -y`) installs global skills that enhance Claude Code (and other agents) without touching `settings.json` — it only creates files in `~/.agents/skills/` (source) and symlinks in `~/.claude/skills/`. This makes it safe to add to the `run_once` script with zero conflict with chezmoi-managed files.

## What Changes

- Add a new section to `run_once_install-packages.sh.tmpl` that installs global skills via `npx skills add -g -y`
- Six repos to install covering: Vercel/React/Next.js best practices, Anthropic document skills (pdf, docx, pptx, xlsx), shadcn/ui, Deno, and skill discovery
- Add `~/.agents/` and `~/.claude/skills/` to `.chezmoiignore.tmpl` so chezmoi doesn't try to manage the generated files

## Capabilities

### New Capabilities

- `skills-global-install`: Installation of skills.sh global skills via the `run_once` script, including idempotency checks and the full list of skill repos

### Modified Capabilities

- `claude-code-plugins`: The `run_once` script gains a new group for skills.sh alongside the existing plugin marketplace/install section

## Impact

- `run_once_install-packages.sh.tmpl`: New install group added
- `.chezmoiignore.tmpl`: May need entries for `dot_agents/` if chezmoi picks up the `~/.agents/` directory
- No changes to `dot_claude/settings.json.tmpl` — verified empirically that `npx skills add` does not modify `settings.json`
