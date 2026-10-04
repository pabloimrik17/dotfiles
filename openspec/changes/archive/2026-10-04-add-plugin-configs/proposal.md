## Why

Two Claude Code plugins from the `daily-agentic-task-force` marketplace read a per-user JSON configuration outside the plugin: `autonomous` reads `~/.config/autonomous/config.json` (schema `autonomous.config.v1`), and the upcoming `stonks` plugin (change `add-stonks-plugin` in that repository) reads `~/.config/stonks/config.json`. Both plugins reject a missing or invalid file and never fall back to a default. So each machine needs the real file, and today it is created by hand and exists on one machine only. The files hold personal values: tracker scopes and repository lists for `autonomous`; spreadsheet, portfolio, watchlist and trader-page identifiers for `stonks`. This repository and the plugin repository are both public.

The user decided that plugin configurations are always encrypted, even when a file holds nothing secret. Deciding file by file which values are safe to publish is the step that eventually leaks one.

## What Changes

- Manage `~/.config/autonomous/config.json` with chezmoi as an age-encrypted file: source `dot_config/autonomous/encrypted_private_config.json.age`, deployed with mode 600.
- Manage `~/.config/stonks/config.json` the same way: source `dot_config/stonks/encrypted_private_config.json.age`, mode 600.
- Make "plugin configurations are always encrypted" a rule of this repository. No plaintext copy, no `.tmpl` rendering of plugin values, and no placeholder or example file is ever committed or deployed in place of the real configuration.
- Leave the file formats to the plugins. Each plugin's `config.example.json` and loader define the format. This repository specifies the path, the encryption and the deployment, never a field.
- Define how failures behave. Without the age identity, apply stops and reports the encrypted file; it writes no plaintext and keeps the existing target. When the encrypted source is absent, nothing is deployed and the plugin reports its own missing-file error. A file that fails the plugin's schema is reported by the plugin, not by chezmoi.
- Document the create and edit flow (`chezmoi edit <target>`) for both files in the README and in the manual's "Encrypted files (chezmoi + age)" table.
- The user produces the encrypted artifacts during implementation (`chezmoi add --encrypt`, run from the user's own terminal). The plaintext never enters an agent transcript or the repository.

## Capabilities

### New Capabilities

- `plugin-configs`: per-user Claude Code plugin configuration files (`autonomous`, `stonks`) managed by chezmoi as age-encrypted files under `~/.config/<plugin>/config.json`: the always-encrypted rule, deployment with mode 600, behavior without the identity or without the source file, the boundary between chezmoi (delivers bytes) and the plugin (validates them), and the documented edit flow.

### Modified Capabilities

None. The change uses the existing `chezmoi-encryption` contract (age backend, committed recipient, per-host identity at `~/.config/chezmoi/key.txt`, `encrypted_` + `.age` naming) without changing its requirements. It touches no install, settings or plugin-enablement contract in `claude-code-plugins`.

## Impact

- New source files (ciphertext only): `dot_config/autonomous/encrypted_private_config.json.age` and `dot_config/stonks/encrypted_private_config.json.age`.
- New `tests/plugin-configs.test.ts`: guards the always-encrypted rule (only `.age` sources target these paths) and the failure behavior without the identity, using no real configuration value.
- `README.md` and `docs/manual.html`: edit flow for the two files, through the `update-readme` and `update-manual` skills.
- Per machine: `chezmoi apply` now writes both files, so it needs `~/.config/chezmoi/key.txt`, which ticker and the shell secrets already require. On a machine that has an unmanaged copy of either file, the managed content replaces it on the first apply.
- No new dependency, Homebrew package, `run_` script, template or shell change. No change to how the plugins are installed or enabled.
- Cross-repository contract (decision record §10): the path `~/.config/stonks/config.json` and the schema id declared by `plugins/stonks/config.example.json` in `add-stonks-plugin`. The stonks plugin PR merges after this change, so the `stonks` file can be deployed before any loader reads it.
