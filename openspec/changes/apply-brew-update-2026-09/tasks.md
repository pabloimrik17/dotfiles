Tracked as `WebstormProjects-d2x`. The tap-qualification work is also tracked as
`WebstormProjects-tvi`; close it with this change rather than duplicating it.

## 1. Version holds — first, so nothing later can advance them

- [ ] 1.1 Add a declared hold list to `run_onchange_install-packages.sh.tmpl`, each entry carrying its
      reason and its exit condition, with `beads` as its only member (exit condition: a release whose
      schema cursor reaches v65). Verify by reading the rendered script: the entry carries both fields.
- [ ] 1.2 Apply declared holds in the brew group, before the `BREW_PACKAGES` pre-scan. Verify
      `brew list --pinned` reports `beads` after `chezmoi apply`, and that re-running exits 0 without
      warning.
- [ ] 1.3 Reconcile holds: release any hold the script manages that is no longer declared, so removing
      a declaration actually lifts the hold. Verify by temporarily adding a second entry, applying,
      removing it, re-applying, and confirming `brew list --pinned` drops it.
- [ ] 1.4 Confirm a bulk upgrade cannot move the held package: `brew upgrade --dry-run` reports no
      change for `beads`, and `bd version` still reports 1.2.1.

## 2. Config adoptions — independent of every upgrade

- [ ] 2.1 Change `dot_tmux.conf:22` from `set -gF status-right` to `set -g`. Verify after
      `chezmoi apply` and a fresh tmux server that `tmux show -gv status-right` is non-empty and the
      right-hand bar renders application and session.
- [ ] 2.2 Add `tips = false` under the existing `[ai]` section of `dot_config/atuin/config.toml`.
      Verify the rendered `~/.config/atuin/config.toml` contains it and `atuin` starts without
      surfacing a tip.
- [ ] 2.3 Add `--` immediately before `{}` in `FZF_ALT_C_OPTS` (`dot_zshrc.tmpl:153`). Verify by
      creating a directory whose name starts with `-` and previewing it in the `Alt+C` picker without
      an unknown-option error.
- [ ] 2.4 Add `-group` to all three `terminal-notifier` invocations in
      `dot_config/private_agent-of-empires/modify_private_config.toml:81-86`, using a per-session
      identifier. Verify two transitions in one AoE session replace each other while two different
      sessions notify independently.
- [ ] 2.5 Confirm the two AoE sounds are distinct in the rendered config (`on_waiting` → `Glass`,
      `on_error` → `Basso`) and that neither omits its sound argument. Verify by reading the rendered
      `~/.config/agent-of-empires/config.toml`.
- [ ] 2.6 Add `codex` to the agent-host list in the `gh skill list` comment at
      `run_onchange_install-packages.sh.tmpl:509`. Verify the comment matches what
      `gh skill list` actually reports.
- [ ] 2.7 Add a comment to `dot_config/worktrunk/config.toml` recording that neither `template` nor
      `squash-template` references `{{ user_guidance }}` or `{{ project_guidance }}`, so any
      `commit.generation.template-append` — including a future project-level `.config/wt.toml` — would
      be discarded without a warning. Verify the comment names both placeholders.

## 3. worktrunk `-x` payloads — rewrite and exercise on the installed 0.72.0

- [ ] 3.1 Rewrite the `b` binding (`dot_config/gh-dash/config.yml:74`) to
      `-x claude -- /code-review:code-review {{.RepoName}}#{{.PrNumber}}`. Verify by pressing `b` on a
      real PR and observing Claude start with the review prompt.
- [ ] 3.2 Rewrite the `B` binding (`:84`), keeping the `tmux split-window` wrapper and matching `b`'s
      `wt` portion exactly. Verify by pressing `B` inside tmux and observing the split pane.
- [ ] 3.3 Rewrite the `f` binding (`:99`) to `-x aoe -- add . -t "pr {{.RepoName}}#{{.PrNumber}}"`.
      Verify by pressing `f` and confirming the queued AoE session's title is the full multi-word
      token, not just its first word.
- [ ] 3.4 Rewrite the `F` binding (`:110`) to pass `aoe` to `-x` and `add . -t … -g … -l
      --extra-args …` after `--`. Verify by pressing `F` and confirming the session is grouped,
      launched, and carries the `/review-team` argument — i.e. that `-g`, `-l` and `--extra-args`
      reached `aoe` rather than being consumed by `wt`.
- [ ] 3.5 Confirm the `i` and `I` bindings are unchanged, since `-x claude` is already a bare program
      name. Verify by diffing `dot_config/gh-dash/config.yml`.

## 4. Package and cask data corrections

- [ ] 4.1 Qualify the tap-sourced entries in `BREW_PACKAGES:100`: `tickrs` → `tarkah/tickrs/tickrs`,
      `ticker` → `achannarasappa/tap/ticker`. Verify `brew outdated achannarasappa/tap/ticker` runs
      without `Refusing to load formula`.
- [ ] 4.2 Add `pkg_bin` cases mapping both qualified entries to `tickrs` and `ticker`. Verify a second
      `chezmoi apply` reports both as `already installed, skipping` instead of reinstalling.
