## MODIFIED Requirements

### Requirement: Core cask apps are installed with single confirmation

The script SHALL declare its casks in a single `ALL_CASKS` array whose rows are
`token|AppName|Category|Description`. A row whose `Category` is anything other than `Optional` is a
core cask. Core casks SHALL comprise the following 21 rows:

- Dev: `visual-studio-code`, `docker-desktop`, `ghostty`, `jetbrains-toolbox`, `dbeaver-community`
- Browsers: `google-chrome`, `firefox`
- Productivity: `raycast`, `rectangle`, `ticktick`, `numi`, `the-unarchiver`, `tailscale-app`,
  `adobe-acrobat-reader`
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

### Requirement: Optional cask apps are installed with individual confirmation

Rows in `ALL_CASKS` whose `Category` is `Optional` SHALL be prompted individually. They SHALL
comprise the following 9 rows:

- Communication: `telegram`, `whatsapp`, `microsoft-teams`
- Media: `stremio`
- Utilities: `appcleaner`
- Other: `vnc-viewer`, `raspberry-pi-imager`, `folx`, `philips-hue-sync`

Each optional cask SHALL have its own individual `confirm()` prompt.

Two rows are removed. `transmission-remote-gui` was disabled upstream on 2026-09-01 for failing
Gatekeeper, so a fresh `brew install --cask` fails outright. `spark` resolves to `spark-app`, a
keyboard-shortcut manager, not the mail client of that name — the intended application is not
available as a cask.

#### Scenario: User selects specific optional casks

- **WHEN** the optional cask prompts are presented
- **THEN** each `Optional` row is asked individually and only confirmed casks are installed

#### Scenario: User declines all optional casks

- **WHEN** the user declines every optional cask prompt
- **THEN** no optional casks are installed

#### Scenario: Removed rows are absent

- **WHEN** the install script is loaded
- **THEN** `ALL_CASKS` contains no row for `transmission-remote-gui` and none for `spark`

#### Scenario: A disabled cask is not offered

- **WHEN** the optional cask prompts are presented
- **THEN** no prompt offers a cask that upstream has disabled, so accepting a prompt cannot fail
  immediately

### Requirement: Cask-to-app-name mapping handles non-trivial names

The script SHALL provide a `cask_to_app()` function that maps cask tokens to the path of their
installed application relative to `/Applications`, so the existing-app check resolves. All casks in
`ALL_CASKS` with non-trivial branding, casing, or directory nesting SHALL be explicitly mapped.

The mappings SHALL be carried in the `AppName` field of each `ALL_CASKS` row and read through
`cask_to_app()`, rather than duplicated into a second table inside the function. The array is
already the place a cask is added or removed, so a separate table is a second source of truth that
drifts the moment a row changes — and the scenario below that no mapping outlives its cask is
then satisfied structurally instead of by remembering to edit two places. The following mappings
SHALL be hardcoded in those rows:

| Cask                   | App path (relative to `/Applications`) |
| ---------------------- | -------------------------------------- |
| `visual-studio-code`   | `Visual Studio Code`                   |
| `dbeaver-community`    | `DBeaver`                              |
| `jetbrains-toolbox`    | `JetBrains Toolbox`                    |
| `microsoft-teams`      | `Microsoft Teams`                      |
| `adobe-acrobat-reader` | `Adobe Acrobat Reader`                 |
| `the-unarchiver`       | `The Unarchiver`                       |
| `1password`            | `1Password`                            |
| `philips-hue-sync`     | `Hue Sync`                             |
| `chatgpt`              | `ChatGPT`                              |
| `ticktick`             | `TickTick`                             |
| `superwhisper`         | `superwhisper`                         |
| `iina`                 | `IINA`                                 |
| `vnc-viewer`           | `VNC Viewer`                           |
| `appcleaner`           | `AppCleaner`                           |
| `whatsapp`             | `WhatsApp.localized/WhatsApp`          |

The mapping SHALL be able to express a nested path, not only a top-level bundle name. WhatsApp
installs to `/Applications/WhatsApp.localized/WhatsApp.app`, so a mapping that can only yield
`WhatsApp` produces a path that never exists and the app is reported pending on every single run.
The `transmission-remote-gui` row is removed along with its cask.

For a cask token that appears in no `ALL_CASKS` row, `cask_to_app()` SHALL fall back to the token
with each hyphen replaced by a space and the first letter of each word upper-cased; the rest of each
word is unchanged.

#### Scenario: Known mapping resolves correctly

- **WHEN** `cask_to_app "visual-studio-code"` is called
- **THEN** the function returns `Visual Studio Code`

#### Scenario: Unknown cask uses default derivation

- **WHEN** `cask_to_app "some-new-app"` is called
- **THEN** the function returns `Some New App`

#### Scenario: Nested app path resolves

- **WHEN** `cask_to_app "whatsapp"` is called on a host where WhatsApp is installed
- **THEN** the returned value combines with `/Applications` and `.app` into the real bundle path, so
  the existing-app check succeeds

#### Scenario: No mapping survives its cask

- **WHEN** a cask row is removed from `ALL_CASKS`
- **THEN** `cask_to_app()` contains no mapping for that token
