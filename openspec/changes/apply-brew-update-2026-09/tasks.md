Tracked as `WebstormProjects-d2x`. The tap-qualification work is also tracked as
`WebstormProjects-tvi`; close it with this change rather than duplicating it.

## 1. Version holds — first, so nothing later can advance them

- [x] 1.1 Add a declared hold list to `run_onchange_install-packages.sh.tmpl`, each entry carrying its
      reason and its exit condition, with `beads` as its only member (exit condition: a release whose
      schema cursor reaches v65). Verify by reading the rendered script: the entry carries both fields.
- [x] 1.2 Apply declared holds in the brew group, before the `BREW_PACKAGES` pre-scan. Verify
      `brew list --pinned` reports `beads` after `chezmoi apply`, and that re-running exits 0 without
      warning.
- [x] 1.3 Reconcile holds: release any hold the script manages that is no longer declared, so removing
      a declaration actually lifts the hold. Verify by temporarily adding a second entry, applying,
      removing it, re-applying, and confirming `brew list --pinned` drops it.
- [x] 1.4 Confirm a bulk upgrade cannot move the held package: `brew upgrade --dry-run` reports no
      change for `beads`, and `bd version` still reports 1.2.1.

## 2. Config adoptions — independent of every upgrade

- [x] 2.1 Change `dot_tmux.conf:22` from `set -gF status-right` to `set -g`. Verify after
      `chezmoi apply` and a fresh tmux server that `tmux show -gv status-right` is non-empty and the
      right-hand bar renders application and session.
- [x] 2.2 Add `tips = false` under the existing `[ai]` section of `dot_config/atuin/config.toml`.
      Verify the rendered `~/.config/atuin/config.toml` contains it and `atuin` starts without
      surfacing a tip.
- [x] 2.3 Add `--` immediately before `{}` in `FZF_ALT_C_OPTS` (`dot_zshrc.tmpl:153`). Verify by
      creating a directory whose name starts with `-` and previewing it in the `Alt+C` picker without
      an unknown-option error.
- [x] 2.4 Add `-group` to all three `terminal-notifier` invocations in
      `dot_config/private_agent-of-empires/modify_private_config.toml:81-86`, using a per-session
      identifier. Verify two transitions in one AoE session replace each other while two different
      sessions notify independently.
- [x] 2.5 Confirm the two AoE sounds are distinct in the rendered config (`on_waiting` → `Glass`,
      `on_error` → `Basso`) and that neither omits its sound argument. Verify by reading the rendered
      `~/.config/agent-of-empires/config.toml`.
- [x] 2.6 Add `codex` to the agent-host list in the `gh skill list` comment at
      `run_onchange_install-packages.sh.tmpl:509`. Verify the comment matches what
      `gh skill list` actually reports.
- [x] 2.7 Add a comment to `dot_config/worktrunk/config.toml` recording that neither `template` nor
      `squash-template` references `{{ user_guidance }}` or `{{ project_guidance }}`, so any
      `commit.generation.template-append` — including a future project-level `.config/wt.toml` — would
      be discarded without a warning. Verify the comment names both placeholders.
- [x] 2.8 Make `dot_config/private_agent-of-empires/modify_private_config.toml` exit non-zero and name
      the target file when the uv merge engine fails or its output does not re-parse as TOML, instead
      of passing the live config through while `chezmoi apply` still exits 0. Only the uv-absent
      branch stays pass-through (a cold-start path, not a failure); empty stdin runs the merge like any
      other input. Verify by forcing the engine to fail and observing a non-zero exit whose message
      names the file.
- [x] 2.9 Same for `dot_claude/modify_settings.json.tmpl`, whose uv-absent branch emits `{}` when there
      is no live file. Verify the same way.
- [x] 2.10 Same for `dot_junie/mcp/modify_mcp.json.tmpl`, whose uv-absent branch emits `{}` when there
      is no live file. Verify the same way.

