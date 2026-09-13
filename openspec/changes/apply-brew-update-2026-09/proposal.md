## Why

Brew provisioning in this repo is install-only: the loop in `run_onchange_install-packages.sh.tmpl:150`
installs a package only when its binary is absent from PATH, and `brew upgrade` appears nowhere
executable. Twenty-six packages are outdated, `ticker` has been three months behind without being
reported, and the changelogs in that backlog carry adoptable improvements nobody has read.

Two facts found while auditing make this cycle different from the five before it. **Homebrew ended
Intel x86_64 bottle production in September 2026** — the warning prints on every `brew upgrade
--dry-run` on this host, so every future upgrade here is a source build and the eight remaining
bottles are a shrinking residual stock. And **`beads 1.2.2` is a rollback, not an upgrade**: v1.1.2
republished under a higher number, whose binary knows schema v53 while all three local Dolt DBs are
migrated to v65. It is also one of the few packages that still pours, so a bulk upgrade lands it
first.

## What Changes

**Upgrades, executed in a fixed order** because `brew cleanup` frees 117 MB before the cycle and
~520 MB after it, on a volume at 94% with 14 GiB free:

- Eight bottled pours plus the two Nerd Font casks.
- `brew cleanup`.
- Then, one package at a time against a written disk floor that aborts: `uv`, `mole`, `gh`,
  `worktrunk`, `ticker`, `lazygit`, `atuin`, `fd`, `age`.
- Deferred, each with its reason and the architecture that reason belongs to. Homebrew stopped
  producing `x86_64` macOS bottles in **September 2026** (announced August 2025), so on `amd64`
  every one of these is a source build; on `arm64` the same packages pour and the cost half of each
  reason does not transfer. The constraint is recorded in the install script above `BREW_HOLDS`.
  - `terminal-notifier` 3.1.0 — `amd64` cost, plus a hard prerequisite: the build needs a global
    `sudo xcode-select` pointed at Xcode rather than the Command Line Tools, and the signature
    changes from unsigned. The one thing worth having from 3.x, `-group`, lands on the installed
    2.0.0 in this change.
  - `aoe` 1.16.0 — not a cost deferral and not `amd64`-specific: migration v026 rewrites the
    chezmoi-managed `config.toml`, and the new `session.pre_trust_agent_folders` key is a decision
    about AoE's unmanaged security keys as a class, which this change declares out of scope.
  - `tmux` 3.7c — `amd64` cost, and the fixes do not reach the running 3.7b server on any
    architecture: they need `tmux kill-server` from outside tmux. The `fill=` workaround in
    `dot_tmux.conf` is still required either way.
  - `dolt` 2.3.3 — buys nothing at any cost on any architecture: everything relevant in the range
    is `sql-server` work, and `bd` serves this repo's data from a dolt vendored inside its own
    binary, not from brew's.
  - `chezmoi` 2.72.1 — an innocuous patch, deferred on `amd64` cost alone. The open question is
    governance, not this release: chezmoi is the engine of the whole repo and has no managed
    version path.
  - `little-cms2`, `aom`, `pcre2` — transitive dependencies with no direct consumer here, deferred
    on `amd64` cost. pcre2's CVE-2026-86145 was checked and is unreachable: no linked consumer
    imports `pcre2_dfa_match()`.

**A declared pin list**, because a pin today is machine-local state under
`$(brew --prefix)/var/homebrew/pinned/` that neither git nor chezmoi sees — so pinning `beads` here
leaves the second machine, where `beads` pours, unprotected. `beads` is pinned with a written exit
condition (a release whose schema cursor reaches v65).

**Adoptions derived from the changelogs:**

- `-group` on the three AoE `[status_hooks]`; without it 3.x accumulates notifications instead of
  replacing them. Verified present in the installed 2.0.0, so this lands before any upgrade.
- `ai.tips = false` under atuin's existing `[ai]` section; the new default invites `atuin config set`,
  which writes the chezmoi-managed file.
- The `--` guard in `FZF_ALT_C_OPTS`, the only one of the three previews missing it.
- `set -g` instead of `set -gF` for `status-right`, which has baked an empty string since April.

**Data corrections:**

- `llmfit` joins `BREW_PACKAGES`. It resolves to `homebrew/core` (its install receipt says so), needs
  no tap and no trust entry, and the vestigial `alexsjones/llmfit/llmfit` row in `trust.json` — the
  only entry there, pointing at a tap that no longer serves the formula — is removed.
- `tickrs` and `ticker` gain fully-qualified tap names and tap trust. Homebrew 6's trust gate hides
  untrusted taps from `brew outdated`, and bare names mean a fresh machine cannot install them at
  all. Tracked as `WebstormProjects-tvi`.
