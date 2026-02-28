## ADDED Requirements

### Requirement: Run-once script installs brew packages
The repo SHALL include a `run_once_install-packages.sh.tmpl` that installs required brew packages on first apply. Packages: starship, eza, bat, zoxide, atuin, fzf, ripgrep, lazygit.

#### Scenario: Packages installed on fresh machine
- **WHEN** chezmoi apply runs for the first time on a machine with brew installed
- **THEN** all listed packages are installed via `brew install`

#### Scenario: Script does not re-run on subsequent apply
- **WHEN** chezmoi apply runs again after packages were already installed
- **THEN** the `run_once` script is not executed again (chezmoi tracks execution)

### Requirement: Interactive confirmation before each install group
The install script SHALL prompt for confirmation before each group of installations. Groups: brew packages, fonts, oh-my-zsh + plugins.

#### Scenario: User declines font installation
- **WHEN** the script prompts "Install Hack Nerd Font? [Y/n]" and user answers "n"
- **THEN** the font installation is skipped but the script continues to the next group

#### Scenario: User confirms all groups
- **WHEN** user answers "Y" (or presses Enter) for all prompts
- **THEN** all groups are installed

### Requirement: Oh-my-zsh installation
The script SHALL install oh-my-zsh if `~/.oh-my-zsh/` does not exist. It SHALL use the official install script with `--unattended` flag.

#### Scenario: Oh-my-zsh installed on clean machine
- **WHEN** `~/.oh-my-zsh/` does not exist and user confirms
- **THEN** oh-my-zsh is installed via the official install script

#### Scenario: Oh-my-zsh already present
- **WHEN** `~/.oh-my-zsh/` already exists
- **THEN** oh-my-zsh installation is skipped

### Requirement: Zsh custom plugins installed via git clone
Custom oh-my-zsh plugins (you-should-use) SHALL be installed by cloning their git repos into `~/.oh-my-zsh/custom/plugins/`. External zsh plugins (zsh-autosuggestions, zsh-syntax-highlighting) SHALL be installed via brew.

#### Scenario: you-should-use plugin cloned
- **WHEN** `~/.oh-my-zsh/custom/plugins/you-should-use/` does not exist and user confirms
- **THEN** the plugin is cloned from its GitHub repo

#### Scenario: Plugin already cloned
- **WHEN** `~/.oh-my-zsh/custom/plugins/you-should-use/` already exists
- **THEN** the clone is skipped

### Requirement: Hack Nerd Font installation
The script SHALL install Hack Nerd Font via `brew install --cask font-hack-nerd-font` on macOS.

#### Scenario: Font installed on macOS
- **WHEN** script runs on macOS and user confirms font installation
- **THEN** Hack Nerd Font is installed via brew cask

### Requirement: Script is OS-conditional
The install script SHALL use chezmoi template conditionals to run brew-based installations only on macOS (darwin). On other OSes, it SHALL print a message listing the required packages for manual installation.

#### Scenario: Non-macOS machine gets manual instructions
- **WHEN** chezmoi apply runs on a Linux machine
- **THEN** the script prints a list of required packages instead of attempting brew install

### Requirement: Script fails gracefully
The script SHALL NOT abort entirely if a single package fails to install. It SHALL report the failure and continue with the next package/group.

#### Scenario: One package fails
- **WHEN** `brew install atuin` fails (e.g., network error)
- **THEN** the error is printed, remaining packages are still attempted, and the script exits with non-zero status
