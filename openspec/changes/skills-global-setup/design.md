## Context

The dotfiles repo uses chezmoi to manage configuration files and a `run_once` script for imperative setup steps (brew packages, fonts, oh-my-zsh, Claude Code plugins). The skills.sh CLI (`npx skills add <repo> --skill <name> -g -y`) installs individual agent skills globally by:

1. Cloning the repo temporarily
2. Copying the selected skill directory to `~/.agents/skills/` (universal, multi-agent)
3. Creating symlinks in agent-specific directories (e.g., `~/.claude/skills/` for Claude Code)

Verified empirically: the CLI does NOT modify `~/.claude/settings.json`, `installed_plugins.json`, or `known_marketplaces.json`. This means it has zero conflict with chezmoi-managed files.

## Goals / Non-Goals

**Goals:**

- Add skills.sh individual skill installation to the `run_once` script
- Install 10 specific skills from 3 repos using `--skill` flag for surgical selection
- Skip already-installed skills using `npx skills list -g --json`
- Prevent chezmoi from trying to manage the generated `~/.agents/` and `~/.claude/skills/` directories

**Non-Goals:**

- Tracking individual skill files in chezmoi templates
- Installing entire repos (use `--skill` to select only what we want)
- Managing skills for agents other than Claude Code (they get installed automatically by the CLI but we don't manage them)

## Decisions

### 1. Use `run_once` script, not chezmoi templates

**Decision**: Add `npx skills add` commands to the existing `run_once_install-packages.sh.tmpl` as a new group.

**Rationale**: The skills CLI generates files (`~/.agents/skills/`, `~/.claude/skills/` symlinks) that we don't need to template. Tracking these in chezmoi would be fragile and redundant.

**Alternatives considered**:

- Chezmoi `create_` or `modify_` scripts per skill directory — overly complex, fights the CLI
- Separate `run_onchange_` script — unnecessary since the install is idempotent and the list changes rarely

### 2. Individual skill installation with `--skill` flag

**Decision**: Use `npx -y skills add <repo> --skill <name> -g -y` instead of installing entire repos.

**Rationale**: Installing full repos pulls in many unwanted skills (e.g., `anthropics/skills` has 18 but we only want 6). The `--skill` flag gives surgical control over exactly which skills are installed.

### 3. Skip already-installed skills using CLI

**Decision**: Before installing, query `npx -y skills list -g --json` and check if each skill is already present. Skip if found.

**Rationale**: Avoids re-cloning repos and re-installing on every run. The JSON output provides structured data for reliable checks. The CLI itself is idempotent, but skipping saves time and network round-trips.

### 4. New install group with confirmation prompt

**Decision**: Add as a new "Group 6: Agent skills (skills.sh)" section, following the same `confirm()` pattern as existing groups.

**Rationale**: Consistent with the existing script structure. Users can skip if they don't want agent skills.

### 5. Require npx (Node.js) availability

**Decision**: Guard the section with a `command -v npx` check, similar to how Group 5 checks for `claude`.

**Rationale**: The skills CLI is distributed via npm. If npx isn't available, we warn and skip.

### 6. No chezmoiignore changes needed

**Decision**: No changes to `.chezmoiignore.tmpl` required.

**Rationale**: Chezmoi only manages files that have corresponding source entries in the repo (e.g., `dot_agents/`). Since we won't create a `dot_agents/` or `dot_claude/skills/` directory in the source, chezmoi will ignore these runtime directories naturally.

## Risks / Trade-offs

- **[10 individual commands vs 3 repo-wide]** → More commands but precise control. Worth it to avoid 25 unwanted skills.
- **[npx dependency]** → Node.js/npm is generally available on dev machines. Guard with a check.
- **[Network required on first run]** → Same as all other `run_once` groups (brew, git clone, curl). Expected for initial setup.
- **[Skills CLI version changes]** → Using `npx -y skills` always gets the latest version.