- Four objectively wrong `ALL_CASKS` rows: `transmission-remote-gui` (disabled upstream 2026-09-01
  for failing Gatekeeper), `spark` (resolves to a shortcut manager, not the mail client),
  `docker` → `docker-desktop`, `ollama` → `ollama-app`; plus `whatsapp`, which can never match
  because the app lives at `/Applications/WhatsApp.localized/WhatsApp.app`.
- The `gh skill list` comment at `install-packages.sh.tmpl:509` gains `codex`, added in gh 2.99.0.

**Two cross-cutting requirements**, because the audit found the same defect six times in unrelated
places — a step reports success and the effect does not occur: `set -gF` baking an empty string for
five months, the three `modify_` scripts passing the live file through on a uv error while chezmoi
exits 0, `bd prime` dropping memories silently under a skewed beads, the cask group reporting 30/30
while brew manages two, and a worktrunk `template-append` that would be ignored because neither
template references `{{ user_guidance }}`. Managed steps must fail loudly or expose an observable
verification, and the Intel bottle EOL is recorded as a dated constraint rather than left implicit
in per-package deferral reasons.

One item on that list is repaired here rather than only named: the three `modify_` merge scripts
(Claude's `settings.json`, the AoE config, Junie's `mcp.json`) exit non-zero and name the file when
their merge engine fails or emits output that does not re-parse, instead of passing the live file
through under a successful `chezmoi apply`. Their empty-stdin and `uv`-absent branches stay
pass-through — those are cold-start paths on a machine that has not bootstrapped yet, not failures.

**Doctrine fix.** `.agents/skills/classify-tool-updates/SKILL.md:25` currently reads *"brew-managed →
no action. `brew upgrade` (omz `bubu`) covers it."* That sentence instructs agents not to read brew
changelogs, and it is the mechanical cause of the backlog. `bubu` had zero invocations across 8262
recorded commands and two machines when this was written; the three interrupted runs on 2026-09-12
(see `design.md`) did not dent the backlog.

**BREAKING** — `worktrunk` 0.76 changed `wt switch -x` from a shell string to a program plus literal
argv. Four gh-dash bindings (`config.yml:74,84,99,110`) pass multi-word strings and break the moment
worktrunk advances, so they are rewritten first and then verified by pressing each key.

## Capabilities

### New Capabilities

- `brew-version-pins`: a repo-declared list of Homebrew packages held at their installed version,
  each with a written reason and exit condition, applied by the install script so pins are
  reproducible across hosts instead of local folklore. Records the dated Intel x86_64 bottle EOL as
  the platform constraint that governs upgrade cost on `amd64` hosts.
- `managed-step-failure-visibility`: chezmoi-managed steps either fail loudly or expose an
  observable verification, so a step cannot report success while its effect is absent.

### Modified Capabilities

- `cli-tool-expansion`: `BREW_PACKAGES` gains `llmfit`; `BREW_TAPS` registration adds tap trust and
  the array carries fully-qualified names for tap-sourced packages, with matching `pkg_bin` entries.
- `ticker-install`: ticker is referenced by its qualified tap name and its tap is trusted.
- `tickrs-install`: same for tickrs.
- `gui-app-install`: cask-to-app-name mapping covers `WhatsApp.localized`; four incorrect cask tokens
  corrected or removed.
- `agent-manager`: the three `[status_hooks]` pass `-group`; the existing distinct-sound requirement
  gains a scenario that actually verifies distinctness, which today's rendering-only scenario does
  not.
- `tmux-catppuccin`: `status-right` is assigned with `set -g`, and the requirement gains a scenario
  verifying the expansion is non-empty at runtime.
- `atuin-config`: `ai.tips` is pinned to `false`.
- `markdown-viewer`: the directory preview passes `--` before the placeholder.
- `gh-dash-keybindings`: the four `-x` payloads use worktrunk 0.76 argv semantics.
- `classify-tool-updates-skill`: the brew-managed classification no longer defers to a bulk
  `brew upgrade`.

## Impact

**Files:** `run_onchange_install-packages.sh.tmpl` (BREW_PACKAGES, BREW_TAPS, pkg_bin, ALL_CASKS,
tap trust, pin application, `:509` comment) · `dot_tmux.conf:22` · `dot_config/atuin/config.toml` ·
`dot_zshrc.tmpl:153` · `dot_config/private_agent-of-empires/modify_private_config.toml:81-86` ·
`dot_config/gh-dash/config.yml:74,84,99,110` · `.agents/skills/classify-tool-updates/SKILL.md:25` ·
`~/.config/homebrew/trust.json`.

**Fleet.** Two hosts in daily use: this `amd64` machine and an `arm64` M3, both bootstrapped and
current. Everything written here deploys to both via chezmoi. On `arm64` every package still pours,
so the deferral reasons in this change are `amd64`-specific by construction while the `beads` pin is
fleet-wide — on `arm64` it matters more, because there `beads` is a pour and lands more easily. The
M3's brew drift is unknown to this audit and will be learned on its first run.

