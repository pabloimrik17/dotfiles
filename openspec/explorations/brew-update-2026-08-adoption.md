# Adopción de features — evaluación decision-grade (6-ago-2026)

8 candidatos, cada uno verificado contra fuente upstream descargada y pesado contra el
coste de un knob más. Resultado: **1 ADOPT parcial, 6 REJECT, 1 DEFER**.

Los 7 escépticos y la síntesis final murieron por límite de sesión; los veredictos de
abajo son de la pasada de evaluación, sin contra-lente salvo eza --hyperlink.

## DEFER — atuin pty-proxy (18.19.0) — `[pty_proxy] enabled` / `eval "$(atuin pty-proxy init zsh)"` (valor low)

Feature is real and the Homebrew binary supports it, but the audit's reasoning for it does not survive source. Do not carry this into the proposal as written.

MECHANISM (verified, crates/atuin-pty-proxy/src/pty_proxy.rs:168-199): render_init emits `exec atuin pty-proxy --shell "${_atuin_pty_proxy_zsh#-}"`, guarded by ATUIN_PTY_PROXY_ACTIVE and ATUIN_PTY_PROXY_TMUX. It is an exec RE-ENTRY: zsh replaces itself with the proxy, which respawns zsh, which re-sources .zshrc from line 1. Upstream's config comment (crates/atuin-client/config.toml, PR #3828): "everything sourced before it runs again inside the proxy."

THE AUDIT IS BACKWARDS. It claimed "everything sourced after it runs inside the proxy." The truth inverts that, and this dissolves its case for line 82: after the exec the ENTIRE interactive shell is inside the proxy no matter where the line sits. starship/fzf/tv are captured either way. Placement changes only how much of .zshrc runs TWICE. Nothing breaks at line 174 — it merely re-runs oh-my-zsh (25 plugins + compinit), starship, fzf and tv on every shell. So the audit landed on a defensible placement via false reasoning, which is exactly the kind of premise that should not be inherited unexamined.

BENEFIT OVERSOLD. "Half the feature is dead" is wrong: enable_history_output is one of FOUR AiCapabilities (settings.rs:691-701, alongside enable_history_search, enable_file_tools, enable_command_execution). Without pty-proxy, `atuin ai` still reads history, loads TERMINAL.md, suggests commands, executes commands, and reads/writes files. One capability of four is inert, not half the feature. And `atuin ai` is the secondary assistant here — this repo's AI investment is overwhelmingly Claude Code.

WHY DEFER RATHER THAN REJECT OR ADOPT: the feature is legitimately available and trivially reversible (one line), but every cost that decides it is empirical and currently UNMEASURABLE — 18.16.1 is installed, not 18.19.0. I cannot measure the startup delta, the vt100 parsing overhead under lazygit/tv/claude, or the tmux nesting behavior. Adopting now would bundle a shell-init rewiring plus a spec delta into a version bump on unmeasured assumptions whose stated rationale was already wrong once. Rejecting outright would discard a real feature before the one moment measurement becomes possible. Land the upgrade; then measure; then decide.

CONCRETE GATE (after 18.19.0 is installed, before any edit): (1) `hyperfine 'zsh -i -c exit'` before/after adding the line, to price the second zsh startup; (2) watch `atuin pty-proxy` CPU while scrolling lazygit and a Claude Code session, since vt100 parses every byte with no alt-screen bypass; (3) confirm Ghostty super+shift+up/down prompt jumping and notify-on-command-finish still fire under the proxy; (4) enter tmux from a proxied shell and check for a nested second proxy. If startup cost is small and TUI CPU is flat, adopt then.

PREPARED EDIT, if the gate passes (recorded so no re-research is needed — deliberately NOT applied now): insert immediately BEFORE line 82 (`source $ZSH/oh-my-zsh.sh`) of dot_zshrc.tmpl:

  # atuin pty-proxy — wraps the interactive shell in a PTY so `atuin ai` can read
  # command output. This `exec`s zsh inside the proxy, so everything ABOVE this
  # line runs a SECOND time; keep it above the expensive inits. A separate init
  # line, not `[pty_proxy] enabled` in config.toml: that key hangs the re-exec off
  # `atuin init` (L174), which would re-run oh-my-zsh, starship, fzf and tv.
  eval "$(atuin pty-proxy init zsh)"

The separate-line form (not the config key) is correct, and the docs confirm combining both is safe. But it is right for the double-execution reason above, not the audit's.

**Riesgos:** VERIFIED SAFE (do not re-litigate these): OSC 133 is forwarded byte-exact in the non-debug path (runtime.rs:305, `mirror.write_all(&buf[..n])`), so Ghostty `jump_to_prompt` (ghostty/config:92-93) and `notify-on-command-finish` (:69) keep working. SIGWINCH is caught and pushed to both the PTY master and the screen engine (runtime.rs:358-377), so resize is fine. The init guard is `[[ "$-" == *i* ]] && [[ -t 0 ]] && [[ -t 1 ]]`, so Claude Code's non-interactive Bash shells and chezmoi scripts never re-exec. The tv/fzf Ctrl+T wrapper and atuin's Ctrl+R are zle widgets, orthogonal to the PTY layer. Homebrew builds default features (`cargo install *std_cargo_args`, no --no-default-features; default = [client, sync, clipboard, check-update, daemon, ai, pty-proxy]), so the audit's build claim is CORRECT.

REAL COSTS: (1) Every interactive shell gains a long-lived `atuin pty-proxy` process plus a full second zsh startup. (2) screen.rs runs a real `vt100::Parser` over every output byte in a parser thread (runtime.rs:296/303 feed it unconditionally), and there is NO alt-screen/1049 bypass anywhere in screen.rs or capture.rs — so every lazygit, tv, fzf, gh-dash, aoe and Claude Code TUI frame is parsed into a grid model in a second process. This is the cost most likely to bite, and it is exactly the workload this repo runs all day. (3) The guard re-execs whenever $TMUX differs from ATUIN_PTY_PROXY_TMUX; `wsh` spawns tmux sessions and aoe runs Claude inside tmux, so a proxied non-tmux shell entering tmux nests a second proxy layer. (4) One more knob in the single most load-bearing file in the repo, whose init ordering is already delicate (dot_zshrc.tmpl:156-157 documents the fzf -> tv -> atuin contract).

