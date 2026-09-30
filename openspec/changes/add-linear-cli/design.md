# Design

## Context

See proposal.md - Why. Facts this design rests on:

- `schpet/tap/linear` is a cargo-dist formula. It downloads `linear-<triple>.tar.xz` from the GitHub release for the host's CPU and OS, with a sha256 per target, and installs the prebuilt binary. Nothing builds from source, so the Intel bottle end-of-life costs nothing here.
- The tap serves only its current formula. Its git history holds older versions (`638d0ca linear 2.6.0`), but `brew install` uses only the current one. 2.6.0 (2026-09-02) is the latest release on 2026-09-30.
- The freeze (`brew-version-pins`) pins every formula in `BREW_PACKAGES` after the install groups, compares the pin with its `BREW_VERSIONS` row, and warns on drift without enforcing it. `brew-upgrade-pinned <pkg>` unpins, upgrades and repins.
- `linear` 2.6.0 has no self-update command. `NO_COLOR=1 linear --version` prints `linear 2.6.0`.

State on this host (2026-09-30):

- `schpet/tap/linear` 2.6.0 is installed by hand with Homebrew and not pinned. The tap is registered and trusted.
- `~/.config/linear/credentials.toml` holds only `default` and `workspaces`. The key is in the Keychain.

## Goals / Non-Goals

**Goals:**

- `linear` installs on every macOS host with no manual step, and is pinned there.
- Only a reviewed row bump moves the declared version, after the triage checklist passes.
- `linear` has the same install and update path as every other brew package.

**Non-Goals:**

- Enforcing 2.6.0 on a host that installs after a newer tap release. The freeze reports that drift and does not correct it.
- Automatic install on Linux.
- Automatic re-verification. The checklist is run by hand before raising the row.

## Decisions

### D1. A frozen tap formula

`linear` is a `BREW_PACKAGES` entry with a `BREW_VERSIONS` row, like `ticker`, `tickrs` and `llmfit`. The freeze pins it once it is installed and releases the pin if the entry is removed.

Alternatives:

- A chezmoi `run_onchange_` script with a sha256 per target (the previous draft). It installs the exact artifact on every host, Linux included. Rejected: it is a second install and update path next to the freeze adopted in #210, and the tap formula already installs the same sha256-pinned tarballs.
- A declared hold. Rejected: a hold does not install a missing package, and it is for a version brew would install that is itself wrong.
- `brew extract --version=2.6.0` into a local tap, or an own tap repo with a pinned `linear.rb`. Both reach older versions, but need a second tap on every host or a second repo for one formula.

### D2. Qualified name, trusted tap, `pkg_bin` arm

Homebrew 6 refuses a bare-named formula from a third-party tap, and an untrusted tap is left out of `brew outdated`. `BREW_TAPS` trusts and taps `schpet/tap` before the pre-scan. The pre-scan checks `command -v` on `pkg_bin`'s result, so the qualified name needs an arm that yields `linear`.

### D3. The checklist sits beside the declaration

It is a comment in the tap-qualified block right above `BREW_PACKAGES`, next to the llmfit paragraph. It cannot go inside `BREW_VERSIONS`: the freeze coverage test reads that array as plain tokens. The manual points to it and does not copy it, so the two cannot drift. Editing it re-runs the install script, as any edit to that file does.

### D4. Raising the version

Run the checklist on the candidate release, then `brew-upgrade-pinned schpet/tap/linear`, then bump the row. The candidate's release tarball runs the checklist without moving a host. A forgotten bump shows up as drift on the next run.

### D5. Drift is warned, not enforced

When the tap publishes a release before the row moves, a fresh host installs it and warns `schpet/tap/linear: declared 2.6.0, pinned <new>`. The `label-triage` step on that host runs an unverified version until the checklist passes and the row is bumped. This is the freeze's rule for every package, accepted for `linear` with it.

### D6. `print_linear_cli_guidance` is a separate function

The Linear MCP function's content belongs to `linear-mcp-access`. A separate function, called right after it in both branches, keeps each capability's text in its own place.

### D7. 2.6.0 is verified by existing evidence

Evidence from this session, on 2.6.0 from tap commit `638d0ca`:

- `issue query --all-teams --json` returns `{nodes, pageInfo}`, and each node carries `labels.nodes[{id,name,color}]`.
- `label list --json` returns `{nodes, pageInfo}`.
- `issue update` offers `--add-label`, documented as "keeping its existing labels".
- `label create` offers `-n` and `-c`.
- `auth whoami` exits 0. `auth status` is rejected with `Unknown command "status"`.

Writes on 2.6.0 were exercised by DOT-102's `--apply` run on 2026-09-26: 559 labels were added and read back.

### D8. Tests stay offline

`tests/linear-cli.test.ts` evaluates the real `BREW_TAPS`, `BREW_PACKAGES`, `BREW_VERSIONS` and `BREW_HOLDS` assignments with bash, runs `pkg_bin` on the qualified name, and checks the checklist, the guidance and the summaries. The freeze behaviour itself is covered by `tests/brew-freeze.test.ts`, whose coverage count includes `linear`.

## Risks / Trade-offs

- [A tap release lands before the row moves] → A fresh host runs an unverified version, with a drift warning (D5).
- [The tap is removed or renamed] → `brew tap` or `brew install` fails, the script reports the error, and chezmoi retries on the next apply.
- [A `linear` binary elsewhere on PATH] → The pre-scan counts it as installed and brew installs nothing. The freeze then finds no formula to pin.
- [Linux] → Not installed automatically. The non-macOS branch prints the install hint.
- [Free-plan issue limit] → The disposable issue for the write checks can fail to create. The checks run only when raising the row, and the disposable issue is deleted right after.
- [Keyring access from a headless context] → `linear` cannot read the keyring. The guidance names `LINEAR_API_KEY` as the fallback.

## Migration Plan

1. Merge, then run `chezmoi update` on each host.
2. This host: the first run pins the hand-installed 2.6.0 and records it. No drift warning.
3. Other macOS hosts: the first run taps `schpet/tap`, installs the current formula and pins it.
4. Rollback: revert. The freeze releases its recorded pin on the next run. `brew uninstall schpet/tap/linear` removes the binary.
