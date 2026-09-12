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
- Deferred with a written reason: `aoe`, `terminal-notifier`, `tmux`, `dolt`, `chezmoi`,
  `little-cms2`, `aom`, `pcre2`.

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

**Doctrine fix.** `.agents/skills/classify-tool-updates/SKILL.md:25` currently reads *"brew-managed →
no action. `brew upgrade` (omz `bubu`) covers it."* That sentence instructs agents not to read brew
changelogs, and it is the mechanical cause of the backlog. `bubu` has zero invocations across 8262
recorded commands and two machines.

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
