# Final verification addendum — uncapped sweep

Scope: what this sweep **adds or changes** relative to the three earlier rounds. Everything else stands.

---

## Verdict on the proposal as written

**The proposal is wrong in eight places.** Seven are corrections to existing bullets; one is a verdict reversal that adds work.

| Proposal line | Says | Reality | Change |
|---|---|---|---|
| `:3`, `:22`, `:80` | "28 pending upgrades" / "26 further formulae" / "Homebrew (28 formulae)" | `brew outdated` = **29 formulae + 1 cask**. Six targets have zero coverage in any artifact: `pango` 1.58.0→1.58.2, `fontconfig` 2.18.1→**2.18.3**, `openjph` 0.30.1→**0.31.0**, `llhttp` 9.4.2→9.4.3, `uv`→**0.12.2** (artifacts stop at 0.12.1), `font-jetbrains-mono-nerd-font` 3.4.0→3.5.0 | Renumber to 29+1. |
| `:13` | `modify_` engine is jq, "already a dependency of the worktrunk `sync-claude` hook" | **jq is not in `BREW_PACKAGES`** (28 entries, verified). It is Apple's `/usr/bin/jq` (macOS 15+ only; absent on the Linux the README advertises). In `sync-claude` jq is *soft* (warn-and-skip, `claude-settings-writeback/spec.md:45`). In a `modify_` script chezmoi writes stdout verbatim — **jq missing or erroring replaces `~/.claude/settings.json` with an empty file.** | Rewrite justification; add the three design gaps below. |
| `:20` | libgit2 "reachable here via `bat`/`eza`" | `brew uses --installed --recursive libgit2` = `bat eza **git-delta**`. delta is the git pager (`dot_gitconfig.tmpl:11`) and the `wt switch` picker pager. Soname `libgit2.1.9.dylib` unchanged, so no rebuild needed — but the reach statement is wrong. | Add git-delta. |
| `:26` | Delete `dot_zshrc.tmpl:399` | Both self-audit lenses independently derived the block as **397-410**. Deleting 399-407 (or the dossier's 396-405) orphans the trailing `printf` args and a bare `}` at the end of `.zshrc` → parse error on every shell start; 396-405 also deletes the `eval "$(zoxide init …)"` line. | Fix range to **397-410**, keep 394-396. Add ordering constraint. |
| `:42` | atuin syntax highlighting: "six `Meaning` variants Catppuccin does not define, so they fall back to raw ANSI. Either disable it or ship a derived theme" | **Both breaking-bucket lenses refuted this.** `Theme::from_map` (theme.rs:150-168) seeds from `DEFAULT_THEME.styles.clone()` *before* applying the TOML, so all six Syntax\* meanings are defined. Their values are ANSI palette indices (crossterm emits `38;5;{10,6,3,13,8}`), and `dot_config/ghostty/config:6` loads `catppuccin-mocha`, mapping them to Mocha Green/Teal/Yellow/Pink/Surface2 + Text. **A derived theme would hardcode RGB and be strictly less adaptive.** | Delete the bullet's remedies; **drop `atuin-catppuccin` from Modified Capabilities (`:72`)**. Informational note only. |
| `:46` | atuin `pty-proxy` — **DEFER with a gate** | `exec atuin pty-proxy` **permanently discards Ghostty's shell integration.** Ghostty injects via `ZDOTDIR`; its `.zshenv:28-33` unsets it before autoloading, and `ghostty-integration:23-31` states in-source that `exec zsh` produces a shell where it will not run. `runtime.rs:48-73` spawns the inner zsh with a plain `CommandBuilder`. Lost: OSC 7 cwd reporting (so `super+t` and splits stop inheriting the directory — both `*-inherit-working-directory` default true), plus `cursor`, `sudo` (TERMINFO), `title` — all three explicitly enabled at `dot_config/ghostty/config:54`. The gate's step (3) checks only the two features atuin **re-emits itself** (`atuin.zsh:36-69` under `ATUIN_PTY_PROXY_ACTIVE`), so it goes green while the regression lands. | **DEFER → REJECT.** Decidable now from shipped source; no measurement needed. |
| `:52` | lazygit `git.diffRenderers` — **REJECT** ("the only escape is `--no-gitconfig`, which discards the theme") | **False.** `delta --config <PATH>` exists in 0.19.2. Verified end-to-end: a 5-line file that `[include]`s `~/.config/delta/catppuccin.gitconfig` + `features = catppuccin-mocha`, called as `delta --dark --paging=never --config …`, renders unified + full 24-bit Mocha through `GIT_PAGER` under a TERM=dumb pty, with the terminal `git diff` untouched. Cost is one new managed file + a 3-line YAML block — not "edit `dot_gitconfig.tmpl` + 2-3 spec deltas". Single entry ⇒ `canCycleDiffRenderers` false ⇒ no `\|` key, no keybinding block. | **REJECT → ADOPT.** |
| `:55` | eza `--hyperlink=auto` rejected because "no `require_equals`, same value-eating shape as `--icons`" | Self-refuting: with `=` present nothing is eaten, and `:58` clears the `--icons` aliases on exactly that ground. Real blockers: installed 0.23.4 **exits 3 with empty stdout** on `--hyperlink=auto`, and the install script never runs `brew upgrade` (skips any package already on PATH) so a lagging machine loses `ls`/`ll`/`la`; separately `xterm-ghostty` has no `Hls` cap and tmux 3.7b drops the OSC 8. | Rewrite rationale; verdict unchanged. |

**Also wrong, lower stakes:** `:5`/`:14`/`:32` frame the alphabetization as "an ordering Claude Code immediately rewrites" and a "pre-existing spec violation". Measured: **zero arrays reordered** (`permissions.allow` 66 entries, identical order); 37 object-key mismatches under 6 deterministic rules. And commit `85992e0` shows the alphabetization was **deliberate** — written to match AoE's serialization, `cmp`-verified byte-identical. Three writers, not two (chezmoi, Claude Code, **AoE** — `aoe` 1.12.0 strings show `.claude/settings.json` + `agent_status_hooks`, pinned true at `modify_private_config.toml:42`). This *strengthens* the `modify_` case (the cheap fix was already tried on this file and broke) — but the proposal makes a weaker, false argument.

`:84`'s "41 remain unverified" is now stale.

---

## New must-dos

### From the four new brew deltas

**1. Hack Nerd Font is not brew-managed and is permanently stuck at 3.4.0.**
`brew list --cask` returns only `font-jetbrains-mono-nerd-font`. Hack lives in `~/Library/Fonts/HackNerdFont*.ttf` (manual, Apr 2025, `Nerd Fonts 3.4.0`). The pre-scan at `run_onchange_install-packages.sh.tmpl:392` and the install branch at `:403-406` both accept the manual copy, so `FONTS_PENDING` is permanently 0 and the script prints "Fonts: 2/2 installed" forever. This contradicts `openspec/specs/ghostty-visual-polish/spec.md:62` ("SHALL install both … casks"). `dot_config/ghostty/config:24` renders **everything** with Hack; the JetBrains lines at `:27-30` are commented out — so the batch's only cask upgrade changes nothing rendered, while the font that draws every eza icon and every `nerdFontsVersion: "3"` glyph is outside brew's reach.
→ Remove the 12 manual `~/Library/Fonts/HackNerdFont*.ttf` files (or `brew install --cask --force font-hack-nerd-font` — the `Moved` artifact refuses to clobber pre-existing targets), then install the cask. Optionally make the manual-install fallback at `:392`/`:403-406` **warn** instead of silently declaring the font done.
Payoff, not cosmetic: Nerd Fonts 3.5.0 adds **all 256 Braille codepoints U+2800–28FF** (0/256 in 3.4.0). `fc-list ':charset=2801'` today resolves only to Apple Braille / Apple Symbols — i.e. `tickrs` charts (in `BREW_PACKAGES:80`) render braille from a font not metrically matched to the 14pt Hack cell. Caveat: 3.5.0 **ships without the Devicons v2.17.0 it advertises** (0/105 of U+E8F0–E958; fixed in 3.5.1, PR #2057). Nothing here consumes those, so bump now and record the deferral so next cycle doesn't re-litigate it.

**2. `uv` target is 0.12.2, and that is the version to land — say why.**
0.12.2 bumps **no** cache buckets beyond the 0.11.30 Simple/FlatIndex change already accounted for (`sdists-v9, flat-index-v4, git-v0, interpreter-v4, simple-v24, wheels-v6, archive-v0, builds-v0, environments-v2` identical at 0.12.1 and 0.12.2; `ARCHIVE_VERSION = 0` unchanged since 0.11.26). More importantly **#20963 restores bidirectional msgpack cache compatibility** — 0.12.0/0.12.1 wrote wheel/sdist pointers older uv readers reject. Jumping 0.11.26 → 0.12.2 skips that window. `uv run` semantics, `--with` resolution and `--no-project` are untouched (run.rs is +11/−0: an `rlimit` param). The `--no-project` plan needs no rewording.
→ **Do not set `UV_RUN_RLIMIT_NOFILE` anywhere.** A bad value makes `uv run` exit 2 with empty stdout, the `cat "$infile"` fallback fires, and the managed-key merge is silently skipped while `chezmoi apply` succeeds.

**3. `fontconfig` 2.18.3 — do NOT add an `fc-cache` step.**
Cache version deliberately stays **12** and gains `cachemincompat = 9` plus `.cache-9/10/11 → .cache-12` symlinks (`src/fccache.c`, `FcDirCacheReplaceVersion`). 57 new orth files raise `NUM_LANG_SET_MAP` 9→11, guarded by a pre-existing `FC_MIN(map_size, NUM_LANG_SET_MAP)`. Zero PUA codepoints in any orth file, so language data cannot touch Nerd Font glyph fallback. ABI unchanged (`libfontconfig.1.dylib` compat 18.0.0; 236 `FcPublic` symbols both sides).
→ Record one semantic for the future: `<alias>` blocks now implicitly emit `target="scan"` genericfamily rules (`src/fcxml.c`). Inert today (`~/.config/fontconfig` does not exist), but any future fontconfig config must be written against 2.18.3 behaviour.

**4. `pango` 1.58.2 is literally empty** — NEWS says "No changes"; GitLab compare = 2 commits, 3 files (NEWS, version bump, one test fixture). `osx_current` is 5801 at both 1.58.0 and 1.58.2, matching the installed dylib → **zero dyld churn**, no relink for librsvg/chafa/mdfried.
1.58.1's renderer fix (9547ade8, over/strikethrough extents) *does* reach this repo — mdfried → chafa → librsvg → pangocairo — but only for decorated `<text>` inside an SVG in a Markdown doc. Free win.
→ **Record explicitly: no CVE and no GNOME advisory exists for pango 1.58.x.** The 680e04d2 uninitialized-offset fix is UBSan cleanup, not a security advisory. Say so, or a later round will manufacture a CVE ID.
→ Correct `dossier.md:179`: `harfbuzz 14.3.0 (Ghostty ships its own text stack)` — true but not the relevant consumer. `brew uses --installed --recursive harfbuzz` = `chafa librsvg mdfried pango`, and pango 1.58.1 raised its harfbuzz floor to 11.
→ Record the backend fact so future rounds route correctly: **macOS Homebrew pango uses the CoreText fontmap, not fontconfig** (`pangocairo-fontmap.c:80-83`; the installed dylib exports `_pango_cairo_core_text_font_map_get_type`). The `pangofc-fontmap` fixes in 1.58.1 are off-path.

### From cross-package interaction

**5. Take the full `brew upgrade` set — a curated apply breaks `chafa`.**
`jpeg-xl` 0.12.0 and `openjph` 0.31.0 are **ABI breaks**. homebrew-core `b8cb16cb` ("chafa: revision bump (for jpeg-xl 0.12.0)") and `8a2ed0ec` ("openexr: revision bump (openjph 0.31.0)") are pure relinks — `diff` of the installed chafa formula against `brew cat chafa` is empty. libjxl's soversion is `MAJOR.MINOR` while major is 0, so 0.12.0 ships `libjxl.0.12.dylib` and drops the `0.11` the installed `chafa` links.
→ This contradicts `dossier.md:179`, which files "chafa/libssh2/openexr revision-only rebuilds" under confirmed no-action. Amend.

**6. `libssh2` `1.11.1_1 → 1.11.1_4` is ten CVE backports, invisible from upstream** (upstream is still 1.11.1). `3e01435a` → revision 3 (CVE-2025-15661, 2026-7598, 2026-55199, 2026-55200, 2026-58050, 2026-58051); `52414dd1` → revision 4 (CVE-2026-66032/66033/66034/66035). Consumers are bat/eza/git-delta via libgit2 — **not** gh or lazygit (both pure Go, verified by `otool`). Sonames unchanged, no rebuild needed.
→ Add to the Security bullet at `:20`. The proposal currently claims "one security patch" while five formulae are security-relevant.

**7. `rm ~/.zcompdump-*` after the batch.**
`compinit` validates the dump by **file count + `$ZSH_VERSION` only** (`/usr/share/zsh/5.9/functions/compinit:489-490`) — content is never hashed. Eleven completion symlinks in `/usr/local/share/zsh/site-functions/` re-point without changing the count: `_aoe _atuin _bd _chezmoi _eza _gh _mole _rg _uv _uvx _wt _zoxide`. Most consequential: `_wt` (0.65→0.71 adds `wt remove --reap`, `wt config approvals list|clear --stale`) and `_uv` (0.11.26→0.12.2).
Related: **`dossier.md:179` is false** where it says "`dot_zshrc.tmpl` is never interpreted by brew zsh". Two dumps exist on disk — `.zcompdump-…-5.9` (Apple, login) and `.zcompdump-…-5.9.1` (Homebrew, mtime 5 Aug 22:18). The filename is oh-my-zsh's own construction, so `~/.zshrc` **has** been sourced under brew zsh via `dot_config/opencode/opencode.jsonc:4` `"shell": "zsh"`. Strike that dossier entry. Consequence: 5.9.2 changes the dump name, so the opencode shell gets a free rebuild while the 5.9 login shell does not — the two will disagree about all 11 tools' flags until the dumps are cleared.

**8. `manual-web` / `manual-print` spec section count is wrong, and the proposal opens a `manual-web` delta.**
`docs/manual.html` has **13** `<summary>N.` sections (13th = "Agent Sessions (Agent of Empires)"); `openspec/specs/manual-web/spec.md:14,:27,:89,:126` and `manual-print/spec.md:72` all say 12. Also `manual-web:95` pins "worktrunk 0.32, atuin 18.13, git-delta 0.19, lazygit 0.60, fd 10.4" — the repo is ~30 minors past worktrunk 0.32 and `docs/manual.html:1318` already says lazygit 0.61.
→ Both **must** be fixed in this change's `manual-web` delta, or the error is baked in.

**9. Decide the beads telemetry question.**
Both lenses on the "only in-range `bd prime` change is the Linear removal" finding refuted it. beads 1.1.x adds `internal/metrics` (HTTP 404 at v1.0.5, 200 at v1.1.2). `main.go` PersistentPreRunE calls `metrics.EnsureUserConfigDefaults()` + `metrics.Init(…, resolveMetricsEnabled(), …)` where `resolveMetricsEnabled() = !config.MetricsDisabledByUserConfig()` — **on unless opted out** — before the `skipsStoreInit` branch, so bare `bd prime` reaches it. After `ExecuteC`, `CloseAndFlush()` → `MaybeSpawnFlusher()` → detached `bd send-metrics` uploading to `https://gastownhall-eventsapi.com/mp/collect`. Both repo hooks use `"matcher": ""`, so this fires on **every SessionStart and PreCompact in every directory**. `"prime"` is in `firstRunNoticeSuppressedCommands`, so the consent banner never reaches the hook — it is silent.
→ Make it an explicit accept-or-opt-out in the proposal. Opt-out options: `bd metrics off` once (user-global, covers non-Claude invocations) or `"BD_DISABLE_METRICS": "1"` in the `env` block at `dot_claude/settings.json.tmpl:40-42` — if the latter, slot it **before** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` to preserve AoE's alphabetical serialization.

**RESOLVED — opted out, user-globally.** Neither listed option shipped. The env-var route only covers `bd` invocations that inherit a shell environment, and `bd metrics off` is a one-shot manual step that does not reproduce on a new machine. Instead `~/.config/bd/config.yaml` is now chezmoi-managed (`dot_config/bd/private_config.yaml`) with `metrics.disabled: true` — the same store `bd metrics off` writes, and the only one beads consults for consent, so a project's `.beads/config.yaml` cannot re-enable it. `metrics.endpoint` is kept alongside it because `EnsureUserConfigDefaults()` writes back any missing key on the next `bd` run; with both present it returns without writing, so the managed file does not drift. See the `claude-hooks` delta.

### Design gaps in the `modify_` conversion (must be in the design, not discovered at apply time)

Both self-audit lenses converged on the same three, independently:

- **Empty stdin.** Measured: chezmoi passes **0 bytes** when the target is absent. A naive `jq` overlay emits nothing → chezmoi writes a **zero-byte `~/.claude/settings.json`** and `apply` exits 0. Use `jq -n 'input? // {}'`, mirroring `modify_private_config.toml`'s `tomlkit.document()` branch.
- **Conditional removal.** jq's `*` cannot delete. `openspec/specs/claude-code-plugins/spec.md:159,:188` require `superwhisper@superwhisper` **absent** on non-arm64 (arm64-only hook binary → "Bad CPU type" on every stop hook). This host is Intel, so the regression would be silent. Emit templated `del(.enabledPlugins["superwhisper@superwhisper"])` / `del(.extraKnownMarketplaces.superwhisper)` in the false branch, or wholesale-assign both objects (safe — their key order already matches live).
- **jq availability.** Add `jq` to `BREW_PACKAGES`, or add a pass-through fallback (`command -v jq || cat "$infile"`) mirroring `modify_private_config.toml:24-31`.
- Two smaller: decide the trailing newline (template has none per `85992e0`; live has one; jq always emits one), and decide `hooks` ownership (AoE also merges groups carrying the `# aoe-hooks` sentinel — whole-object replace clobbers future AoE installs; deep-merge never removes stale groups).
- Widen the `claude-user-preferences` delta: ~25 requirements name `dot_claude/settings.json.tmpl` by path, and `spec.md:71`'s verification method (`chezmoi cat` parsed in source order) breaks — verified that `chezmoi cat` on a `modify_` target **executes the script and returns merged output**.

### Ordering additions to `:81`

- `brew info dolt` must read **2.2.3** pre-flight (2.2.2 `dolt gc` live-journal race #11312). `gaps.md` correction 1 says keep this, demoted not dropped; it never reached the proposal.
- **fzf must land 0.74.2, never 0.74.0/0.74.1** — those double-fire `chpwd` on ALT-C (#4879), and `__zoxide_hook` is in `chpwd_functions`, so every jump is double-counted in the frecency DB. Zero `0.74` occurrences in the proposal today.
- `brew upgrade zoxide` (≥0.10.0) must complete **before** `chezmoi apply` writes the edited `.zshrc`. zoxide is unpinned and the install script has no `brew upgrade`, so apply will not pull 0.10.0 on its own; this machine is still on 0.9.9.
- After the `json-schema` pin: `wt config update` must report nothing to migrate. Sequence it **after** `brew upgrade worktrunk` — wt 0.65.0 prints "unknown field `list.json-schema`" on every invocation until 0.66+.
- The proposal has **no `tasks.md` and no `design.md`**, yet `:42` says "decided in design".

---

## Actions that were missed

False negatives the earlier caps let through. Each is a concrete edit.

**Config-correctness**

1. **`dot_config/lazygit/config.yml:8` `showIcons: true` is dead config.** `ShowIcons` has exactly one consumer in the whole lazygit tree — the `else if` branch at `gui.go:523-529`, unreachable when `nerdFontsVersion` is non-empty. Field is declared `// Deprecated: use nerdFontsVersion instead`. Delete it and fix the comment at `:5-7` ("Both flags required" is false). Removing an inert deprecated key also removes standing exposure to a future file-rewriting migration.
2. **`docs/manual.html:1316-1319` repeats the same false claim** ("requires `showIcons: true` + `nerdFontsVersion`") and is the only prose teaching how PR badges are enabled. Also stale: since 0.64.0 an **open** PR renders its combined checks state as plain Unicode (`✓ ● ✗ ! ○`, `branches.go:344-359`), so that badge needs no nerd font; closed/merged badges and file icons still do.
3. **New `.chezmoiremove` at repo root** (does not exist today). A **0-byte** `~/Library/Application Support/lazygit/config.yml` (13 Oct 2025) exists and wins config resolution whenever `XDG_CONFIG_HOME` is unset — verified: `env -u XDG_CONFIG_HOME lazygit --print-config-dir` → the Library dir; delete the file and it falls back to `~/.config/lazygit`. In that state lazygit runs stock (no Catppuccin, no `g`→`mdview`) **and** `e` / `<alt+shift+c>` edit an unmanaged file `chezmoi status` can never see. Same shadow for glow: `env -u XDG_CONFIG_HOME glow --help` → `~/Library/Preferences/glow/glow.yml` (stale 237 B vs managed 630 B). Two lines; verified applyable against chezmoi 2.70.5 and safe under the 2.72.0 pattern tightening. Do **not** touch `state.yml`.
4. **`dot_config/worktrunk/config.toml` has no `worktree-path`**, so wt uses its default `{{ repo_path }}/../{{ repo }}.{{ branch | sanitize }}` while AoE writes `../{repo-name}-worktrees/{branch}`. Both layouts coexist on disk right now (six `~/WebstormProjects/dotfiles.feature-*` dirs alongside `dotfiles-worktrees/`). Add `worktree-path = "{{ repo_path }}/../{{ repo }}-worktrees/{{ branch | sanitize }}"` as a **top-level** key (before `[list]`). Sharpened by 0.63/0.64: lazygit's new worktree-location **menu** seeds candidates from `filepath.Dir()` of existing linked worktrees, so from the main clone the pre-selected first candidate is `~/WebstormProjects/dotfiles-worktrees/.aoe-trash/<name>` — a destination that was structurally unreachable in 0.62.2. Needs a new requirement in `openspec/specs/worktrunk-config/spec.md` (nothing covers worktree location today). Migration is a no-op for existing worktrees.
5. **`~/.config/atuin/permissions.ai.toml` is unmanaged and grants unscoped `Shell`.** Verified on disk: 0600, 32 bytes, `[permissions] allow = ["Shell"]` — a standing no-prompt grant of shell execution to the `?` agent. Not in the chezmoi source tree, not in `.chezmoiignore`, undocumented in `manual.html:702-707` and in `openspec/specs/atuin-config/spec.md:42-54`, self-widening (atuin's TUI appends to it), and overridable by any `.atuin/permissions.ai.toml` in cwd **or any parent**. Bring it under chezmoi as `dot_config/atuin/private_permissions.ai.toml` and add a spec requirement. (No live leak: `Shell` does not grant `AtuinOutput`.)
6. **`dot_gitignore_global` is missing two rules.** `~/.config/git/ignore` exists (31 B, `**/.claude/settings.local.json`) but is **permanently dead** — `dot_gitconfig.tmpl:10` sets `core.excludesFile`, which replaces the XDG default rather than stacking. Verified: `git check-ignore` exits 1 for that path while `.DS_Store` resolves to `~/.gitignore_global:4`. Fold it in, plus `.claude/.worktree-base` — which **this repo's own** `[[pre-start]] save-base` hook manufactures in every `.claude/`-bearing worktree, and which has already been hand-added to two per-repo `.gitignore`s. Then `rm ~/.config/git/ignore`.

**Behaviour / safety**

7. **`mole clean` empties `~/.Trash` by default** (`lib/clean/user.sh:114`, gated on `MOLE_SKIP_TRASH_CLEANUP`; `~/.Trash` is not in `DEFAULT_WHITELIST_PATTERNS` and no user whitelist exists). This machine deliberately provisions a **30-day** Trash window (`run_once_configure-macos-defaults.sh.tmpl:57` `FXRemoveOldTrashItems`, spec'd at `macos-defaults/spec.md:30`), and mole's own "safe" deletes (`mole analyze`, `mo remove`) land *in* the Trash. Export `MOLE_SKIP_TRASH_CLEANUP=1` in `dot_zshrc.tmpl` (needs a `mole-install` spec amendment — its scenario currently forbids `mole` appearing outside the install script and docs) **or**, if the undocumented env var is judged too fragile, document the hazard and recommend `mole clean --whitelist`. Either way the manual note is warranted.

**Documentation**

8. **`openspec/specs/television-shell-integration/spec.md:13-16` asserts the opposite of shipped behaviour.** Scenario: "WHEN the user opens a new shell and presses Ctrl+T THEN tv smart autocomplete launches (**not** fzf's file search)". At a fresh prompt `LBUFFER` is empty, so `_tv_ctrl_t_wrapper` (`dot_zshrc.tmpl:163-170`) deliberately calls `fzf-file-widget`. Spec and contradicting wrapper landed in the same commit (4bf3be5) and it has never been corrected — an implementer running verify would "fix" the wrapper and reintroduce the Tab-completion breakage the `:161-162` comment exists to prevent. Restate as two scenarios. `docs/manual.html:671-672` and `dot_config/atuin/TERMINAL.md:18` each document only one branch (opposite branches); TERMINAL.md also omits `?` and `Alt+C` despite claiming to list reserved keys.
9. **`docs/manual.html` documents four shell functions that no longer exist**: `frg` (`:756`, plus a prescriptive Flow box at `:767-771`), `fkill` (`:760`), `fglog` (`:1325`, `:1397`), `fgco` (`:1329`). All four were deleted by the archived television migration; a repo-wide grep finds zero definitions. `frg pattern` is printed as an instruction and yields `command not found`. Replace with `tv rg-edit` / `tv procs` / `tv git-log` / `tv git-branch`.
10. **`eza --code` has no documentation anywhere.** The alias was correctly rejected, but its rationale explicitly deferred the docs clause to `claims.md` item 4 — whose manual note is scoped to `=`-syntax and marked "optional". Net: neither candidate documents it. With no tokei/scc/cloc installed (`command -v` returns nothing), `eza --code` is the only LOC counter on the machine after this bump. Add a small table + note to `manual.html` (after the eza alias table, before the bat heading), carrying the two hard-won facts: modes need the `=` form, and extension-based detection makes every `.tmpl` invisible here.
11. **`mole status` row** — already in the proposal at `:31`, but note it exists on the *installed* 1.44.1 too and survives the bump (homebrew-core builds `%w[analyze status]` at V1.49.2); it is a doc gap independent of the upgrade.
12. **`run_onchange_install-packages.sh.tmpl:9`** says "chezmoi captures stdout/stderr of scripts by default". False for `run_` scripts (chezmoi wires their stdio straight to its own); capture applies only to `modify_` scripts via `LogCmdOutput`. It is the premise a future reader would build on when touching the `/dev/tty` fallback at `:56`. Recorded in `gaps.md` item 6 but never fixed in the file.
13. **Non-macOS install instructions never list `zsh`.** `.chezmoiignore.tmpl` deploys `dot_zshrc.tmpl` and `opencode.jsonc` (`"shell": "zsh"`) on Linux, and the manual block at `:1186-1214` lists oh-my-zsh (`:1208`) and three zsh plugins but not zsh itself. Verified against the exact installer the script invokes at `:445`: ohmyzsh `tools/install.sh:535-536` aborts with "Zsh is not installed." Insert a `zsh` line before `:1208` (precedent: `zsh-completions/spec.md:26-27` already requires this shape).
14. **fzf 0.74.0's new default bindings `alt-left`/`alt-right`** are absent from the manual's fzf keybindings table (`:661-683`, currently 3 rows). Low priority, docs-only.
15. **`openspec/changes/brew-upgrade-and-claude-settings/proposal.md`** — the coupling created by `:41`/`:69` (deleting the hand-written `bd prime` hooks makes `beads@beads-marketplace` load-bearing) currently exists only in `dossier.md:73`, a throwaway artifact. Put it in the `claude-hooks` delta as a requirement.

---

## Overturned

**Reversed by this sweep:**

- **atuin syntax highlighting** — BREAKING → **informational no-action** (both lenses; see verdict table). Drop `atuin-catppuccin` from Modified Capabilities.
- **atuin `pty-proxy`** — DEFER → **REJECT**.
- **lazygit `git.diffRenderers`** — REJECT → **ADOPT** (via `delta --config`).
- **"chafa / openexr revision-only rebuilds = no-action"** (`dossier.md:179`) → they are the required relinks for two ABI breaks.
- **"`dot_zshrc.tmpl` never interpreted by brew zsh"** (`dossier.md:179`) → false; two zcompdumps prove otherwise.
- **"harfbuzz — Ghostty ships its own text stack"** (`dossier.md:179`) → answers the wrong consumer; four real dependents.
- **"only in-range `bd prime` change is the Linear auto-pull removal"** → misses default-on telemetry with a detached network uploader, and a new `primeDivergenceReminder("")` output line (inert here — neither AGENTS.md nor CLAUDE.md carries the bd marker).
- **beads `--reap` risk #1 in the adoption doc** ("detached `install-deps` is a reap candidate, the strongest argument against") → wrong. `spawn_detached_unix` uses only `process_group(0)`, never `setsid`; the controlling terminal is inherited, so interactive `wt switch` hooks are **spared**. Only agent-driven invocations (Claude Code Bash shells have no tty) produce reapable hooks. Verdict unchanged.
- **exploration doc "gh: three GHSAs / inflated severities"** → already corrected in `brew-update-2026-08.md:37-38,:189,:194-197`. The stale text survives only in `dossier.md:124`; mark it resolved so it stops regenerating.
- **`--icons`, `gh api`, `gh pr diff`, dolt, `dolt init`/clone marker, beads migration timeout, beads remote-migrate gate** — all filed as BREAKING, all downgraded to informational or no-op against this repo. Two of these had **split lenses**; resolving them: no `.beads` directory exists anywhere on this machine (verified by two independent searches with passing controls), so no pre-upgrade beads ritual is needed and `BEADS_PRIME_TIMEOUT` would be dead config. Keep the runbook as a **conditional** note, and fix two errors in it: the schema apply is **`bd migrate schema`** (bare `bd migrate` only refreshes metadata), and `bd export --all` is explicitly **not a backup** upstream (no Dolt branches, history, working set, non-issue tables) — use `bd backup init|sync`.
- **`gh pr diff` retry advice** — the rationale "agent output is not a terminal, so it is safe" is false; the bytes are re-rendered into the user's terminal and enter model context, which is exactly what GHSA-3m3g-3wcr-px46 addresses. Prefer `--name-only`, `| cat -v`, or `git diff <base>...HEAD` (the gh-dash bindings already land the agent in a `wt switch pr:N` worktree). Also narrow the scope: only the `code-review@claude-plugins-official` path is exposed — `plannotator` already falls back to the paginated files API on any non-zero `gh pr diff` exit.
- **`gh api` ESC refusal is not TTY-gated** for textual content (`CopyGuardedContent` passes `isTTY` only to the binary branch), so piped agent calls fail too — but `--jq`, `--template` and `--silent` all bypass the guard. Cite `opencode.jsonc:**132**` (not :131) if cited at all — a permission rule does not gate gh's output guard.

**Self-audit results (the six items already written into the proposal):**

| Item | Outcome |
|---|---|
| `zoxide-delete` | Confirmed 2-0. **Line range wrong** (397-410) + ordering constraint missing. |
| `worktrunk-schema` | Confirmed 2-0. Rationale needs one clause: **any** explicit value closes the migration loop (`adopt_json_schema_doc` bails on a present key of any value); `= 2` is a deliberate opt-in, not forced. Blast radius zero — no consumer of `wt list --format=json` exists here. |
| `uv-no-project` | Confirmed 2-0, and **understated**. Reproduced end-to-end on the *installed* 0.11.26: from a project with an unresolvable dep, `uv run` exits 1, the `cat "$infile"` fallback fires, the managed aoe keys are silently skipped and chezmoi exits 0; from a healthy project, uv writes `.venv` and `uv.lock` into that unrelated repo. Both vanish with `--no-project`. Say explicitly this is **pre-existing, not caused by 0.12.x**, so a future reader doesn't revert it. Also fix the stale `:101` → `:106` in `brew-update-2026-08.md:281` and `dossier.md:26`, and the doc comment at line 8 of the script. |
| `atuin-ai-init` | **Split 1-1.** Resolution: keep the deletion (byte-identity verified on the installed binary, md5-equal), but the proposal's unqualified "already emits" is an over-read — emission is gated on `!disable_ai && settings.ai.enabled.unwrap_or(true)` and `ATUIN_NOBIND` unset. Both hold here. Reword `:33`, and **explicitly scope out** removing `[ai] enabled = true` (`dot_config/atuin/config.toml:9-10`) — post-deletion it is the only guard on the `?` widget, so `atuin-config`'s "only non-default values" invariant must carry a stated exception. |
| `beads-org` | Confirmed 2-0. The orphan/duplicate worry is **disproved**: Claude Code keys the registry by marketplace **name** read from the repo's own manifest (`beads-marketplace`, unchanged upstream), so the repoint is an in-place source overwrite. Soften the "stops updates silently" rationale — the redirect works today (`lastUpdated 2026-08-05`). Add a transition note: `marketplace_installed()` (`:885-892`) greps the raw repo string, so the first apply re-attempts `claude plugin marketplace add`, which has no update mode; run `claude plugin marketplace remove beads-marketplace` once, or accept the noise (`run_claude_step` returns 0 unconditionally). Non-goal: do **not** rewrite the Go module path — upstream keeps `module github.com/steveyegge/beads` on purpose. |
| `settings-modify` | **Split 1-1**, but both lenses agree the conversion is right and name the same three design gaps. Verdict stands; justification and design must change (see above). |

---

## Confirmed

Survived without change; do not re-argue.

- The `modify_` conversion itself; `modify_` + `.tmpl` coexist and `{{ .chezmoi.uid }}` expands (live-tested).
- `json-schema = 2`, `--no-project`, the zoxide deletion, the beads repoint, the aoe 1.14.0 hook sync, `[cockpit]`→`[acp]`, the mole manual corrections.
- `gui.shrinkSidePanelsToContent: true` ADOPT and `gui.sidePanels` REJECT — with one rationale fix: status (3) and unfocused stash (3) are **already** hard-pinned in today's default layout, so shrink reclaims nothing from them. The real win is files/branches capping at content and handing surplus to commits (upstream's own golden test: 8/8/8 → 5/4/14).
- Rejections that held under attack: `editConfig` hardening, `--loc`/`--code` aliases, `wt remove --reap` + approvals, declaring `zsh` in `BREW_PACKAGES` (the `command -v` gate makes it a provable no-op on macOS forever; measured functional delta between the two zsh builds is `$ZSH_VERSION` only), `git.pagers`, declaring `dolt`, `RIPGREP_CONFIG_PATH`, `tmux.socket_name`.
- fzf: `shell/completion.zsh` byte-identical 0.73.1↔0.74.2; the tv Ctrl+T wrapper is safe; the ALT-C symlink change affects only relative candidates. **New**: 0.74.2's `cd -q` also silences a double-fire of **direnv**, which is the other `chpwd_functions` entry.
- eza 0.23.5 icon codepoints U+E8EB / U+EEFC verified present in the **on-disk** Hack font, not just an upstream cmap.
- `dot_config/starship.toml`'s 88 PUA glyphs are all unaffected by Nerd Fonts 3.5.0 (0 removed, 0 renamed).
- chezmoi 2.72.0 hardening lands inert (creation-path only; `~/.config/chezmoi` stays 0755, secrets already 0600); `run_once_configure-macos-defaults.sh.tmpl` will not re-run.
- gh 2.97.0 does not break any extension/skill call site; gh-dash's `pager: diff: delta` runs on a real TTY and is unaffected.
- `dot_config/atuin/TERMINAL.md` — `user_context/walker.rs` byte-identical 18.16.1↔18.19.0.
- The `:82` prerequisite is load-bearing and correct: archiving `update-brew-deps` **first** also resolves the worktrunk-config drift (aliases 3→4, `[list].summary`/`full` → `columns`) and the AoE uid-scoped status path — both already carried by its unarchived deltas. **Do not write a second delta for those.** Its `claude-hooks` delta still pins the 1.12 event set, which this change must supersede.
- Also uncovered by any pending change and worth folding in while the files are open: five specs still name `run_once_install-packages.sh.tmpl` (`claude-hooks:11`, `claude-code-plugins:30`, `skills-global-install:11`, `git-config:165`, `macos-defaults:11`); `claude-code-plugins:64` claims an Expo consolidation that never reached `CC_PLUGINS` (`:861-863` still lists all three deprecated entries).

---

## Still open after an uncapped sweep

**Genuine gaps**

1. **`harfbuzz` 14.2.1→14.3.0 contents never read.** Four dependents (`chafa librsvg mdfried pango`); the only recorded rationale is wrong. Highest-value remaining read.
2. **`llhttp` 9.4.2→9.4.3 contents never read.** Feeds libgit2 → git-delta.
3. **`openjph` 0.31.0 contents never read** — established as an ABI break, but its own changes unaudited.
4. **`ca-certificates`, `glib`, `dav1d`, `libtiff`, `jpeg-xl` contents** are dismissed via the catch-all at `dossier.md:179`; three of the five are security-relevant.
5. **`dot_config/private_agent-of-empires/themes/catppuccin-mocha.toml`** (37 hand-mapped theme tokens) was never checked against aoe 1.13/1.14 for added/renamed theme roles — the exact failure mode the atuin-syntax finding was about, applied to a different file, never applied.
6. **beads runtime mode** (embedded vendored dolt vs `dolt sql-server` subprocess) remains undetermined (`gaps.md:59`). Non-blocking — every beads conclusion holds either way.
7. **Contested, unresolved:** whether beads 1.1.2 bottles carry `runtime_dependencies: {dolt, version "2.2.2"}` in `sh.brew.tab` (enforced at `formula_installer.rb:787`). One finding says the formula has no dolt bound; `gaps.md:53` records the opposite. Both cannot be right; the `brew info dolt` ≥ 2.2.3 pre-flight covers either way.
8. **`fontconfig` NEWS mentions a `tl` orth update that does not appear in the 2.18.1→2.18.3 tree diff.** Unconfirmed; immaterial (no PUA).
9. **The beads telemetry decision** (must-do 9) is surfaced, not decided.
10. No `tasks.md`, no `design.md`; three ordering steps and the "decided in design" pointer at `:42` have no home.

**Post-upgrade smoke tests** (none of these is a gap; all require the target versions installed)

1. `mdview` on a Markdown file containing an image, once in bare Ghostty and once in tmux — the *only* exercise of the rebuilt pango/fontconfig/harfbuzz/libtiff/jpeg-xl/openjph/dav1d/openexr/chafa stack. `dot_local/bin/executable_mdview:51,:56` is the sole launcher of `mdfried`, which is the sole leaf consumer of all ten. Watch for `fc-cache` chatter on first run.
2. `chezmoi apply --dry-run --verbose` under 2.72.0 must **not** list `run_once_configure-macos-defaults.sh.tmpl` as pending (script-state keys were verified for `run_onchange_` only).
3. Launch lazygit 0.64.0 once, then `chezmoi status` — `~/.config/lazygit/config.yml` must be unmodified. The "no migration fires" conclusion is source-verified, never executed.
4. `git diff` + the `wt switch` picker after libgit2 1.9.6 / llhttp 9.4.3 — confirms git-delta still links.
5. Start aoe 1.14.0 once; confirm every theme role in `catppuccin-mocha.toml` still renders and aoe does not rewrite the file.
6. A `cd` in a fresh Claude Code Bash call must produce clean stderr (zoxide 0.10.0 + override deleted), and a `cd` in an interactive shell likewise.
7. If the `modify_` script ships: run it once with `jq` off PATH and confirm the live `~/.claude/settings.json` survives; and once with the target absent, confirming a non-empty file.
8. After the Hack cask lands: `fc-list ':charset=2801' family | grep -i hack` must list it, then eyeball a `tickrs` chart.
9. `env -u XDG_CONFIG_HOME lazygit --print-config-dir` must print `/Users/etherless/.config/lazygit` after `.chezmoiremove` applies.
10. `rm ~/.zcompdump-*`, open a fresh shell, and confirm `wt remove --<TAB>` offers `--reap`.