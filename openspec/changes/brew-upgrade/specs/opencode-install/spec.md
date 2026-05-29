## ADDED Requirements

### Requirement: OpenCode installed via official script, not Homebrew

The install script SHALL install opencode via its official installer
(`curl -fsSL https://opencode.ai/install | bash`) instead of Homebrew, so opencode's
built-in auto-update is active. opencode auto-update only works when opencode is NOT
installed via a package manager such as Homebrew; the default `autoupdate: true` in
opencode's config therefore becomes effective only under the official-script install.

The installer SHALL be invoked with `--no-modify-path` so it does not append a PATH line
to the chezmoi-managed `~/.zshrc` (PATH for `~/.opencode/bin` is owned by `dot_zshrc.tmpl`
— see the `zsh-config` capability). The install step SHALL NOT require `sudo`.

#### Scenario: Fresh install on a machine without opencode

- **WHEN** the install script runs, `~/.opencode/bin/opencode` does not exist, and opencode is not installed via brew
- **THEN** the official installer runs with `--no-modify-path` and opencode is installed to `~/.opencode/bin/opencode`

#### Scenario: opencode absent from brew packages

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array does NOT contain `opencode`

### Requirement: Migration from a Homebrew opencode install

If opencode is currently installed via Homebrew, the install script SHALL uninstall the
brew copy so the official-script binary is the one resolved on PATH, avoiding two
`opencode` binaries shadowing each other. User configuration under `~/.config/opencode`
SHALL be preserved — it is independent of the install method.

#### Scenario: Existing brew install is migrated

- **WHEN** `brew list opencode` succeeds
- **THEN** the script runs `brew uninstall opencode` (and MAY `brew untap anomalyco/tap`), then installs via the official installer, leaving `~/.config/opencode` untouched

### Requirement: OpenCode install step is idempotent

The opencode install step SHALL be idempotent. Re-running the install script on a machine
already using the official-script install SHALL NOT force a reinstall from scratch; it MAY
no-op or defer to opencode's own version self-check.

#### Scenario: Already installed via official script

- **WHEN** `command -v opencode` resolves to a path under `~/.opencode/bin`
- **THEN** the script performs no brew migration and does not force a clean reinstall

### Requirement: opencode available to later install-script groups

After opencode is installed, the install script SHALL ensure `~/.opencode/bin` is on
`PATH` within the running script, so later groups that probe `command -v opencode` (e.g.
the OpenCode plugins group) detect it in the same invocation.

#### Scenario: OpenCode plugins group detects opencode

- **WHEN** the OpenCode plugins group runs after a fresh opencode install in the same script invocation
- **THEN** `command -v opencode` succeeds and the plugins group proceeds instead of warning that opencode is missing
