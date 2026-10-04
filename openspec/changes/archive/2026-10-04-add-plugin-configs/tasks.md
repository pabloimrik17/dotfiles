Steps marked **USER** handle plaintext. Run them in your own terminal, outside any agent session. Do not use a `!`-prefixed command for them in Claude Code, because its output goes into the transcript. Agent steps only run checks that print `ok`, `identical`, `match`, a file mode or a ciphertext header, never a configuration value. `$WT` is this worktree, `~/WebstormProjects/dotfiles-worktrees/feature-add-plugin-configs`.

## 1. Preconditions

- [x] 1.1 Confirm the identity on this host matches the committed recipient. Verify: `[ "$(age-keygen -y ~/.config/chezmoi/key.txt)" = "$(grep -o 'age1[a-z0-9]*' "$WT/.chezmoi.toml.tmpl")" ] && echo match` prints `match` (this prints the public key comparison only).
- [x] 1.2 Confirm both paths are unmanaged today, so the live files are untouched until this change lands (spec: source absent). Verify: `chezmoi managed | grep -E '\.config/(autonomous|stonks)/config\.json'` prints nothing.

## 2. Guard test

- [x] 2.1 Add `tests/plugin-configs.test.ts` (`bun:test`, same helpers as `tests/linear-cli.test.ts`). It asserts four things, using no real configuration value:
    - (a) `dot_config/autonomous/` and `dot_config/stonks/` each contain exactly `encrypted_private_config.json.age`, and each starts with an age header (`-----BEGIN AGE ENCRYPTED FILE-----` or `age-encryption.org/v1`).
    - (b) No other source file targets either path: no plaintext file, plaintext template, `create_` or `modify_` variant.
    - (c) Run apply against a temporary home with a temporary chezmoi config (`--config`, `--destination`, `--persistent-state`) whose `[age] identity` points at a missing file. Applying each target exits non-zero and stderr names `config.json`. A sentinel file pre-seeded at the `autonomous` target is byte-identical afterwards, and the `stonks` target is not created.
    - (d) No `run_` script or template references `.config/autonomous` or `.config/stonks`, so there is no validation at apply time.

    Verify: `bun test tests/plugin-configs.test.ts` runs, and it fails only on the assertions that need the `.age` files from groups 3–4.

## 3. autonomous configuration

- [x] 3.1 **USER**: `chmod 600 ~/.config/autonomous/config.json`. The file exists today with mode 644, and `chezmoi add` derives `private_` from the mode. Verify (agent): `stat -f %Lp ~/.config/autonomous/config.json` prints `600`.
- [x] 3.2 **USER**: `chezmoi --source "$WT" add --encrypt ~/.config/autonomous/config.json`. `--source` writes into this worktree, not the `main` clone at `~/.local/share/chezmoi`. Fallback: `age --encrypt --armor -r <recipient> -o "$WT/dot_config/autonomous/encrypted_private_config.json.age" ~/.config/autonomous/config.json`. Verify (agent):
    - `head -c 34 "$WT/dot_config/autonomous/encrypted_private_config.json.age"` shows an age header.
    - `chezmoi --source "$WT" status ~/.config/autonomous/config.json` prints nothing.
    - `chezmoi --source "$WT" cat ~/.config/autonomous/config.json | cmp -s - ~/.config/autonomous/config.json && echo identical` prints `identical`.
- [x] 3.3 Confirm the plugin accepts the deployed file. Run the plugin's own loader from a `daily-agentic-task-force` checkout, printing only the verdict: `bun -e 'import { loadConfig } from "<datf>/plugins/autonomous/src/config.ts"; console.log(loadConfig(process.env).ok ? "ok" : "invalid")'` with `AUTONOMOUS_CONFIG` unset. Verify: prints `ok`. On `invalid`, **USER** reruns it in their own terminal printing `.error`, fixes the plaintext, and repeats 3.2. The error comes from the plugin, not from chezmoi.

## 4. stonks configuration

