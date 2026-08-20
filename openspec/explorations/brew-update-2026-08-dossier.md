REPO = `/Users/etherless/WebstormProjects/dotfiles-worktrees/brew-update`

---

## Must do before/with the upgrade

**1. aoe 1.12.0 → 1.14.0 changed the Claude hook set — `chezmoi apply` will downgrade live hooks.**
Attribution: 1.13.1 (PR #2909 widened the two `Notification` matchers; PR #2937 added the `PostToolUse`/`AskUserQuestion` pair and `PreToolUse waiting_tools`); unchanged in 1.13.2/1.14.0. Byte-verified against `src/agents.rs` `CLAUDE_HOOK_EVENTS` at every tag. The installer prunes every entry matching `is_aoe_hook_command` and rewrites the current event set on each install (`src/migrations/v021…`-style rewrite path in `v015_rewrite_hook_strings.rs`), so a stale template loses to aoe and vice versa.

Four edits to `$REPO/dot_claude/settings.json.tmpl`:
- L143 → `"matcher": "permission_prompt|elicitation_dialog|agent_needs_input"`
- L152 → `"matcher": "idle_prompt|agent_completed"`
- L170 `PreToolUse` command: replace `printf running > \"$D/status\" 2>/dev/null; ` with `IN=$(cat 2>/dev/null); S=running; case \"$IN\" in *\\\"tool_name\\\":\\\"AskUserQuestion\\\"*) S=waiting ;; esac; printf %s \"$S\" > \"$D/status\" 2>/dev/null; ` — leave the guard prologue and trailing `exit 0 # aoe-hooks` untouched.
- Add a `"PostToolUse"` key, `"matcher": "AskUserQuestion"`, one hook whose command is byte-identical to the *current* L170 command (plain `printf running` form). Insert between `Notification` (ends L154) and `PreCompact` (L155) — aoe serializes with sorted keys.

Do not hand-transcribe: upgrade, start one aoe session, let aoe rewrite `~/.claude/settings.json`, then `chezmoi diff` and fold aoe's own bytes back — re-applying `B=/tmp/aoe-hooks-{{ .chezmoi.uid }}` (aoe writes the literal `-501`).

Spec delta required: `$REPO/openspec/specs/claude-hooks/spec.md` L63/L68/L73 pin the old hook set. Evolve via MODIFIED requirement in the new change; archived specs stay frozen. Same file also has two pre-existing staleness bugs to fix in the same delta: it specifies the status path as `/tmp/aoe-hooks/$AOE_INSTANCE_ID/status` (template writes `/tmp/aoe-hooks-{{ .chezmoi.uid }}/…`), and L11 references `run_once_install-packages.sh.tmpl`, which is now `run_onchange_`.

Note: "keep `chezmoi diff` quiet" is not achievable — `~/.claude/settings.json` was already reordered by Claude Code (`env`/`attribution` first) and `chezmoi status` already reports `MM .claude/settings.json`. Sorted placement is still correct for hygiene.

**2. worktrunk 0.65.0 → 0.71.0 config drift — pin `json-schema`.**
`[list] json-schema` introduced 0.66.0; 0.67.0 made `wt config update` pin it when unset; 0.68.0 made it write `= 2`. Neither `$REPO/dot_config/worktrunk/config.toml` nor live `~/.config/worktrunk/config.toml` defines it. Add `json-schema = 2` under `[list]` in the chezmoi source to preserve the "`wt config update` finds nothing to migrate" invariant.

**3. uv 0.11.26 → 0.12.1 — make the aoe config merge hermetic.**
`$REPO/dot_config/private_agent-of-empires/modify_private_config.toml:101` runs `uv run --quiet --with tomlkit python "$prog"`. 0.12.0's "discover projects relative to the script passed to `uv run`" does *not* apply (`python` is the command), but project discovery is still cwd-relative — `chezmoi apply` from inside any Python project resolves that project's environment. 0.12.0 also rejects invalid `--project`. Add `--no-project` (flag confirmed present in the installed uv).

**4. atuin 18.18.0 turns on command syntax highlighting by default with 6 theme keys Catppuccin does not define.** *(UNVERIFIED — high confidence, single pass)*
`Ui::default_syntax_highlight() -> true`; new `Meaning` variants `SyntaxCommand/Flag/String/Variable/Operator/Comment` default to raw ANSI (`Color::Green`, `DarkCyan`, `DarkYellow`, `Magenta`, default fg, `DarkGrey`). Only `SyntaxComment` has a `MEANING_FALLBACKS` entry. `catppuccin-mocha-blue.toml` defines only AlertInfo/Warn/Error, Annotation, Base, Guidance, Important, Title.
Pick one in `$REPO/dot_config/atuin/config.toml`:
- (a) `[ui]\nsyntax_highlight = false` — keeps current look, one line; or
- (b) ship a chezmoi-managed derived theme `dot_config/atuin/themes/…-syntax.toml` with `parent = "catppuccin-mocha-blue"` + 6 Catppuccin values, repoint `[theme] name`.
Colors cannot be inlined under `[theme]` (only `name`/`debug`/`max_depth`). Do **not** hand-edit the fetched theme file — it is re-fetched by `run_onchange_install-packages.sh.tmpl:299-301` and `dot_zshrc.tmpl:339-340`. Contradicts `$REPO/openspec/specs/atuin-catppuccin/spec.md` ("renders with Catppuccin Mocha colors") → spec delta either way.

**5. aoe 1.13.0 moved `[app_state]` out of `config.toml` into a sibling `state.toml`** (migration `v021_split_app_state_to_state_toml.rs`, PR #2821).
- `$REPO/dot_config/private_agent-of-empires/modify_private_config.toml` L4-6: narrow the runtime-writeback list to `[web]`/`[logging]` + default-expanded tables. Note `[app_state]` now lives in `state.toml` (unmanaged, unpruned — no `exact_` prefix anywhere in the repo, `.chezmoiignore` covers only the sounds dir, so no `.chezmoiignore` entry needed).
- Drop `[cockpit]` as a **separate pre-existing doc bug**: renamed to `[acp]` by migration `v012_acp_rename` in aoe **1.11.0**, before the 1.12.0 baseline. Live config already has `[acp]`, `.schema_version = 18`, `acp-workers/`. Do not attribute it to 1.13.1/PR #3027 (that PR only retired "cockpit" wording in comments/docs/tracing and explicitly scoped out migrations and config tables).
- Same stale list is normative in two live spec files: `$REPO/openspec/specs/agent-manager/spec.md:219,223` and `$REPO/openspec/changes/update-brew-deps/specs/agent-manager/spec.md:118,122` (the in-flight delta — it will sync into the main spec and re-introduce the stale text; L118 already self-contradicts by listing `[acp]` as MANAGED while listing `[cockpit]` as writeback). Fix via a MODIFIED requirement in the new change's delta, not by hand-editing the main spec. Leave `openspec/changes/archive/2026-07-01-improve-aoe-config/**` frozen.
- No config.toml diff expected from v021: `modify_` output is derived from the live file on stdin, so the reserialization round-trips byte-for-byte (verified by running the script twice, once with an app_state-stripped copy).

**6. lazygit 0.64.0 renamed `git.pagers` → `git.diffRenderers`.** No `git:` section in `$REPO/dot_config/lazygit/config.yml`, so nothing migrates today. But `$REPO/openspec/explorations/brew-update-2026-08.md:162` recommends adopting `git.pagers` to wire delta into lazygit — **that recommendation is now actively harmful**: writing `git.pagers` is exactly what `migratePagersToDiffRenderers` matches, and lazygit would rewrite the chezmoi-managed file (the hazard L40-42 of that file already documents for `subprocess`). Same for the older `git.paging` object form (`migratePaging` still runs first). If delta is ever wired in, write only the new shape, and only after 0.64.0 is installed:
```yaml
git:
  diffRenderers:
    - command: delta --dark --paging=never
```
(`stdinFilter` is the default type; `colorArg: always` is the default; `validateDiffRenderers` hard-errors on unknown `type`.) Footnote: `[delta] navigate = true` in `$REPO/dot_gitconfig.tmpl` is a no-op inside lazygit.

**7. beads 1.0.5 → 1.1.2: do not let the first post-upgrade store open be the SessionStart hook.** *(UNVERIFIED)*
Schema v49 → v53 (adds migrations 0050-0053). `bd prime` opens the store under a hard 10s timeout (`cmd/bd/prime.go:34 primeStoreTimeoutDefault`), and `bd prime` suppresses all errors by design (`return "" // Silently skip`), so a failed/gated migration surfaces as silently-missing memories, not an error. Hooks at `$REPO/dot_claude/settings.json.tmpl:159` (PreCompact) and `:180` (SessionStart) are bare `bd prime`. Remote-migrate gate is on by default in 1.1.0. See Operational steps for the recipe. Optional: add `"BEADS_PRIME_TIMEOUT": "60s"` to the `env` block at `dot_claude/settings.json.tmpl:40-42` for rigs >10K issues.

**8. gh 2.97.0: `gh pr diff` and `gh api` now hard-error on piped stdout when the body contains any `0x1B` byte.** *(UNVERIFIED)*
`ContainsEscapeSequence` = `bytes.IndexByte(b, 0x1B) >= 0` — a single ESC anywhere. `$REPO/dot_claude/settings.json.tmpl:270` (`Bash(gh pr *)`) + `:299` (`defaultMode: auto`) means review agents run it auto-approved through a pipe. No config edit is required to upgrade; the retry is `--allow-escape-sequences`. Optionally note this in `$REPO/dot_claude/commands/review-team.md` so agents retry instead of aborting. **Do not** add a blanket alias that always passes the flag — that re-opens the injection for genuine terminal use. `gh api` JSON responses are unaffected (`!isJSON` guard); `$REPO/dot_config/opencode/opencode.jsonc:131` grants `gh api *`.

**9. atuin 18.18.0 records comment-only lines into history.** *(UNVERIFIED, medium)*
`atuin.zsh` now does `setopt interactive_comments` (no-op here — oh-my-zsh sourced first at `dot_zshrc.tmpl:82`) plus a new `zshaddhistory` hook that records single-line `#*` buffers. Bare `# note to self` lines will start appearing in Ctrl+R. No config key disables it. No action — flagged so it is not mistaken for a bug.

---

## Obsolete workarounds now removable

**1. Delete the `__zoxide_doctor` override — `$REPO/dot_zshrc.tmpl:396-405`.** *(pre-verified)*
zoxide 0.10.0: "Zsh: skip doctor diagnostics in non-interactive shells." Upstream `templates/zsh.txt` at v0.10.0 adds `[[ $- == *i* ]] || return 0` as the second guard in `__zoxide_doctor` — strictly more general than the repo's `[[ -z "${CLAUDECODE:-}" ]] || return 0`. Keep `eval "$(zoxide init zsh --cmd cd)"`. (0.10.0 also changed `zoxide import` from `--from` to a subcommand; repo does not use it.)
**Same change must update the standing memory note `feedback_zoxide_cmd_cd.md`**, which instructs future sessions to patch the override back in — otherwise it gets reintroduced.

**2. Fix the stale `[app_state]`/`[cockpit]` runtime-writeback comment** — see Must-do #5. Comment-only in the script; normative in two spec files.

**3. Drop `eval "$(atuin ai init zsh)"` at `$REPO/dot_zshrc.tmpl:175`.** *(UNVERIFIED, medium)*
`atuin init zsh` already emits the AI widget when `enable_ai` resolves true: `enable_ai: !self.disable_ai && settings.ai.enabled.unwrap_or(true)`, and `atuin ai init zsh` prints the identical `generate_zsh_integration()` string. Line 175 redefines the same widget and rebinds `?`. One fewer subprocess per shell start. Requires a spec delta against `$REPO/openspec/specs/atuin-config/spec.md:56-63` (which mandates line 175). Same evidence shows `[ai] enabled = true` in `dot_config/atuin/config.toml:9-10` is a compiled default, violating that file's own "only non-default values" invariant (`spec.md:21`) — remove it too unless the intent is to pin against a future default flip. Do not delete L175 without confirming `[ai] enabled` is not `false` anywhere.

**4. Delete the two hand-written `bd prime` hook blocks** at `$REPO/dot_claude/settings.json.tmpl:155-165` and `:176-185`. *(UNVERIFIED, high confidence)*
`plugins/beads/.claude-plugin/plugin.json` declares its own identical `SessionStart` and `PreCompact` `bd prime` hooks, and `cmd/bd/setup/claude.go` skips writing project hooks precisely because "the plugin declares its own SessionStart hooks in plugin.json, so project-level hooks from `bd setup claude` would duplicate them" (GH#3192; exact-match hardening GH#4244 in 1.1.2). `settings.json.tmpl:9` enables `beads@beads-marketplace`, so today `bd prime` runs **twice** per SessionStart and twice per PreCompact — two store opens each, each under its own 10s timeout. Retire the corresponding requirements in `$REPO/openspec/specs/claude-hooks/spec.md:23-59`.
**Hazard if you go the other way:** if `beads@beads-marketplace` is ever removed from `enabledPlugins`, `hasBeadsPlugin` returns false and a later `bd init` / `bd setup claude --global` writes hooks directly into the chezmoi-managed `~/.claude/settings.json`. Tie plugin removal and manual-hook removal together — never one alone.
**Conflict with Must-do #1 — reconcile before editing:** both changes rewrite the same `hooks` map. Determine whether aoe's writer merges or replaces the whole `hooks` object; if it replaces, regenerating aoe hooks silently deletes the `bd prime` entries.

**5. Correct `mole analyze` "read-only" in the manual.** *(UNVERIFIED)*
`cmd/analyze/delete.go` defines `const trashBinary = "/usr/bin/trash"` + `deletePathCmd`/`deleteMultiplePathsCmd`; `cmd/analyze/view.go:411` renders `Delete: %d items … Press Enter to confirm`. 1.48.0/1.48.1 hardened exactly that path for SSH. Edit `$REPO/docs/manual.html:2207-2208` (row → "Explore disk usage; can move selected items to Trash (Enter confirms)") and drop `mole analyze` from the non-destructive list at `:2180` (keep `--dry-run`). No spec change — `openspec/specs/mole-install/spec.md:65-72` only forbids automated invocation.

**6. Beads marketplace still points at the pre-rename org.** *(UNVERIFIED, low)*
`$REPO/dot_claude/settings.json.tmpl:44-50` (`"repo": "steveyegge/beads"`) and `$REPO/run_onchange_install-packages.sh.tmpl:826` (`CC_MARKETPLACES`). Upstream moved to `gastownhall/beads` in v1.0.0; only a GitHub redirect keeps these working. With `autoUpdate: true` at `settings.json.tmpl:45`, a broken redirect stops plugin updates silently rather than erroring. Change both to `gastownhall/beads`.

---

## Adoptable features

Ranked by value here.

**1. atuin pty-proxy — the missing half of AI command-output capture.** *(18.19.0, UNVERIFIED)*
`[daemon]` (config.toml:5-7) and `[ai]` (:9-10) are already on; without pty-proxy the `?` AI can never read what a command printed. Add `eval "$(atuin pty-proxy init zsh)"` **high** in `$REPO/dot_zshrc.tmpl`, before the oh-my-zsh source at L82 — **not** `[pty_proxy] enabled = true`. Reason: the proxy starts wherever `atuin init` sits, and everything sourced before it re-runs inside the proxy; `atuin init` is at L174, after oh-my-zsh (82), starship (117), fzf (132), tv (159). Homebrew builds default features (`ai`, `pty-proxy`), so the binary supports it. Optional: `[ai.capabilities] enable_history_output = false` if output-reading is unwanted.

**2. lazygit `gui.shrinkSidePanelsToContent` + `gui.sidePanels`.** *(0.63.0, UNVERIFIED)*
`$REPO/dot_config/lazygit/config.yml:4-9`. Add `shrinkSidePanelsToContent: true` under `gui`. Consider `gui.sidePanels` to promote `worktrees` to its own top-level panel given the worktree-per-ticket workflow (default is `[[status],[files,worktrees,submodules],[branches,remotes,tags],[commits,reflog],[stash]]`; `validateSidePanels` requires `files`, `branches`, `commits` present). Purely additive, no migration.

**3. worktrunk `wt remove --reap` (0.67.0) and `wt config approvals list` / `clear --stale` (0.66.0).** Not yet decided; both are CLI-only, no config change. `wt list` duplicate-branch flag (0.70.0) is schema-2 only — available once Must-do #2 lands.

**4. eza `--loc` / `--code`.** *(0.23.5, UNVERIFIED)*
`$REPO/dot_zshrc.tmpl:285-289` (the "eza developer views" block). Add e.g. `alias lloc="eza --icons --group-directories-first -l --git-ignore --loc"` and/or `alias lcount="eza --code"`. **Do not** add `--loc` to the hot `ls`/`ll`/`la` aliases at L206-210 — it recurses the whole git repo to compute the percent denominator. Both flags set `require_equals(true)`, so modes must be `--loc=lines`. Requires a spec delta against `$REPO/openspec/specs/zsh-aliases/spec.md:21-43` ("four additional eza aliases") plus a `docs/manual.html` row.

**5. eza `--hyperlink=auto`.** *(0.23.5, UNVERIFIED, medium)*
The flag gained a `WHEN` argument, so it now suppresses OSC 8 when piped — previously unconditional, which is why it was omitted. Append to `ls`/`ll`/`la` at `$REPO/dot_zshrc.tmpl:206-208` for cmd-clickable filenames in Ghostty (`dot_config/ghostty/config:24-26,53`). Skip `lt`/`lta` and the ALT-C preview at `:153` (piped into `head`). Verify visually before committing.

**6. `mole status` row in the manual.** *(UNVERIFIED, medium)*
`$REPO/docs/manual.html:2183-2211` lists no `mole status`. Add "Live system dashboard — CPU, memory, disk, battery, network; read-only". Genuinely read-only, unlike `analyze`, so it fits the note at `:2175-2181`. Repo ships no other system monitor.

**7. lazygit: disable the new global `editConfig` binding.** *(0.63.0, UNVERIFIED, medium)*
`<alt+shift+c>` opens `~/.config/lazygit/config.yml` — the deployed target, edits to which drift from chezmoi. Add `keybinding: {universal: {editConfig: <disabled>}}`. Note this is a widened footgun, not a new one (`e` in the status panel already did it in 0.62.2). Low value; skip unless drift has actually bitten.

**Cut:** lazygit `worktree.defaultPath` (worktrunk owns worktree creation here); ripgrep `RIPGREP_CONFIG_PATH` (nothing new to carry, and a global export would leak flags into the `tv` rg-edit subprocess at `$REPO/dot_config/television/cable/rg-edit.toml:7`); atuin `[search] shells` (default `auto` already includes the empty-shell bucket, so imported pre-18.18.0 history stays visible); mole config-dir management (every file under `~/.config/mole` is tool-written — managing it reproduces the recurring rewrite problem).

---

## Security

**chezmoi 2.70.5 → 2.72.0 — coordinated security release.** External audit by Secur0; release leads with `feat: Fix multiple security vulns thanks to secur0.com` + **14** entries under `### Fixes` (not 16). No CVE/GHSA published (`security-advisories` returns `[]`). Upstream policy: "Only the most recent version of chezmoi is supported with security updates" — nothing backported to 2.70.x/2.71.x (every fix commit is `ahead` of `v2.71.1`; 98 commits in range). Live surfaces here: age decryption of `$REPO/encrypted_dot_ticker.yaml.age` via `$REPO/.chezmoi.toml.tmpl:4-8`, script temp-file handling, persistent-state permissions. Most relevant fixes: `Ensure that age-keygen always writes a private file`, `Make persistent state directory private by default`. The tar/rar archive-escape fixes have **no surface here** (no `.chezmoiexternal*` anywhere) — cite them as evidence of the release's character, not repo impact. The temp-file fix is scoped to external-diff temp dirs (`0o777`→`0o700` in `Config.externalDiffFile`).

**chezmoi 2.72.0 breaking (no action):** `.chezmoiignore`/`.chezmoiremove` patterns with a `..` path component (or an absolute path) are now a hard apply-time error — `NewUntrustedRelPath` rejects `""`, `".."`, `../` prefix, embedded `/../`, `/..` suffix, absolute. Both ignore files are clean (`$REPO/.chezmoiignore` 2 patterns, `$REPO/.chezmoiignore.tmpl` 23 + darwin conditional; both branches verified against a real v2.72.0 binary, exit 0). Literal substrings like `foo..bar` still pass. Comments, blanks and `!` negation are stripped before validation, so trailing-slash and `**` patterns are safe. Recorded so nobody adds a relative escape later — it fails the whole apply.

**gh 2.96.0 → 2.97.0 — four GHSAs, all `<= v2.96.0`, patched v2.97.0** *(UNVERIFIED)*:
- GHSA-3m3g-3wcr-px46 / CVE-2026-64654 — **medium** — terminal escape sequence injection (`gh gist view`, `gh api`, `gh pr diff`, `gh release download --output -`, `gh codespace logs`, `gh skills preview`, `gh agent-task view`/`create`)
- GHSA-4fjg-2h4q-fwg3 / CVE-2026-64653 — **low** — path traversal via unescaped URL components
- GHSA-cg6r-mpgc-h9mm / CVE-2026-64652 — **low** — partial token disclosure in `gh auth status`
- GHSA-mm27-mwq9-fr5g / CVE-2026-64655 — **low** — attestation verification bypass via unescaped regex metacharacters in SAN matching

`$REPO/openspec/explorations/brew-update-2026-08.md:122` says "tres GHSAs" and omits GHSA-mm27; `:124` labels 3m3g "(alto)" (upstream: medium); `:132` labels cg6r "(medio)" (upstream: low). Correct the doc; the "máxima prioridad 🔴" framing rests on a severity upstream did not assign. Keep the operational advice at `:134` (do not run `gh auth status` before upgrading). Also raises the keyring op timeout 3s → 60s, removing spurious failures during interactive keychain unlock — relevant to the authenticated `gh` calls in `run_onchange_install-packages.sh.tmpl:328-357`.

**libgit2 1.9.4 → 1.9.6** — crosses v1.9.5, a security release: CVE-2026-53583 (inverted IP SubjectAltName comparison, OpenSSL backend), CVE-2026-53584 (submodule path traversal escaping the repo), CVE-2026-53585 (unbounded allocation DoS via delta object headers), CVE-2026-53586 (credentials leaked to new host on HTTP redirect), CVE-2026-53587 (heap OOB read in packet capability parsing), plus a 1-byte heap overflow in bundled PCRE 8.45 reachable via revspec. **Correction to the task framing:** `brew uses --installed --recursive libgit2` → `bat`, `eza`, `git-delta` — *not* gh or lazygit (both pure Go, shell out to `git`). Network CVEs largely unreachable; revspec/PCRE and submodule-path handling are in scope for `bat`/`eza` on an untrusted checkout. Take it.

**libtiff 4.7.1_1 → 4.7.2** — memory safety in decode/render paths reachable by `chafa`/`mdfried` on untrusted TIFFs: `TIFFGrowStrips` UAF on partial realloc failure, NULL deref in `_TIFFReserveLargeEnoughWriteBuffer`, int overflows in `TIFFRGBAImage` put functions, inconsistent `fromskew` in `put16bitbwtile`. **No CVE IDs published — do not cite any.**

**glib 2.88.2 → 2.88.3** — CVE-2026-15588, pre-auth DoS in GDBusServer via unbounded SASL line buffering. **Not reachable** — nothing here runs a GDBusServer. Take it, no action.

**jpeg-xl 0.11.2 → 0.12.0** — upstream explicitly recommends updating ASAP for security fixes. Deps: `chafa`, `mdfried`.

**Data-integrity bugfixes worth calling out as risk-reduction (not CVEs):**
- worktrunk 0.69.0 fixed a `wt merge` span-measurement bug that "could sweep in upstream commits, corrupting the default branch". This repo drives `wt merge` via the `mc` alias. Strongest single reason to take the worktrunk bump.
- dolt 2.2.2 (PR #11312) — `dolt gc` could delete a live journal file (race between `bootstrapJournal` and `PruneTableFiles`). beads reaches it: `cmd/bd/compact.go:836` `exec.LookPath("dolt")`, `:847` `exec.Command("dolt","gc")` on `bd compact --dolt` / `bd gc`. *(UNVERIFIED)*
- atuin 18.17.0 (#3502) — shell hang when Ctrl+R autostarts the daemon: the integration runs `atuin search -i` with `3>&1 1>&2 2>&3`, leaving fd 3 open; the daemonized child inherits the command-substitution pipe and the shell waits for EOF forever. Fixed by `3>&-`. `$REPO/dot_config/atuin/config.toml:5-7` (`[daemon] enabled/autostart = true`) + `dot_zshrc.tmpl:174` meet both preconditions verbatim. *(UNVERIFIED)*

---

## Operational steps

Ordered.

1. **Rebase this worktree first.** HEAD `7e19e69` is 3 commits behind `origin/main` (`072bcea`). Commit `a98f5a1` ("fix(aoe): mirror tmux mouse instead of forcing it off (#171)") already changed `[tmux].mouse` from `"disabled"` to `"auto"` and added `set -g mouse on` to `$REPO/dot_tmux.conf`. Any edit to `modify_private_config.toml` written against the stale tree will conflict or revert #171 (DOT-40).
2. **Sync the chezmoi source dir.** `~/.local/share/chezmoi/dot_claude/settings.json.tmpl` is dated 12 Jul and predates this worktree. `chezmoi apply`/`chezmoi diff` will not see any edits until the source is synced (`chezmoi update`, or point `--source` at the worktree for verification).
3. **`brew upgrade chezmoi` on its own.** chezmoi is deliberately *not* in `BREW_PACKAGES` (`$REPO/run_onchange_install-packages.sh.tmpl:80`) — it is the unpinned bootstrap tool. Produces no repo diff, so it cannot ride in the batch commit. Validate with `chezmoi diff` (expect a clean no-op modulo the known `.claude/settings.json` reorder) — that confirms the age decrypt and the tomlkit `modify_` round-trip still hold under 2.72.0. Also correct the stale `2.71.1` baseline at `$REPO/openspec/explorations/brew-update-2026-08.md:24` → installed is **2.70.5**.
4. **beads, before starting any Claude session in a beads project.** Local rigs: `bd export --all -o backup.jsonl`, then `bd migrate` in the foreground. Remote-backed / multi-clone rigs: sync every clone with the **old** binary first → designated migrator runs `BD_ALLOW_REMOTE_MIGRATE=1 bd migrate && bd dolt push` → every other clone installs the new binary then `bd bootstrap` (`bd dolt pull` is refused while pending migrations exist; do not migrate on those clones). Verify per project with `bd version` / `bd doctor` — `bd prime` cannot report the failure. Target **1.1.2, never 1.1.0** (1.1.0's v53 migration can leave the DB unopenable on dolt-drifted storage; 1.1.2's re-key skips the drifted table with a warning and records `aux_row_rekey_drifted`). There is no 1.1.1.
5. **dolt:** transitive via beads, not in `BREW_PACKAGES`, `installed_on_request: false`. Verify `brew info dolt` reports **2.2.3** immediately before applying — 2.2.0/2.2.1/2.2.2 carry the prolly-index-writer panic (issue #11317, fixed by #11333). The "do not land an intermediate 2.2.x" advice is otherwise unenforceable; either declare `dolt` explicitly in `BREW_PACKAGES` or drop the pinning advice.
6. **fzf: land 0.74.2, never 0.74.0/0.74.1.** Those two fire zsh `chpwd` hooks twice on ALT-C (regression from `7d647c70`, fixed by adding `-q` to the subshell `builtin cd`). `$REPO/dot_zshrc.tmpl:393` installs `__zoxide_hook` into `chpwd_functions`, so every ALT-C would double-increment that directory's frecency in the shared zoxide DB. *(UNVERIFIED)*
7. **lazygit: install 0.64.0 before writing any `git.diffRenderers` key** — 0.62.2 does not understand it.
8. **aoe: upgrade → start one aoe session → `chezmoi diff` → fold aoe's own hook bytes back into the template** (re-applying `{{ .chezmoi.uid }}`). Do not hand-transcribe the escaped `case` pattern.
9. **worktrunk: pin `json-schema = 2` in the chezmoi source, apply, then run `wt config update`** — it must report nothing to migrate.
10. **Do not run `gh auth status` before upgrading gh** (CVE-2026-64652, partial token disclosure).
11. **Post-upgrade sanity:** run `chezmoi apply --dry-run --verbose` under 2.72.0 and confirm the interactive `confirm()` prompts in `$REPO/run_onchange_install-packages.sh.tmpl` still reach the terminal (that script does `exec > /dev/tty 2>&1` and `read -r reply </dev/tty`; the 2.71.0 script-cmd dedup refactor was never audited against it).

---

## Audited and rejected

**aoe — `tmux.mouse = "disabled"` never applied to the lazygit Alt+g pane.** *Rejected on two independent grounds.* (a) Alt+g routes through `src/tui/app.rs::attach_tool_session`, which in the installed v1.12.0 already calls `apply_all_tmux_options` at `app.rs:3019` before attach → the tool session has had `mouse off` all along. The path PR #3227 actually names (`home/mod.rs::ensure_tool_pane_ready`) does not exist in v1.12.0. (b) The finding read a stale worktree: commit `a98f5a1` already changed the managed value to `"auto"`, and `$REPO/dot_tmux.conf:2` is `set -g mouse on` (the finding asserted no tmux config exists — false, and checkable at the time). Its proposed action would revert #171 and re-open DOT-40. If anything, 1.14.0 is what finally delivers #171's intent — but that is the inverse claim and needs re-verification against the `"auto"` baseline.

**aoe — "drop the quit-aoe-before-apply habit; 1.13.0 makes config saves read-modify-write."** The read-modify-write fix is real and verified (`save_config` gone, `update_config` takes `config_save_lock()` + `acquire_storage_flock` + fresh `Config::load()`, with regression tests). But the proposed action is wrong for this repo: `$REPO/openspec/changes/update-brew-deps/design.md:12` (D1) grounds the quit-aoe prerequisite in **sqlite WAL** (`cockpit_events.db-wal/-shm`) and `tui.active`, not config.toml locking. Retiring the step reintroduces exactly the hazard D1 exists to prevent; the new `state.toml` argues for keeping it. Also "no edit required" is false — see Must-do #5.

**aoe — adopt `tmux.socket_name = "aoe"`.** Feature is real (1.13.0, PR #2846, `tmux -L <name>`, still present at v1.14.0). Rejected on repo impact: (a) `$REPO/dot_tmux.conf` exists (the finding claimed it did not); (b) `$REPO/openspec/specs/agent-manager/spec.md:111,192,201` justify all three managed `[tmux]` keys on the user-owned `~/.tmux.conf` being authoritative *on AoE sessions*; (c) two concrete regressions — `wsh` (`$REPO/dot_zshrc.tmpl:255-269`) creates handoff sessions with no `-L` and prints `tmux attach -t $branch`, a hint spec-locked by `openspec/specs/zsh-aliases/spec.md:164,183`, which would become wrong; and `$REPO/dot_config/television/config.toml:34` (`"tmux-sessions" = ["tmux attach","tmux switch"]`) would stop surfacing aoe sessions, with the literal trigger prefix never matching `tmux -L aoe attach`; (d) real cost is MANAGED tuple + spec delta + manual row + reconciling three rationales, not a one-liner.

**aoe 1.13.0 "Remove support for x86_64-darwin".** No impact. Commit `fed711b` touches only `flake.nix` and `.github/workflows/ci.yml` (one line each, removing `x86_64-darwin` from a Nix systems list). v1.13.0/v1.14.0 still publish `aoe-darwin-amd64.tar.gz`. homebrew-core `Formula/a/aoe.rb` builds from source via `cargo install` and still carries an Intel `sonoma:` bottle at 1.14.0. The repo uses no Nix (sole mention is a rejected alternative at `openspec/changes/archive/2026-02-28-setup-dotfiles/design.md:41`). **Do not add an arch gate to `BREW_PACKAGES:80`** — this host is Intel (`uname -m` = x86_64, brew prefix `/usr/local`).

**chezmoi — drop `chmod 600` from the age bootstrap as "now redundant".** Rejected. (a) Wrong binary: the v2.72.0 commit touches `chezmoi age-keygen`; the repo documents the **standalone** `age-keygen` from `brew install age` (`$REPO/README.md:98-100`), and `chezmoi age-keygen` appears nowhere in the repo. (b) Standalone `age-keygen -o` has used `O_EXCL|0600` since age v1.0.0 (2021) — the chmod has been a no-op on the generation path for five years, not because of this release. (c) The premise is false for the README path anyway: `README.md:98-102` is newline-separated, not `&&`-chained, so on a re-paste `age-keygen` fails (`file exists`) while `chmod 600` still tightens a pre-existing loose file. (d) The "switch to `chezmoi age-keygen`" suggestion is a **safety regression**: standalone uses `O_EXCL` and refuses to overwrite; chezmoi's `writeOutput` uses `O_CREATE|O_TRUNC` and would silently clobber the key that `README.md:110` says makes the encrypted artifacts irrecoverable. (e) Would desync `$REPO/openspec/specs/chezmoi-encryption/spec.md:39,53`, which names the standalone command and already blesses both branches at `:40`.

**chezmoi — `mkdir -p -m 700 ~/.config/chezmoi`.** Rejected as attributed. chezmoi v2.72.0 still creates that directory at `0o777` in this exact flow (`internal/cmd/config.go:913` `chezmoi.MkdirAll(..., fs.ModePerm)` in `createAndReloadConfigFile`, and `:2572` under `requiresConfigDirectory`). `chezmoi init` is not tagged `requiresConfigDirectory`, and bolt's new `0o700` `MkdirAll` runs lazily *after* line 913 — so it can never win here. The `mkdir -p` pre-empts nothing. Separately, the proposed edit is a **no-op on the existing machine** (`mkdir -p -m 700` does not chmod an existing dir; `~/.config/chezmoi` is already `drwxr-xr-x`), and it patches only the "first machine ever" path, not the restore path (`README.md:106-108`, `manual.html:1949-1952`). Severity overstated: home is `drwxr-x---`, all three files in the dir are already 0600, and the only non-system account is `etherless`. If pursued at all, do it as `chmod 700` and as an independent hygiene change, not justified by v2.72.0.

**chezmoi — `--skip-secrets` as a workaround for a missing key.txt.** Correct finding, kept as a negative result, but note it is a no-op **for this repo only**: `SkipTemplateIf` call sites live exclusively in `internal/cmd/*templatefuncs.go` (~21 secret-manager files + `encryptiontemplatefuncs.go`'s `decrypt`/`encrypt` template funcs). `skipSecrets` is a field on `internal/cmd.Config` and is never plumbed into `internal/chezmoi.SourceState`, so `newSourceStateFile`'s `contentsFunc` (`sourcestate.go:2152-2164`) calls `s.encryption.Decrypt` unconditionally. `$REPO/encrypted_dot_ticker.yaml.age` uses the `encrypted_` source attribute, not a `decrypt` template call. **Do not** reach for `chezmoi apply --skip-secrets` on a machine missing `~/.config/chezmoi/key.txt` — restore key.txt per `README.md:108`. Would become live if any secret-manager template func is ever added.

**chezmoi — "modify_ execution path rewritten in v2.72.0 but contract byte-identical."** Substance correct, **release wrong**: commit `077b2a10` ("chore: Deduplicate script cmd setup") shipped in **v2.71.0** (commit 2026-07-04, tag 2026-07-07; it is an ancestor of v2.71.0, 76 commits behind v2.72.0). Also mislabeled `kind: breaking` while concluding "no action", and the "(not in the release-note list)" framing is meaningless — chezmoi's generated changelog has no chore section at all. Verified conclusion holds: `setWorkingDir` is false for modify scripts so `cmd.Dir` stays empty, stdin/stderr/env unchanged, and nothing in v2.70.5…v2.72.0 changes run_onchange hashing or script state keys (only a `ContentsFunc`/`ContentsSHA256Func` type-alias extraction). Caveat: the script's cwd-safety comes from `setWorkingDir` being false, **not** from `mktemp -d` — `uv run` at line 101 walks up from cwd (see Must-do #3).

**lazygit — "0.63.0 had no config-key deprecations."** Refuted by the audit itself: v0.63.0 added a `pathsToMove` entry `keybinding.worktrees.viewWorktreeOptions` → `keybinding.universal.newWorktree`, and deleted `KeybindingWorktreesConfig` entirely (`NewWorktree` moves to universal, default `w`). Inert here only because `$REPO/dot_config/lazygit/config.yml` has no `keybinding:` section — inert **by absence**, not by design. Also note the 0.64.0 migration list is not exhaustive: it omits `git.allBranchesLogCmd` → `git.allBranchesLogCmds` and `migratePagersToDiffRenderers`. Net: no rewrite fires, config.yml is untouched by the upgrade. `output: terminal` at `config.yml:48` remains load-bearing (`changeCustomCommandStreamAndOutputToOutputEnum` still wired at `app_config.go:347`, still converts `subprocess: true` → `output: terminal`) — **do not** switch to `subprocess: true`.

**Everything below is confirmed no-action** and recorded so it is not re-flagged: ripgrep 15.2.0 `GIT_CONFIG_GLOBAL`/`SYSTEM` support (rg already honored `~/.gitconfig` `excludesfile`; nothing exports those vars); ripgrep multi-path gitignore fix and traversal perf (free wins, no workaround to remove); atuin `[search] shells = "auto"`; atuin Ctrl+R/Ctrl+T bindings unchanged across 18.17-18.19 (so any post-batch Ctrl+T regression is fzf 0.74 or tv, not atuin); fzf ALT-C logical-path change (correct behavior, matches `cd` builtin; day-to-day impact limited to symlinked trees like `/tmp`); `fzf-file-widget` and `fzf_default_completion` both survive 0.74.2 (`shell/completion.zsh` byte-identical v0.73.1→v0.74.2), so `$REPO/dot_zshrc.tmpl:158-171` is safe; gh `skill`/extension API compatibility (`--agent claude-code` and the `skillName` JSON field untouched; extension changes are internal `safeurl` refactors); zsh 5.9.2 (pure bug-fix; brew zsh is only reached by opencode's `"shell": "zsh"` — the login shell is Apple `/bin/zsh` 5.9, so `dot_zshrc.tmpl` is never interpreted by brew zsh); **do not** add `/usr/local/share/zsh/functions` to fpath for 5.9.2's new `_age`/`_namei`/`_hardlink` (would load 5.9.2 completions into a 5.9 runtime and shadow `/usr/share/zsh/5.9/functions`); eza theme.yml color-parse fix and YAML/CSV icon codepoint changes (Hack Nerd Font cmap covers U+E8EB and U+EEFC — verified, no tofu); mole `mo update` fix cluster (brew installs delegate to Homebrew via `is_homebrew_install`; repo never runs `mo update`); mole config dir (all tool-written); dolt 2.1→2.2 minor bump is a JWT-auth semver signal only — `go/store/types/format.go` byte-identical v2.1.10↔v2.2.3 (sha1 `52b57360…`), no `dolt migrate`, nothing here uses `authentication_dolt_jwt`; harfbuzz 14.3.0 (Ghostty ships its own text stack); dav1d 1.5.4, ca-certificates, chafa/libssh2/openexr revision-only rebuilds, fontconfig/llhttp/openjph (no sourced change).

**Doc corrections needed regardless:** `$REPO/openspec/changes/update-brew-deps/proposal.md:10` still says "dolt 2.1.0→2.1.10 … only removes unused `dolt archive`" — that is the previous cycle. Replace with "dolt 2.1.10→2.2.3 (beads runtime dep; minor bump is a semver signal for an `authentication_dolt_jwt` change we do not use — storage format byte-identical, no `dolt migrate`)".

---

## Coverage gaps

**Range coverage is clean** for chezmoi (no 2.70.6+), lazygit (no 0.62.3), atuin (no 18.16.2), fzf (no 0.73.2), gh (no 2.96.x), mole (tags jump V1.44.1 → V1.45.0), dolt (2.1.11 is the only 2.1.x), aoe, ripgrep, eza, zsh. Footnote: beads `v1.0.5` is a tag with **no GitHub release** — the baseline was the CHANGELOG, not a release body.

**1. uv 0.11.26 → 0.12.1 is only partially audited.** Nine releases in range (0.11.27-0.11.33, 0.12.0, 0.12.1); only 0.12.0's breaking changes were read. uv is on the `chezmoi apply` critical path (`$REPO/dot_config/private_agent-of-empires/modify_private_config.toml:101`). **Read 0.11.27-0.11.33 and 0.12.1**, filtered for `uv run --with` resolution, cache, and ephemeral-env behavior.

**2. `$REPO/dot_zshrc.tmpl:140-153` — the repo's largest fzf surface — was never checked against 0.74.0.** 12 lines of `FZF_DEFAULT_OPTS` (`--height 40%`, `--border`, `--bind='ctrl-/:toggle-preview'`, ten Catppuccin `--color=` keys incl. `selected-bg`/`label`) plus `FZF_CTRL_T_OPTS`/`FZF_ALT_C_OPTS`. Diff the 0.74.0 option/color-key list and check for any deprecation warning that would print on **every shell start**.

**3. `$REPO/run_onchange_install-packages.sh.tmpl` was never audited against chezmoi 2.72.0.** Only the `modify_` stdio contract was verified. This script does `exec > /dev/tty 2>&1` and `read -r reply </dev/tty`. See Operational step 11.

**4. gh's ESC-byte refusal was checked for `pr diff` and `api`, not for the piped `gh` calls this repo actually runs.** `run_onchange_install-packages.sh.tmpl:330,339,350` pipe `gh extension list` and `gh skill list … --jq` into `grep`. If the refusal generalizes, the idempotency checks fail and extensions/skills get reinstalled on every apply. **Confirm the refusal is scoped to `pr diff`/`api` only.**

**5. aoe hook-writer semantics unknown — blocks reconciling Must-do #1 with Obsolete-workaround #4.** Does aoe 1.14.0's JSON-settings installer merge into the existing `hooks` object or replace it? If it replaces, regenerating aoe hooks silently deletes the `bd prime` entries at `settings.json.tmpl:159,180`. Resolve before touching either.

**6. `dolt` is not independently upgradable.** Absent from `BREW_PACKAGES`, `installed_on_request: false`, pulled by `brew deps beads`. The "target 2.2.3 exactly" advice is unenforceable as written — check the beads 1.1.2 formula's dolt bound, then either declare `dolt` in `BREW_PACKAGES:80` or drop the pinning advice.

**7. Unverified over the cap** (marked UNVERIFIED inline above): all atuin, beads, gh, mole, ripgrep, eza, zsh, dolt, fzf and remaining lazygit findings. They passed a single research pass but **not** the two-lens refutation the aoe/chezmoi/lazygit findings survived. Highest-consequence of these: the atuin syntax-highlight theme break (Must-do #4), the beads schema-migration ordering (Must-do #7), and the beads duplicate-hook deletion (Obsolete-workaround #4).

**8. Claims that need tightening before they land in prose:**
- beads "documented 10-25s migration pause" — sourced to CHANGELOG 1.1.0-rc.1 line 1207 but drives the whole severity; re-read in context.
- mole "matured into a usable iStat-style dashboard" — subjective, no release-note anchor. Say what the fixes were instead.
- ripgrep `core.excludesfile` reasoning is self-labelled as inference. Leave it labelled.
- eza clap-rewrite claim (`--icons` swallowing a following bare token) was inferred from arg declarations, not executed. Verify against the 0.23.5 binary before documenting.
- dolt "on-disk format byte-identical" — this one **is** verified at the constant (`format.go` sha1 match), stronger than release-note prose. Keep the source citation, drop any reliance on the release text.

**9. Memory-note debt:** deleting the `__zoxide_doctor` override invalidates `feedback_zoxide_cmd_cd.md`. Update it in the same change or a future session reintroduces the workaround.