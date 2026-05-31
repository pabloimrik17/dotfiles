## ADDED Requirements

### Requirement: OpenCode experimental feature flags exported in zshrc

The `dot_zshrc.tmpl` SHALL export the curated set of OpenCode experimental feature
flags that remain env-gated in the installed OpenCode version. As of OpenCode 1.15.x
this set SHALL be:

- `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`
- `OPENCODE_ENABLE_EXA=true`
- `OPENCODE_EXPERIMENTAL_OXFMT=true`
- `OPENCODE_EXPERIMENTAL_FILEWATCHER=true`

The block SHALL NOT export `OPENCODE_EXPERIMENTAL_MARKDOWN`: OpenCode graduated markdown
rendering to default-on (1.14.50) and removed the flag, so exporting it is a no-op in
1.15.x. A flag SHALL be removed from this set once upstream graduates the feature to
default-on or to a stable config key.

#### Scenario: Markdown flag absent after change

- **WHEN** a user opens `dot_zshrc.tmpl`
- **THEN** no `OPENCODE_EXPERIMENTAL_MARKDOWN` export is present

#### Scenario: Remaining experimental flags retained

- **WHEN** `chezmoi apply` deploys `.zshrc` and a new shell is started
- **THEN** `OPENCODE_EXPERIMENTAL_LSP_TOOL`, `OPENCODE_ENABLE_EXA`,
  `OPENCODE_EXPERIMENTAL_OXFMT`, and `OPENCODE_EXPERIMENTAL_FILEWATCHER` are exported as `true`

### Requirement: OpenCode binary directory on PATH

The `.zshrc` SHALL add `$HOME/.opencode/bin` to `PATH` so the official-script-installed
opencode binary resolves. opencode is installed via its official script (to
`~/.opencode/bin`) rather than Homebrew, and the installer is run with `--no-modify-path`
to avoid editing the chezmoi-managed `~/.zshrc`; therefore the dotfiles own this PATH entry.

#### Scenario: opencode resolves after chezmoi apply

- **WHEN** opencode is installed to `~/.opencode/bin/opencode` and the user opens a new shell
- **THEN** `opencode` is found in PATH and resolves to `~/.opencode/bin/opencode`
