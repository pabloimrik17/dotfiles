## MODIFIED Requirements

### Requirement: fzf previews render Markdown with glow

The `fzf` preview commands (`FZF_DEFAULT_OPTS` and `FZF_CTRL_T_OPTS`) SHALL render `*.md` and
`*.markdown` files with `glow` while continuing to preview all other files with `bat`. Because
`dot_zshrc.tmpl` is a chezmoi template, the preview command strings SHALL NOT contain literal `{{`
or `}}` sequences (which chezmoi interprets as template delimiters); only `fzf`'s single-brace
`{}` placeholder and shell parameter expansions are permitted.

Every configured `fzf` preview command — including `FZF_ALT_C_OPTS`, which previews directories with
`eza` rather than rendering Markdown — SHALL pass `--` immediately before the `{}` placeholder, so a
selection whose name begins with `-` is treated as an operand and not parsed as an option by the
preview program. The Markdown previews already do this; the directory preview is the one place the
guard is missing, which `fd`'s change to `--strip-cwd-prefix` (it now keeps a leading `./` precisely
when stripping it would leave a path starting with `-`) makes reachable rather than theoretical.

#### Scenario: Markdown file preview

- **WHEN** a `.md` file is focused in an `fzf` picker that uses the configured preview
- **THEN** the preview shows the document rendered by `glow`

#### Scenario: Non-Markdown file preview unchanged

- **WHEN** a non-Markdown file is focused
- **THEN** the preview shows `bat` output as before

#### Scenario: Template renders cleanly

- **WHEN** `dot_zshrc.tmpl` is rendered by chezmoi
- **THEN** the resulting `~/.zshrc` contains the intended preview commands with no stray template artifacts

#### Scenario: Directory preview guards the placeholder

- **WHEN** the rendered `FZF_ALT_C_OPTS` preview command is read
- **THEN** it passes `--` immediately before the `{}` placeholder

#### Scenario: A leading-dash selection previews as an operand

- **WHEN** a directory whose name begins with `-` is focused in the `Alt+C` picker
- **THEN** the preview renders that directory rather than failing with an unknown-option error