PRIVACY (plainly): with pty-proxy + daemon running, the raw stdout/stderr of every command run in an interactive shell is captured and held in DAEMON MEMORY ONLY, keyed by history ID — 1MB per command, most recent 128 commands per session, up to 32MB, all lost when the daemon stops. Nothing is written to the sync server or sent to the LLM until the AI requests a specific command's output, and by default it prompts first. That default matters here: this shell prints git remotes, gh output, env-bearing build logs and Claude/aoe sessions. `[ai.capabilities] enable_history_output = false` IS the correct escape hatch — the field is Option<bool> where None means "enabled, ask permission" (settings.rs:695), so the capability is ALREADY live today; only the capture side is missing. Note the inverse hatch too: `[permissions] allow = ["AtuinOutput"]` removes the prompt — never set that here.

**Delta de spec:** none while deferred. If the measurement gate passes, atuin-config would need an ADDED requirement ("pty-proxy shell integration in .zshrc", mirroring the existing "AI shell integration in .zshrc" requirement and specifying the pre-oh-my-zsh insertion point plus the separate-line-over-config-key rationale), and atuin-ai-context would need a MODIFIED requirement extending its existing "contents leave the machine" warning to cover captured command output.

## ADOPT — lazygit 0.64.0 — gui.shrinkSidePanelsToContent + gui.sidePanels (valor medium)

Split verdict: ADOPT `gui.shrinkSidePanelsToContent: true`, REJECT `gui.sidePanels`.

BOTH KEYS VERIFIED IN v0.64.0 (not just release prose):
- pkg/config/user_config.go:115 `ShrinkSidePanelsToContent bool \`yaml:"shrinkSidePanelsToContent"\``, default at :869 = `false`.
- pkg/config/user_config.go:120 `SidePanels []SidePanel \`yaml:"sidePanels"\``; `type SidePanel []string` (pkg/config/side_panel.go:8). Default at :870 is exactly the grouping the audit quoted.
- `ValidSidePanelTabs`: status, files, worktrees, submodules, branches, remotes, tags, commits, reflog, stash.
- `validateSidePanels` (pkg/config/user_config_validation.go:67-98): every panel >=1 tab; every name in ValidSidePanelTabs; no name twice; total > 0; files+branches+commits mandatory ("A lot of code focuses these panels directly"). All are hard startup errors.

(2) WHAT SHRINK ACTUALLY DOES. `shrinkToContentSidePanelBoxes` in pkg/gui/controllers/helpers/window_arrangement_helper.go: each flexible panel is sized to `max(content+1, 2) + 2` frame rows, then water-filling redistributes; status stays pinned at 3 rows and unfocused stash keeps its constant height; if everything fits with room to spare the leftover is shared by weight. It is gated: skipped entirely in SCREEN_FULL/SCREEN_HALF, and only runs when `height >= minHeightForNormalLayout` (28 rows at 5 panels) — below that lazygit squashes instead.

Concretely here: status is fixed at 3, stash is near-always empty, and in a worktree-per-ticket flow the files panel holds one small diff. Under today's equal-weight layout those three panels burn ~60% of the column regardless of content. Shrink hands those rows to commits/branches — the panel actually scanned before `wt merge`. That is a mechanism-grounded win, not taste-laundering. The taste part is honest and stated: panel heights re-flow live as you stage/unstage. It is one boolean, opt-in, no interaction with any key already set (the user sets neither `expandFocusedSidePanel` nor `expandedSidePanelWeight`), and reverting is deleting a line. Critically it is a NEW key, so it cannot match `computeMigratedConfig` and trigger the config rewrite that lines 40-42 of this file exist to warn about.

(3) WHY sidePanels IS REJECTED — three verified costs against ~zero benefit.

Cost A, jump keys break. `JumpToSideWindowController.GetKeybindings` binds positionally: `count := min(len(windows), len(jumpKeys))`, and `Keybinding.Universal.JumpToBlock` defaults to exactly five entries `{"1"}..{"5"}` (user_config.go:1024). Promoting worktrees yields six panels, so the sixth (stash) gets NO jump key at all, and 3/4/5 all change meaning: 3 branches→worktrees, 4 commits→branches, 5 stash→commits. Upstream's own test pkg/integration/tests/ui/promote_tab_to_side_panel.go uses precisely this six-panel arrangement and asserts the shift. Repairing it means also adding a `keybinding:` section with a 6-entry `jumpToBlock` — a block this file deliberately does not have today, and whose absence is the only reason the 0.63.0 `keybinding.worktrees.viewWorktreeOptions` migration does not fire here (per openspec/explorations/brew-update-2026-08.md:226-231). Adding `jumpToBlock` does not itself trigger that migration, but it puts a keybinding tree into a chezmoi-managed file that must never be rewritten.

Cost B, pinning. `sidePanels` is decoded as a sequence into `[]SidePanel` via plain `yaml.Unmarshal` (app_config.go:215) — it REPLACES the default list wholesale, no element merge. Writing it freezes the layout, so any panel a future lazygit adds is silently hidden. That is the same silent-drift class this exploration already flags for worktrunk `json-schema = 2`.

Cost C, it fights the adoption above. A promoted worktrees panel adds a permanent 4-row floor (2 frame + min 2 content). And `minHeightForNormalLayout = min(28, 28*len(windows)/5)` — the `min` caps at 28, so six panels get no threshold relief. shrink + promoted worktrees is strictly worse than shrink alone.

Benefit: near zero. worktrunk owns worktrees end-to-end here — `wt switch --prs` (wtpr), `wt list --full --branches` (wtci), `wt merge` (mc), `wsc='wt switch --create --execute=claude'` at dot_zshrc.tmpl:252, plus pre-start copy-ignored, post-start install-deps, and the pre-remove .claude/settings.local.json merge in dot_config/worktrunk/config.toml. lazygit's worktree panel can retarget the repo lazygit displays but cannot cd the shell — that is the entire reason `wt switch` exists. And lazygit is always launched from inside a worktree (`lg`, plus the aoe `[tools.lazygit]` session on Alt+g), so the list is a read-only curiosity. Promoting it spends permanent vertical space on a view with no action behind it.

(4) THEME INTERACTION: none. `Theme` and `AuthorColors` are sibling fields of the same GuiConfig struct; the new scalar decodes independently. One placement caveat worth honoring: lazygit calls `yaml.Unmarshal` WITHOUT KnownFields, so unknown keys are silently ignored — misplacing this under `theme:` would be a silent no-op, not an error. It must be a direct child of `gui:`.

SPEC: `openspec/specs/lazygit-catppuccin/spec.md` is scoped to "the official Catppuccin Mocha blue theme" and covers only `gui.theme` + `gui.authorColors`. It does NOT cover `gui.showIcons` or `gui.nerdFontsVersion`, which already live in this file with only an inline comment. So a layout boolean needs no delta to match existing precedent, and forcing it into lazygit-catppuccin would be wrong — it is not theme. Flagging honestly: this repo has pre-existing undocumented lazygit config; closing that gap belongs in a broadened lazygit capability, as its own decision, not smuggled in with this bump.