## 3. worktrunk `-x` payloads — rewrite and exercise on the installed 0.72.0

- [x] 3.1 Rewrite the `b` binding (`dot_config/gh-dash/config.yml:74`) to
      `-x claude -- /code-review:code-review {{.RepoName}}#{{.PrNumber}}`. Verify by pressing `b` on a
      real PR and observing Claude start with the review prompt.
- [x] 3.2 Rewrite the `B` binding (`:84`), keeping the `tmux split-window` wrapper and matching `b`'s
      `wt` portion exactly. Verify by pressing `B` inside tmux and observing the split pane.
- [x] 3.3 Rewrite the `f` binding (`:99`) to `-x aoe -- add . -t "pr {{.RepoName}}#{{.PrNumber}}"`.
      Verify by pressing `f` and confirming the queued AoE session's title is the full multi-word
      token, not just its first word.
      *Superseded on merge with `main` (task 9.4): `f` now calls the `ghd-aoe` helper.*
- [x] 3.4 Rewrite the `F` binding (`:110`) to pass `aoe` to `-x` and `add . -t … -g … -l
      --extra-args …` after `--`. Verify by pressing `F` and confirming the session is grouped,
      launched, and carries the `/review-team` argument — i.e. that `-g`, `-l` and `--extra-args`
      reached `aoe` rather than being consumed by `wt`.
      *Superseded on merge with `main` (task 9.4): `F` now calls the `ghd-aoe` helper.*
- [x] 3.5 Confirm the `i` and `I` bindings are unchanged, since `-x claude` is already a bare program
      name. Verify by diffing `dot_config/gh-dash/config.yml`.

## 4. Package and cask data corrections

- [x] 4.1 Qualify the tap-sourced entries in `BREW_PACKAGES:100`: `tickrs` → `tarkah/tickrs/tickrs`,
      `ticker` → `achannarasappa/tap/ticker`. Verify `brew outdated achannarasappa/tap/ticker` runs
      without `Refusing to load formula`.
- [x] 4.2 Add `pkg_bin` cases mapping both qualified entries to `tickrs` and `ticker`. Verify a second
      `chezmoi apply` reports both as `already installed, skipping` instead of reinstalling.
- [x] 4.3 Grant trust to every `BREW_TAPS` entry in the same loop that taps them, before the package
      pre-scan. Verify `brew outdated` lists tap formulae without a qualified name and prints no
      untrusted-tap warning.
- [x] 4.4 Add `llmfit` to `BREW_PACKAGES` (no tap entry — `homebrew/core`). Verify the rendered array
      has 29 entries and `brew info llmfit` confirms the core source.
      *Superseded on merge with `main` (task 9.1): the entry is `AlexsJones/llmfit/llmfit`, from the tap.*
- [x] 4.5 Remove the `alexsjones/llmfit` entry from `~/.config/homebrew/trust.json`. Verify the file
      no longer names that tap and `brew install llmfit` still resolves.
      *Reversed on merge with `main` (tasks 9.2, 9.3): the tap is declared again, and trusted.*
- [x] 4.6 Remove the `transmission-remote-gui` and `spark` rows from `ALL_CASKS`, plus the
      `transmission-remote-gui` row from `cask_to_app()`. Verify the rendered array has 9 `Optional`
      rows and no prompt offers either cask.
- [x] 4.7 Rename the `docker` row to `docker-desktop` and `ollama` to `ollama-app`. Verify both tokens
      resolve with `brew info --cask`.
- [x] 4.8 Make `cask_to_app()` able to return a nested path and map `whatsapp` to
      `WhatsApp.localized/WhatsApp`. Verify the cask group stops reporting WhatsApp as pending on a
      host where it is installed.

## 5. Bottled upgrades, then reclaim disk

- [x] 5.1 Record the starting baseline: `df -h /System/Volumes/Data` and `brew upgrade --dry-run`
      output. Classify every package in this change as pour or source build from that output rather
      than from the plan — the residual bottle stock shrinks between writing and executing, and `fzf`
      already moved. Record every package whose available version is higher than the version this
      change researched. Verify the dry-run lists no new dependencies for the pour set.
