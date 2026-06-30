## Context

chezmoi-managed dotfiles, macOS-first, Homebrew install via `run_onchange_install-packages.sh.tmpl`
(a `BREW_PACKAGES` array + `pkg_bin()` binary-name map). Everything is themed Catppuccin Mocha; the
terminal is **Ghostty** (GPU-accelerated, supports the Kitty graphics protocol); fuzzy finding uses
`fzf` + `television`, with `bat` (aliased `cat`) as the universal preview/pager and `delta` as the
diff pager. There is no Markdown *renderer* today — `bat` only highlights `.md` source.

Linear DOT-35 ("add glow + compare viewers") is the umbrella; DOT-32 ("evaluate mdfried") is
explicitly scoped *inside* that comparison. One decision closes both. The user confirmed they
regularly read `.md` containing `mermaid`/images and live inside tmux.

## Goals / Non-Goals

**Goals:**

- Install a default terminal Markdown viewer; document the comparison and decision.
- Make `.md` pleasant to read and browse without leaving the terminal (TUI browse + quick render).
- Centralize the glow-vs-mdfried choice in one dispatcher every surface calls.
- Wire it into the existing Catppuccin / Ghostty / `fzf` / `television` / `lazygit` / tmux setup.

**Non-Goals:**

- No `mdfried` theme/config file (install-only; default theme acceptable, themeable later).
- No change to the `cat`→`bat` alias or `EDITOR` (highlighting source / editing are different jobs).
- No change to plannotator (browser HTML render for plan review — a different workflow).
- **No diff rendering.** PR/agent diffs (gh-dash `d`, aoe `D`, lazygit diffs) are out of scope: a
  diff is not a document, so routing it through a Markdown renderer would destroy the `+`/`-`
  information. Diffs are `delta`'s job (gh-dash already sets `pager.diff: delta`).
- No gh-dash or aoe wiring: gh-dash already renders bodies via internal glamour; aoe sessions
  inherit the shell, so `mdview`/`glow` are available there transitively.

## Decisions

**1. `glow` is the default viewer.**
glow (charmbracelet, Go, `homebrew/core`) is the only candidate that is *both* a TUI folder browser
(`less`-style pager, fuzzy file filter) and a CLI renderer (file / stdin / remote URL / GitHub repo).
It is the most mature and widely used candidate — important for an unattended dotfiles repo — and it
is the only adopted tool that renders to stdout, making it the sole option for preview panes. It
complements `bat` (source highlighting) rather than overlapping it.
*Alternative rejected:* none for this role — glow is uniquely positioned.

**2. `mdfried` is the visual-rich companion — justified by a confirmed use case.**
glow renders neither images nor `mermaid` (raw fenced block / alt-text). `mdfried` (Rust,
`homebrew/core`) draws inline images, `mermaid` diagrams, and Big Headers™ via a terminal graphics
protocol. Ghostty speaks Kitty, so the feature is real here. It is the *secondary* tool, not
load-bearing.
*Trade-off accepted:* `mdfried` is a young, single-maintainer project — higher churn/abandonment
risk than glow. If it breaks or is dropped, glow still covers the 90% prose case. Adoption is a
small, reversible bet justified by a confirmed need (mermaid/images), not "just in case".

**3. Reject `mdcat`.**
A mature `cat`-for-markdown with inline images. Its strengths (pipe/scriptability, inline images)
are already covered by `bat`+`glow` (pipe/cat) and `mdfried` (images). No non-overlapping niche.
*Alternative rejected:* mdcat as the image tool instead of mdfried — mdcat renders no `mermaid` or
Big Headers and has no browse TUI, losing the deciding feature.

**4. Reject `frogmouth`.**
Capable Textual (Python) TUI browser, but **not in `homebrew/core`** — needs pipx, breaking the
brew-first, single-`BREW_PACKAGES` install flow. Its TOC/bookmarks differentiator isn't worth a
second install channel.

**5. Central `mdview` dispatcher; previews stay glow.**
The key realization: `mdfried` is a full-screen TUI and **cannot** run in a preview pane (fzf,
television) — those require a stdout renderer. So the auto-selection applies only to the *foreground
open* path; previews are glow-only by necessity. `mdview` encapsulates the policy (non-TTY→stdout
glow; `MD_VIEWER` override; auto = visuals + graphics-terminal → mdfried, else glow). Every
foreground surface (`md`, television Enter, lazygit) delegates to it, so the policy lives in one
place and is reconfigurable via `MD_VIEWER`.
*Alternative rejected:* per-surface inline logic — duplicates the heuristic and drifts.

