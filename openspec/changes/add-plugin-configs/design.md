## Context

- age encryption is already in place (`chezmoi-encryption`): `encryption = "age"`, recipient committed in `.chezmoi.toml.tmpl`, per-host identity at `~/.config/chezmoi/key.txt`. Two encrypted files exist: `encrypted_dot_ticker.yaml.age` (`ticker-config`) and `dot_config/zsh/encrypted_private_secrets.zsh.age` (`shell-secrets`).
- `autonomous` loads `~/.config/autonomous/config.json` (or `$AUTONOMOUS_CONFIG`), requires `schema: "autonomous.config.v1"`, and rejects a missing file, a missing, mistyped or unknown field, or invalid JSON with an error naming the path. It never applies a default. A missing file points the user at the plugin's `config.example.json`.
- `stonks` follows the same pattern for `~/.config/stonks/config.json` (decision record §4). Its format, example and schema id are defined in `add-stonks-plugin`, which is still being written.
- On this machine `~/.config/autonomous/config.json` exists with mode 644 and is unmanaged. `~/.config/stonks/` does not exist yet.
- chezmoi's live source directory is `~/.local/share/chezmoi`, a separate clone on `main`. Changes are developed in worktrees of `~/WebstormProjects/dotfiles`, so a plain `chezmoi add` writes to the wrong checkout.
- The plaintext of both files is personal. Under this repository's agent workflow it must not reach an agent transcript (precedent: `add-typesafe-skill` D4).

## Goals / Non-Goals

**Goals:**

- One encrypted source per plugin configuration, identical on every machine and deployed with mode 600.
- A clear boundary: chezmoi delivers the bytes and the plugin decides whether they are valid.
- An implementation an agent can drive end to end without ever seeing a configuration value.

**Non-Goals:**

- Defining, documenting or defaulting any field of either format. That belongs to each plugin's `config.example.json` and loader.
- Installing or enabling the plugins (`claude-code-plugins`), or the tooling `stonks` needs (`gws`, the `ibkr` MCP server). The latter is change `add-stonks-tooling`.
- Supporting `AUTONOMOUS_CONFIG` or any other path override. The managed file is at the default path only.
- Configurations of other plugins. The always-encrypted rule covers them when they are added, but this change adds only these two.

## Decisions

**D1: Every plugin configuration is encrypted, whatever it holds (user rule).** `autonomous.config.v1` carries no credentials, but it does carry tracker scopes, a local directory path and repository names. `stonks` carries spreadsheet, portfolio, watchlist and trader-page identifiers. Both repositories are public.
- Encrypting only the files that hold credentials was rejected. Every new field would need a fresh judgement about whether it is safe to publish, and one wrong call publishes it permanently in git history.
- Committing a plaintext template whose sensitive values come from encrypted chezmoi data (`.chezmoidata` or `{{ include ... | decrypt }}`) was rejected. It still publishes the structure and the non-sensitive values, needs the same file-by-file judgement, and adds a second artifact per file.

**D2: Whole-file age encryption, the same mechanism as ticker and the shell secrets.**
- Keychain or 1Password template functions were rejected. Each machine would need a manual step or the `op` CLI, and nothing would be reproducible from the repository alone.
- Leaving the files manual (the current state) was rejected. A second machine has no configuration, and the plugins fail by design without one.

**D3: Source `dot_config/<plugin>/encrypted_private_config.json.age`, plain parent directories.** The target path is the plugin's default path, so no path override is needed. `private_` gives mode 600, as in `shell-secrets`. The parent directories stay plain (mode 755), following `dot_config/zsh/`: the file mode protects the content, and the directory only reveals a file name that is public in this repository anyway. A `private_` directory (700) was considered and not adopted, to keep a single convention for encrypted files under `~/.config`. The file is encrypted as a whole and is not a template, because nothing in it varies per machine today (see Risks for the Beads directory).

**D4: The user produces the ciphertext; the agent never handles plaintext.** During implementation the user writes or keeps the plaintext and runs `chmod 600 <path>`. Then, from their own terminal, the user runs `chezmoi --source <worktree> add --encrypt <path>`.
- `--source` makes chezmoi write into the feature-branch worktree instead of `~/.local/share/chezmoi` on `main`.
- `chmod 600` first is required because `chezmoi add` derives `private_` from the file's mode, and the existing `autonomous` file is 644.
- `age --encrypt --armor -r <recipient>` straight into the worktree is the accepted fallback, as ticker did. It produces bytes chezmoi decrypts the same way.
- The agent verifies only properties that reveal no values: the ciphertext header, the target mode, a byte comparison that prints only "identical", and a schema-id check that prints only `ok`.