- [x] 5.2 `brew upgrade fd gdk-pixbuf harfbuzz imath libdeflate openexr` — six pours, `beads`
      excluded by its hold. `fzf` was a seventh when this was written; 0.74.4 has no `amd64` bottle,
      so it moves to 6.7. Verify each reports a bottle pour and no compilation.
- [x] 5.3 `brew upgrade --cask font-hack-nerd-font font-jetbrains-mono-nerd-font`. Verify the glyphs
      this repo renders still resolve in the prompt.
- [x] 5.4 For every package recorded in 5.1 as available at a higher version than the one this change
      researched — `fzf` 0.74.3→0.74.4, `uv` 0.12.10→0.12.13, `atuin` 18.21.0→18.22.0, `worktrunk`
      0.76→0.77.0 at the time of writing — read the changelog for the extra delta and report anything
      that touches a chezmoi-managed file before upgrading. Then upgrade to the available version:
      Homebrew serves no versioned formula for any of them, so installing the researched version would
      mean building an extracted formula revision `homebrew/core` no longer carries. Verify no upgrade
      in groups 5 and 6 lands a version range nobody has read.
- [x] 5.5 `brew cleanup` and record freed space. Verify `df` shows materially more headroom than the
      117 MB available before the pours.

## 6. Source builds, one at a time behind a disk floor

- [x] 6.1 Establish the floor. The original — abort when free space is under 8 GiB, checked between
      packages — does not hold: a driver implementing exactly it ran `uv` from 13.00 GiB free, and the
      single upgrade consumed 4.65 GiB and was at 8.35 GiB when it was stopped. A floor checked
      *between* packages cannot stop one package from crossing it *during* a build. Re-specified
      2026-09-12 as a per-package headroom estimate, sized to the toolchain each build pulls. The
      compilers themselves are unbottled on every platform — `rust`, `go` and `protobuf` ship as
      source tarballs with an empty bottle stanza — while `cmake`, `ninja` and `python@3.14` still
      pour, so the cost is the compiler each package drags in:
      - **Rust** — `uv`, `worktrunk`, `atuin`. `rust` builds from source; the one measured attempt
        consumed 4.65 GiB without finishing. Require **≥ 13 GiB free** before starting. `atuin`
        also builds `protobuf` and needs more, not less.
      - **Go** — `mole`, `gh`, `lazygit`, `age`, `fzf`. `go` is not installed and has no bottle, so
        the first of these compiles the Go toolchain too. Unmeasured at the time of writing: required
        **≥ 13 GiB** for the first, to be re-sized from what it actually consumed.
        **Measured 6.3 (2026-09-12): the Go class is cheap.** `go` 1.27.1 built in 4m30s for a 245 MB
        keg, and `mole` itself took 25s for 11.3 MB; the volume moved 17 → 15 GiB and most of that
        came back. The ≥ 13 GiB figure was carried over from the Rust class and does not describe
        this one. `go` is now installed, so `gh`, `lazygit`, `age` and `fzf` compile only their own
        binary: **≥ 3 GiB** is ample for each.
      - `ticker` — no build dependencies, a 9.3 MB keg. Not a compile; no floor applies.
      Verify by reading `df -h /System/Volumes/Data` before each of 6.2-6.8 and refusing to start a
      package whose class exceeds the headroom. **Applied 2026-09-12:** the host stood at 8.4 GiB —
      below both classes, and `brew cleanup` reclaims only 119 MB — so the estimate stopped every
      compile and admitted only 6.6, the one package with no build dependency. ~5.6 GiB was then
      freed from outside Homebrew, putting the volume at 14 GiB, and 6.2 onward resumed against that.
