## Context

The dotfiles repo uses chezmoi to manage shell config, CLI tools, and Claude Code settings across machines. Tools are installed via a `run_once` script with grouped interactive prompts. Shell integrations (starship, zoxide, atuin, gh) are baked directly into `dot_zshrc.tmpl` as `eval` lines rather than relying on tools modifying `.zshrc` at runtime.

Worktrunk is a Rust CLI (`wt`) for git worktree management, installed via brew, with shell integration that enables `cd` on `wt switch`.

## Goals / Non-Goals

**Goals:**
- Install worktrunk consistently across machines via the existing brew packages group
- Shell integration managed by chezmoi, not by `wt config shell install`
- Sensible default config with a universal post-create hook for JS dependency installation
- Claude Code plugin enabled out of the box

**Non-Goals:**
- Per-project `.config/wt.toml` files (those live in each project repo, not in dotfiles)
- Worktrunk statusline replacing claude-hud (keep current statusline)
- Removing the `using-git-worktrees` superpowers skill in this change (evaluate separately)
- Linux/Windows automated installation (manual instructions only, matching existing pattern)

## Decisions

### D1: Add worktrunk to Group 1 brew packages
**Decision**: Add `worktrunk` to the existing `BREW_PACKAGES` array alongside starship, eza, bat, etc.

**Rationale**: Worktrunk is a standalone brew package with no special install steps beyond the binary. It fits the same pattern as the other CLI tools. A separate group would add an unnecessary interactive prompt.

**Alternative considered**: Dedicated install group with shell integration step — rejected because shell integration is handled in `.zshrc`, not in the install script.

**Note**: Add `worktrunk` → `wt` mapping to `pkg_bin()` for the idempotent check.

### D2: Inline shell integration in zshrc template
**Decision**: Add `if command -v wt >/dev/null 2>&1; then eval "$(command wt config shell init zsh)"; fi` to the "Modern CLI Tools" section of `dot_zshrc.tmpl`, after the gh completions line.

**Rationale**: All other tool integrations (starship, zoxide, atuin, gh) use the same eval pattern in `.zshrc`. Running `wt config shell install` would write to `.zshrc` directly, which chezmoi would overwrite on next apply. Inlining keeps chezmoi as the single source of truth.

**Alternative considered**: Let `wt config shell install` modify `.zshrc` and use chezmoi `modify_` script — rejected as overly complex and fragile.

### D3: Static config.toml (no chezmoi template)
**Decision**: Use a plain `dot_config/worktrunk/config.toml` file, not a `.tmpl` template.

**Rationale**: The worktrunk config doesn't need machine-specific variables (no home dir paths, no OS conditionals). A static file is simpler and easier to maintain.

**Alternative considered**: `.toml.tmpl` with `{{ .chezmoi.homeDir }}` — rejected because worktrunk config paths are relative or don't reference home.

### D4: Lockfile-based package manager detection in hook
**Decision**: The post-create hook uses a simple if/elif chain checking for `bun.lock`, `pnpm-lock.yaml`, and `package-lock.json` in that order.

**Rationale**: Lockfile presence is the most reliable indicator of which package manager a project uses. The priority order (bun > pnpm > npm) reflects the user's preference. The hook exits silently for non-JS projects.

**Alternative considered**: Using `packageManager` field from `package.json` via jq — rejected as more complex and requires jq dependency. Lockfile check is simpler and covers all cases.

## Risks / Trade-offs

- **[Worktrunk shell init changes format]** → The eval command calls `wt config shell init zsh` at shell startup. If worktrunk changes its init output format, shell startup could break. Mitigation: guard with `command -v wt` check; worktrunk is stable (v1.x).
- **[Post-create hook assumes lockfile at worktree root]** → If a project has lockfiles in subdirectories only, the hook won't detect them. Mitigation: acceptable for the common case; per-project `.config/wt.toml` can override.
- **[Brew-only macOS install]** → No automated install path for cargo users on macOS. Mitigation: users who prefer cargo can skip the brew group and install manually.