**Riesgos:** shrinkSidePanelsToContent: (a) taste — panel heights re-flow as you stage/unstage, which reads as jumpy to some; revert is one deleted line. (b) Inert in fullscreen/half-screen mode and under 28 rows of terminal height, so in a short aoe/tmux tool pane (Alt+g `[tools.lazygit]`) it may do nothing visible — do not expect it everywhere. (c) It sits outside any spec requirement, matching the existing showIcons/nerdFontsVersion gap rather than closing it.

sidePanels (if adopted against this advice): six panels leave stash with no jump key and silently remap 3/4/5; requires a new `keybinding:` block to repair; pins the layout so future lazygit panels are hidden without warning; a bad name or a missing files/branches/commits is a HARD startup failure from validateSidePanels, which for a chezmoi-managed file means `chezmoi apply` succeeds and lazygit is simply broken afterwards.

General: verified against the v0.64.0 tag. Installed is 0.62.2, which has NEITHER key — apply this only together with the 0.64.0 upgrade. On 0.62.2 it is silently ignored (no KnownFields), so it fails quiet rather than loud.

**Delta de spec:** none

## REJECT — lazygit delta via git.diffRenderers (lazygit 0.64.0) (valor low)

Verified against v0.64.0 source (downloaded tarball, not release prose) and against installed delta 0.19.2 empirically.

