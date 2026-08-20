## 1. Ranges never read end to end

`brew outdated` today is **29 formulae + 1 cask**; the proposal (`openspec/changes/brew-upgrade-and-claude-settings/proposal.md:3,22,80`) still says **28**. Six targets have no range coverage in any artifact:

| Formula | Range | Status in artifacts |
|---|---|---|
| **pango** | 1.58.0 → 1.58.2 | zero mentions, anywhere |
| **font-jetbrains-mono-nerd-font** (cask) | 3.4.0 → 3.5.0 | zero mentions |
| **uv** | …→ **0.12.2** | all artifacts stop at 0.12.1 (gaps.md gap 1 read endpoints at tag 0.12.1) |
| **fontconfig** | 2.18.1 → 2.18.**3** | dismissed at `-dossier.md:179` as "no sourced change" |
| **openjph** | 0.30.1 → 0.**31**.0 | same catch-all |
| **llhttp** | 9.4.2 → 9.4.3 | same catch-all |

The three catch-all dismissals are contradicted by today's version numbers — these are source bumps, not revision rebuilds, and llhttp feeds `libgit2` + `git-delta` while openjph/fontconfig/pango feed `chafa`/`mdfried`. The sweep's claimed coverage of uv 0.12.2 / pango / fontconfig / the cask **left no written artifact** — nothing to review, nothing to inherit.

Also thin: **harfbuzz** 14.2.1→14.3.0 is dismissed with "Ghostty ships its own text stack", but `brew uses --installed --recursive harfbuzz` = `chafa librsvg mdfried pango`. The rationale answers a consumer that isn't the one at risk.

## 2. Repo files an upgrading tool touches that nobody has read

