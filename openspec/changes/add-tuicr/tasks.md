# Tasks: add-tuicr

Verification steps that need deployed files: run `chezmoi apply --source <this repo>` or sync `~/.local/share/chezmoi` first (dual-dir layout).

## 1. Install

- [ ] 1.1 Add `tuicr` to `BREW_PACKAGES` in `run_onchange_install-packages.sh.tmpl`; verify with `bash -n` on the rendered script and `brew install tuicr && tuicr --version` locally
- [ ] 1.2 Add the tuicr line to the non-macOS manual-install block (CLI tools list + `cargo install tuicr` / curl hint); verify by inspecting the block
- [ ] 1.3 Add `install_skill "agavra/tuicr" "tuicr" "claude-code opencode junie codex"` to the agent-skills group in `run_onchange_install-packages.sh.tmpl`, next to the gluestack entry; verify with `bash -n` on the rendered script
- [ ] 1.4 Add the matching `npx -y skills add agavra/tuicr --skill tuicr -g -y --agent claude-code opencode junie codex` line to the non-macOS manual block, in the same order as the install_skill calls; verify by inspecting the block
- [ ] 1.5 Run the skill install locally; verify `~/.agents/skills/tuicr/` is staged and symlinked under `~/.claude/skills/tuicr`, and that `npx skills list -g --json` reports all four agents (rerun to confirm the cache check skips it)

## 2. Config

- [ ] 2.1 Create `dot_config/tuicr/config.toml` with the design §4 contents (theme, no_update_check, show_pr_checks, username, comment_types, [export] intro); verify `~/.config/tuicr/config.toml` deploys and `tuicr -w` launches catppuccin-mocha themed with no update check
- [ ] 2.2 In a dirty repo, open `tuicr -w`, Tab through comment types (issue/suggestion/question/nit/praise in order) and export with `y`; verify the export opens with the configured intro
- [ ] 2.3 With comments of each type saved, run `tuicr review comments --repo . --session <slug>`; verify the JSON `comment_type` field carries the five ids verbatim (design §4 mapping holds without a `definition` field)

## 3. gh-dash keybindings

- [ ] 3.1 Add `n` (direct: `cd {{.RepoPath}} && tuicr pr {{.PrNumber}}`) and `N` (tmux `display-popup -E -d "{{.RepoPath}}" -w 95% -h 95% -T " {{.RepoName}}#{{.PrNumber}} "`) to the `prs` keybindings with `name` fields; verify both appear in the `?` help menu and shadow no built-ins
- [ ] 3.2 Press `n` on a real PR; verify gh-dash suspends, tuicr shows the PR diff with CI checks, and quitting resumes gh-dash at the same section/cursor
- [ ] 3.3 Press `N` on a real PR inside tmux; verify the popup opens over gh-dash with title and rounded border, `-d` tilde expansion lands in the repo (otherwise switch to the design §2 `cd` fallback), and closing tuicr returns to gh-dash intact

## 4. lazygit

- [ ] 4.1 Add the `W` customCommand (`files` context, `tuicr -w`, `output: terminal`, descriptive label) to `dot_config/lazygit/config.yml.tmpl`; verify the binding shows in lazygit's keybindings menu and round-trips lazygit → tuicr → lazygit on a dirty repo

## 5. zsh

- [ ] 5.1 Add `tcr` and `tcrw` aliases next to the git/GitHub tooling aliases in `dot_zshrc.tmpl`; verify `alias tcr tcrw` resolves after `reload`

## 6. tmux

- [ ] 6.1 Add `popup-border-lines rounded` and `popup-border-style` (Mocha mauve `#cba6f7`) to `dot_tmux.conf` with a brief comment; verify with `tmux display-popup -E true` after sourcing — rounded mauve border

## 7. Agent skill end-to-end

- [ ] 7.1 Open a working-tree session (`tuicr -w`), leave it running, and from a second shell run `tuicr review list --repo .`; verify exactly one row with `kind: local`, a usable `slug`, and `"active": true`
- [ ] 7.2 Ask Claude to read the review in that session; verify it invokes the skill, resolves the slug, and reports the comments without being told the CLI shape by hand
- [ ] 7.3 Open a PR session via the gh-dash `n` binding and run `tuicr review list --repo owner/repo`; verify the PR row appears with a `gh:owner/repo/pr/N` slug

## 8. AoE tool-session

- [ ] 8.1 Add `(("tools", "tuicr", "command"), "tuicr", False)` to the MANAGED list in `dot_config/private_agent-of-empires/modify_private_config.toml`, next to the `tools.lazygit` entries; no `hotkey` key
- [ ] 8.2 Run `chezmoi apply` and verify `~/.config/agent-of-empires/config.toml` gains a `[tools.tuicr]` table with `command = "tuicr"` only, that mode stays `0600`, and that AoE's runtime tables (`[web]`, `[logging]`) survive untouched
- [ ] 8.3 Re-run `chezmoi apply`; verify `chezmoi diff` is empty (check-then-set idempotency holds for the new entry)
- [ ] 8.4 In the AoE home view with a session selected, press `;`; verify `tuicr` is listed alongside `lazygit` and launches scoped to that session's worktree

## 9. Docs & close

- [ ] 9.1 Update `README.md` What's Included via the docs:readme skill; verify the tuicr row is present and mentions the agent skill
- [ ] 9.2 Update `docs/manual.html` via the docs:manual skill (tool section, the new keybindings/aliases, and the `tuicr review` agent loop); verify section renders
- [ ] 9.3 Run quality gates (`bun run` lint/format per repo config) and `openspec validate add-tuicr --strict`; verify both pass
