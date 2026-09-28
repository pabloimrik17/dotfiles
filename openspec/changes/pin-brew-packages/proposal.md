# Proposal

## Why

Only `beads` is pinned. Every other brew package the repo installs can still move with a bulk
`brew upgrade` or `bubu`, skipping the per-package changelog review the repo requires. On the Intel
host each of those moves is also a source build. Nothing lists what brew has installed outside the
repo either, so there is no basis for deciding what to drop or adopt.

## What Changes

- Record a version for each package the install script installs through brew: the 33 formulae
  (`BREW_PACKAGES` plus the three zsh plugin formulae) and the 2 font casks. Each value is the
  version installed on this Intel host on 2026-09-27, with `llmfit` refreshed after its tap
  migration on 2026-09-28. Keep the table in alphabetical order by package name.
- The install script pins each of these packages after installing it. It releases the pin when a
  package leaves the list. This uses the same reconcile model as `BREW_HOLDS`, with its own record.
- A pinned version that differs from the declared one produces a warning. The script does not
  enforce it, because brew cannot install an older version.
- A declared package with no version row is an error, and so is a version row with no package.
- Upgrading a package uses `brew-upgrade-pinned <pkg>`, which restores the pin even if the upgrade
  fails, followed by a bump of its version row.
- The Intel host's `llmfit` is moved from `homebrew/core` to the declared tap and pinned at
  1.1.16. A source mismatch on another host still gets a one-time switch warning, without an
  always-present migration hint.
- Add a one-off inventory to `design.md`: what brew has installed on this host that the repo does
  not declare. No keep, remove or adopt action is taken in this change.
- Out of scope: transitive dependencies (68 formulae), GUI casks (on this host all of them are
  installed outside brew), and per-host versions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `brew-version-pins`: adds the freeze on every brew package the repo installs: declared versions,
  drift reports, and releasing a pin when its package is removed. The existing hold requirement
  now applies only to correctness holds, which still skip packages that are not installed.
- `classify-tool-updates-skill`: a new brew-managed package needs a version row, and the upgrade
  path uses the repinning helper before bumping the row.

## Impact

- `run_onchange_install-packages.sh.tmpl`: a new version table, and a freeze pass after the zsh
  plugin group. The zsh plugin formula list moves into an array. The stale llmfit hint is removed.
- `dot_zshrc.tmpl`: adds `brew-upgrade-pinned` for safe per-package upgrades.
- New state file `~/.local/state/dotfiles/brew-freezes`.
- `tests/`: a bun test that runs the freeze pass against a stubbed `brew`.
- `.agents/skills/classify-tool-updates/SKILL.md`, `README.md`, `docs/manual.html`.
- On its first run, this host gains 34 pins (`beads` is already held). On the arm64 host, expect
  one drift warning for each package whose version differs from this host's.
- `brew upgrade <pkg>` on its own now refuses to run, and bulk upgrades skip every declared
  package.
