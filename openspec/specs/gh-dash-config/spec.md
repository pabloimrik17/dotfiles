# gh-dash-config Specification

## Purpose

TBD - created by archiving change add-gh-dash. Update Purpose after archive.

## Requirements

### Requirement: PR sections

The gh-dash config SHALL define three PR sections:

1. "My Pull Requests" with filter `is:open author:@me`
2. "Needs My Review" with filter `is:open review-requested:@me`
3. "Involved" with filter `is:open involves:@me -author:@me`

#### Scenario: User sees their own open PRs

- **WHEN** the user opens gh-dash on the PRs view
- **THEN** the first section shows all open PRs authored by the user

#### Scenario: User sees PRs requesting their review

- **WHEN** the user navigates to the "Needs My Review" section
- **THEN** only PRs where the user's review is requested are shown

#### Scenario: User sees PRs they're involved in but didn't author

- **WHEN** the user navigates to the "Involved" section
- **THEN** PRs where the user is mentioned, assigned, or commented are shown, excluding PRs they authored

### Requirement: Issue sections

The gh-dash config SHALL define three issue sections:

1. "My Issues" with filter `is:open author:@me`
2. "Assigned" with filter `is:open assignee:@me`
3. "Involved" with filter `is:open involves:@me -author:@me`

#### Scenario: User sees their assigned issues

- **WHEN** the user switches to issues view and navigates to "Assigned"
- **THEN** only issues assigned to the user are shown

### Requirement: Notification sections

The gh-dash config SHALL define four notification sections:

1. "All" with empty filter
2. "Review Requested" with filter `reason:review-requested`
3. "Participating" with filter `reason:participating`
4. "Mentions" with filter `reason:mention`

#### Scenario: User sees review-requested notifications

- **WHEN** the user navigates to the "Review Requested" notification section
- **THEN** only notifications triggered by review requests are shown

### Requirement: Catppuccin Mocha theme

The gh-dash config SHALL use the Catppuccin Mocha color palette:

- `text.primary`: `#cdd6f4` (Text)
- `text.secondary`: `#94e2d5` (Teal)
- `text.inverted`: `#1e1e2e` (Base)
- `text.faint`: `#6c7086` (Overlay0)
- `text.warning`: `#f38ba8` (Red)
- `text.success`: `#a6e3a1` (Green)
- `background.selected`: `#313244` (Surface0)
- `border.primary`: `#89b4fa` (Blue)
- `border.secondary`: `#a6e3a1` (Green)
- `border.faint`: `#45475a` (Surface1)

The theme SHALL enable `sectionsShowCount: true` and `table.showSeparator: true`.

#### Scenario: Theme colors match Catppuccin Mocha

- **WHEN** the user opens gh-dash
- **THEN** the UI renders with Catppuccin Mocha colors consistent with ghostty, bat, delta, and starship

### Requirement: Lazygit keybinding

The gh-dash config SHALL define a universal keybinding `g` that opens lazygit in the selected item's repository path using `cd {{.RepoPath}} && lazygit`.

#### Scenario: User opens lazygit from gh-dash

- **WHEN** the user presses `g` on any item
- **THEN** lazygit opens in the repository's local directory

### Requirement: Claude Code review keybinding

The gh-dash config SHALL define a PR keybinding `C` that opens a tmux window named `PR-{{.PrNumber}}` and launches Claude Code with the code-review skill for the selected PR.

#### Scenario: User triggers code review from gh-dash

- **WHEN** the user presses `C` on a PR item
- **THEN** a new tmux window opens with Claude Code running the code-review skill against the selected PR

### Requirement: Delta diff pager

The gh-dash config SHALL set `pager.diff` to `delta`.

#### Scenario: User views a diff in gh-dash

- **WHEN** the user presses `d` on a PR
- **THEN** the diff is rendered through delta with syntax highlighting

### Requirement: Repo paths

The gh-dash config SHALL map `*/*` to `~/WebstormProjects/*` in the `repoPaths` section.

#### Scenario: User checks out a PR branch

- **WHEN** the user presses `C` (checkout) on a PR from any repository
- **THEN** gh-dash resolves the local repo path to `~/WebstormProjects/<repo-name>`

### Requirement: Default settings

The gh-dash config SHALL set:

- `defaults.view`: `prs`
- `defaults.prsLimit`: `20`
- `defaults.issuesLimit`: `20`
- `defaults.notificationsLimit`: `20`
- `defaults.preview.open`: `true`
- `defaults.preview.width`: `0.45`
- `defaults.refetchIntervalMinutes`: `30`
- `confirmQuit`: `false`
- `showAuthorIcons`: `true`
- `smartFilteringAtLaunch`: `true`

#### Scenario: Preview pane is open by default

- **WHEN** the user opens gh-dash
- **THEN** the preview pane is visible on the right side occupying 45% of the terminal width