SCHEMA (pkg/config/user_config.go:375-390). `DiffRendererConfig{ type, name, colorArg, command, args }`. `type` default "" → treated as `stdinFilter` (diff_renderer_config_manager.go:45). `colorArg` default "" → `GetColorArg()` returns "always" (line 84-86). `validateDiffRenderers` (user_config_validation.go:114-134): stdinFilter/"" requires `command`, forbids `args`; `extDiff` forbids `args`; `rawGit` forbids `command`. Cycle keys are `|` / `\` (user_config.go:1063-64), guarded off when total<=1, and the index is runtime-only (never persisted).

(3) THE AUDIT'S `- {}` IS WRONG AND WOULD BRICK LAZYGIT. `- {}` gives Type=="" and Command=="" → hits `case "stdinFilter", ""` → error "'command' must be specified". A validation error at app_config.go:221 aborts config load, so lazygit refuses to start. The real builtin entry is `- type: rawGit` / `name: default` (docs/Custom_DiffRenderers.md). That the headline recommendation is a startup-breaking typo is itself a signal about how well this was vetted.

(2a) HUNK STAGING IS SAFE — but that is why the case collapses. staging_helper.go:56-57 calls `WorktreeFileDiff(file, plain=true, ...)`; plain forces `--color=never` and `AddCommonDiffArgs(..., forUI=false)` (no diff.external, no rawGit args), and renders via `NewRenderStringWithoutScrollTask`, never `newPtyTask`, so GIT_PAGER is never set. Same for custom-patch building (patch_building_helper.go:76). delta structurally cannot touch the patch text. Colour/truecolor also survives lazygit's `TERM=dumb` (COLORTERM is not stripped; confirmed 38;2; SGR on a pty).

So delta reaches ONLY read-only previews (files_controller.go:372/387, commits_files_controller.go:179). Today lazygit is uniformly builtin. After adoption it is delta in the preview and builtin the moment you press enter to stage. The "delta everywhere except lazygit" seam is not closed — it is moved inside lazygit, where it is more jarring.

(2b) THIS USER'S [delta] IS UNOVERRIDABLE AND HOSTILE TO THE PANE. dot_gitconfig.tmpl:49-54 sets side-by-side/line-numbers/navigate in the MAIN `[delta]` section. Tested on delta 0.19.2: main-section values beat named features; a CLI-appended `--features` setting `side-by-side = false` does NOT turn it off (delta cannot negate a bool via features); there is no `--no-side-by-side` flag (confirmed in delta's own usage dump). The only escape is `--no-gitconfig`, which also discards the Catppuccin theme that the entire `delta-catppuccin` capability exists to deliver. With lazygit's default `sidePanelWidth: 0.3333` (not overridden here), a 98-char TS signature wraps 3 rows per side at pane width 86, and still wraps at width 160 (a 240-col terminal). `mainPanelSplitMode: flexible` halves the pane again when staged+unstaged both show.

(2c) `navigate = true` IS NOT INERT — the brief's premise is half wrong. Upstream docs say n/N jumping "doesn't work in lazygit", but `navigate` is a delta feature that also sets `file-modified-label = "Δ"` and `hunk-label = "•"` (delta src/features/navigate.rs:9-29), and those glyphs are emitted into the output. Verified against the live ~/.gitconfig: every diff renders `Δ code.ts` and `• code.ts:1:`. lazygit has no navigation to attach them to, so they are pure noise.

COST. Not one YAML block. Making it actually good requires editing dot_gitconfig.tmpl too — and I proved the clean restructure (move side-by-side into a named feature) still fails. The remaining option is deleting side-by-side/navigate from `[delta]` outright, degrading the terminal `git diff` this user deliberately curated, plus 2-3 spec deltas and manual.html rows for the `|` key. That is a large, multi-file, spec-bearing change that makes one read-only pane look WORSE than the builtin for typical code.

Not DEFER: the blocker is not missing information or the pending 0.64.0 install, it is a structural conflict between a full-width-pager delta config and a one-third-width TUI pane that delta offers no supported way to resolve.

If the user later wants the `|` cycle for its own sake, the zero-conflict entry is a `rawGit` `--color-words` renderer — no delta involvement, no gitconfig fight. Different candidate; not proposing it here.

**Riesgos:** Nothing changes, so no adoption risk. Residual notes for whoever revisits: (1) writing `git.diffRenderers` is safe on the currently installed 0.62.2 — lazygit uses plain `yaml.Unmarshal` with no KnownFields, so the key is silently ignored, and `migratePagersToDiffRenderers` exists only in 0.64.0; there is no ordering hazard, just no benefit. (2) The separate, already-established constraint still holds and is unaffected by this rejection: never write the old `git.pagers` key, since app_config.go:562 rewrites the chezmoi-managed file. (3) The current config.yml triggers no 0.64.0 migration — it has no `keybinding:` section and already uses `output: terminal` rather than deprecated `subprocess`.

**Delta de spec:** none (rejected). Had it been adopted it would have needed 2-3: `lazygit-catppuccin` (Purpose is theme-only — would need widening, or a new `lazygit-diff-renderer` capability), plus `delta-catppuccin` and/or `git-config` for the `[delta]` restructure the fix requires.

## REJECT — eza --loc / --code aliases (eza 0.23.5) (valor low)

WHAT THEY DO (verified, v0.23.5 source + executed binary). `--loc` adds two long-view columns, Language and Code (parser.rs:128-133 → table.rs:102-113, 241-242). `--code` is a separate output mode that pre-empts all layout flags (view.rs:65-69, main.rs:230) and prints a per-language table: Language / Files / Lines / Code / Comments / Blanks / Code % + a bar chart. Modes for both are the same enum `CodeContent { Lines, Percent, Both }` (parser.rs:216-222), `default_missing_value("both")`, `require_equals(true)`. `--code=lines` drops the % and bar; `--code=percent` keeps only Files + % + bar. Counting is eza's own dependency-free comment-aware counter (src/loc/mod.rs), language keyed off extension or whole filename via a compile-time phf map — there is no env var and no config knob to extend it (checked options/vars.rs and config.rs).

COST CLAIM: CONFIRMED, and sharper than the audit's wording. `--loc=lines` is free — 0.02s vs 0.02s baseline in monolab, because it only counts the files being listed. `--loc=percent` and bare `--loc` (=both) call `crate::loc::count_roots(&self.loc_roots())` up front (details.rs:199-204, grid_details.rs:274). Correction to the audit: `loc_roots()` (details.rs:245-251) is the *listed path*, not the git repo — git is only used to get an ignore filter via `Repository::discover` (loc/mod.rs:342-359). Measured on this machine: monolab root (2.6G, 1235 tracked files) 0.19-0.31s vs 0.01-0.03s for the same `ll` without it — 10-15x. Worst case is OUTSIDE a repo, where `discover` fails and nothing is filtered: `ll --loc` in ~/WebstormProjects (5.0G, non-repo parent holding monolab + 12 worktrees, node_modules and all) = 2.19s wall / 7.5 CPU-seconds vs 0.02s. Never put this on ls/ll/la.

WHY A DEDICATED ALIAS STILL DOESN'T EARN ITS KEEP. (1) `--loc` is low-information where you'd actually type it. Directories always render `-` in both columns, so `ll --loc` at a project root shows LOC for the handful of top-level files and nothing for the subtrees where the code is — while paying the full-tree denominator walk. And because the numerator is one file and the denominator the whole tree, the percentages are 0.0%/0.1% noise. Verified output in this very repo. (2) It is blind to this repo. Language detection is by extension; every chezmoi file is `dot_zshrc.tmpl`, `run_onchange_install-packages.sh.tmpl`, `dot_tmux.conf`, so extension = `tmpl` = unrecognized. `--code` here reports 512 Markdown / 82.7% (the openspec archive) and zero Shell — the 16k zshrc and the 54k install script are invisible. That number grows with every archived change, so the summary is really "how much openspec prose do I have". Unfixable: the language map is compile-time. (3) `--code` does work well in monolab (0.24s, correct TS/TSX/JS/YAML breakdown, and no tokei/scc/cloc is installed so it isn't redundant) — but it is a standalone report you run by hand a few times a year, and the alias saves five keystrokes on an 11-character command. (4) Namespace cost is real: this repo already has nine eza aliases, and an `lcount`/`lcode`-adjacent name sits next to the existing `lcode` (a *tree* alias) — `lcode` vs `--code` meaning two unrelated things in the same block is a maintenance trap. (5) `--loc` without `-l` is silently ignored (no error, no columns), so an alias would also need to hard-code `-l`, removing the composability that would justify it. Three files touched (zshrc + spec MODIFIED requirement + manual row) for a hand-run flag is the exact trade the standards call out as not worth it.

WHAT TO DO INSTEAD: nothing in config. `eza --code` is worth knowing about — if the separately-proposed manual note about 0.23.5's `=`-required optional-value flags gets written (claims.md item 4 already recommends it), one clause there costs nothing. That belongs to that candidate, not this one.

**Riesgos:** Adopting anyway carries: a permanent 200ms-2.2s foot-gun one typo away from the hot aliases; a spec requirement rewritten from "four" to "five" that then has to stay in sync; and a documented alias that produces actively misleading output (512 Markdown, no Shell) in the repo the manual itself documents. Rejecting carries essentially no risk — both flags remain available by hand, and nothing in the repo uses or references them today (confirmed: no `--loc`/`--code` anywhere in dot_zshrc.tmpl or dot_config/eza/). Provenance caveat on the numbers: measured with the genuine 0.23.5 Homebrew bottle binary extracted to scratchpad and re-linked against /usr/local/opt/libgit2 (the unrelocated bottle SIGSEGVs on any git-touching path — that crash is an artifact of my extraction, NOT an eza bug, and will not occur after a normal `brew upgrade`). No repo file was modified.

**Delta de spec:** none (REJECT). Had it been adopted: zsh-aliases → "eza developer views" requirement, which is worded "four additional eza aliases ... `lla`, `ldev`, `lcode`, `lsize`" (openspec/specs/zsh-aliases/spec.md:21-43) — a MODIFIED requirement (four→five) plus a new scenario, plus a docs/manual.html row in the 9-row eza table at lines ~793-830.

## REJECT — eza --hyperlink=auto (valor low)

MECHANISM — verified against upstream source, not release prose. eza v0.23.5 `src/options/parser.rs:94-97`:

    .arg(arg!(--hyperlink <WHEN> "when to display entries as hyperlinks")
        .num_args(0..=1)
        .value_parser(value_parser!(ShowWhen))
        .default_missing_value("auto"))

`ShowWhen` (parser.rs:169-201) accepts `always | auto | never`, and its `from_str` also maps `""` and `"automatic"` to Auto. There is NO `require_equals(true)` — identical value-eating shape to `--icons`, so a bare `--hyperlink` followed by a path would swallow the path. `src/options/file_name.rs:98-106` maps Auto to `EmbedHyperlinks::Automatic`, and `src/output/file_name.rs:497-501` resolves `Automatic => self.options.is_a_tty`. So the flag does exactly what the audit claims.

(3) PIPING CONCERN — real in the abstract, but `=auto` already dissolves it. fzf runs the ALT-C preview at dot_zshrc.tmpl:153 with stdout as a pipe, and `| head -200` guarantees non-tty regardless; `is_a_tty` is false, so no OSC 8 is emitted. Adding it there would be an inert no-op, not a hazard. Same for `lt`/`lta`. The audit's "skip these sites" advice is correct but for the wrong reason — they are harmless, just pointless.

(2) GHOSTTY — renders OSC 8. Confirmed in the Ghostty 1.3.1 binary: `osc_hyperlink`, "The active OSC8 hyperlink for newly printed characters", "When enabled, highlights OSC8 hyperlinks". Activation is cmd+hover / cmd+click on macOS (`link-url = true` default, per `ghostty +show-config --default --docs`). The ghostty config at dot_config/ghostty/config sets nothing that disables it.

(4) TMUX — this is what kills it, and it is a hard measurement, not a guess:
  - tmux forwards OSC 8 to the outer terminal only when the CLIENT terminal carries the `hyperlinks` feature, which tmux derives from terminfo cap `Hls`.
  - `infocmp -x xterm-ghostty` (resolving to /Applications/Ghostty.app/Contents/Resources/terminfo/78/xterm-ghostty) lists extended caps AX, Su, Tc, XT, BD, BE, Clmg, Cmg, Dsmg, E3, Enmg, Ms, PE, PS, RV, Se, Setulc, Smulx, Ss, Sync, XM, XR. **No `Hls`.**
  - tmux 3.7b's default `terminal-features` is exactly `xterm*:clipboard:ccolour:cstyle:focus:title`, `screen*:title`, `rxvt*:ignorefkeys` — no hyperlinks. Its hardcoded per-terminal feature table names only iTerm2, foot and WezTerm; there is no ghostty entry.
  - dot_tmux.conf is 29 lines and sets no `terminal-features` at all.
  => Inside tmux the hyperlinks are parsed into the grid and silently dropped. This user lives inside tmux: aoe sessions, the `wsh` function at dot_zshrc.tmpl spawns tmux sessions, and the memory notes are all about tmux-resident agents. The feature would be dead in the primary environment and alive only in a bare Ghostty tab.

COST, honestly weighed:
  - Nine alias lines touched (dot_zshrc.tmpl:206-210 and 285-292), or a partial subset that makes the alias block internally inconsistent.
  - Two spec deltas, not one — `zsh-aliases` for the flag set, `tmux-config` for `set -as terminal-features ',xterm-ghostty:hyperlinks'`, which is itself only correct while the attaching client is Ghostty and would need revisiting the day Ghostty ships `Hls` itself.
  - A docs/manual.html touch (the eza table at :785-825 lists all nine aliases).
  - PORTABILITY BREAK: installed eza is 0.23.4 and `eza --hyperlink=auto .` on it prints `eza: Flag --hyperlink cannot take a value` and refuses to list. This is a multi-machine chezmoi repo (README: macOS primary, Linux supported). Any machine whose eza lags 0.23.5 loses `ls`, `ll`, `la` — a hard failure on the most-used commands in the shell, traded for a cosmetic gain.
  - A live footgun: because there is no `require_equals`, the `=` is load-bearing forever. Any future edit that normalises `--hyperlink=auto` to `--hyperlink` turns `ls somedir` into an exit-2 error.
  - Shell startup cost is nil (aliases are free) — that is the one axis where this is cheap.

VALUE: what you actually buy is a cmd-click on a filename that hands a `file://` URI to the macOS system opener — Finder for directories, TextEdit/Preview for files. Not the editor. And this repo already has zoxide, fzf ALT-C with an eza tree preview, television, and lazygit covering navigation faster than the mouse. A mouse affordance that does not survive tmux, does not open your editor, and costs two spec deltas plus a cross-machine breakage risk is not worth one more knob in an already large, deliberately curated config.

