# markdown-viewer Specification

## Purpose
TBD - created by archiving change add-markdown-viewer. Update Purpose after archive.
## Requirements
### Requirement: glow is the default terminal Markdown viewer

`glow` SHALL be the default tool for viewing rendered Markdown in the terminal. Installed via
`BREW_PACKAGES` (see `cli-tool-expansion`), it serves two roles: a TUI to browse `.md` files in a
directory with a `less`-style pager, and a CLI to render a single file, stdin, or a remote
URL/GitHub repo with styling. `glow` is the only adopted viewer that renders to stdout, so it is
also the sole tool usable in preview panes. It complements — and SHALL NOT replace — the existing
`cat`→`bat` alias, which highlights Markdown *source* rather than rendering it.

#### Scenario: Render a file

- **WHEN** the user runs `glow <file>.md`
- **THEN** the document is rendered with styling (headings, lists, tables, code blocks)

#### Scenario: Browse a directory

- **WHEN** the user runs `glow` with no arguments
- **THEN** glow opens a TUI listing the Markdown files under the current directory for selection and reading

#### Scenario: bat alias unchanged

- **WHEN** the user runs `cat <file>.md`
- **THEN** `bat` highlights the raw source as before; the `cat`→`bat` alias is not repointed to glow

### Requirement: glow configuration is managed by chezmoi

A chezmoi-managed `glow.yml` SHALL be provided at `dot_config/glow/glow.yml`, landing at
`~/.config/glow/glow.yml`. It SHALL set a dark rendering style consistent with the repo's
Catppuccin Mocha palette, a word-wrap width, the pager enabled, and mouse support enabled. Each
setting SHALL carry an explanatory comment.

Because on macOS glow resolves its config under `~/Library/Preferences/glow/` when `XDG_CONFIG_HOME`
is unset, `dot_zshrc.tmpl` SHALL export `XDG_CONFIG_HOME="$HOME/.config"` (before any tool init) so
glow — and other XDG-respecting tools the repo configures under `~/.config` — honor the
chezmoi-managed config.

#### Scenario: Config applied

- **WHEN** `chezmoi apply` runs
- **THEN** `~/.config/glow/glow.yml` exists and glow uses its style, width, pager, and mouse settings

#### Scenario: glow honors the XDG config location on macOS

- **WHEN** a shell with `XDG_CONFIG_HOME` exported to `~/.config` runs glow
- **THEN** glow loads `~/.config/glow/glow.yml` rather than the macOS-default `~/Library/Preferences/glow/glow.yml`

### Requirement: mdview dispatcher selects the viewer when opening a document

An `mdview` dispatcher SHALL centralize the choice of viewer when *opening* a Markdown document, so
every surface in the stack delegates the decision to one place. It SHALL be provided as an
executable on `PATH` (not merely a shell function), because surfaces such as lazygit `customCommands`
and the television channel invoke it from a non-interactive subprocess that does not source the
interactive shell config — a shell function would be undefined there. Its behavior SHALL be:

- When stdout is not a TTY (piped), it SHALL render to stdout with `glow` (no full-screen TUI).
- When the `MD_VIEWER` environment variable is set to `glow` or `mdfried`, it SHALL use that tool
  unconditionally; the default (`auto` or unset) selects automatically.
- In auto mode it SHALL use `mdfried` only when the document contains embedded images or a
  `mermaid` code fence AND the terminal supports a graphics protocol (Kitty/iTerm2/Sixel) — inside
  tmux this means passthrough is enabled AND a graphics-capable terminal is detected (passthrough
  alone is insufficient); otherwise it SHALL use `glow`'s pager.

#### Scenario: Piped output renders to stdout

- **WHEN** `mdview <file>.md` is run with stdout not attached to a TTY (e.g. piped)
- **THEN** the document is rendered to stdout via `glow` rather than launching a full-screen TUI

#### Scenario: Override forces a viewer

- **WHEN** `MD_VIEWER=glow mdview <file>.md` is run on a document with images/mermaid in a graphics-capable terminal
- **THEN** `glow` is used despite the document being graphics-rich

