## ADDED Requirements

### Requirement: Core cask apps are installed with single confirmation

The script SHALL define a `CASK_PACKAGES` array containing the following 19 casks:

- Dev: `visual-studio-code`, `docker`, `ghostty`, `jetbrains-toolbox`, `dbeaver-community`
- Browsers: `google-chrome`, `firefox`
- Productivity: `raycast`, `rectangle`, `ticktick`, `numi`, `the-unarchiver`
- AI: `claude`, `chatgpt`, `ollama`
- Security: `1password`
- Media: `iina`, `superwhisper`
- PDF: `adobe-acrobat-reader`

A single `confirm()` prompt SHALL gate installation of all core casks.

#### Scenario: All core casks installed on fresh Mac

- **WHEN** the user confirms the core cask group on a Mac with no apps installed
- **THEN** all 19 casks are installed via `brew install --cask`

#### Scenario: User declines core casks

- **WHEN** the user declines the core cask confirmation
- **THEN** no core casks are installed and the script proceeds to the next group

### Requirement: Optional cask apps are installed with individual confirmation

The script SHALL define an `OPTIONAL_CASK_PACKAGES` array containing the following 11 casks:

- Communication: `telegram`, `whatsapp`, `microsoft-teams`
- Media: `stremio`
- Utilities: `appcleaner`
- Other: `spark`, `vnc-viewer`, `raspberry-pi-imager`, `transmission-remote-gui`, `folx`, `philips-hue-sync`

Each optional cask SHALL have its own individual `confirm()` prompt.

#### Scenario: User selects specific optional casks

- **WHEN** the optional cask prompts are presented
- **THEN** each cask is asked individually and only confirmed casks are installed

#### Scenario: User declines all optional casks

- **WHEN** the user declines every optional cask prompt
- **THEN** no optional casks are installed

### Requirement: Cask installation checks for existing app before installing

Before each `brew install --cask`, the script SHALL check if the corresponding `.app` already exists in `/Applications/`. If the app exists, the cask SHALL be skipped with an informational message.

#### Scenario: App already installed manually

- **WHEN** `/Applications/Visual Studio Code.app` already exists
- **THEN** the `visual-studio-code` cask is skipped with message `visual-studio-code — already installed, skipping`

#### Scenario: App not present

- **WHEN** `/Applications/Visual Studio Code.app` does not exist
- **THEN** `brew install --cask visual-studio-code` is executed

### Requirement: Cask-to-app-name mapping handles non-trivial names

The script SHALL provide a `cask_to_app()` function that maps cask names to their actual `/Applications/*.app` directory names. All casks in `CASK_PACKAGES` and `OPTIONAL_CASK_PACKAGES` with non-trivial branding or casing SHALL be explicitly mapped. The following mappings SHALL be hardcoded:

| Cask                      | App Name                  |
| ------------------------- | ------------------------- |
| `visual-studio-code`      | `Visual Studio Code`      |
| `dbeaver-community`       | `DBeaver`                 |
| `jetbrains-toolbox`       | `JetBrains Toolbox`       |
| `microsoft-teams`         | `Microsoft Teams`         |
| `adobe-acrobat-reader`    | `Adobe Acrobat Reader`    |
| `the-unarchiver`          | `The Unarchiver`          |
| `1password`               | `1Password`               |
| `philips-hue-sync`        | `Hue Sync`                |
| `transmission-remote-gui` | `Transmission Remote GUI` |
| `chatgpt`                 | `ChatGPT`                 |
| `ticktick`                | `TickTick`                |
| `superwhisper`            | `superwhisper`            |
| `iina`                    | `IINA`                    |
| `vnc-viewer`              | `VNC Viewer`              |
| `appcleaner`              | `AppCleaner`              |
| `whatsapp`                | `WhatsApp`                |

For unmapped casks, the function MAY derive the name by capitalizing each word of the cask name (replacing hyphens with spaces) as a last-resort fallback.

#### Scenario: Known mapping resolves correctly

- **WHEN** `cask_to_app "visual-studio-code"` is called
- **THEN** the function returns `Visual Studio Code`

#### Scenario: Unknown cask uses default derivation

- **WHEN** `cask_to_app "some-new-app"` is called
- **THEN** the function returns `Some New App`

### Requirement: Cask installation failures are accumulated, not fatal

If a `brew install --cask` command fails, the script SHALL increment the error counter and continue with the next cask. The script SHALL NOT exit on individual cask failures.

#### Scenario: One cask fails, others succeed

- **WHEN** `brew install --cask docker` fails but other casks succeed
- **THEN** an error is logged for docker, remaining casks are attempted, and the final error count includes the failure