WHAT WOULD FLIP THIS: Ghostty shipping `Hls` in its bundled terminfo (or the user accepting a `terminal-features` line in dot_tmux.conf), AND eza 0.23.5 being the floor on every machine this repo targets. Worth a one-line re-check at the next Ghostty major, not worth carrying now.

**Riesgos:** Rejecting carries essentially no risk — the status quo is the current, working behaviour and nothing in the 0.23.4→0.23.5 bump forces a decision here. The only thing lost is a cosmetic affordance. Two caveats on the evidence: (a) I could not read `#{client_termfeatures}` from a live attached Ghostty client because the session is detached, so the tmux conclusion rests on the terminfo dump plus tmux's default feature table rather than a live client read — both are direct measurements of this machine, but a live attach would be the final confirmation; (b) if Ghostty later adds `Hls` to its terminfo, the tmux blocker disappears on its own without any repo change, at which point only the eza-version-floor and low-value arguments remain.

**Delta de spec:** none (REJECT). Had it been adopted it would have cost two deltas, not one: a MODIFIED requirement on `zsh-aliases` › "eza developer views" (openspec/specs/zsh-aliases/spec.md:21-23, which pins the flag set with "All SHALL include `--icons --group-directories-first`"), plus a new requirement on `tmux-config` for the `terminal-features` line without which the feature is inert.

## REJECT — lazygit editConfig hardening — disable the new global `<alt+shift+c>` (`keybinding.universal.editConfig`) added in 0.63.0 (valor low)

Mechanism verified against the v0.64.0 source tarball, not release prose.

WHAT IS REAL:
- `pkg/config/user_config.go:561` puts `EditConfig Keybinding \"yaml:editConfig\"` inside `KeybindingUniversalConfig` (struct spans 463-562); `:1079` defaults it to `Keybinding{\"<alt+shift+c>\"}`.
- `pkg/gui/controllers/global_controller.go` registers it in `GlobalController.GetKeybindings`, and `GlobalController.Context()` returns `nil` — so yes, genuinely global, fires from any panel.
- It calls `EditConfigAction.Call()` (`pkg/gui/controllers/edit_config_action.go`), which resolves `GetUserConfigPaths()` and hands them to `Files.EditFiles(...)`. That is the chezmoi-DEPLOYED `~/.config/lazygit/config.yml`, as the candidate claims.

THE AUDIT'S "NOT A REGRESSION" CLAIM IS CORRECT:
- v0.62.2 `pkg/gui/controllers/status_controller.go:43` already bound `Universal.Edit` (`e`) to `StatusController.editConfig`, which calls the SAME `EditConfigAction`. v0.62.2 `global_controller.go` has zero `EditConfig` occurrences (grep -c = 0). The installed /usr/local/bin/lazygit 0.62.2 symbol table confirms: `controllers.(*StatusController).editConfig` exists, no global equivalent.
- So 0.64.0 widens the surface from one panel to all panels. The capability itself is years old and has never bitten this user — the only scar comment in the file (config.yml:40-42) is about the automatic `subprocess` migration, not about `e`.

DISABLE SYNTAX IS ALSO REAL, AND MIGRATION-SAFE:
- `pkg/config/keybinding.go:36-41` — `UnmarshalYAML` filters out `\"\"` and `\"<disabled>\"`, so an empty Keybinding means "no key bound". `user_config_validation_test.go:122,157,178,203` list `<disabled>` as valid.
- Crucially: `<disabled>` does NOT trigger a rewrite. The only prefix-walking keybinding migration is `changeNullKeybindingsToDisabled` (`pkg/config/app_config.go:381-386`), which fires only on `node.Tag == \"!!null\"` under `keybinding.`. `<disabled>` is `!!str`. Writing `editConfig: null` WOULD rewrite the managed file; `editConfig: <disabled>` would not.

