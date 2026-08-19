# Delta: extra-updates-command

## MODIFIED Requirements

### Requirement: Update step coverage

`update-extra` SHALL run every step in its registered step list. The step list SHALL be exactly:

1. gh extensions: `gh extension upgrade --all`
2. you-should-use omz plugin: `git -C "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/you-should-use" pull --ff-only`
3. skills.sh global skills: `npx -y skills update -g -y`
4. plannotator CLI: re-run the official installer `https://plannotator.ai/install.sh`
5. Catppuccin theme assets: re-download the bat, delta, zsh-syntax-highlighting, and atuin theme files from the same URLs used by `run_onchange_install-packages.sh.tmpl`, followed by `bat cache --build`
6. television channels: `tv update-channels`
7. fallow CLI (global): `npm install -g fallow@latest`

#### Scenario: gh extensions updated

- **WHEN** `update-extra` runs
- **THEN** `gh extension upgrade --all` executes

#### Scenario: you-should-use updated

- **WHEN** `update-extra` runs
- **THEN** the you-should-use clone under `$ZSH_CUSTOM/plugins` is fast-forwarded to upstream

#### Scenario: skills.sh globals updated

- **WHEN** `update-extra` runs
- **THEN** `npx -y skills update -g -y` executes against the global skill set

#### Scenario: plannotator updated

- **WHEN** `update-extra` runs
- **THEN** the official plannotator installer re-runs, replacing the binary with the latest release

#### Scenario: Catppuccin themes refreshed

- **WHEN** `update-extra` runs
- **THEN** the four theme assets are re-downloaded and the bat cache is rebuilt

#### Scenario: television channels updated

- **WHEN** `update-extra` runs
- **THEN** `tv update-channels` executes

#### Scenario: fallow updated

- **WHEN** `update-extra` runs
- **THEN** `npm install -g fallow@latest` executes, updating the global CLI and its bundled `fallow-lsp`/`fallow-mcp` binaries in one step
