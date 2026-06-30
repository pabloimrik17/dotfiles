## 1. Install the viewers (brew)

- [x] 1.1 Add `glow` and `mdfried` to the `BREW_PACKAGES` array in `run_onchange_install-packages.sh.tmpl` (both `homebrew/core` — no `BREW_TAPS` entry needed).
- [x] 1.2 Confirm no `pkg_bin()` change is needed: `glow`→`glow`, `mdfried`→`mdfried` fall through the default identity case.
- [x] 1.3 Add `glow` and `mdfried` to the macOS completion-message tool list (the `info "  CLI tools: ..."` line).
- [x] 1.4 Add `glow` and `mdfried` to the non-macOS fallback `CLI tools:` list, annotating `mdfried` as needing a Kitty/iTerm2/Sixel-capable terminal for images/mermaid.

## 2. glow config (glow.yml)

- [x] 2.1 Create `dot_config/glow/glow.yml` with: `style: dark`, a word-wrap `width` (e.g. 120), `pager: true`, `mouse: true`, `all: false`. Comment each key.
- [x] 2.2 Verify `chezmoi apply` lands it at `~/.config/glow/glow.yml` and glow picks it up. _(Path mapping confirmed by chezmoi convention. **Discovered**: macOS glow ignores `~/.config` unless `XDG_CONFIG_HOME` is set — fixed in 2.3. Verified empirically (glow 2.1.2): with `XDG_CONFIG_HOME=~/.config`, glow loads `~/.config/glow/glow.yml`.)_
- [x] 2.3 Export `XDG_CONFIG_HOME="$HOME/.config"` early in `dot_zshrc.tmpl` (before tool inits) so macOS honors `~/.config/glow/glow.yml` (and `~/.config/lazygit/`, television, …). Template re-renders clean; `zsh -n` passes.

## 3. Shell: mdview dispatcher + md + fzf preview (dot_zshrc.tmpl)