SO THE FEATURE AND THE FIX BOTH WORK. THE QUESTION IS WHETHER TO SPEND THE KNOB. FOUR REASONS NOT TO:

1. ACCIDENTAL FIRING IS NEARLY IMPOSSIBLE HERE. `dot_config/ghostty/config:85` sets `macos-option-as-alt = right`. Left option emits composed characters (documented at docs/manual.html:594 as deliberate, for ISO chars). Firing this needs right-⌥ + shift + c specifically.

2. THIS IS NOT THE SAME CLASS OF RISK AS THE MIGRATION SCAR — and that is the honest answer to point 3. The `output: terminal` guard exists because lazygit rewrites the managed file AT STARTUP, unprompted, silently, on every launch until fixed. `editConfig` opens $EDITOR on a file you are looking at. Drift requires a keypress, then typing, then an explicit save. Even a fully accidental trigger costs `:q` and produces zero drift. Defence in depth is for silent-write paths; this is a visible-write path gated behind three deliberate acts.

3. DISABLING IT CLOSES NOTHING. `e` in the status panel still invokes the identical `EditConfigAction` in 0.64.0 (`status_controller.go:35-40`), and always has. A guard that leaves the equivalent door standing open is a placebo knob, not defence in depth. If the user genuinely wanted this class of protection, the coherent move is `keybinding.universal.edit` too — or making the deployed file read-only — and both are worse ideas with real breakage.

4. IT INVERTS THE SCAR IT INVOKES. `dot_config/lazygit/config.yml` has exactly two top-level keys today: `gui:` (line 4) and `customCommands:` (line 44). No `keybinding:` section. The exploration doc already recognises this at openspec/explorations/brew-update-2026-08.md:229 — the 0.63.0 `viewWorktreeOptions` → `newWorktree` migration is a no-op HERE only because there is no `keybinding:` key to match. Adding one for the first time surrenders blanket immunity to lazygit's whole accumulated keybinding-migration family (executeCustomCommand, cyclePagers, cyclePagersReverse, openMergeTool, viewWorktreeOptions, null→disabled — five already, more coming). Trading that immunity for a guard that protects nothing is the wrong direction, especially when the stated motivation is the migration scar.

COST SIDE, CONCRETELY: a new top-level `keybinding:` block, a comment explaining a non-obvious knob (this config is heavily commented and an uncommented one would be worse), a delta to openspec/specs/lazygit-catppuccin/spec.md — which currently enumerates only theme colours and would need a new requirement to cover a keybinding — plus a likely docs/manual.html row given the repo's update-manual skill triggers on keybinding-level changes. That is three artefacts and permanent maintenance for zero delivered protection.

Not a DEFER: nothing further can be learned that changes this. The mechanism is fully verified and the reasoning does not depend on unknowns. Revisit only if the user reports actually hitting `<alt+shift+c>` by accident, which the right-only option mapping makes unlikely.

**Riesgos:** Accepted by rejecting: `<alt+shift+c>` from any panel opens `~/.config/lazygit/config.yml` in $EDITOR. If the user edits and saves there, `~/.config/lazygit/config.yml` diverges from `dot_config/lazygit/config.yml` and the next `chezmoi apply` silently reverts it (plain managed file, not a template — no merge prompt). This risk already exists via `e` in the status panel and is unchanged in kind by 0.64.0.

Detection is cheap and already covered: `chezmoi status` / `chezmoi diff` surfaces the drift. No new mitigation needed.

Separately confirmed while verifying (not this candidate, but relevant to the upgrade): the current file survives 0.64.0 clean. `output: terminal` is the modern form so `changeCustomCommandStreamAndOutputToOutputEnum` will not fire, and with no `keybinding:` and no `git:` section, none of the other migrations in `computeMigratedConfig` match. Keep it that way — this is a second, independent argument against adding `keybinding:`.

**Delta de spec:** none

## REJECT — worktrunk `wt remove --reap` (0.67.0) + `wt config approvals list` / `clear --stale` (0.66.0), targeting 0.71.0 (valor low)

Verified against v0.71.0 source (cloned at tag v0.71.0), not changelog prose.

ITEM 1+2 — `--reap`: REJECT as alias, and "make it the default" is not possible.

Mechanism (src/cli/mod.rs:502-510, src/commands/remove.rs:159-222, src/git/reap.rs): `lsof -d cwd -F pcn` machine-wide, filter by `cwd.starts_with(worktree)`, drop self, then drop every PID whose `ps -o tty=` shows a controlling terminal. SIGTERM, 1500ms (REAP_KILL_DEADLINE), SIGKILL. No confirmation prompt — it prints the PID list and signals. Flagged `[experimental]` in the flag's own doc comment and in the module header.

(a) NOT configurable. `RemoveConfig` (src/config/user/sections.rs:414-419) has exactly one field, `delete-branch`. There is no `reap` key, and the arg carries no `env=`. Flag-only. Never invent `[remove] reap = true` — it does not exist.

(b) It does not cover this setup's dominant teardown path. `MergeArgs` (src/cli/mod.rs:530-601) has no `reap` field, and `[merge].remove` defaults true — so `wt mc` (the alias this repo actually uses to tear down worktrees) removes the worktree and can never reap. The picker has no reap either. An alias on `wt remove` covers the minority path.

(c) The processes this user would want killed are the ones reap deliberately spares. Nothing in dot_config/worktrunk/config.toml starts a long-lived process — `[[post-start]].install-deps` only runs `bun|pnpm|npm install`. Dev servers here get started by hand or by an agent in a tmux pane, so they hold a pty and are excluded by the controlling-terminal guard. What actually remains reapable is agent-spawned detached children (MCP servers, background bash) — and orphaned `git fsmonitor--daemon`s are already reaped unconditionally by wt's own sweep since 0.5x. Upstream itself says `wt step tether` is the reliable path and that reap is under-inclusive by design.

(d) Alias style. wtlog/wtci/wtpr/mc all exist because the underlying invocation is awkward (jq plumbing, an env-var override, multi-flag combos). `wt remove --reap` is one short flag on a rarely-typed command; a `wtrm` alias would save seven characters while hiding SIGKILL semantics behind a short name — the wrong direction for a destructive operation. Cost would be a config line, a MODIFIED requirement in openspec/specs/worktrunk-config/spec.md ("User-defined wt aliases…"), and a manual row at docs/manual.html:1477. Not earned by an experimental flag.