- `/Users/etherless/WebstormProjects/dotfiles-worktrees/brew-update/dot_local/bin/executable_mdview` — the dispatcher that routes to **mdfried**, the single consumer of pango, fontconfig, harfbuzz, libtiff, jpeg-xl, openjph, dav1d, openexr and chafa. Eight of the "no repo change" formulae land on this one file's runtime and it is unmentioned in all five artifacts.
- `/Users/etherless/WebstormProjects/dotfiles-worktrees/brew-update/dot_config/private_agent-of-empires/themes/catppuccin-mocha.toml` — 37 hand-mapped theme tokens. aoe 1.12→1.14 got a byte-level audit of `CLAUDE_HOOK_EVENTS`, `config.toml` and `state.toml`, but nobody asked whether 1.13/1.14 added theme roles. That is exactly the atuin-syntax-highlight failure mode (Must-do #4) applied to a different file, and it was not applied.
- `/Users/etherless/WebstormProjects/dotfiles-worktrees/brew-update/dot_config/atuin/TERMINAL.md` — atuin 18.16.1→18.19.0 with `[ai] enabled`; the AI-context file itself was never checked against the range.

## 3. Proposal claims on a single unverified source

- **`jq` is not a declared dependency.** `BREW_PACKAGES` (`run_onchange_install-packages.sh.tmpl:79`) has no `jq`; on this machine `command -v jq` → `/usr/bin/jq` (jq-1.7.1-**apple**), not Homebrew. The proposal (`:13`) justifies the whole `modify_` conversion with "jq … already a dependency of the worktrunk `sync-claude` hook" — but there jq is *soft* (warn-and-skip, spec'd at `openspec/specs/claude-settings-writeback/spec.md`, "jq is not installed → log a warning and exit"). In a `modify_` script, chezmoi writes stdout verbatim: **jq missing or erroring means `~/.claude/settings.json` is replaced by an empty file.** The aoe precedent guards this at `dot_config/private_agent-of-empires/modify_private_config.toml:24-31` (`command -v uv` → `cat "$infile"`) and `:106-110`. The proposal states no equivalent requirement. This is the sharpest hole in the sweep.
- **libgit2 reach is understated.** Proposal `:20` says "reachable here via `bat`/`eza`". `brew uses --installed --recursive libgit2` = `bat eza **git-delta**`. The dossier had all three (`:126`); the proposal dropped the one that matters most (delta is the git pager in `dot_gitconfig.tmpl` and the `wt switch` picker pager at `dot_config/worktrunk/config.toml:12`). The five CVE IDs themselves rest on release prose with no source citation and never got a second lens.
- **worktrunk 0.69.0 `wt merge` "could sweep in upstream commits, corrupting the default branch"** — quoted changelog prose. adoption.md verified `RemoveConfig`, `MergeArgs`, `HookPlan::approve_readonly` at tag v0.71.0 but never this fix. It is the proposal's sole "Data integrity" headline (`:21`).
- **`Rft()`/`Ek()` in the 2.1.220 binary** (`:15`) — one read of minified JS, no counter-lens, and it decides where two managed keys live.
- **Security framing.** Proposal `:3` says "one security patch"; the dossier found five security-relevant formulae (gh, libgit2, libtiff, jpeg-xl, glib). libtiff/jpeg-xl/glib are silently folded into "26 further formulae, no repo change" (`:22`).

## 4. Deferred so often it is now a silent omission

Each of these was explicitly written down as "fix in the same delta / the upgrade change should reconcile", then dropped from the proposal:

- **`claude-hooks` spec pre-existing bugs.** `-dossier.md:18` names two: `openspec/specs/claude-hooks/spec.md:11` still says `run_once_install-packages.sh.tmpl` (now `run_onchange_`), and `:63`/`:68` specify the status path as `/tmp/aoe-hooks/$AOE_INSTANCE_ID/status` while the template writes `/tmp/aoe-hooks-{{ .chezmoi.uid }}/…`. Verified still present. Proposal `:69` covers only the 1.14.0 set and the `bd prime` retirement.
- **worktrunk spec drift.** `-adoption.md:233`: `openspec/specs/worktrunk-config/spec.md:199,232` mandates *three* aliases; the config ships four (`wtpr` at `dot_config/worktrunk/config.toml:163`). `:141,157` mandate `[list].summary = true` AND `full = true`; the config has neither, only `columns = [...]` (`:9`). Proposal `:71` touches `worktrunk-config` for `json-schema = 2` only — the delta is being opened and the known drift left in it.
- **`[ai] enabled = true`** at `dot_config/atuin/config.toml:9-10`. `-dossier.md:69` verified it is a compiled default and violates that file's own line-3 invariant, "remove it too". Proposal amends `atuin-config` for the adjacent `atuin ai init` line and says nothing about it. Zero occurrences in the proposal.
- **The eza `=`-required-flags manual note.** `-claims.md:25` item 4 proposes it; `-adoption.md:112` defers to it ("one clause there costs nothing"); the proposal's `manual-web` delta (`:75`) covers only mole. Deferred twice, landed nowhere.
- **Operational ordering lost in transit.** The proposal has no `tasks.md` and no `design.md`. Three ordered steps that exist only in `-dossier.md` never reached the proposal's Ordering section: `brew info dolt` must read 2.2.3 pre-flight (gaps.md correction #1 explicitly says *keep* this, demoted not dropped), **land fzf 0.74.2 never 0.74.0/0.74.1** (zero `0.74` occurrences in the proposal), and `wt config update` must report nothing to migrate after the pin. The atuin syntax-highlight must-do is marked "decided in design" (`:42`) against a design doc that does not exist.

## 5. Post-upgrade smoke tests (not gaps)

Additions to the list already in `-gaps.md:50-59`:

1. `mdview` on a Markdown file with an image, once in bare Ghostty and once inside tmux — the only exercise of the rebuilt pango/fontconfig/harfbuzz/libtiff/jpeg-xl/openjph/dav1d/chafa stack. Watch for `fc-cache` chatter on first run after fontconfig 2.18.3.
2. `chezmoi apply --dry-run --verbose` under 2.72.0 must **not** list `run_once_configure-macos-defaults.sh.tmpl` as pending — script-state keys were verified for `run_onchange_` only.
3. Launch lazygit 0.64.0 once, then `chezmoi status`: `~/.config/lazygit/config.yml` must be unmodified. The "no migration fires" conclusion is source-verified but never executed.
4. `git diff` + `wt switch` picker after libgit2 1.9.6 / llhttp 9.4.3 — confirms git-delta still links.
5. Start aoe 1.14.0 once and confirm `dot_config/private_agent-of-empires/themes/catppuccin-mocha.toml` still renders every role (and that aoe does not rewrite it).
6. If (and only if) the `modify_` settings script ships: run it once with `jq` off PATH and confirm the live `~/.claude/settings.json` survives.
7. The font cask 3.4.0→3.5.0 is inert today — `dot_config/ghostty/config:24` uses `Hack Nerd Font` and the JetBrains lines at `:27-30` are commented out. One line to record, no test needed.