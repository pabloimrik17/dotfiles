## Context

See `proposal.md` — Why. The audit artifacts live in `openspec/explorations/brew-update-2026-08*.md`; `-sweep.md` supersedes the earlier four where they disagree.

Two constraints shape everything below.

**Three writers own `~/.claude/settings.json`.** chezmoi, Claude Code and Agent of Empires all write it. AoE merges correctly (it sweeps only matcher groups where every command carries its sentinel) and Claude Code edits surgically. Only chezmoi replaces the whole file, so only chezmoi loses the others' work. Pinning a source order was already attempted in commit `85992e0` — written to match AoE's serialization, `cmp`-verified — and it still drifts.

**A `modify_` script's stdout becomes the file.** chezmoi writes it verbatim. There is no "script failed, keep the old file" behaviour to fall back on, so every failure path has to be handled inside the script. This is what makes the engine choice consequential rather than cosmetic.

## Goals / Non-Goals

**Goals**

- `chezmoi apply` converges on `~/.claude/settings.json` instead of ping-ponging with the other two writers.
- No failure mode in which the file ends up empty or truncated.
- Reuse the merge pattern the repo already runs for AoE, rather than inventing a second one.

**Non-Goals**

- Managing `~/.claude.json`. It holds machine-local state (install identifiers, caches, per-project history) and is not a config file.
- Managing every key Claude Code writes. The managed set stays small and explicit; everything else is writeback.
- Adopting features rejected in the proposal. Reversing one needs its own change.

## Decisions

### D1 — The merge engine is `uv run python`, not `jq`

The proposal originally assumed `jq`. That was wrong on the facts: `jq` is not in `BREW_PACKAGES`, and the binary in use is Apple's `/usr/bin/jq`, which exists only on macOS 15+ and not at all on the Linux the README supports. In the `sync-claude` worktrunk hook jq is soft — it warns and skips. Here a missing engine truncates the file.

Chosen: the same engine `modify_private_config.toml` already uses for the AoE config — `uv run` with a small Python program, reading stdin and writing stdout. `uv` is a declared entry in `BREW_PACKAGES`, so this adds no dependency. JSON needs no third-party library, so unlike the AoE script there is no `--with` and no network on a cold cache.

Alternatives considered:

- **Add `jq` to `BREW_PACKAGES`.** Workable, but it adds a dependency to solve a problem an existing dependency already covers, and jq expresses conditional *removal* awkwardly.
- **System `python3`.** No dependency at all, but on macOS invoking `/usr/bin/python3` without Command Line Tools triggers an install prompt mid-apply. The AoE script already declined system Python for this reason; matching that choice keeps one story.
- **chezmoi template functions.** `fromJson`/`toJson` round-trip through a Go map and lose key order, which is the whole point of the exercise.

### D2 — Fail closed by passing stdin through

The script captures stdin to a temp file first, then runs the merge. Any failure — engine absent, non-zero exit, output that does not parse as JSON — results in the captured input being echoed unchanged. `modify_private_config.toml:28-31` already does exactly this for the `uv`-absent case; this extends the same shape to cover engine failure and invalid output.

The consequence to accept: a silent no-op apply is possible. That is strictly better than a truncated settings file, and the diagnostic goes to stderr where chezmoi surfaces it. This is why the `--quiet` level matters — one `--quiet` keeps errors on stderr, `-qq` would suppress the only signal.

### D3 — The managed set is a literal list, and removals are explicit

The script is a `.tmpl`, so chezmoi renders it before execution and `{{ .chezmoi.uid }}`, `{{ .chezmoi.homeDir }}` and the darwin/arm64 conditionals all still work — they are resolved into the program text.

The managed set is declared as an explicit list of key paths and values, mirroring the `MANAGED` tuple list in the AoE script so a reader recognises the shape. Host-conditional entries are emitted as *removals* on hosts where the condition is false, not merely omitted — otherwise a key added on one host would live forever in another host's live file.

### D4 — Ordering is not asserted anywhere