- [ ] 4.3 Grant trust to every `BREW_TAPS` entry in the same loop that taps them, before the package
      pre-scan. Verify `brew outdated` lists tap formulae without a qualified name and prints no
      untrusted-tap warning.
- [ ] 4.4 Add `llmfit` to `BREW_PACKAGES` (no tap entry — `homebrew/core`). Verify the rendered array
      has 29 entries and `brew info llmfit` confirms the core source.
- [ ] 4.5 Remove the `alexsjones/llmfit` entry from `~/.config/homebrew/trust.json`. Verify the file
      no longer names that tap and `brew install llmfit` still resolves.
- [ ] 4.6 Remove the `transmission-remote-gui` and `spark` rows from `ALL_CASKS`, plus the
      `transmission-remote-gui` row from `cask_to_app()`. Verify the rendered array has 9 `Optional`
      rows and no prompt offers either cask.
- [ ] 4.7 Rename the `docker` row to `docker-desktop` and `ollama` to `ollama-app`. Verify both tokens
      resolve with `brew info --cask`.
- [ ] 4.8 Make `cask_to_app()` able to return a nested path and map `whatsapp` to
      `WhatsApp.localized/WhatsApp`. Verify the cask group stops reporting WhatsApp as pending on a
      host where it is installed.

## 5. Bottled upgrades, then reclaim disk

- [ ] 5.1 Record the starting baseline: `df -h /System/Volumes/Data` and
      `brew upgrade --dry-run` output. Verify the dry-run lists no new dependencies for the pour set.
- [ ] 5.2 `brew upgrade fd fzf gdk-pixbuf harfbuzz imath libdeflate openexr` — seven pours, `beads`
      excluded by its hold. Verify each reports a bottle pour and no compilation.
- [ ] 5.3 `brew upgrade --cask font-hack-nerd-font font-jetbrains-mono-nerd-font`. Verify the glyphs
      this repo renders still resolve in the prompt.
- [ ] 5.4 Confirm the fzf bracketed-paste fix landed: `Ctrl+T` and `Alt+C` no longer leak paste
      escape sequences.
- [ ] 5.5 `brew cleanup` and record freed space. Verify `df` shows materially more headroom than the
      117 MB available before the pours.

## 6. Source builds, one at a time behind a disk floor

- [ ] 6.1 Establish the floor: abort before starting any compile when free space is under 8 GiB.
      Verify by checking `df` before each of the tasks below and stopping rather than continuing.
- [ ] 6.2 `brew upgrade uv`. Verify all three `modify_` merge scripts still produce their targets
      (`chezmoi diff` clean for `~/.claude/settings.json`, the AoE config, and Junie's `mcp.json`).
- [ ] 6.3 `brew upgrade mole`. Verify `mole uninstall --dry-run` no longer lists the chezmoi-managed
      `~/.claude` tree as app leftovers.
- [ ] 6.4 `brew upgrade gh`. Verify `gh repo sync` and `gh pr view` still work in a worktree and
      `gh skill list` output matches the comment corrected in 2.6.
- [ ] 6.5 `brew upgrade worktrunk`. Verify by re-running the four key presses from group 3 — this is
      the second exercise of each payload, now against the argv semantics that motivated the rewrite.
- [ ] 6.6 `brew upgrade achannarasappa/tap/ticker`. Verify `ticker` renders the portfolio and spot-check
      prices for any holding quoted in a minor currency; the encrypted portfolio is not read by this
      change, so a wrong price is detected here and fixed by hand.
- [ ] 6.7 `brew upgrade lazygit atuin age` one at a time. Verify lazygit's custom commands still load,
      then run `atuin daemon restart` so the patched crates take effect in the long-lived process.
- [ ] 6.8 `brew cleanup` and record the final state: `df`, `brew list --pinned`, `brew outdated`.
      Verify the remaining outdated set is exactly the deferred packages plus the held one.

## 7. Doctrine and documentation

- [ ] 7.1 Rewrite `.agents/skills/classify-tool-updates/SKILL.md:25` so brew-managed no longer means
      "no action" and no longer points at a bulk upgrade. Verify the step describes changelog review
      per package plus the declared-hold outcome.
- [ ] 7.2 Record the Intel bottle EOL as a dated constraint with its architecture scope, and scope the
      deferral reasons for `aoe`, `terminal-notifier`, `tmux`, `dolt` and `chezmoi` to `amd64` rather
      than stating them as properties of the packages. Verify a reader can find the date and the
      scope without reading the exploration document.
- [ ] 7.3 Run the repo's `update-readme` and `update-manual` skills for the tool-level changes in this
      change (`llmfit` added, two casks removed, two cask tokens renamed) and apply only
      platform-neutral prose. Verify the proposed edits contain no `amd64`-only claims.

## 8. Close out

- [ ] 8.1 Re-run `openspec validate apply-brew-update-2026-09 --strict`. Verify it reports valid.
- [ ] 8.2 Confirm every silent failure this change repaired now has an observable check that would
      have caught the original: non-empty `status-right`, distinct AoE sounds, four exercised
      keybindings, a hold that reconciles, and a cask count that matches what brew owns.
- [ ] 8.3 Close `WebstormProjects-tvi` and `WebstormProjects-d2x`, and file beads for the deferred
      work named in the proposal's out-of-scope list that still needs a follow-up — the
      `is_cask_installed` migration above all.
