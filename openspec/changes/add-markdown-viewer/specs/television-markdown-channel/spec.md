## ADDED Requirements

### Requirement: markdown cable channel

`dot_config/television/cable/markdown.toml` SHALL define a `television` cable channel named
`markdown` whose source lists Markdown files (`.md` and `.markdown`) under the working directory
via `fd`. Its `[metadata]` SHALL declare its requirements (`fd`, `glow`).

#### Scenario: Channel lists Markdown files

- **WHEN** the user opens the `markdown` channel in `television`
- **THEN** the candidate list is populated with `.md`/`.markdown` files found via `fd`

#### Scenario: Channel is discoverable

- **WHEN** the user opens television's remote-control channel list
- **THEN** the `markdown` channel appears with its description

### Requirement: Channel preview renders with glow

The `markdown` channel's `[preview]` command SHALL render the focused file with `glow` (a stdout
renderer suitable for a preview pane), with an explicit preview panel size as the existing
`rg-edit` channel does.

#### Scenario: Preview shows rendered Markdown

- **WHEN** a file is focused in the `markdown` channel
- **THEN** the preview pane shows it rendered by `glow`

### Requirement: Enter opens the file via mdview

The `markdown` channel SHALL bind Enter to an action that opens the selected file through `mdview`,
so the viewer choice (glow vs mdfried) follows the central dispatcher policy rather than being
hard-coded in the channel.

#### Scenario: Opening a selection

- **WHEN** the user presses Enter on a file in the `markdown` channel
- **THEN** the file is opened through `mdview`