The merge sets values at existing key positions and appends genuinely new keys. It never reorders, never sorts, and the spec no longer claims an order. This is what makes the loop terminate: whatever order the last writer chose is preserved, so the next `chezmoi diff` is clean.

### D5 — lazygit gets its own delta config file

lazygit does not inherit the git pager, and `delta --no-gitconfig` would discard the Catppuccin theme. A small chezmoi-managed file that `[include]`s the existing `~/.config/delta/catppuccin.gitconfig` and selects the feature is passed to `delta --config`. The terminal `git diff` path is untouched.

Declared under `git.diffRenderers` only. Writing the superseded `git.pagers` triggers lazygit's migration, which rewrites the managed file — the exact hazard the `output: terminal` comment already documents.

### D6 — mole's Trash behaviour is documented, not suppressed

`MOLE_SKIP_TRASH_CLEANUP=1` works but is an undocumented environment variable, so it can disappear without notice. Exporting it also means `mole-install`'s current requirement — that `mole` appears nowhere outside the install script and docs — needs amending.

Chosen: document the hazard in the manual and recommend `mole clean --whitelist`, which is a supported surface. Revisit if the env var ever gets documented upstream.

## Risks / Trade-offs

- **A silent no-op apply if `uv` is missing** → accepted deliberately (D2). The alternative is a truncated settings file. Smoke test 7 in `-sweep.md` exercises it.
- **The managed set drifts from what Claude Code expects as it adds settings** → the set is small and explicit; unknown keys are preserved rather than fought over, so drift degrades to "not managed yet", not breakage.
- **Deleting the `__zoxide_doctor` override at the wrong line range breaks every shell start** → the range is `dot_zshrc.tmpl:397-410`, keeping 394-396. Deleting 399-407 orphans the trailing `printf` arguments and a bare `}`; the earlier 396-405 removes the `eval "$(zoxide init …)"` line itself. Verify with `zsh -n` on the rendered file before applying.
- **Removing the duplicate `bd prime` hooks makes the beads plugin load-bearing** → captured as a requirement in the `claude-hooks` delta, not left as a comment.
- **Version targets moved four times during the audit** → several findings are version-anchored. Re-run `brew outdated` immediately before implementing.
- **glow crossed a major (2.1.2 → 3.0.0)** → upstream reports no UX or config change, but the five managed keys in `glow.yml` and the non-interactive `glow -s dark` calls in the fzf previews are unverified against 3.0.0. Smoke test rather than pre-emptive edit.

## Migration Plan

Ordered; each step is independently revertible.

1. Rebase, then sync the chezmoi source directory — `~/.local/share/chezmoi` predates this worktree, so `chezmoi diff` shows nothing until it is current.
2. `brew upgrade chezmoi` alone. It is the unpinned bootstrap tool and is deliberately absent from `BREW_PACKAGES`, so it produces no repo diff. Validate with `chezmoi diff` before touching anything else — this is what confirms the age decrypt and the AoE `modify_` round-trip still hold under 2.72.0.
3. Repo edits, in any order except that the settings work lands as one edit — the hook-set update and the `modify_` conversion touch the same file.
4. `brew upgrade` the rest. Do not run `gh auth status` beforehand.
5. Upgrade AoE, start one session, let it write its hooks, then fold its own bytes back into the managed set rather than hand-transcribing the escaped `case` pattern.
6. `chezmoi apply`, then the smoke tests enumerated in `-sweep.md`.

**Rollback**: every repo edit is a git revert. The one irreversible step is the brew upgrade itself; `brew` keeps prior versions in the Cellar, so a specific formula can be rolled back with `brew switch`-style relinking if a smoke test fails.

## Open Questions

- Whether to also bring `~/.claude.json`'s `workflowSizeGuideline` into line, or leave it as the now-shadowed fallback. Deferred safely: the settings-chain value wins either way, so this changes nothing observable.
- Whether the `beads` telemetry default (surfaced by the sweep, not decided) warrants an opt-out. Independent of this change's specs and tasks.
