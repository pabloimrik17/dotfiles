## Why

15 brew formulae and 1 cask are outdated, including two with security advisories (`openssl@3` 3.6.2 fixes 8 CVEs incl. one Moderate; `uv` 0.11.6 fixes GHSA-pjjw-68hj-v9mw). Beyond pure security, the changelogs surface several configurable features that fit this dotfiles setup — `[directory]` regex substitutions and `[git_status]` worktree/index split in starship 1.25, `TERMINAL.md` context file in atuin 18.16, and the `shell` field in opencode 1.14 — that are worth adopting at the same time as the version bumps. Beads 0.62→1.0.3 is intentionally excluded because its one-way schema migration to v11 plus the `steveyegge`→`gastownhall` repo move warrant an isolated, separately-archivable change.

## What Changes

### Brew upgrades (no repo changes — `brew upgrade <pkg>` per package)

- **Security**: `openssl@3` 3.6.1→3.6.2, `uv` 0.11.2→0.11.8
- **Patches**: `chezmoi` 2.70.0→2.70.2, `git-delta` 0.19.1→0.19.2, `television` 0.15.5→0.15.6, `coderabbit` cask 0.4.3→0.4.4, `dolt` 1.84.0→1.86.6
- **Minors low-risk**: `git` 2.53.0→2.54.0, `fzf` 0.70.0→0.72.0, `gh` 2.89.0→2.92.0
- **Minors with verification**: `starship` 1.24.2→1.25.1, `atuin` 18.13.6→18.16.0, `lazygit` 0.60.0→0.61.1, `worktrunk` 0.33.0→0.46.1

### Configuration adoption (changes to repo files)

- `dot_config/starship.toml`:
    - Add `[[directory.substitutions]]` entries with `regex = true` to shorten `~/WebstormProjects/` and `dotfiles.feature-*` paths in the prompt
    - Replace `[git_status]` to use the new split `index_*` and `worktree_*` variables (green for staged, red for unstaged) instead of lumped `$all_status`
- `dot_config/atuin/TERMINAL.md` (new file): user-defined context loaded by `atuin ai` describing the stack, owned-tool keybindings, and common workflows
- `dot_config/opencode/opencode.jsonc`: add `"shell": "zsh"` so the agent shell tool inherits aliases and PATH from `~/.zshrc`

### Worktrunk migration (housekeeping after upgrade)

- Run `wt config update` to migrate deprecated keys (`merge.no-ff`→`merge.ff`, `switch.no-cd`→`switch.cd`)
- Audit `[commit.generation].command` for any `--no-verify`/`--var KEY=VALUE` flags that need rename to `--no-hooks`/`--KEY=VALUE`
- Optionally migrate single-table `[pre-start]`/`[post-start]` to pipeline form `[[pre-start]]`/`[[post-start]]` (deprecated but still functional)

### Lazygit decision after upgrade

- 0.61 changes default file-sort to "mix files and folders" — decide whether to pin previous behavior in `dot_config/lazygit/config.yml` or accept the new default
- New free GitHub PR integration (icons + `shift-G`) requires no config

### Atuin verification after upgrade

- 18.14 auto-injects new hooks on `atuin ai init zsh` — verify init order in `dot_zshrc.tmpl` (fzf → tv → atuin) is preserved
- First `atuin ai` invocation prompts for client-tool execution permissions — accept restrictively
- `strip_trailing_whitespace` is now default-on (known behavior change)

### Habits / usage patterns (no repo changes — captured in proposal but not enforced by spec)

- Adopt `bd ready --exclude-label wip` once spike issues are labeled
- Use `bd batch` for bulk creates from the Claude beads plugin
- Use bd type `spike` for time-boxed exploration issues
- Add `bd dolt pull && bd config apply` to multi-machine switch routine (available after `bump-beads-1.0` lands)

## Capabilities

### New Capabilities

- `atuin-ai-context`: User-defined `TERMINAL.md` context file describing the local environment that `atuin ai` automatically loads to improve command suggestion quality

### Modified Capabilities

- `starship-config`: Adds regex-based `[directory]` substitutions and replaces the `[git_status]` requirement to use split worktree/index variables with green-for-staged / red-for-unstaged conventions
- `opencode-user-config`: Adds explicit `shell: "zsh"` field so the agent shell tool resolves to zsh and inherits user aliases/PATH

## Impact

### Affected files

- `dot_config/starship.toml` (modified — `[directory]` substitutions, `[git_status]` rewrite)
- `dot_config/atuin/TERMINAL.md` (new)
- `dot_config/opencode/opencode.jsonc` (modified — one new field)
- `dot_config/lazygit/config.yml` (potentially modified — depends on sort-default decision after upgrade)
- `dot_config/worktrunk/config.toml` (potentially modified — `wt config update` may rewrite deprecated keys; pipeline-form migration is optional)
- `dot_zshrc.tmpl` (verify only — atuin's auto-injected hooks must not break init order)

### Affected systems

- Local Homebrew installation (15 formulae + 1 cask upgraded)
- Atuin daemon (re-init expected after upgrade)
- Worktrunk on-disk state (deprecated config keys migrated by `wt config update`)
- Claude Code statusline (unchanged — `claude-hud` keeps owning it; `starship statusline` is explicitly out of scope)

### Out of scope

- Beads 0.62→1.0.3 migration (separate proposal `bump-beads-1.0`)
- `gh skill` workflow adoption (radar only — try ad-hoc post-upgrade)
- Worktrunk per-branch vars / `Refs:` footer in commits
- Starship `statusline claude-code` integration
- Atuin `edit_file`/`write_file` AI tools (off by default — keep that way)
- bd `config drift` as a routine command (only `apply` enters the routine)
- bd `story`/`milestone` first-class types
- Chezmoi `.chezmoi.rawHomeDir`/`.chezmoi.flags`/`globCaseInsensitive`/`stdinIsATTY` template variables
- README.md / docs/manual.html updates (handled by `/docs:readme` + `/docs:manual` after implementation)