- [x] 6.2 `brew upgrade uv`. Verify all three `modify_` merge scripts still produce their targets
      (`chezmoi diff` clean for `~/.claude/settings.json`, the AoE config, and Junie's `mcp.json`).
      **Done 2026-09-12, 0.12.3 → 0.12.13, in two attempts.** The first ran 1h50m, built and installed
      `rust` 1.98.1, then died on a cached formula file that had vanished from the downloads cache
      mid-run — see the second Rollback correction in `design.md` for the built-but-not-linked state
      it left. The retry, with `HOMEBREW_NO_INSTALL_CLEANUP=1`, reused the built `rust` and compiled
      `uv` in 43 minutes. Verification: all three targets report a clean `chezmoi diff`. The AoE
      config was not clean at first — task 2.4's `-group` edit had never been applied to the live
      file — which incidentally proved the merge engine works rather than failing it: the script ran
      under the new `uv` and produced exactly the intended three-line diff. After applying, the live
      file re-parses as TOML, keeps `Basso`/`Glass` distinct, and carries `-group` on all three hooks.
      Left open: `rust` 1.98.1 is installed but 1.98.0 stays linked. `brew cleanup` refuses to remove
      a linked keg, so nothing is at risk; `rust` remains in `brew outdated`, which matches its
      out-of-scope deferral.
- [x] 6.3 `brew upgrade mole`. Verify `mole uninstall --dry-run` no longer lists the chezmoi-managed
      `~/.claude` tree as app leftovers.
      **Done 2026-09-12, → 1.53.0**, pulling `go` 1.27.1 (4m30s, 245 MB). Verified non-interactively:
      `mole uninstall --dry-run Claude` lists seven paths and none is `~/.claude` or `~/.agents` —
      everything it names is `com.anthropic.claudefordesktop` data under `~/Library`, which genuinely
      belongs to the desktop app. `Claude Code URL Handler` lists only its own bundle. Note the bare
      `mole uninstall --dry-run` form is an interactive selector and shows no leftovers at all, so it
      cannot serve as the check; the per-app form is what has to be read.
- [x] 6.4 `brew upgrade gh`. Verify `gh repo sync` and `gh pr view` still work in a worktree and
      `gh skill list` output matches the comment corrected in 2.6.
      **Done 2026-09-12, 2.97.0 → 2.100.0** (1m54s, `go` already installed).
      - Repo resolution from the worktree: `gh repo view` returns `pabloimrik17/dotfiles`. ✓
      - `gh pr view 192` returns `#192 MERGED`. ✓
      - `gh repo sync` is worktree-aware and refuses safely: *"can't sync \"main\" because it's
        checked out in another worktree at .../dotfiles"*, with a tip naming the right worktree.
        Nothing changed — branch, local `main` and the 17 modified files were identical afterwards.
        A refusal is the correct outcome here and still exercises the worktree handling the upgrade
        put at risk. Noted in passing: local `main` (3f1e8fc) is behind `origin/main` (87fcf68); that
        is the other checkout's business, not this change's.
      - `gh skill list` now reports `['codex', 'cline', 'universal', 'warp']` for the gh-installed
        skills, against `['cline', 'universal', 'warp']` on 2.97.0. Both halves of the 2.6 comment are
        now confirmed empirically rather than predicted. ✓
- [x] 6.5 `brew upgrade worktrunk`. Verify by re-running the four key presses from group 3 — this is
      the second exercise of each payload, now against the argv semantics that motivated the rewrite.
      **Done 2026-09-12, 0.72.0 → 0.77.0** (6 minutes).
      - `wt config show` exits **0**, which is the check the proposal flags as mandatory immediately
        after this upgrade: 0.77.0 started exiting non-zero on a broken config or invalid
        `[list] columns`, where it always exited 0 before. The repo's
        `columns = ["branch", "working-diff", "branch-diff", "ci", "summary"]` is still valid.
      - Payloads re-exercised on 0.77.0 in a throwaway repo with a recorder standing in for
        `claude`/`aoe` — the same method group 3 used on 0.72.0. `b`: `claude` gets 2 arguments.
        `f`: `-t` carries `pr dotfiles#999` as **one** argument. `F`: 9 arguments, with `-g`, `-l` and
        `--extra-args` all reaching `aoe` instead of being consumed by `wt`, and `--extra-args`
        holding `/review-team dotfiles#999` as one argument.
      - `B` was not executed: it opens a tmux pane, and this session is forbidden from mutating tmux.
        Verified instead by the comparison its own scenario specifies — its `wt` portion is byte-for-byte
        identical to `b`'s.
      - **Still outstanding, needs a human at a terminal:** physically pressing the four keys in
        gh-dash against a real PR. Nothing above exercises gh-dash's own template rendering. Already
        recorded in the proposal's outstanding verifications and in 8.2.
      - False alarm worth recording: `wt` printed *"Shell wrapper is out of date"* during the test.
        It is an artefact of running in a non-interactive shell that never sourced `~/.zshrc`. The
        repo evals `wt config shell init zsh` at every shell start (`dot_zshrc.tmpl:179`, live at
        `~/.zshrc:163`, `chezmoi diff` clean), so the wrapper regenerates from the installed binary
        and cannot go stale. Same shape as the lazygit/PATH incident already on record.
- [x] 6.6 `brew upgrade achannarasappa/tap/ticker`. Verify `ticker` renders the portfolio and spot-check
      prices for any holding quoted in a minor currency; the encrypted portfolio is not read by this
      change, so a wrong price is detected here and fixed by hand.
      **Done 2026-09-12, 5.2.1 → 5.3.0.** `ticker print` renders all 24 holdings with live prices and
      `ticker print summary` totals them. The spot-check has no subject: every symbol in both `lots`
      and `watchlist` is a US listing quoted in USD, so `minor currency support (#372)` — the feature
      this change accepted the phone-home updater for — buys this portfolio nothing today.
- [x] 6.7 `brew upgrade lazygit atuin age fzf` one at a time. Verify lazygit's custom commands still
      load, then run `atuin daemon restart` so the patched crates take effect in the long-lived
      process. `fzf` is here rather than in the pour set because 0.74.4 builds from source on `amd64`;
      after it lands, confirm the bracketed-paste fix: `Ctrl+T` and `Alt+C` no longer leak paste
      escape sequences.
      **Done 2026-09-12, one at a time**: `lazygit` 0.64.0 → 0.65.0 (20s), `atuin` 18.19.0 → 18.22.0
      (30min, pulling `protobuf` 36.1 at 4m17s plus `abseil` and `cmake` as pours), `age` 1.3.1 →
      1.3.2 (11s), `fzf` 0.74.2 → 0.74.4 (6s).
      - lazygit: config parses, and its one custom command (`g` → `mdview`) is intact with the helper
        present at `~/.local/bin/mdview`, on PATH. `mdview` itself was not run to completion — it
        opens a viewer that waits for a TTY and hangs without one, which is known behaviour, not a
        regression.
      - atuin: `atuin daemon restart` replaced the long-lived process, which is the whole point of
        the step — the old daemon kept running unpatched crates. New daemon reports 18.22.0, sync
        against `api.atuin.sh` works, `tips = false` survives at line 14 and `chezmoi diff` is clean.
      - age: verified through the job it actually does here — `chezmoi diff ~/.ticker.yaml` is clean,
        so the repo's `encrypted_dot_ticker.yaml.age` still decrypts.
      - fzf: 0.74.4 carries the #4899 fix. The `--` guard from 2.3 was re-verified against a real
        dash-prefixed directory, and it is a check that can fail: without `--`, `eza` reads
        `-weird-dir` as `-w eird-dir` and errors *invalid value 'eird-dir' for '--width <COLS>'*;
        with it, the tree renders.
      - **Still outstanding, needs a human at an interactive shell:** the bracketed-paste symptom
        itself — pressing `Ctrl+T` and `Alt+C` and confirming no paste escape sequences leak. Nothing
        non-interactive reproduces it.
- [x] 6.8 `brew cleanup` and record the final state: `df`, `brew list --pinned`, `brew outdated`.
      Verify the remaining outdated set is exactly the deferred packages plus the held one.
      **Done 2026-09-12. Freed ~5 GB: 12 GiB free / 95% → 17 GiB / 92%.** `brew list --pinned`
      reports `beads` and nothing else. Removed: `chezmoi` 2.72.0, `dolt` 2.1.10 and 2.2.3, `llmfit`
      1.1.11, plus 21 staging directories the interrupted bulk upgrades below left in
      `var/homebrew/tmp/.cellar` (`cargo-c` 127.8 MB and `python@3.14` 72 MB the largest). `brew
      doctor` reports no unlinked keg, and no formula has a newer keg installed than the one linked.
      **The outdated set is not exactly the deferred set.** Nine entries: `aoe`, `aom`, `beads`
      (annotated `[pinned at 1.2.1]`), `librsvg`, `little-cms2`, `pcre2`, `rust`, `terminal-notifier`,
      `tmux`. Seven of them are the deferred packages plus the held one, as specified. The
      discrepancies, all accounted for:
      - **`dolt` and `chezmoi` left the set — `bubu` upgraded them today**, outside this change.
        Shell history records `bubu` at 17:56:22, 17:56:53 and 18:04:47, each exiting 130
        (interrupted); `dolt` 2.2.3 → 2.3.3 landed at 18:02:07 and `chezmoi` 2.72.0 → 2.72.1 at
        18:05:48. Both are installed, linked and healthy (`dolt version` 2.3.3; `chezmoi doctor`
        all-`ok` on 2.72.1). Both landed versions are ones this change researched, so nothing unread
        shipped. The premise this falsifies is corrected in `design.md`.
      - **`beads` survived all three runs**, still pinned at 1.2.1 and still reported outdated. That
        is the `brew-version-pins` scenario *A bulk upgrade cannot advance beads*, observed against a
        real bulk upgrade rather than a dry run.
      - **`rust` 1.98.0 < 1.98.1** — left open by 6.2 and out of scope. The built-but-unlinked 1.98.1
        keg from 6.2 is gone; only 1.98.0 remains, linked, so the state is consistent and the outdated
        report is honest rather than masking a half-applied upgrade.
      - **`librsvg` 2.62.3 < 2.63.0 is new** and is named nowhere in this change. It belongs to the
        same class as `little-cms2`/`aom`/`pcre2`: a transitive dependency — its installed consumers
        are `mdfried` and `chafa` — with no direct use here, and an `amd64` source build. Deferred on
        the same grounds, recorded so the next audit does not read it as drift nobody noticed.
      Noted, not fixed: `brew doctor` warns that `alexsjones/llmfit` is an untrusted tap. 4.5 removed
      its `trust.json` entry, but the tap itself is still tapped, so the warning persists until it is
      untapped. `llmfit` resolves from `homebrew/core` either way. Filed in 8.3.

## 7. Doctrine and documentation

- [x] 7.1 Rewrite `.agents/skills/classify-tool-updates/SKILL.md:25` so brew-managed no longer means
      "no action" and no longer points at a bulk upgrade. Verify the step describes changelog review
      per package plus the declared-hold outcome.
- [x] 7.2 Record the Intel bottle EOL as a dated constraint with its architecture scope, and scope the
      deferral reasons for `aoe`, `terminal-notifier`, `tmux`, `dolt` and `chezmoi` to `amd64` rather
      than stating them as properties of the packages. Verify a reader can find the date and the
      scope without reading the exploration document.
- [x] 7.3 Run the repo's `update-readme` and `update-manual` skills for the tool-level changes in this
      change (`llmfit` added, two casks removed, two cask tokens renamed) and apply only
      platform-neutral prose. Verify the proposed edits contain no `amd64`-only claims.

## 8. Close out

- [x] 8.1 Re-run `openspec validate apply-brew-update-2026-09 --strict`. Verify it reports valid.
      **Done 2026-09-12**, after the 6.8 and 8.3 write-ups and the `bubu` premise correction in
      `design.md` and `proposal.md`: *Change 'apply-brew-update-2026-09' is valid*.
- [x] 8.2 Confirm every silent failure this change repaired now has an observable check that would
      have caught the original: non-empty `status-right`, distinct AoE sounds, four exercised
      keybindings, a hold that reconciles, and a cask count that matches what brew owns.
      **Audited 2026-09-12. Four of the five already had a failable scenario; the fifth did not.**
      - `status-right` — `tmux-catppuccin`, *Empty status-right is detectable*. ✓
      - AoE sounds — `agent-manager`, *Error and waiting sounds are different*. ✓
      - keybindings — `gh-dash-keybindings` gained the requirement *Keybinding payloads are verified
        by invocation, not by inspection*, with *Each argv-passing binding is exercised* and *A broken
        payload is observable*. ✓ The check exists; it is not yet satisfied — the four keys were
        exercised through `wt` 0.72.0 with a recorder, not physically pressed. See the proposal's
        outstanding verifications, and 6.5.
      - cask data — `gui-app-install`, *Removed rows are absent*, *Renamed tokens resolve*, *A
        disabled cask is not offered*, *No mapping survives its cask*. ✓
      - **hold reconciliation — no check existed.** `brew-version-pins` required only that declared
        holds be *applied*; the release path that task 1.3 implemented had no requirement and no
        scenario, so removing a declaration could silently stop working and nothing would notice.
        Closed by adding the requirement *Lifting a declaration actually lifts the hold*, with
        scenarios for releasing an undeclared hold, leaving hand-made pins alone, and not churning an
        unchanged declaration.
      One silent failure named in the proposal is **not** covered and is not meant to be: the cask
      group reporting 30/30 while brew manages two. That is `is_cask_installed`'s directory test,
      explicitly out of scope here; 8.3 files it.
- [x] 8.3 Close `WebstormProjects-tvi` and `WebstormProjects-d2x`, and file beads for the deferred
      work named in the proposal's out-of-scope list that still needs a follow-up — the
      `is_cask_installed` migration above all.
      **Done 2026-09-12.** Both beads are closed, each naming this change as the reason; `d2x` also
      carries a closing note with the group 6 results and pointers to the follow-ups below. The
      `is_cask_installed` migration was already filed as `WebstormProjects-ndi`, so it was not
      duplicated.
      Follow-ups filed in the `agentic-task` tracker, labelled `project:personal` — this repo's beads
      belong there rather than in a dotfiles-local database:
      - `agentic-task-4wv` (P2) — the four verifications that need a human at a terminal: the gh-dash
        keys pressed on a real PR, the two AoE `-group` transitions, `tmux kill-server` from outside
        tmux, and the `Ctrl+T`/`Alt+C` bracketed-paste check on fzf 0.74.4.
      - `agentic-task-ddx` (P3) — adversarial verification of the transitive formulae this cycle
        poured or deferred, `librsvg` included after 6.8 surfaced it.
      - `agentic-task-qo4` (P3) — the five unread pcre2 security entries in 10.47 → 10.48.
      - `agentic-task-a4n` (P3) — the three unread atuin 18.20.0 betas.
      - `agentic-task-b1x` (P2, decision) — AoE's three unmanaged security keys as a class, which is
        what actually blocks the deferred `aoe` 1.16.0 upgrade.

## 9. Merge with `main` — 2026-09-13

`main` gained `add-claude-code-fullscreen-tui` (#196), `add-llmfit` (#197) and
`improve-ghd-aoe-integration` (#198) while this change was open. Git conflicts in
`run_onchange_install-packages.sh.tmpl`, `dot_config/gh-dash/config.yml` and `README.md`; spec
overlap in `cli-tool-expansion`, `gh-dash-keybindings` and `llmfit-install`.

- [x] 9.1 Resolve llmfit toward `main`: `AlexsJones/llmfit/llmfit` in `BREW_PACKAGES`,
      `AlexsJones/llmfit` in `BREW_TAPS`, and its `pkg_bin` arm beside tickrs and ticker. Decided by
      the user: the tap ships a prebuilt binary, while core is a Rust build on every `amd64` upgrade.
      Verify the rendered script has 29 entries, no bare `llmfit`/`tickrs`/`ticker`, and `pkg_bin`
      returns the bare binary for all three qualified entries.
      **Done.** `chezmoi execute-template` then `bash -n` is clean; 29 entries; all three arms map.
- [x] 9.2 Trust every `BREW_TAPS` entry, before tapping it. Decided by the user, superseding
      `add-llmfit` D7. Verify with a stubbed `brew` that the loop runs trust then tap for each entry,
      skips the tap when trust fails, and logs both failures.
      **Done.** `trust --tap` precedes `tap` for all three; a failed trust logs `Failed to trust tap`
      and never taps; a failed tap logs `Failed to tap`. Against a scratch `XDG_CONFIG_HOME`,
      `brew trust --tap` succeeds for a tap that was never registered and a second call reports
      `Already trusted tap` — which is what lets trust come before `brew tap`.
- [x] 9.3 Apply the trust decision on this host for `AlexsJones/llmfit`.
      **Done, with a limit.** The tap was registered but untrusted, the state 4.5 left. `brew trust
      --tap` then `brew tap` ran with no untrusted-tap refusal, a second pass was a no-op, and
      `brew doctor` no longer warns about the tap. The fresh-host path — `brew tap` on a tap never
      registered — was **not** exercised: simulating it needs `brew untap`, and `brew untap` on an
      untrusted tap is itself refused (`Refusing to load formula … from untrusted tap`). That path
      rests on the scratch trust write in 9.2 and on `add-llmfit` D7's account of the gate.
      This host's `llmfit` is still the core build. Switching it is manual (`add-llmfit` D3) and is
      filed as `agentic-task-l60`.
- [x] 9.4 Resolve gh-dash toward `main` for `f` and `F` (the `ghd-aoe` helper) and keep this change's
      `b`/`B` rewrite. Drop the `f`/`F` `MODIFIED` blocks from the `gh-dash-keybindings` delta, which
      would otherwise overwrite `main`'s newer requirements on archive.
      **Done.** `README.md` takes `main`'s llmfit row. `agentic-task-4wv` now asks for `b` and `B`
      only.
- [x] 9.5 Rewrite the `cli-tool-expansion` delta against `main`'s spec, keeping every scenario name
      `main` has; add an `llmfit-install` delta replacing its no-trust contract; move the ticker and
      tickrs deltas to the trust-then-tap order.
      **Done.**
- [x] 9.6 Run the quality gates on the merged tree.
      **Done.** `openspec validate apply-brew-update-2026-09 --strict`: valid. `openspec validate
      --all --strict`: 22 failures, the same 22 as an extract of `origin/main` — pre-existing, none
      introduced. `bun test`: 40 pass. `oxfmt --check`: clean.
- [x] 9.7 Pass CI's pinned validator (`bunx @fission-ai/openspec@1.2.0 validate --changes`), not only
      the local 1.11.0 `--strict`.
      **Done.** The merge commit got this PR's first CI run — GitHub runs no `pull_request` workflow
      while a PR has conflicts — and it failed. The same three errors reproduce on the pre-merge
      commit 75842ad, so the merge did not cause them: 1.2.0 requires SHALL or MUST in the opening
      text of each ADDED requirement, and *Version holds are declared in the repo…*, *The Intel bottle
      end-of-life is recorded…* and *A managed step SHALL NOT report success…* opened with context.
      Each now leads with its SHALL clause, meaning unchanged; 1.2.0 and 1.11.0 `--strict` both pass.
