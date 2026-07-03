# television-markdown-channel Delta

## MODIFIED Requirements

### Requirement: Enter opens the file via mdview

The `markdown` channel SHALL bind Enter to an action that opens the selected file through `mdview`, so the viewer choice (glow vs mdfried) follows the central dispatcher policy rather than being hard-coded in the channel. The action command SHALL pass the selection as a bare `{}` token (`command = "mdview {}"`): television auto-quotes bare `{}` in action commands, so explicit surrounding quotes would double-quote the entry and break filenames containing spaces. Preview commands are not auto-quoted and keep their explicit quoting.

#### Scenario: Opening a selection

- **WHEN** the user presses Enter on a file in the `markdown` channel
- **THEN** the file is opened through `mdview`

#### Scenario: Filenames with spaces open correctly

- **WHEN** the user presses Enter on a Markdown file whose path contains spaces
- **THEN** `mdview` receives the full path as a single argument (no double-quoting) and renders the file
