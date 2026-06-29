## Why

We have no in-terminal Markdown *renderer*. The only `.md`-aware tool today is `bat` (aliased to `cat`), which highlights the *source* — it does not render headings, lists, tables, or code blocks. To read a document with style you currently leave the terminal for the IDE or a browser (plannotator renders `.md` → HTML, which is heavyweight and pulls you off the keyboard). Linear DOT-35 (add glow + compare viewers) and DOT-32 (evaluate mdfried) ask to close this gap with a real terminal viewer and a documented decision. Rather than make the user remember which of two viewers to invoke, this change also centralizes the choice in one dispatcher so the whole dotfiles stack picks the right tool automatically.

## What Changes

- **Adopt `glow` as the default terminal Markdown viewer.** Both a TUI to browse `.md` files in a directory (`less`-style pager) and a CLI to render a file / stdin / remote URL with style — covering "read and navigate docs without the IDE". Mature (charmbracelet), `homebrew/core`. It is the only viewer that can render to stdout, so it is also the sole tool usable in preview panes.
- **Adopt `mdfried` as the visual-rich companion.** The one candidate that renders embedded images and `mermaid` diagrams graphically (plus Big Headers™) instead of as raw fenced code — useful for architecture docs and AI plans. `homebrew/core`. It is a full-screen TUI, so it is only usable in a foreground "open this doc" context, never in a preview pane. Its rich rendering needs a terminal graphics protocol (Kitty/iTerm2/Sixel).
- **Reject `mdcat` and `frogmouth`** (rationale in `design.md`): `mdcat`'s niche (pipe + inline images) is already covered by `bat` + `glow` + `mdfried`; `frogmouth` is not in `homebrew/core`, breaking the brew-first install flow.
- **Add a central `mdview` dispatcher** (shell function) that picks the right viewer when *opening* a document: render to stdout when not a TTY; honor an `MD_VIEWER=auto|glow|mdfried` override; otherwise auto-select — `mdfried` when the file contains images/`mermaid` **and** the terminal is graphics-capable, else `glow`'s pager. One function encodes the policy; everything that opens a `.md` calls it.
- **Wire the stack to the dispatcher / glow.** `md` shell function → `mdview`; the `television` `markdown` channel's Enter action → `mdview`; a `lazygit` `customCommand` (Files context) opens the selected `.md` via `mdview` as a subprocess; `fzf` previews and the `television` preview pane render `*.md` with `glow` (preview panes can only use a stdout renderer, so they are glow-only by necessity). The `cat`→`bat` alias and `EDITOR` are untouched (highlighting source / editing are different jobs).
- **Enable tmux graphics passthrough.** Add `set -g allow-passthrough on` to `dot_tmux.conf` so `mdfried`'s Kitty-protocol images/diagrams survive inside tmux — without it the dispatcher would always fall back to `glow` in tmux (where the user works).
- **Style + browse**: a chezmoi-managed `glow.yml` (dark/Catppuccin-aligned style, word-wrap, pager); the `markdown` `television` cable channel paralleling `rg-edit`.
- **Docs**: README "What's Included" gains `glow` + `mdfried`; the manual documents `md`/`mdview`, `MD_VIEWER`, and the `markdown` channel.
- **Reconcile spec drift**: the `cli-tool-expansion` spec still says 25 packages and omits `aoe` (already in the array). The modified requirement is brought current — `aoe` plus the two new tools.

Non-goals: no `mdfried` theme file (install-only); no change to the `cat`→`bat` alias or `EDITOR`; no change to plannotator (a separate browser-based workflow). **No diff rendering**: PR/agent diffs (gh-dash `d`, aoe `D`) are explicitly out of scope — a diff is not a document, so routing it through the Markdown viewer would destroy the `+`/`-` information; diffs are `delta`'s job (gh-dash already sets `pager.diff: delta`; any "raw diff" symptom is a delta theme/PATH issue tracked separately, not here). **No gh-dash or aoe wiring**: gh-dash already renders bodies via its internal glamour, and aoe sessions inherit the shell (so `mdview`/`glow` are available there for free).

## Capabilities

### New Capabilities

- `markdown-viewer`: How Markdown is viewed in this environment — `glow` as the default renderer, `mdfried` as the graphics-dependent companion, the `mdview` dispatcher (content + terminal + tmux detection, `MD_VIEWER` override) that auto-selects when opening a doc, the `md` function, a `lazygit` `customCommand` that opens the selected `.md` via `mdview`, the `glow.yml` config, and the `fzf`/preview routing that renders `*.md` with `glow`.
- `television-markdown-channel`: A `television` cable channel (`markdown`) that lists `.md`/`.markdown` files via `fd`, previews them rendered with `glow`, and opens the selected file via `mdview` — paralleling the existing `television-rg-edit-channel`.

### Modified Capabilities

- `cli-tool-expansion`: The `BREW_PACKAGES` array gains `glow` and `mdfried` (both `homebrew/core`, identity `pkg_bin` mappings, no new `BREW_TAPS`); the count and list are reconciled to include the already-present `aoe`; the non-macOS fallback lists the two new tools.
- `tmux-config`: tmux gains `set -g allow-passthrough on` so terminal graphics protocols pass through to applications inside tmux (required for `mdfried`'s images/`mermaid`).

## Impact

- **Install script**: `run_onchange_install-packages.sh.tmpl` — `BREW_PACKAGES`, non-macOS fallback list, completion-message tool list.
- **Config (new)**: `dot_config/glow/glow.yml`; `dot_config/television/cable/markdown.toml`.
- **Shell**: `dot_zshrc.tmpl` — `mdview` dispatcher + `md` function; `.md`→glow `fzf` preview routing (must avoid literal `{{`/`}}`, which chezmoi treats as template delimiters).
- **lazygit**: `dot_config/lazygit/config.yml` — a `customCommands` entry (Files context) that opens the selected `.md` via `mdview` as a subprocess.
- **tmux**: `dot_tmux.conf` — `set -g allow-passthrough on`.
- **Docs**: `README.md`, `docs/manual.html`.
- **Dependency note**: `mdfried`'s rich rendering requires a Kitty/iTerm2/Sixel-capable terminal (Ghostty) and, inside tmux, the passthrough setting above; it otherwise degrades to character rendering, which the dispatcher avoids by selecting `glow`.
- **Resolves** Linear DOT-35 and DOT-32.
