## ADDED Requirements

### Requirement: Channel triggers for project stack
The television config SHALL define channel triggers mapping command prefixes to appropriate channels.

#### Scenario: git checkout triggers git-branch channel
- **WHEN** user types `git checkout ` and presses Ctrl+T
- **THEN** television opens the git-branch channel showing local and remote branches

#### Scenario: git add triggers git-diff channel
- **WHEN** user types `git add ` and presses Ctrl+T
- **THEN** television opens the git-diff channel showing changed files

#### Scenario: docker exec triggers docker-containers channel
- **WHEN** user types `docker exec ` and presses Ctrl+T
- **THEN** television opens the docker-containers channel showing running containers

#### Scenario: gh pr triggers gh-prs channel
- **WHEN** user types `gh pr view ` and presses Ctrl+T
- **THEN** television opens the gh-prs channel showing open pull requests

#### Scenario: brew info triggers brew-packages channel
- **WHEN** user types `brew info ` and presses Ctrl+T
- **THEN** television opens the brew-packages channel showing installed packages

#### Scenario: bun run triggers bun-scripts channel
- **WHEN** user types `bun run ` and presses Ctrl+T
- **THEN** television opens the bun-scripts custom channel showing package.json scripts

### Requirement: Custom bun-scripts channel
A cable channel file SHALL exist at `dot_config/television/cable/bun-scripts.toml` that reads scripts from `package.json` using `jq` and allows running them with `bun run`.

#### Scenario: Scripts listed from package.json
- **WHEN** user activates the bun-scripts channel in a directory with package.json
- **THEN** all scripts from package.json are listed with their commands

#### Scenario: Selected script executes
- **WHEN** user selects a script and presses Enter
- **THEN** `bun run <script-name>` is executed