ITEM 3 — approvals: REJECT, and the premise behind it is factually wrong.

The task states every command in dot_config/worktrunk/config.toml "needs worktrunk approval." It does not. `HookPlan::approve_readonly` (src/commands/hook_plan.rs:243-258) retains any entry where `*source != HookSource::Project`; the comment is explicit — "user pipelines always survive" — and `unapproved_project_commands` skips non-Project sources outright. Approval gates only `<repo>/.config/wt.toml`. So the two `[[pre-start]]` hooks, the `[pre-remove]` jq blob, `[[post-start]].install-deps`, `[commit.generation].command` and all four `[aliases]` are ungated and will never appear in `approvals list` — `list_approvals` (src/commands/config/approvals.rs:52-70) sources its command set solely from `repo.load_project_config()`.

`clear --stale` is unusable in this repo. It calls `require_project_config(&repo)?` (src/commands/config/approvals.rs:196), which errors `ProjectConfigNotFound` when `<repo>/.config/wt.toml` is absent — deliberate, per the inline comment. `find` over the worktree returns no `wt.toml` anywhere. So the flag errors out here.

There is real cruft, but it is inert and out of scope. /Users/etherless/.config/worktrunk/approvals.toml (last touched 15 Mar) holds three approvals under `github.com/pabloimrik17/dotfiles`: `wt step copy-ignored`, an older jq blob missing the `warn: claude settings copy failed` branch, and `echo '{{ base_worktree_path }}' > .claude/.worktree-base` — the pre-`[ -d .claude ]`, pre-`| default(primary_worktree_path)` form. All three are leftovers from when these lived in a project config that no longer exists. They are inert: `approve_readonly` only consults approvals for Project-sourced entries, and there are none. Optional one-time chore: `wt config approvals clear` (plain, no flag — it already exists in the installed 0.65.0, it is not the new feature). approvals.toml is by design kept out of chezmoi ("This allows dotfile management of config.toml without machine-local trust state", src/config/approvals.rs:1-5), so there is nothing for this repo to manage.

Finally, the approvals guidance is already in the agent's path: the installed worktrunk Claude plugin skill documents `wt config approvals add` and the escalate-to-user rule (SKILL.md:110-128 in the plugin cache). Copying it into docs/manual.html creates a second copy that drifts.

Net: zero config surface, zero spec delta, zero manual rows. Take the 0.71.0 bump for the 0.69.0 `wt merge` span fix and the `json-schema = 2` pin already decided; leave these two alone.

**Riesgos:** If adopted anyway, the concrete hazards:

1. Global package-manager store corruption. `[[post-start]].install-deps` runs detached (no tty), so an in-flight `bun install` under a freshly created worktree IS a reap candidate. 1500ms is not a realistic graceful-shutdown window for a package manager, so it gets SIGKILLed. bun/pnpm write into machine-global stores (`~/.bun/install/cache`, the pnpm CAS) — damage there outlives the worktree being deleted. This is the strongest argument against ever wanting reap-by-default here.

2. Experimental surface. `--reap` is marked `[experimental]` in its own help text. Baking it into a chezmoi-managed alias + an openspec requirement + a manual row is exactly the knob that costs a migration when upstream renames or promotes it.

3. Ordering is safe, for the record. `maybe_reap_result` fires at src/commands/remove.rs:355 and :417, before `handle_remove_output`, so the `[pre-remove].sync-claude` jq hook starts after reaping finishes and is not itself killed. No hazard to the Claude settings writeback.

4. Low collateral otherwise. `Path::starts_with` is component-wise, so no `foo`/`foobar` prefix bug; the tty guard fails safe (an unreadable `ps` column counts as "has terminal", and an `lsof`/`ps` spawn failure reaps nothing).

Adjacent, unrelated to this candidate but worth carrying in the upgrade: openspec/specs/worktrunk-config/spec.md still specifies three aliases (wtlog, wtci, mc) while dot_config/worktrunk/config.toml ships four — `wtpr` was added without a spec delta. Same file also still requires `[list].summary = true` and `[list].full = true`, but the config now pins `columns = [...]` instead. Both are pre-existing drift the upgrade change should reconcile.

**Delta de spec:** none

## REJECT — declare brew zsh in BREW_PACKAGES (valor low)

FACTS VERIFIED ON THIS MACHINE

1. Login shell is Apple zsh 5.9. `dscl . -read /Users/etherless UserShell` -> `/bin/zsh`; `$SHELL` -> `/bin/zsh`; `/bin/zsh --version` -> `zsh 5.9 (x86_64-apple-darwin24.0)`. `/etc/shells` lists `/bin/zsh` and NOT `/usr/local/bin/zsh`, so brew zsh cannot become the login shell without a sudo edit this repo never performs. `brew info zsh` -> `Installed (on request)`, `zsh 5.9.1 -> stable 5.9.2`. `brew uses --installed zsh` -> empty: it is a leaf nothing depends on. Intel host, brew prefix `/usr/local`; `/usr/local/bin/zsh -> ../Cellar/zsh/5.9.1/bin/zsh`.

2. WHERE THE OPENCODE SETTING LIVES AND WHAT IT RESOLVES TO. `/Users/etherless/WebstormProjects/dotfiles-worktrees/brew-update/dot_config/opencode/opencode.jsonc:4` has `"shell": "zsh"`. Upstream is `anomalyco/opencode` (the `sst/opencode` path is dead). Chain, read from source not release notes:
   - `packages/opencode/src/tool/shell.ts:595` -> `Shell.acceptable(cfg.shell)`; `packages/opencode/src/session/prompt.ts:518` -> `Shell.preferred(cfg.shell)`.
   - `packages/core/src/shell.ts:205-221` -> `select("zsh")` -> `:114` -> `resolve("zsh")` -> `:89-96`: `full()` is a no-op off win32, `rooted("zsh")` is false, so it returns `which("zsh")`.
   - `packages/core/src/util/which.ts:5-13`: plain `process.env.PATH` first-match.
   macOS `path_helper` reads `/etc/paths`, whose first line is `/usr/local/bin`. So `which zsh` -> `/usr/local/bin/zsh` -> BREW ZSH, and that holds even for a GUI-launched opencode. Confirmed empirically.

