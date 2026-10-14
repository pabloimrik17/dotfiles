# Spec Delta

## MODIFIED Requirements

### Requirement: OpenCode installed via official script, not Homebrew

The install script SHALL install opencode via its official installer
(`curl -fsSL https://opencode.ai/install | bash`) instead of Homebrew, so opencode's
built-in auto-update is active. opencode auto-update only works when opencode is NOT
installed via a package manager such as Homebrew; the managed `update: "auto"` in
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
