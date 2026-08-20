## MODIFIED Requirements

### Requirement: lazygit opens Markdown via mdview

`dot_config/lazygit/config.yml.tmpl` SHALL define a `customCommands` entry in the `files` context that
opens the selected file through `mdview` as a subprocess (so the viewer takes over the terminal and
returns to lazygit on exit). This views a whole document; it SHALL NOT alter how lazygit renders
diffs (which remain `delta`'s responsibility).

#### Scenario: Open selected Markdown file from lazygit

- **WHEN** the user selects a `.md` file in lazygit's Files panel and triggers the custom command
- **THEN** the file opens rendered via `mdview` in a subprocess, and lazygit resumes on exit

#### Scenario: Diff rendering unchanged

- **WHEN** the user views a file's diff in lazygit
- **THEN** the diff is still rendered by `delta`, not the Markdown viewer