**Explicitly out of scope**, recorded so the next audit does not reopen them: the `is_cask_installed`
directory-test bug and the ownership question for the 24 manually installed apps · AoE's unmanaged
security keys (`yolo_mode_default`, `sandbox.enabled_by_default`, `pre_trust_agent_folders`) ·
`rust`/`tuicr` leaf drift · auditing `docs/manual.html` · adversarial verification of the eight
transitive formulae · five unread pcre2 security entries · three unread atuin 18.20.0 betas · any new
brew drift-detection mechanism or bulk-upgrade path.

**Accepted trade-off.** ticker 5.3.0 adds an updater that makes an HTTP request on every start with
no opt-out — the cache flag is hardcoded, so `--no-cache` does not disable it — and replaces the
footer refresh timer with an update notice that becomes permanent once 5.4.0 ships, since this repo
installs ticker via brew and never auto-upgrades. Accepted deliberately in exchange for
`minor currency support (#372)`.

## Execution status — 2026-09-12

Groups 1–4 and 7 are done and verified; group 5 is done; group 6 was **started and stopped** after
one package. Resume from `openspec instructions apply --change apply-brew-update-2026-09 --json`.

**State left on the host (all reversible, nothing half-applied):**

- `beads` is held (`brew list --pinned`), state recorded in `~/.local/state/dotfiles/brew-holds`.
- Taps `tarkah/tickrs` and `achannarasappa/tap` are trusted; the stale `alexsjones/llmfit/llmfit`
  formula-trust entry is gone and `~/.config/homebrew/trust.json` now holds only `trustedtaps`.
- Poured: `fd` 10.5.0, `gdk-pixbuf` 2.44.8, `harfbuzz` 14.4.0, `imath` 3.2.3, `libdeflate` 1.26,
  `openexr` 3.4.15. Both Nerd Font casks at 3.5.1. `brew cleanup` freed 128.4 MB.
- `~/.tmux.conf`, `~/.config/atuin/config.toml` and `~/.zshrc` were applied from this worktree
  (`chezmoi apply --source .`). **The running tmux server still holds the old empty `status-right`**
  — it needs a `tmux kill-server` from outside tmux to pick the fix up.
- `uv` was left **unlinked** by the interrupted build and has been relinked (0.12.3), along with
  `rust` 1.98.0. `brew doctor` reports no unlinked kegs. See the Rollback correction in `design.md`.

**Blocking finding — group 6 must not resume as written.** A single `uv` upgrade consumed 4.65 GiB
against an 8 GiB floor that is only checked between packages. Fix the floor before continuing; see
the Risks correction in `design.md`.

**Task 5.4, changelog deltas beyond what this change researched** (read before upgrading; none
forces a config change, two are worth knowing):

- `fzf` 0.74.3→0.74.4 — nothing touching a managed file, and #4899 (an escape sequence split across
  reads, e.g. a late `DECRQM` reply leaving `?2004;2$y`) **is** the bracketed-paste leak this repo
  hits, so the extra patch delivers the fix rather than risking it.
- `uv` 0.12.10→0.12.13 — 0.12.12 code-signs and notarizes the macOS executable; no change to
  `uv run --no-project` semantics, which is all the three `modify_` scripts use.
- `atuin` 18.21.0→18.22.0 — adds an `[output_capture]` section and command-*output* capture. It is
  driven by the PTY proxy (`atuin pty`), which this repo never invokes, so it is unreachable here;
  worth a look if `atuin pty` is ever adopted. `atuin ai init` became a no-op instead of erroring.
- `worktrunk` 0.76→0.77.0 — **two breaking changes touching the managed config.**
  `wt list --format=json` now defaults to schema 2, so the explicit `json-schema = 2` pin is
  redundant but still a correct guard; and `wt config show` now exits non-zero on a broken config,
  an invalid `[list] columns`, or an invalid `approvals.toml`, where it always exited 0 before.
  **Run `wt config show` immediately after upgrading worktrunk** — it is the check that the repo's
  `columns = ["branch", "working-diff", "branch-diff", "ci", "summary"]` is still valid in 0.77.

**Outstanding verifications that need a human at a terminal:**

- The four gh-dash keys pressed on a real PR. The payloads were exercised end-to-end through the
  installed `wt` 0.72.0 with a recorder in place of `claude`/`aoe`, and each delivered its intended
  argv — `-t` kept its multi-word title as one argument, and `-g`/`-l`/`--extra-args` reached `aoe`
  rather than being consumed by `wt` — but no key was physically pressed.
- Two AoE state transitions in one session, and two sessions side by side, to see `-group` replace
  rather than stack.
- `tmux kill-server` from outside tmux, then confirm the right-hand status bar renders.
