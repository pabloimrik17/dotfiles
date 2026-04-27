## Context

We currently use fzf with custom shell functions in `.zshrc` (frg, fgco, fglog, fkill) and FZF_DEFAULT_COMMAND/OPTS configuration. Television offers a declarative TOML channel system with contextual autocomplete (Ctrl+T detects the command being typed).

## Goals / Non-Goals

**Goals:**

- Install television and configure shell integration (Ctrl+T contextual, Ctrl+R history)
- Configure channel triggers for our stack: git, gh, docker, bun, brew
- Create a custom `bun-scripts` channel to run scripts from package.json
- Apply the Catppuccin theme
- Evaluate which custom fzf functions in .zshrc television can replace

**Non-Goals:**

- Remove fzf entirely (television uses it internally and fzf is still useful for ad-hoc pipes)
- Create custom channels for Kubernetes/AWS (not our primary stack)
- Replace atuin for history (atuin has sync and AI, television only does local search)

## Decisions

### fzf + television coexistence

fzf stays installed. Television uses fzf internally for fuzzy matching. What changes:

- Ctrl+T: moves from fzf (always files) to television (contextual)
- Ctrl+R: stays on atuin (sync + AI), not television
- The custom functions (frg, fgco, fglog, fkill) stay initially and we evaluate removing them after confirming television covers them

### Keybinding strategy

| Keybinding | Current            | Proposed                                      |
| ---------- | ------------------ | --------------------------------------------- |
| Ctrl+R     | atuin (AI history) | atuin (no change)                             |
| Ctrl+T     | fzf (files)        | television (contextual)                       |
| Alt+C      | fzf (directories)  | fzf (no change, television has no equivalent) |

Television is initialized AFTER fzf in .zshrc so it overrides Ctrl+T without affecting other bindings.

### Channel triggers for our stack

```toml
[shell_integration.channel_triggers]
"git-branch" = ["git checkout", "git branch", "git merge", "git rebase"]
"git-diff" = ["git add", "git restore", "git stash"]
"git-log" = ["git show", "git revert", "git cherry-pick"]
"gh-prs" = ["gh pr checkout", "gh pr view", "gh pr merge"]
"gh-issues" = ["gh issue view", "gh issue close"]
"docker-containers" = ["docker exec", "docker stop", "docker logs"]
"bun-scripts" = ["bun run", "br"]
"brew-packages" = ["brew info", "brew upgrade", "brew uninstall"]
```

### Custom channel: bun-scripts

A TOML file in `cable/bun-scripts.toml` that reads `package.json` with jq and lists the available scripts. Enter runs the script with `bun run`.

## Risks / Trade-offs

- **[Ctrl+T collision with fzf]** → Mitigation: television initializes after fzf and overrides the binding cleanly.
- **[television is relatively new]** → Mitigation: 10k+ stars on GitHub, frequent releases, written in Rust.
- **[The bun-scripts channel requires jq]** → Mitigation: jq should already be installed; add it to the install script if not.
- **[Custom functions duplicated temporarily]** → Acceptable: they will be removed in a later change after validation.
