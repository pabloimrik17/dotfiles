## Context

The dotfiles repo uses chezmoi to manage configuration files and a `run_once` script for imperative setup steps (brew packages, fonts, oh-my-zsh, Claude Code plugins). The skills.sh CLI (`npx skills add -g -y <repo>`) installs agent skills globally by:

1. Cloning the repo temporarily
2. Copying skill directories to `~/.agents/skills/` (universal, multi-agent)
3. Creating symlinks in agent-specific directories (e.g., `~/.claude/skills/` for Claude Code)

Verified empirically: the CLI does NOT modify `~/.claude/settings.json`, `installed_plugins.json`, or `known_marketplaces.json`. This means it has zero conflict with chezmoi-managed files.

## Goals / Non-Goals

**Goals:**

- Add skills.sh global skill installation to the `run_once` script
- Install 6 repos: `vercel-labs/agent-skills`, `vercel-labs/skills`, `anthropics/skills`, `vercel-labs/next-skills`, `shadcn/ui`, `denoland/skills`
- Ensure idempotency (re-running is safe)
- Prevent chezmoi from trying to manage the generated `~/.agents/` and `~/.claude/skills/` directories

**Non-Goals:**

- Tracking individual skill files in chezmoi templates
- Selective skill installation (each repo installs all its skills)
- Managing skills for agents other than Claude Code (they get installed automatically by the CLI but we don't manage them)

## Decisions

### 1. Use `run_once` script, not chezmoi templates

**Decision**: Add `npx skills add -g -y` commands to the existing `run_once_install-packages.sh.tmpl` as a new group.

**Rationale**: The skills CLI generates files (`~/.agents/skills/`, `~/.claude/skills/` symlinks) that we don't need to template. The CLI is idempotent and handles symlinking. Tracking these in chezmoi would be fragile and redundant.

**Alternatives considered**:

- Chezmoi `create_` or `modify_` scripts per skill directory — overly complex, fights the CLI
- Separate `run_onchange_` script — unnecessary since the install is idempotent and the list changes rarely

### 2. New install group with confirmation prompt

**Decision**: Add as a new "Group 6: Agent skills (skills.sh)" section, following the same `confirm()` pattern as existing groups.

**Rationale**: Consistent with the existing script structure. Users can skip if they don't want agent skills.

### 3. Require npx (Node.js) availability

**Decision**: Guard the section with a `command -v npx` check, similar to how Group 5 checks for `claude`.

**Rationale**: The skills CLI is distributed via npm. If npx isn't available, we warn and skip.

### 4. No chezmoiignore changes needed

**Decision**: No changes to `.chezmoiignore.tmpl` required.

**Rationale**: Chezmoi only manages files that have corresponding source entries in the repo (e.g., `dot_agents/`). Since we won't create a `dot_agents/` or `dot_claude/skills/` directory in the source, chezmoi will ignore these runtime directories naturally.

## Risks / Trade-offs

- **[Repo installs all skills, not just selected ones]** → Acceptable trade-off. The repos contain curated collections and users can remove individual symlinks manually if needed.
- **[npx dependency]** → Node.js/npm is generally available on dev machines. Guard with a check.
- **[Network required on first run]** → Same as all other `run_once` groups (brew, git clone, curl). Expected for initial setup.
- **[Skills CLI version changes]** → Using `npx skills` always gets the latest. The `-y` flag auto-accepts prompts for non-interactive use.
