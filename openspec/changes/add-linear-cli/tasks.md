# Tasks

## 1. Frozen brew entry (`linear-cli-install`)

- [x] 1.1 Delete `run_onchange_after_install-linear-cli.sh.tmpl`, the previous draft's install script.
- [x] 1.2 In `run_onchange_install-packages.sh.tmpl`:
  - add `schpet/tap` to `BREW_TAPS` and `schpet/tap/linear` to `BREW_PACKAGES` after `tuicr`
  - add the `pkg_bin` arm `schpet/tap/linear` → `linear`
  - add the row `schpet/tap/linear|2.6.0` to `BREW_VERSIONS` in alphabetical order
  - add no `BREW_HOLDS` entry

  Verify with `tests/linear-cli.test.ts`, which evaluates each array with bash and runs `pkg_bin`, and with `tests/brew-freeze.test.ts`, whose coverage count rises from 35 to 36.
- [x] 1.3 Write the triage checklist from `linear-cli-install` in the tap-qualified comment above `BREW_PACKAGES`: the rule for raising the `BREW_VERSIONS` row, the four commands, the expected JSON shapes, and the disposable-issue rule. Verify with a test that the block names all of them.
- [x] 1.4 Verify with a test that `update-extra` in `dot_zshrc.tmpl` does not mention `linear`.

## 2. Guidance and docs

- [x] 2.1 In the install script:
  - Keep `print_linear_cli_guidance` right after `print_linear_mcp_guidance` in both branches, and name the keyring as the macOS Keychain or `secret-tool` from libsecret on Linux.
  - Keep `linear` after `tuicr` on both closing `CLI tools:` summary lines.
  - Add `linear` after `tuicr` to the non-macOS manual `CLI tools:` list, with the hint `brew install schpet/tap/linear` or a release tarball at the declared version.

  Verify with tests that render both branches:
  - the guidance follows the MCP guidance and names the required commands
  - no branch names `auth status`, and `--plaintext` appears only in a "never" line
  - all three `CLI tools:` lines include `linear`, and the non-macOS render has the hint
  - `bash -n` passes on both renders
- [x] 2.2 Update the README row and the manual section to the frozen formula: name `schpet/tap/linear`, its `BREW_VERSIONS` row, the drift a later tap release causes, the checklist beside the declaration, the upgrade path `brew-upgrade-pinned schpet/tap/linear` plus the row bump, and the manual Linux install. Verify that `grep -c 'lin_api_' README.md docs/manual.html` prints 0 for both, and that the section renders in a browser.

## 3. Integration

- [x] 3.1 Run `bun test`, `bun run lint:oxfmt`, `bunx fallow dead-code --fail-on-issues`, `openspec validate add-linear-cli --strict` and `bunx @fission-ai/openspec@1.2.0 validate --changes --no-interactive`. Verify that all exit 0.
- [x] 3.2 Run the freeze pass of the rendered install script against this host's brew, twice. The full `chezmoi apply` answers no to every prompt without a TTY and applies the whole source; `chezmoi update` runs it after merge. Verify on this host:
  - `brew list --pinned --versions` lists `linear 2.6.0`
  - `~/.local/state/dotfiles/brew-freezes` has the line `formula schpet/tap/linear`
  - the run prints no drift warning for `schpet/tap/linear`
  - `command -v linear` resolves under `$(brew --prefix)/bin`
  - the second run prints nothing and changes no pin
- [x] 3.3 Verify the installed binary against the checklist, read-only:
  - `linear auth whoami` exits 0.
  - `linear issue query --all-teams --json` returns `nodes` and `pageInfo`, with `labels.nodes` on every node.
  - `linear label list --json` returns `nodes` and `pageInfo`.
  - `--add-label`, `-n` and `-c` appear in their `--help` output.