**6. Heuristics: content sniff + terminal/tmux detection.**
Content: a cheap grep for an image (`![…](…)`) or a ```` ```mermaid ```` fence decides whether
mdfried *adds value*. Terminal: detect a graphics-capable terminal (Ghostty/Kitty/iTerm) and treat
tmux as capable only with passthrough on **and** a surviving graphics-terminal marker
(`GHOSTTY_RESOURCES_DIR`/`KITTY_WINDOW_ID`) — passthrough alone is not proof of graphics support,
since tmux masks the outer terminal's `$TERM`/`$TERM_PROGRAM`, so a passthrough-on session under a
non-graphics terminal must still fall back to glow. The exact detection expressions are an
implementation detail for tasks; the spec fixes the behavior.
*Trade-off:* the sniff can occasionally "guess wrong" (a doc with one trivial image opens mdfried).
The `MD_VIEWER` override and a sensible default absorb this.

**7. Enable tmux graphics passthrough.**
The user lives in tmux, which by default strips graphics escapes. Add `set -g allow-passthrough on`
to `dot_tmux.conf` so mdfried's Kitty-protocol output reaches the pane. Without it the dispatcher
would almost always fall back to glow inside tmux, defeating mdfried's adoption.
*Alternative rejected:* detect `$TMUX` and always use glow there — simpler but neuters mdfried in
the user's primary environment.

**8. Theming: `glow.yml` built-in dark style, not a custom JSON stylesheet (yet).**
glow's built-in dark style auto-detects the terminal background and is close to Catppuccin Mocha. A
bespoke glamour JSON stylesheet is deferred (diminishing returns vs. tracking glamour's schema).
mdfried and ANSI-inheriting tools get Catppuccin colors for free; glow is the one needing an explicit
style choice.

**9. `md` as a function delegating to `mdview`.**
`md` (no args) → glow browse TUI; `md <file>` → `mdview`. A thin function (not a bare alias) keeps
glow's remote/stdin forms reachable by calling `glow` directly.

**10. chezmoi template escaping in the `fzf` preview.**
`dot_zshrc.tmpl` is a chezmoi template, so literal `{{`/`}}` are template delimiters. The `.md`→glow
preview must use only `fzf`'s single-brace `{}` and shell `${…}` expansions — no double braces. This
is the main implementation footgun; verify with `chezmoi diff` after editing.

**11. lazygit wired, gh-dash/aoe not.**
lazygit has no markdown render; a `customCommands` (files context, subprocess) entry calling `mdview`
gives "open this README rendered" without leaving lazygit — a clean win that exercises the central
dispatcher. gh-dash already renders bodies via glamour internally (not swappable, and its content is
remote, not local files). aoe has no markdown surface, and its sessions inherit the shell, so
`mdview` is available there for free. lazygit's diff view is untouched (`delta`).

**12. Reconcile `cli-tool-expansion` spec drift.**
The spec's `BREW_PACKAGES` requirement said "25 packages" and omitted `aoe`, already in the array
(real count 26). The delta lists the true target — 26 + `glow` + `mdfried` = **28** — and adds the
matching per-package scenarios. Spec hygiene, not new behavior.

**13. Export `XDG_CONFIG_HOME=$HOME/.config` so macOS honors `~/.config`.**
Discovered during implementation: with `XDG_CONFIG_HOME` unset (verified — login shell *and* every
system/user zsh startup file), macOS tools fall back to their native dirs — glow reads
`~/Library/Preferences/glow/glow.yml`, lazygit reads `~/Library/Application Support/lazygit/` (per
`lazygit --print-config-dir`) — bypassing the chezmoi-managed `~/.config/*` this repo standardizes
on. So the `glow.yml` (Decision 8) and the lazygit `customCommand` (Decision 11) would silently not
load. `dot_zshrc.tmpl` therefore exports `XDG_CONFIG_HOME="$HOME/.config"` before any tool init,
aligning every XDG-respecting tool (glow, lazygit, television, …) on `~/.config`. Confirmed
empirically: with it set, glow loads `~/.config/glow/glow.yml`; unset, the same file is ignored.
*Alternative rejected:* per-tool relocation to macOS-native paths (e.g. glow → `~/Library/
Preferences`) — fixes only glow, breaks the `~/.config` convention, and needs OS-templating for Linux.

**14. `mdview` is a PATH executable, not a shell function.**
Discovered during post-merge testing: as a `dot_zshrc.tmpl` function, `mdview` was invisible to the
surfaces that call it. lazygit and television run their commands via a non-interactive `sh -c`/`zsh
-c` that does not source `~/.zshrc`, so lazygit's `g` errored with `command not found: mdview` (and
the television Enter action would have too). This contradicts Decisions 5/11, which require those
surfaces to delegate *to* `mdview`. Resolved by shipping the dispatcher as
`dot_local/bin/executable_mdview` → `~/.local/bin/mdview` (already on `PATH`); the helpers move into
the script and `dot_zshrc.tmpl` keeps only the thin interactive `md` wrapper.
*Alternative rejected:* having each surface call `zsh -ic 'mdview …'` — fragile, slow, and re-couples
the policy to the interactive shell the executable was meant to decouple it from.

**15. Preview panes force color + an explicit glow style.**
Discovered during post-merge testing: `glow -s auto` in the fzf/television preview rendered
raw-looking (literal `#`/`**`, no color). A preview pane has no TTY, so glow's `auto` style resolves
to the colorless `notty` profile and its color profile downgrades to ASCII. The preview commands
therefore use `CLICOLOR_FORCE=1 glow -s dark` to force a real rendered, colored preview regardless of
TTY. (The foreground open path is unaffected — it runs under a TTY.)

## Risks / Trade-offs

- **`mdfried` maintenance/abandonment risk** → mitigated by it being secondary; glow alone satisfies
  the core need. Re-evaluate if it stalls.
- **`mdfried` ↔ graphics-terminal coupling** → its headline features need Kitty/iTerm2/Sixel; switching
  terminals, or a tmux build without passthrough support, silently degrades it. Documented as a
  dependency; the dispatcher avoids ugly output by selecting glow when graphics are unavailable.
- **chezmoi `{{`/`}}` in the `fzf` preview** → could corrupt `~/.zshrc` rendering. Mitigation: no
  double braces; verify `chezmoi execute-template` / `chezmoi diff` after editing `dot_zshrc.tmpl`.
- **Content-sniff misfires** → the `MD_VIEWER` override + glow default keep it from being annoying.
- **glow style ≠ exact Catppuccin Mocha** → built-in dark style is close; a custom JSON stylesheet can
  follow if it grates.
- **`allow-passthrough on` broadens what apps can emit through tmux** → minor; it is the standard,
  documented way to enable graphics passthrough and is widely used.
- **`XDG_CONFIG_HOME` export shifts config resolution repo-wide on macOS** → intended (aligns every
  tool on `~/.config`, where this repo already places config). A tool whose config lived *only* under
  `~/Library/*` would revert to defaults; mitigated because the repo configures everything under
  `~/.config`. Only `XDG_CONFIG_HOME` is set — `XDG_DATA_HOME`/`XDG_CACHE_HOME` are left at defaults,
  so data/cache locations (e.g. atuin history) are unaffected.

## Migration Plan

1. Add `glow`, `mdfried` to `BREW_PACKAGES`; update non-macOS fallback + completion message.
2. Add `dot_config/glow/glow.yml` and `dot_config/television/cable/markdown.toml`.
3. Add `mdview` + `md` and the `.md`→glow `fzf` preview routing to `dot_zshrc.tmpl`.
4. Add the `lazygit` `customCommands` entry; add `set -g allow-passthrough on` to `dot_tmux.conf`.
5. `chezmoi diff` / `chezmoi apply`; verify `glow`, `mdfried`, `mdview`/`md`, the `fzf` preview, the
   `tv markdown` channel, the lazygit command, and mdfried-in-tmux graphics; confirm `~/.zshrc`
   renders cleanly.
6. Update README + manual.

**Rollback:** remove the two array entries, the two new config files, and the `dot_zshrc.tmpl` /
`dot_tmux.conf` / `lazygit` additions; revert docs. No state or migration to unwind (`brew uninstall`
the tools independently).

## Open Questions

- Bespoke Catppuccin-Mocha glamour JSON stylesheet for glow — defer unless the built-in dark style
  looks off in practice.
- gh-dash `d` "raw diff" symptom — likely delta not picking up its Catppuccin theme outside a repo
  context. Tracked separately; not part of this change.
