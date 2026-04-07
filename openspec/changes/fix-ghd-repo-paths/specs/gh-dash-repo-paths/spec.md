## ADDED Requirements

### Requirement: repoPaths uses template pattern

The `repoPaths` section in `config.yml` SHALL use the `:owner/:repo` template syntax to map GitHub repositories to local filesystem paths. The mapping SHALL resolve to `~/WebstormProjects/:repo` (using only the repo name, not the owner).

#### Scenario: RepoPath resolves for any GitHub repo

- **WHEN** gh-dash renders a template containing `{{.RepoPath}}` for repo `pabloimrik17/dotfiles`
- **THEN** `{{.RepoPath}}` resolves to `~/WebstormProjects/dotfiles`

#### Scenario: RepoPath resolves for org repos

- **WHEN** gh-dash renders a template containing `{{.RepoPath}}` for repo `some-org/some-repo`
- **THEN** `{{.RepoPath}}` resolves to `~/WebstormProjects/some-repo`

### Requirement: No unsupported wildcard patterns

The `repoPaths` configuration SHALL NOT use the `"*/*"` pattern. Only accepted patterns SHALL be used: exact (`owner/repo`), owner wildcard (`owner/*`), or template (`:owner/:repo`).

#### Scenario: Rejected pattern is not present

- **WHEN** the config is loaded by gh-dash
- **THEN** no `repoPaths` key uses the `"*/*"` pattern
