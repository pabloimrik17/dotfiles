# Design

## Context

See [proposal.md](proposal.md) for motivation. The current source tree has one `encrypted_private_config.json.age` per plugin. `tests/plugin-configs.test.ts` shares that filename between autonomous and stonks, checks age headers and chezmoi mappings, and exercises missing-identity behavior in temporary destinations. Its script/template scan excludes ciphertext. CI installs chezmoi and runs `bun test` without a personal age identity.

The existing `plugin-configs` specification explicitly requires the old autonomous filename and describes deployment as decrypt-and-write. Both clauses need an explicit delta. The general `chezmoi-encryption` convention already allows encrypted files with the `.age` suffix, so it requires no change. The manual's encrypted-files flow names the old shared filename; README only says to commit the `.age` file.

Discovery inspected source names, tests, configuration conventions, documentation, and specs. It did not decrypt personal configurations or verify another machine's filesystem. The reported hardcoded value comes from [issue #229](https://github.com/pabloimrik17/dotfiles/issues/229); implementation must inspect the actual decrypted content privately before converting it.

## Goals / Non-Goals

**Goals:** Preserve the existing JSON values and private deployment while substituting the host-specific home at render time. Make the source rename, encryption guarantees, and behavior under two homes verifiable.

**Non-Goals:** Change the autonomous loader, install a Beads repository, introduce per-machine project-directory prompts, alter stonks, add apply-time schema/path validation, or synchronize unrelated agent configuration.

## Decisions

### Use chezmoi's encrypted-template attributes

Convert only autonomous to `encrypted_private_config.json.tmpl.age`, retaining `encrypted_` and `private_`. Use chezmoi's attribute operation and confirm the mapping with `managed --path-style all --format json`. The resulting target must still be `.config/autonomous/config.json`, never `config.json.tmpl`.

Set the encrypted template's Beads value to `{{ .chezmoi.homeDir }}/WebstormProjects/agentic-task` inside the JSON string, following the issue's requested layout. If JSON escaping is needed for a home path, emit the complete value with JSON encoding rather than interpolating unescaped characters. Inspect other strings for literal template delimiters and escape them so their rendered values do not change.

Alternatives: expanding `~` in the plugin would require a separate project change; a plaintext wrapper or apply hook would add another deployment mechanism and conflict with the current plugin-config contract. Native encrypted templating keeps the transformation with the configuration it owns. See chezmoi's [source attributes](https://www.chezmoi.io/reference/source-state-attributes/) and [age guide](https://www.chezmoi.io/user-guide/encryption/age/).

### Keep validation separate from rendering

The updated spec explicitly permits template rendering while retaining plugin-owned JSON/schema validation. Template syntax failures can fail chezmoi; a plugin schema failure after successful rendering remains a plugin error. Directory existence is a rollout acceptance check, not a hook. Creating an empty directory would conceal a missing Beads checkout.

### Test in two layers

Replace the shared source filename in `tests/plugin-configs.test.ts` with a per-plugin mapping. Preserve ciphertext-only checks, target mapping checks, and missing-identity protection. Keep the script/template scan focused on plaintext deployment mechanisms; do not interpret encrypted bytes as template text.

Add an isolated encrypted-template integration case with a temporary age identity and synthetic JSON generated at runtime. Exercise two distinct temporary destinations (including a home with spaces), explicitly control and verify the `.chezmoi.homeDir` test data, and assert JSON parsing, home-relative Beads output, preservation of unrelated values, mode 600, and empty target diff after apply. Use chezmoi's bundled age tooling so CI needs no new package. No real plugin configuration or identity becomes a fixture, and no example is deployed to the real plugin path.

Synthetic coverage proves the deployment mechanism, not the contents of opaque production ciphertext. During implementation, privately decrypt the actual old/new source, compare rendered JSON values with only the intended Beads change allowed, and render the actual new ciphertext for two home values in isolated destinations. Report only assertions, not full configurations. Keep personal plaintext outside the repository and clean up temporary material.

### Update the existing manual subsection

Under “Encrypted files (chezmoi + age)”, describe autonomous as an encrypted template and tell the reader to preserve its home expression when editing. Replace the shared filename in the existing flow with explicit source names. Proposed replacement HTML:

```html
<div class="flow-only">
    <strong>Flow: Edit a plugin configuration</strong><br />
    <code>chezmoi edit ~/.config/&lt;plugin&gt;/config.json</code> &rarr; commit
    <code>dot_config/autonomous/encrypted_private_config.json.tmpl.age</code> for autonomous or
    <code>dot_config/stonks/encrypted_private_config.json.age</code> for stonks &rarr;
    <code>chezmoi update</code> on every machine. Preserve the autonomous template's home
    expression. Plugin schema errors are reported by the plugin; decryption and template errors are
    reported by <code>chezmoi</code>.
</div>
```

Add a note beside the flow instructing the reader to run `chezmoi cat ~/.config/autonomous/config.json | jq -er .sources.beads.directory`, compare it with the local home plus the expected suffix, check it with `test -d`, then apply and verify an empty target diff. The note must state that a missing checkout is an unmet prerequisite. Keep the current section structure and formatting. README's generic encrypted-file guidance needs no change.

## Risks / Trade-offs

- Enabling templating interprets every template delimiter → inspect the decrypted source and verify that all unrelated JSON values survive rendering unchanged.
- A generic chezmoi command can edit the main checkout instead of this worktree → supply this worktree's absolute `--source` on migration and verification commands; isolate destination, config, state, and cache for tests.
- Git-based inventory checks can still see a deleted tracked filename before its removal is staged → include both sides of the rename in the implementation's Git state before evaluating the final inventory, without staging unrelated changes.
- CI cannot decrypt personal ciphertext → use synthetic CI coverage plus private validation of the real source during implementation; do not claim the synthetic test proves its contents.
- A correct home does not guarantee the checkout exists → run the acceptance check on every machine and leave unavailable-machine checks explicitly pending.

## Migration Plan

1. With the existing age identity available, inspect the autonomous source privately and record comparison data in memory or a private temporary directory. Do not print the complete configuration.
2. Run `chezmoi --source <this-worktree> chattr +template ~/.config/autonomous/config.json`, edit through the encrypted chezmoi flow, and verify the resulting source and target names. Preserve encryption, permissions, and all unrelated values.
3. Complete the tests and manual update. Run `bun test tests/plugin-configs.test.ts`, the full `bun test` CI suite, formatting checks, and OpenSpec validation. Review the changed-file list for plaintext artifacts.
4. On each machine, render the Beads value, verify it matches that machine's home and points to an existing directory, then apply the autonomous target with scripts excluded. Verify valid JSON, mode 600, and an empty diff for that target. Also inspect the full diff required by the issue; report unrelated pre-existing drift separately rather than changing it as part of this fix.
5. Record per-machine results without personal configuration dumps. An unavailable machine remains pending; no remote access or rollout is assumed.

Rollback restores the previous encrypted source and removes the template source as one change, then reapplies the autonomous target. This restores the former machine-specific limitation; it is only a recovery path for a failed migration.
