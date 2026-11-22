# Spec Delta

## MODIFIED Requirements

### Requirement: Core cask apps are installed with single confirmation

The script SHALL declare its casks in a single `ALL_CASKS` array whose rows are
`token|AppName|Category|Description`. A row whose `Category` is anything other than `Optional` is a
core cask. Core casks SHALL comprise the following 22 rows on `arm64` (21 on `amd64`, without
`conductor`), listed by `Category`:

- Dev: `visual-studio-code`, `docker-desktop`, `ghostty`, `jetbrains-toolbox`, `dbeaver-community`
- Browser: `google-chrome`, `firefox`
- Productivity: `raycast`, `rectangle`, `ticktick`, `numi`, `the-unarchiver`, `tailscale-app`,
  `adobe-acrobat-reader`, `obsidian`
- AI: `claude`, `chatgpt`, `ollama-app`, `superwhisper`, and `conductor` on `arm64` hosts only
- Security: `1password`
- Media: `iina`

A single `confirm()` prompt SHALL gate installation of all core casks.

Two tokens are corrected here. `docker` is a renamed token that now resolves to `docker-desktop`,
and `ollama` resolves to `ollama-app`; the previous values named casks that no longer match the
intended applications.

The requirement previously described two arrays, `CASK_PACKAGES` and `OPTIONAL_CASK_PACKAGES`, which
the implementation has not used for some time — it declares one categorized array. The description is
corrected to the actual structure rather than restating a count against an array that does not exist.

`obsidian` is the knowledge base's editor. It updates itself (`auto_updates true`), and `brew pin`
applies only to formulae, so it carries no version pin.

#### Scenario: All core casks installed on fresh Mac

- **WHEN** the user confirms the core cask group on a Mac with no apps installed
- **THEN** every core row in `ALL_CASKS` is installed via `brew install --cask`

#### Scenario: User declines core casks

- **WHEN** the user declines the core cask confirmation
- **THEN** no core casks are installed and the script proceeds to the next group

#### Scenario: Renamed tokens resolve

- **WHEN** the core cask group runs on a host where neither Docker Desktop nor Ollama is installed
- **THEN** the script installs the `docker-desktop` and `ollama-app` casks, and no row names
  `docker` or `ollama`

#### Scenario: conductor stays architecture-scoped

- **WHEN** the install script is rendered for an `amd64` host
- **THEN** `ALL_CASKS` contains no `conductor` row

#### Scenario: Obsidian is a core Productivity cask

- **WHEN** the install script is rendered for any host
- **THEN** `ALL_CASKS` contains the row `obsidian|Obsidian|Productivity|Knowledge base`, and no brew pin or version-freeze entry names `obsidian`

#### Scenario: Obsidian already installed outside the script

- **WHEN** the core cask group runs on a host where `/Applications/Obsidian.app` already exists
- **THEN** `obsidian` is not counted as pending and is not reinstalled
