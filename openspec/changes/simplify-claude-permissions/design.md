## Context

`dot_claude/settings.json.tmpl` defines the global Claude Code permission set for every repo on this machine; its `permissions` block is spec-governed by `claude-user-preferences`. Two forces have made it noisy and slightly unsafe:

1. Claude Code auto-allows a fixed set of read-only commands (`READONLY_COMMANDS`, `GIT_READ_ONLY_COMMANDS`, etc.). Allow rules duplicating that set never change behavior.
2. Convenience rules (`bun run *`, `pnpm run *`, `gh api *`) grant more than intended — arbitrary script execution and silent GitHub writes.

The per-repo `.claude/settings.local.json` (gitignored) is a separate, uncurated accumulation of "always allow" clicks and is where prompts actually pile up.

## Goals / Non-Goals

**Goals:**

- Start every session in auto mode by default to remove per-action prompts while keeping classifier oversight.
- Remove allow rules that are redundant with Claude Code's built-in read-only detection.
- Tighten the two arbitrary-execution / silent-mutation holes the user opted to close (`bun|pnpm run *`, `gh api *`).
- Add the read-only commands used constantly but still prompting.
- Curate this repo's local allowlist down to genuinely-local grants.

**Non-Goals:**

- Tightening broad `gh pr/issue/repo *` to read-only verbs (user chose to keep the existing posture).
- Changing the `deny` block, hooks, plugins, or non-permission settings.
- Promoting WebFetch doc domains from local to global (deferred — see Open Questions).
- Curating local allowlists in other repos.
- Enabling auto mode in project/local scopes (Claude Code ignores it there).

## Decisions

**1. Remove redundant read-only rules rather than keep them as documentation.**
The filesystem group (`ls`, `cat`, … `stat`) and git read group (`git status/diff/log/…`) are covered by Claude Code's built-in read-only auto-allow, so they never prompt. _Alternative — keep as version-independent insurance:_ rejected; the user prioritized simplification and the built-in set is stable. If a future Claude Code version regresses, rules can be re-added.

**2. Narrow `bun run *` / `pnpm run *` to named scripts.**
Wildcard `run` = arbitrary code execution, the largest gap versus "safe defaults". Allow only `typecheck`, `lint`, `build`, `test` for each — the common CI-shaped loop. _Alternative — keep broad (zero friction):_ rejected per scope decision. `bun test *` / `pnpm test *` and `--frozen-lockfile` installs stay.

**3. Drop `gh api *`.**
`gh api` GET is auto-allowed by Claude Code, so reads stay frictionless; removing the rule means only `gh api -X POST|DELETE` writes fall through to the default ask. _Alternative — keep:_ rejected (silent mutation of any GitHub resource).

**4. Local prune is operational, not spec-governed.**
`.claude/settings.local.json` is gitignored and machine-local, so it carries no spec requirement and is not part of the committed diff. The durable fix is good global defaults that slow future accumulation; the prune is a one-time cleanup.

**5. Preserve structure.** The user-preference key order, the chezmoi Go-template guards (`{{ if ... darwin/arm64 }}`), and the `deny` array are untouched. Output must remain valid JSON after templating.

**6. Enable `auto` mode by default (`permissions.defaultMode: "auto"`).** Auto mode runs actions without per-action prompts and sends anything not matched by an allow/deny rule to Claude Code's safety classifier — the biggest prompt reducer available. It is user-scope-only (Claude Code ≥ 2.1.142 ignores it in project/local settings), so the template this change already edits is the only place it works. It reinforces the tightening above: allow rules bypass the classifier, so dropping the `bun|pnpm run *` wildcards and `gh api *` sends those to the classifier instead of blanket-approving them. _Alternatives:_ `acceptEdits` (only edits/fs auto-approved — many prompts remain) and leaving `default` (no reduction) were rejected.

### Bash allow section: before → after

| Group           | Before                                                           | After                                                                                        |
| --------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| filesystem read | 14 rules                                                         | **removed** (auto-allowed)                                                                   |
| git read        | 10 rules                                                         | **removed** (auto-allowed)                                                                   |
| git write       | `add/fetch/push *`                                               | unchanged                                                                                    |
| build/test      | `bun run *`, `pnpm run *`, `bun test *`, `pnpm test *`, installs | `bun run {typecheck,lint,build,test}`, `pnpm run {…}`, `bun test *`, `pnpm test *`, installs |
| version         | `node/bun/npm --version`                                         | `bun --version`, `npm --version`                                                             |
| chezmoi         | cat/diff/managed/source-path/status/data                         | + `execute-template *`                                                                       |
| openspec        | list/status/instructions/bunx                                    | + `validate *`, `verify *`                                                                   |
| worktrunk       | `wt --help *`                                                    | `wt --help`                                                                                  |
| github          | `gh api *`, issue/pr/repo                                        | − `gh api *`, + `gh search *`                                                                |

## Risks / Trade-offs

- **`git ls-tree` may not be in Claude Code's read-only set** → verify during apply (task 2.3); re-add `Bash(git ls-tree *)` and amend the spec if it prompts. (Unobserved in 80 recent transcripts, so impact is near-zero.)
- **Narrowing `run` adds prompts** for `dev`/`start`/other scripts → accepted; add specific names later if friction appears.
- **Reliance on Claude Code's built-in read-only set** → if a future version narrows it, removed rules could start prompting; mitigation is re-adding explicit rules.
- **`gh api` GET auto-allow assumption** → verify a GET still runs without prompt (task 2.5).
- **Auto mode is gated on model / provider / version** (Claude Code ≥ 2.1.83, Opus/Sonnet ≥ 4.6, Anthropic API — not Bedrock/Vertex/Foundry) → on an unsupported combo the setting is inert and sessions fall back to default mode. No breakage, just no effect; this machine (CC 2.1.156) qualifies.
- **Auto mode executes much more without asking** → mitigated by the classifier, the untouched `deny` block, the narrowed allow rules, and protected paths (`.git`, `.claude`, `.env`) always routing to the classifier. Shift+Tab switches to default/plan when closer control is wanted.

## Migration Plan

1. Edit `dot_claude/settings.json.tmpl`; preview with `chezmoi diff`.
2. Apply (or rely on the normal chezmoi apply flow) and run the verification tasks.
3. Prune `.claude/settings.local.json` (non-destructive — entries re-appear on demand).
4. **Rollback:** `git revert` the template change; the local prune needs no rollback.

## Open Questions

- Promote a few stable WebFetch doc domains (`linear.app`, `ghostty.org`, `developer.atlassian.com`, …) from the local file to the global template? Out of scope here; would modify the WebFetch domain requirement in a follow-up.