#### Scenario: Auto selects mdfried for graphics-rich docs

- **WHEN** `mdview <file>.md` is run in auto mode, the file contains a `mermaid` fence or an embedded image, and the terminal is graphics-capable
- **THEN** `mdfried` is launched

#### Scenario: Auto selects glow for prose

- **WHEN** `mdview <file>.md` is run in auto mode on a document with no images or `mermaid`
- **THEN** `glow`'s pager is used

#### Scenario: Auto falls back to glow without graphics support

- **WHEN** `mdview <file>.md` is run in auto mode on a graphics-rich document but the terminal lacks graphics support
- **THEN** `glow`'s pager is used instead of `mdfried`

### Requirement: md shell function

`dot_zshrc.tmpl` SHALL define an `md` function that delegates to `mdview`: with no arguments it
SHALL launch glow's directory-browsing TUI in the current directory; with one or more arguments it
SHALL open the given file(s) through `mdview`.

#### Scenario: md with a file opens via mdview

- **WHEN** the user runs `md <file>.md`
- **THEN** the file is opened through `mdview` (which selects glow or mdfried per its policy)

#### Scenario: md with no arguments browses

- **WHEN** the user runs `md`
- **THEN** glow's directory-browsing TUI opens for the current directory

### Requirement: fzf previews render Markdown with glow

The `fzf` preview commands (`FZF_DEFAULT_OPTS` and `FZF_CTRL_T_OPTS`) SHALL render `*.md` and
`*.markdown` files with `glow` while continuing to preview all other files with `bat`. Because
`dot_zshrc.tmpl` is a chezmoi template, the preview command strings SHALL NOT contain literal `{{`
or `}}` sequences (which chezmoi interprets as template delimiters); only `fzf`'s single-brace
`{}` placeholder and shell parameter expansions are permitted.

#### Scenario: Markdown file preview

- **WHEN** a `.md` file is focused in an `fzf` picker that uses the configured preview
- **THEN** the preview shows the document rendered by `glow`

#### Scenario: Non-Markdown file preview unchanged

- **WHEN** a non-Markdown file is focused
- **THEN** the preview shows `bat` output as before

#### Scenario: Template renders cleanly

- **WHEN** `dot_zshrc.tmpl` is rendered by chezmoi
- **THEN** the resulting `~/.zshrc` contains the intended preview commands with no stray template artifacts

### Requirement: lazygit opens Markdown via mdview

`dot_config/lazygit/config.yml` SHALL define a `customCommands` entry in the `files` context that
opens the selected file through `mdview` as a subprocess (so the viewer takes over the terminal and
returns to lazygit on exit). This views a whole document; it SHALL NOT alter how lazygit renders
diffs (which remain `delta`'s responsibility).

#### Scenario: Open selected Markdown file from lazygit

- **WHEN** the user selects a `.md` file in lazygit's Files panel and triggers the custom command
- **THEN** the file opens rendered via `mdview` in a subprocess, and lazygit resumes on exit

#### Scenario: Diff rendering unchanged

- **WHEN** the user views a file's diff in lazygit
- **THEN** the diff is still rendered by `delta`, not the Markdown viewer

### Requirement: mdfried for graphics-rich Markdown

`mdfried` SHALL be available (via `BREW_PACKAGES`) as the companion viewer for Markdown documents
containing embedded images or `mermaid` diagrams, which `glow` renders as alt-text / raw fenced
code. It renders these graphically (and Big Headers) using a terminal graphics protocol. Its rich
rendering SHALL be understood to depend on a graphics-capable terminal (Kitty/iTerm2/Sixel —
satisfied by the repo's Ghostty, and inside tmux only with passthrough enabled); where unavailable
it degrades to character rendering.

#### Scenario: Mermaid and images render

- **WHEN** the user opens a `.md` containing a `mermaid` block and an embedded image with `mdfried` in a graphics-capable terminal
- **THEN** the diagram and image are drawn (not shown as raw code or alt-text)

#### Scenario: Graceful degradation

- **WHEN** `mdfried` runs without terminal graphics support
- **THEN** it falls back to character rendering rather than failing