**D5: Validation stays in the plugin.** chezmoi writes the decrypted bytes and never parses them.
- A `run_onchange_after_` script that runs the plugin loader during apply was rejected. It would tie every apply to bun and to the installed plugin version. The plugins update on their own through marketplace `autoUpdate`, so a schema bump would start failing unrelated applies. It would also fail on machines where the plugin is not installed, and it would duplicate the plugin's validation.
- A JSON-syntax-only check (`jq`) was rejected as a half check. It cannot catch a wrong field, so the plugin would still be the one that reports real errors.

As a result, apply succeeds with an invalid file, and the plugin reports the error with the path when it next loads its configuration (spec: "Configuration validity is the plugin's concern, not chezmoi's").

**D6: No placeholder when the source is absent.** If an encrypted source is missing, chezmoi does not manage the path and the plugin reports "configuration file not found". Deploying the plugin's `config.example.json` instead was rejected: the example passes the plugin's own strict validation. The plugin would then run without error against placeholder targets, which is worse than a clear missing-file error.

**D7: Deployed on every machine, whatever the machine type.** This follows `ticker-config` and `shell-secrets`, which are not gated by `machineType` either. The decision record does not ask for gating. Restricting `stonks` to `personal` machines through `.chezmoiignore` would be a later, separate decision.

**D8: The stonks format is a reference, not a copy.** This change names only the path and the schema id declared by `plugins/stonks/config.example.json` in `daily-agentic-task-force`. Decision record §10 says the dotfiles PRs merge before the plugin PR. So the user writes the `stonks` plaintext from the example on the `feature/stonks-plugin` branch, and the file is deployed before any loader reads it, which is harmless. If the example changes before the plugin merges, the user updates the file with `chezmoi edit` and the change is a new commit of the `.age` file.

## Risks / Trade-offs

- [Personal identifiers sit as ciphertext in a public repository] → Mitigated by age X25519 with a per-host identity that is never committed. If `key.txt` leaks, generate a new identity, update the recipient, and re-encrypt every `.age` file. The identifiers themselves cannot be rotated like a key, which is why D1 encrypts everything.
- [Apply fails on a host without `key.txt`] → This failure mode already exists for ticker and the shell secrets. The README/manual bootstrap covers restoring the identity first.
- [Editing the plaintext target in place without re-encrypting] → The next apply flags the target as changed or overwrites it with the committed version. The documented flow is `chezmoi edit ~/.config/<plugin>/config.json`, which re-encrypts on save. `chezmoi diff` shows drift.
- [An unmanaged copy on another machine is replaced on first apply] → Run `chezmoi diff` before the first apply on each machine. Run it in the user's own terminal, because it prints plaintext.
- [Plaintext leaks into an agent transcript through `chezmoi diff`, `chezmoi cat`, `cat` or a `!`-prefixed command that prints contents] → Tasks mark every plaintext-printing step as USER-only, outside the agent session. Agent-side checks print only `ok`, `identical`, a mode, or a ciphertext header.
- [`sources.beads.directory` in the autonomous file is an absolute path; a machine with a different home or checkout location would need a different value] → Accepted for now: one file serves every machine (D3). If machines diverge, a later change can make the source an encrypted template. That is still encrypted, so it does not conflict with D1.
- [The stonks schema id changes while `add-stonks-plugin` is still being written] → Tasks 4.1–4.2 check the deployed file against the example's schema id at implementation time. A later mismatch is the plugin's error (D5) and is fixed with `chezmoi edit`.
- [The chezmoi source directory is stale] → Run `chezmoi update` (pull + apply) on each machine after merge, not a bare `chezmoi apply`.

## Migration Plan

1. Merge this change (order relative to `add-stonks-tooling` does not matter). The `add-stonks-plugin` PR merges after both.
2. On each machine: make sure `~/.config/chezmoi/key.txt` is present. Optionally run `chezmoi diff` in your own terminal. Then run `chezmoi update`. Both files appear with mode 600, and an existing 644 `autonomous` file is tightened to 600.
3. Rollback: delete the two `.age` sources and commit. chezmoi stops managing the paths but does not delete the deployed files, so the plugins keep working with the last deployed content. Delete the targets by hand only if the configuration itself should go.
