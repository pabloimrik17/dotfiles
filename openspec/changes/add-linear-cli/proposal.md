# Add linear-cli

## Why

The autonomous loop's `label-triage` step (DOT-102, `daily-agentic-task-force`) reads and labels Linear issues through [schpet/linear-cli](https://github.com/schpet/linear-cli). Today the CLI is installed by hand on one host, so no other host can reproduce it. The triage parser was verified against 2.6.0, and the CLI has almost no automated tests.

The brew freeze from `pin-brew-packages` (#210) now pins every brew package the repo installs at a declared version and reports drift. `linear` joins it like the other tap formulae, so it shares their single update path.

## What Changes

- Declare `linear` as a frozen tap formula: `schpet/tap` in `BREW_TAPS`, `schpet/tap/linear` in `BREW_PACKAGES`, a `pkg_bin` arm, and the row `schpet/tap/linear|2.6.0` in `BREW_VERSIONS`. The freeze pins it after install and warns on drift.
- Record the triage checklist beside the declaration. Raising the row is a reviewed repo change, made after the checklist passes on the candidate and after `brew-upgrade-pinned schpet/tap/linear`.
- Print CLI auth guidance next to the Linear MCP guidance:
  - `linear auth login` stores the key in the system keyring (the macOS Keychain; `secret-tool` from libsecret on Linux), and `~/.config/linear/credentials.toml` holds only workspace metadata.
  - Check the login with `linear auth whoami` or `linear auth list`. The ticket's `linear auth status` does not exist in 2.6.0.
  - `LINEAR_API_KEY` works as a fallback.
  - Never put a key in the repo, and never use `--plaintext`.
- List `linear` in both closing summary lines and in the non-macOS manual list, with an install hint.
- Docs: a README "What's Included" row and a manual section.

Out of scope:

- A hold for `linear`. The freeze pins it, and a hold would skip the install on a fresh host.
- Enforcing the version. As for every frozen package, a host that installs after a newer tap release gets that release and a drift warning.
- Automatic install on Linux. The non-macOS branch prints manual instructions, as for every brew package.
- `linear config` and per-repo `.linear.toml`.
- Delivering `LINEAR_API_KEY` through `shell-secrets`.
- A Linear GraphQL fallback.

## Capabilities

### New Capabilities

- `linear-cli-install`: covers these parts of linear-cli:
  - the frozen brew entry and its update path
  - the auth guidance
  - the summary lines and the non-macOS hint
  - the command surface the triage step relies on

### Modified Capabilities

None. The freeze rules in `brew-version-pins` already cover a new tap formula.

## Impact

- `run_onchange_install-packages.sh.tmpl`: the tap, formula, `pkg_bin` arm, version row and checklist; `print_linear_cli_guidance`, called in both branches; both closing summaries; the non-macOS list and hint.
- `tests/linear-cli.test.ts`; the freeze coverage count in `tests/brew-freeze.test.ts` rises from 35 to 36.
- `README.md`, `docs/manual.html`.
- This host already has `schpet/tap/linear` 2.6.0 from a hand install, with the tap trusted. The first run pins it and records it in the freeze record.
- Other macOS hosts: the first run trusts and taps `schpet/tap`, installs the current formula (2.6.0 today) and pins it.
- Consumer: the `autonomous` plugin's `label-triage` step. No change there.
- Rollout: `chezmoi update` on each host.