3. THE AUDIT PREMISE IS WRONG ON ONE POINT (worth carrying into the proposal). `packages/core/src/shell.ts:169-182` invokes zsh as `["-l","-c", "<body>", "opencode", cwd]` where the body explicitly does `source ~/.zshenv` and `source "${ZDOTDIR:-$HOME}/.zshrc"` before `cd` + `eval`. So `dot_zshrc.tmpl` IS interpreted by brew zsh, on every opencode shell-tool call. `openspec/explorations/brew-update-2026-08-dossier.md:179` states the opposite ("so `dot_zshrc.tmpl` is never interpreted by brew zsh"). Its no-action conclusion survives; its reasoning does not.

4. DOES IT MATTER? No.
   - Same rc, same args, both binaries. Nothing in `dot_zshrc.tmpl` is version-gated; the completion block at `:68-76` guards only on directory existence.
   - Completions are already divergent and already inert. `/bin/zsh -f -c 'print -l $fpath'` -> `/usr/share/zsh/5.9/functions`; `/usr/local/bin/zsh -f` -> `/usr/local/Cellar/zsh/5.9.1/share/zsh/functions`. Each binary carries its own tree; brew's already has 33 functions Apple's lacks and lacks 4 Apple has. That divergence predates 5.9.2 by a full version and has never bitten, because opencode's zsh is a non-interactive `-c` eval: compinit runs via OMZ but only the line editor ever consults it, and the agent never presses TAB. Both fpaths do include the shared `/usr/local/share/zsh/site-functions`, so every brew tool completion is reachable from either.
   - No zcompdump clash: OMZ keys the dump on `$ZSH_VERSION` (`~/.oh-my-zsh/oh-my-zsh.sh:67`), and only `~/.zcompdump-<host>-5.9` exists on disk.
   - 5.9.2's new `_age`/`_namei`/`_hardlink`: verified absent from all three trees today. On upgrade they land on brew zsh's fpath and stay off Apple zsh's. Unreachable from the login shell, irrelevant to a `-c` eval. The dossier's "do not add `/usr/local/share/zsh/functions` to fpath" stands.

5. THE DECISIVE COST POINT: THE NAIVE EDIT IS INERT. The pre-scan at `run_onchange_install-packages.sh.tmpl:108-109` and the install loop at `:129-131` both gate on `command -v "$(pkg_bin "$pkg")"`. macOS always ships `/bin/zsh`, so `command -v zsh` succeeds on a bare machine — verified with `env PATH=/usr/bin:/bin:/usr/sbin:/sbin` -> `/bin/zsh`. Adding `zsh` to the array installs nothing, on any machine, ever. This is the same inertness `openspec/explorations/brew-update-2026-08-gaps.md:14` already adjudicated for `dolt`, but strictly worse: dolt is at least absent on a fresh machine, zsh never is.
   Making it real means extending the `git` special case (`:105` pre-scan and `:118-127` install, both `brew list`-based rather than `command -v`) to a second package — two structural conditionals in one loop — plus a spec delta, plus a README "What's Included" row and a manual row (both `update-readme` and `update-manual` trigger on brew-package changes), plus a permanent new entry in every future brew-audit cycle. And it converts opencode's agent shell from "whatever the OS ships, always works" into a managed, upgradable dependency that shifts under the config on every `brew upgrade` — the single package where one bad bottle takes out every agent shell call at once.

6. THE FRESH-MACHINE ARGUMENT DELIVERS NOTHING HERE. It is the right argument to raise for a dotfiles repo, and I weighed it, but the functional delta is zero: on a fresh machine `select("zsh")` resolves `/bin/zsh` and `Shell.args()` is byte-identical; `fallback()` at `:132-137` is hardcoded to `/bin/zsh` on darwin anyway. The spec's own stated intent at `openspec/specs/opencode-user-config/spec.md:109` — "resolves to zsh on every machine regardless of OpenCode's per-platform default, so the agent inherits aliases, PATH, and shell functions sourced from ~/.zshrc" — is satisfied identically by Apple zsh. Reproducibility of a binary nobody's behaviour depends on is not reproducibility worth paying for.

7. OPTION (c) CONSIDERED AND REJECTED. Pinning `"shell": "/bin/zsh"` would make resolution deterministic and collapse the agent shell onto the login shell; `resolve()` does accept absolute paths (`rooted()` + `statSync().isFile()`, `:89-96`). But `dot_config/opencode/opencode.jsonc` is a plain file, not a `.tmpl`. On Linux `/bin/zsh` usually does not exist, `resolve()` returns undefined, `select()` falls through to `fallback()` -> `which("bash")`, and the agent silently gets bash — violating the spec's own requirement. Fixing that means converting the file to a template: disproportionate for zero functional gain.

RECOMMENDATION: option (b). Leave `zsh` undeclared, accept that a fresh machine's opencode runs Apple zsh, and do not spend a spec delta or a docs row on it. No edit to any file for this candidate.

TWO NON-EDIT FOLLOW-UPS to hand to the proposal (neither needs a spec delta, both are exploration-doc text): correct the "never interpreted by brew zsh" claim at `openspec/explorations/brew-update-2026-08-dossier.md:179`, and record the one-line resolution chain (`"shell": "zsh"` -> `which()` -> `/usr/local/bin/zsh` via `/etc/paths`) so the next audit does not re-litigate this.

**Riesgos:** Rejecting leaves an undocumented machine-specific divergence: opencode's shell tool runs brew zsh here and would run Apple zsh on a fresh machine. A hypothetical zsh-build-specific bug would then reproduce on one and not the other. I judge this low: the two builds are the same 5.9 series, share the same rc and the same invocation, and the only measured difference (the functions tree) is unreachable in a non-interactive `-c` eval.

Second-order risk in the other direction, and the reason I did not soften this to DEFER: if `zsh` were declared, `brew upgrade` would start moving opencode's agent shell on every upgrade cycle. Today a broken brew zsh is survivable — `brew uninstall zsh` restores `which zsh` -> `/bin/zsh` and everything keeps working. Declaring it removes that escape hatch and makes the agent shell a thing that must be audited forever.

Worth stating plainly: the change that would actually eliminate the divergence is `brew uninstall zsh` (it is a leaf, `brew uses --installed zsh` is empty, and nothing in the repo references `/usr/local/bin/zsh`), not declaring it. I am not recommending that either — it is out of scope for a brew upgrade and is itself a user-visible change — but if the divergence ever does become a problem, removal is the one-command fix and declaration is not.

Confidence caveat: the resolution chain was read from `anomalyco/opencode` `dev` HEAD, while the installed binary is 1.18.11. I did not diff HEAD against the 1.18.11 tag. The behaviour is corroborated independently by the observed PATH ordering and by the config schema at https://opencode.ai/config.json ("Default shell to use for terminal and bash tool", `type: string`, no default), so I do not think this changes the verdict — but a `-l -c` args change between 1.18.11 and HEAD is not something I ruled out.

**Delta de spec:** none