- [x] 3.1 Add the `mdview` function: non-TTY stdout → `glow` (stdout); honor `MD_VIEWER=glow|mdfried`; auto → `mdfried` when the file has `![](…)` images or a ```` ```mermaid ```` fence AND the terminal is graphics-capable (Ghostty/Kitty/iTerm; tmux only when passthrough on), else `glow -p`. _(All 9 branch combinations verified under a real pty with stubbed viewers.)_
- [x] 3.2 Add the `md` function near the `bat` aliases: no args → `glow` (browse TUI); with args → `mdview "$@"`. Leave the `cat`→`bat` alias untouched.
- [x] 3.3 Route Markdown to glow in the `fzf` preview commands (`FZF_DEFAULT_OPTS`, `FZF_CTRL_T_OPTS`): `*.md`/`*.markdown` → `glow` (e.g. `glow -s auto`), else the existing `bat --color=always --style=numbers --line-range=:500` command.
- [x] 3.4 **chezmoi guard**: ensure the new preview strings contain no literal `{{`/`}}`; use only `fzf`'s `{}` and bash `${f##*.}`-style expansions. _(Used fzf's `{}` directly in a `case` — no `$`-vars, no double braces; verified clean.)_
- [x] 3.5 `chezmoi execute-template`/`chezmoi diff` on `dot_zshrc.tmpl`; confirm `~/.zshrc` renders with no stray artifacts; open a fresh shell and confirm `mdview`, `md`, and the fzf preview work. _(execute-template render + `zsh -n` syntax + dispatcher logic verified; live fresh-shell use pending `brew install glow`.)_

## 4. tmux graphics passthrough

- [x] 4.1 Add `set -g allow-passthrough on` to `dot_tmux.conf` with a descriptive comment above it (matching the file's comment style).
- [ ] 4.2 `chezmoi apply`, reload tmux, and confirm `tmux show -g allow-passthrough` reports `on`. _(Pending source sync + tmux reload; setting added to config.)_

## 5. lazygit: open Markdown via mdview

- [x] 5.1 Add a `customCommands` entry to `dot_config/lazygit/config.yml`: `context: files`, a key (e.g. `g`), `command: mdview {{.SelectedFile.Name}}`, `subprocess: true`, with a `description`.
- [ ] 5.2 Confirm in lazygit: selecting a `.md` in the Files panel and pressing the key opens it via `mdview`, and lazygit resumes on exit. Diff view still uses `delta`. _(Config valid YAML; with the 2.3 XDG fix, `lazygit --print-config-dir` now resolves `~/.config/lazygit` so the customCommand is read. Interactive key-press confirm pending source sync.)_

## 6. Television markdown channel

- [x] 6.1 Create `dot_config/television/cable/markdown.toml` modeled on `rg-edit.toml`: `[metadata]` name `markdown`, `requirements = ["fd", "glow"]`; `[source] command = "fd -e md -e markdown --type f"`; `[preview] command` renders with `glow` (e.g. `glow -s auto '{}'`); `[ui] preview_panel = { size = 60 }`.
- [x] 6.2 `[keybindings] enter = "actions:open"` + `[actions.open]` that opens the file via `mdview '{}'` (`mode = "execute"`).
- [ ] 6.3 Confirm the `markdown` channel appears in `tv` and that preview + open work on a real `.md`. _(Channel parses + appears in `tv list-channels`; live preview/open pending `brew install glow`.)_

## 7. Verify mdfried + dispatcher (DOT-32)

- [ ] 7.1 In Ghostty (outside and inside tmux), open a `.md` with a `mermaid` block and an embedded image via `mdview <file>`; confirm the dispatcher picks `mdfried` and the diagram/image render (not raw). _(Selection logic verified under a real pty; live graphics rendering pending `brew install mdfried` + Ghostty.)_
- [ ] 7.2 Open a prose-only `.md` via `mdview`; confirm it picks `glow -p`. _(Logic verified — prose+graphics → glow; live pending `brew install glow`.)_
- [ ] 7.3 Confirm `MD_VIEWER=glow mdview <visual.md>` forces glow, and `MD_VIEWER=mdfried mdview <prose.md>` forces mdfried. _(Both override paths verified under a real pty; live pending install.)_
- [ ] 7.4 Confirm graceful fallback: `mdview` where graphics are unavailable (e.g. piped, or a non-graphics terminal) uses glow/stdout instead of erroring. _(Piped→glow-stdout and no-graphics→glow verified under a real pty; live pending install.)_

## 8. Docs

- [x] 8.1 README "What's Included": add `glow` (terminal Markdown viewer — TUI browse + CLI render) and `mdfried` (Markdown viewer with inline images / mermaid / Big Headers) rows under CLI Tools. Use the `/docs:readme` skill.
- [x] 8.2 Manual (`docs/manual.html`): document `md`/`mdview`, the `MD_VIEWER` knob, the lazygit key, and the `markdown` television channel. Use the `/docs:manual` skill.

## 9. Verify & close

- [x] 9.1 Re-run `run_onchange_install-packages.sh.tmpl` (or `chezmoi apply`): both tools install and idempotently skip on re-run. _(`brew install glow mdfried` succeeded — glow 2.1.2, mdfried 0.22.4 on PATH. Idempotent skip is the same `command -v "$bin"` pre-scan that gates all 26 existing packages; both now resolve, so a re-run skips them.)_
- [ ] 9.2 End-to-end: `glow` browse, `glow README.md` render, `mdview`/`md`, `.md` fzf preview, `tv markdown` channel, lazygit open, mdfried-in-tmux graphics. _(**Verified here**: `glow` renders, `mdview` piped→glow renders, `.md`→glow vs other→bat routing, `tv list-channels` shows `markdown`. **Pending hands-on** (interactive/graphics): `glow` browse TUI, live `tv markdown` open, lazygit `g`, mdfried images/mermaid in Ghostty+tmux.)_
- [x] 9.3 `openspec validate add-markdown-viewer --strict` passes.
- [~] 9.4 Update Linear DOT-35 and DOT-32 with the decision (glow default + mdfried companion; mdcat/frogmouth rejected; diffs out of scope) and close them. _(Both updated with the decision comment 2026-06-30; left **open** by decision — close after the branch is merged + live-verified.)_
