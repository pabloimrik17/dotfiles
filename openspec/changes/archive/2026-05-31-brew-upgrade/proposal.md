## Why

`brew upgrade` bumps 16 installed tools. A full changelog × config audit found the
repo is almost entirely unaffected, but a few upgrades enable concrete config cleanups
and two require operational sequencing. Separately, opencode and CodeRabbit are
currently installed via Homebrew, which **disables their built-in auto-update** (both
tools self-update only when installed via their official scripts). This change captures
the upgrade follow-ups and migrates those two tools to their official installers so they
stay current on their own.

## What Changes

### Install-method migration (opencode + CodeRabbit → official installers)

- Install **opencode** via `curl -fsSL https://opencode.ai/install | bash`
  (to `~/.opencode/bin`, with `--no-modify-path`) instead of Homebrew, and **remove
  `opencode` from `BREW_PACKAGES`**. Enables opencode's default `autoupdate` (inert under
  brew). Add `~/.opencode/bin` to PATH in `dot_zshrc.tmpl` (the installer would otherwise
  edit the chezmoi-managed `~/.zshrc`, which `chezmoi apply` overwrites). Side effect:
  removes the need for the un-registered `anomalyco/tap`.
- Install **CodeRabbit** via `curl -fsSL https://cli.coderabbit.ai/install.sh | sh`
  (to `~/.local/bin`, already on PATH) instead of the Homebrew cask, and **remove
  `coderabbit` from `ALL_CASKS`**. Enables `coderabbit update` self-update (disabled
  under the cask). Run non-interactively (`CI=1`) inside `run_onchange`.
- Both install steps **migrate off brew idempotently**: detect an existing
  brew/cask install, `brew uninstall` it (cask without `--zap`), then install via script;
  preserve user config (`~/.config/opencode`, `~/.coderabbit`).
- **BREAKING (behavioral):** opencode/CodeRabbit versions are no longer pinned/managed by
  brew — they self-update to latest. This trades reproducibility for always-current.

### Upgrade follow-ups (config hygiene)

- Remove the dead `export OPENCODE_EXPERIMENTAL_MARKDOWN=true` from `dot_zshrc.tmpl`
  (OpenCode graduated markdown to default-on in 1.14.50 and removed the flag; no-op in
  1.15.12). The other four `OPENCODE_EXPERIMENTAL_*` / `OPENCODE_ENABLE_EXA` exports stay.
- Update the CodeRabbit manual-auth instruction to reflect 0.5.0 deferred/integrated
  login (auth on first use; browser sign-in also handles org selection); keep
  `coderabbit auth login` as the explicit option; add a `coderabbit doctor` hint.

### Operational (no file change)

- **BREAKING (operational):** beads (1.0.5) + dolt (2.0.x) MUST upgrade together and
  `brew install beads` MUST stay unpinned across machines. beads 1.0.5 applies
  irreversible schema migrations (0041/0042/0046) + a hard schema-skew guard aligned to
  Dolt 2.0.6; once a machine on 1.0.5 writes a project's `.beads` DB, older `bd` binaries
  hard-fail.
- worktrunk 0.54.0 shell-wrapper split is auto-adopted on the next shell (`dot_zshrc.tmpl`
  re-evals `wt config shell init zsh`); no file change.

## Capabilities

### New Capabilities

- `opencode-install`: install opencode via its official script (to `~/.opencode/bin`,
  `--no-modify-path`), migrate off Homebrew, idempotent re-runs, and ensure it is on PATH
  for later install-script groups.

### Modified Capabilities

- `coderabbit-install`: REMOVE "installed via brew cask"; ADD "installed via official
  install script" (`~/.local/bin`, migrate off cask, `CI=1`); reflect deferred login in
  the manual-auth requirement; ADD a `coderabbit doctor` verification hint.
- `cli-tool-expansion`: remove `opencode` from `BREW_PACKAGES` (26 → 25) and from the
  non-macOS fallback brew list (opencode moves to the official-installer instructions).
- `zsh-config`: ADD the curated `OPENCODE_EXPERIMENTAL_*` export set (with
  `OPENCODE_EXPERIMENTAL_MARKDOWN` excluded); ADD `~/.opencode/bin` to PATH.

## Impact

- **Files:** `run_onchange_install-packages.sh.tmpl` (remove `opencode` from
  `BREW_PACKAGES`; remove `coderabbit` from `ALL_CASKS`; add an official-installer group
  with brew-migration + idempotency; update manual-instructions block); `dot_zshrc.tmpl`
  (add `~/.opencode/bin` to PATH; remove the dead MARKDOWN export).
- **Specs:** `opencode-install` (new), `coderabbit-install`, `cli-tool-expansion`, `zsh-config`.
- **Binaries:** opencode + CodeRabbit move off brew (self-updating). The remaining tools
  upgrade via `brew upgrade`; all audited as config no-ops except the items above.
- **Operational:** beads+dolt atomic upgrade across machines; shell restart for worktrunk.
- **Out of scope (separate follow-up):** `OPENCODE_ENABLE_EXA=true` is set without an
  exported `EXA_API_KEY` (Exa web search may be inert). The `anomalyco/tap` gap is
  resolved by this change (opencode leaves brew).