- [x] 4.1 Confirm the contract. `plugins/stonks/config.example.json` is not written yet (`add-stonks-plugin` task 2.4), so the source is the example block in that change's `design.md` (D15, placeholders only) on branch `feature/stonks-plugin` of `daily-agentic-task-force`. Verify: the D15 block and the `stonks-sync` spec ("User configuration file") declare the same schema id, recorded in this task. The decision record expects `stonks.config.v1`. Recorded: both declare `stonks.config.v1`.
- [x] 4.2 **USER**: `mkdir -p ~/.config/stonks`, write `~/.config/stonks/config.json` from the D15 block with every placeholder replaced by the real value, then `chmod 600 ~/.config/stonks/config.json`. Verify (agent):
    - `stat -f %Lp ~/.config/stonks/config.json` prints `600`.
    - `jq -e --arg id <id from 4.1> '.schema == $id' ~/.config/stonks/config.json >/dev/null && echo ok` prints `ok`.
    - `grep -qE '<[A-Z_]+>' ~/.config/stonks/config.json || echo customised` prints `customised` (no placeholder left).
- [x] 4.3 **USER**: `chezmoi --source "$WT" add --encrypt ~/.config/stonks/config.json` (same fallback as 3.2). Verify (agent): the same three checks as 3.2 against `dot_config/stonks/encrypted_private_config.json.age` and `~/.config/stonks/config.json`. The header is present, `status` prints nothing, and the comparison prints `identical`.
- [x] 4.4 If the stonks configuration loader already exists on `feature/stonks-plugin`, run it the same way as 3.3, printing only `ok` or `invalid`. Verify: prints `ok`. If it does not exist yet, record here that full validation is covered by `add-stonks-plugin`'s own tasks; that PR merges after this one. Recorded: no loader yet (`plugins/stonks/` holds only `CONTEXT.md`); full validation is covered by `add-stonks-plugin`'s own tasks.
- [x] 4.5 Verify: `bun test tests/plugin-configs.test.ts` passes in full.

## 5. Documentation

- [x] 5.1 Update `README.md` through the `update-readme` skill. Next to "Edit an encrypted file", document both plugin configuration paths and the flow: `chezmoi edit ~/.config/<plugin>/config.json`, commit the `.age` file, then `chezmoi update` on every machine. State that plugin configurations are always encrypted, that each plugin's `config.example.json` defines the format, and that an invalid file is reported by the plugin, not by `chezmoi apply`. No value, identifier or field list goes in. Verify: `grep -nE '\.config/(autonomous|stonks)/config\.json' README.md` matches both paths.
- [x] 5.2 Update `docs/manual.html` through the `update-manual` skill. Add both paths to the "Encrypted files (chezmoi + age)" table in Section 7 with the `chezmoi edit` flow, plus a flow block like the existing ones. Verify: `grep -cE '\.config/(autonomous|stonks)/config\.json' docs/manual.html` is at least 2, and the page renders with the new rows visible and found by the manual's search.

## 6. Integration checks

- [x] 6.1 Run a round trip into a temporary home with the real identity:
    - Run `chezmoi --source "$WT" --destination "$TMP" --persistent-state "$TMP/state.boltdb" apply` for `"$TMP/.config/autonomous/config.json"` and `"$TMP/.config/stonks/config.json"`.
    - Check that both files have mode 600, that `$TMP/.config/stonks/` was created, and that `cmp` against the live files prints `identical`.
    - Delete `$TMP/.config/stonks/config.json`, re-apply, and check that it is restored with mode 600.
    - `rm -rf "$TMP"`.

    Verify: each check prints the expected mode or `identical`, and `$TMP` is gone afterwards.

    Recorded: applying single targets into an empty home needs `--parent-dirs`. A plain re-apply after the delete asks first ("has changed since chezmoi last wrote it"); answering `overwrite`, or `--force`, restores the file with mode 600 and `identical`.
- [x] 6.2 Check for leaks. Verify:
    - `git -C "$WT" status --porcelain` lists only the two `.age` sources, `tests/plugin-configs.test.ts`, `README.md`, `docs/manual.html` and this change directory.
    - `git -C "$WT" ls-files -co --exclude-standard | grep -E 'dot_config/(autonomous|stonks)/'` lists only `encrypted_private_config.json.age` files.
    - No file in the diff outside the `.age` sources contains JSON taken from either configuration.

    Recorded: a scan of every string value (4+ characters, `schema` excluded) against the lines this branch adds found only the `scope` enum word, a literal of the plugin's public schema.
- [x] 6.3 Verify: `bun run lint:oxfmt`, `bun run lint:fallow` and `openspec validate add-plugin-configs --strict` all pass.
- [x] 6.4 After merge, on this machine: run `chezmoi update`. Verify: `chezmoi status ~/.config/autonomous/config.json ~/.config/stonks/config.json` prints nothing, and `stat -f %Lp` prints `600` for both files.
