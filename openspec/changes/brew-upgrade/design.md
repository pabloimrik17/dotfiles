## Context

A changelog × config audit of the 16 tools `brew upgrade` would bump found the chezmoi
config almost entirely unaffected; the audit surfaced a few small repo edits plus two
operational sequencing concerns. Layered on top: opencode and CodeRabbit are installed
via Homebrew, which disables their built-in auto-update (both self-update only when
installed via their official scripts). This change folds the upgrade follow-ups together
with migrating those two tools to their official installers. The install script is a
chezmoi `run_onchange_*` bash script that already uses `curl | bash` installers for
oh-my-zsh, nvm, plannotator, and SuperWhisper, so an official-installer step is an
established pattern here.

## Goals / Non-Goals

**Goals:**

- opencode and CodeRabbit self-update (install via official scripts; remove from brew).
- Migrate existing brew installs cleanly and idempotently, preserving user config.
- Remove dead config the upgrade made obsolete (OpenCode markdown flag); keep CodeRabbit
  install instructions accurate for 0.5.x.
- Document the beads+dolt upgrade coupling so the irreversible migration does not strand
  a multi-machine fleet.

**Non-Goals:**

- Pinning versions. opencode/CodeRabbit intentionally become always-latest; the remaining
  brew tools stay unpinned by existing design.
- Adopting optional features the audit's adversarial pass rated speculative (mas `--json`,
  opencode `headerTimeout`, opencode prompt-size).
- Fixing the missing `EXA_API_KEY` (separate follow-up).
- Re-theming or behavior changes beyond install method + config hygiene.

## Decisions

- **Install via official scripts to enable self-update.** Both tools detect a
  package-manager install and disable their updater; the curl installers put the binary
  in a user-writable dir (`~/.opencode/bin`, `~/.local/bin`) so self-update works.
  Alternative (stay on brew + `brew upgrade`) rejected — it's exactly what blocks
  auto-update, which is the user's goal.
- **opencode PATH lives in `dot_zshrc.tmpl`, installer run with `--no-modify-path`.** The
  opencode installer appends a PATH line to `~/.zshrc`, but that file is deployed by
  chezmoi from `dot_zshrc.tmpl` and would be overwritten on the next `chezmoi apply`. So
  we suppress the installer's rc edit and own `export PATH="$HOME/.opencode/bin:$PATH"`
  ourselves. CodeRabbit needs no equivalent: `~/.local/bin` is already on PATH (zshrc),
  so its installer's rc edit is a skipped no-op.
- **Migrate-then-install, idempotent, by resolved binary path.** Detect a brew install
  (`brew list opencode` / `brew list --cask coderabbit`), uninstall it (cask without
  `--zap` to keep `~/.coderabbit`), then run the official installer. Treat
  `command -v <tool>` resolving under the official dir as "already migrated → no-op".
  This makes the `run_onchange` step safe to re-run.
- **Run CodeRabbit installer non-interactively (`CI=1`).** Prevents the installer from
  blocking on browser login during an unattended `chezmoi apply`; auth still happens on
  first interactive use (0.5.0 deferred login).
- **Order the official-installer group early** (right after the brew-packages group), so
  opencode is present before the OpenCode-plugins group probes `command -v opencode`, and
  export `~/.opencode/bin` onto PATH within the script for the same invocation.
- **Leave `autoupdate` implicit in opencode config.** Default is `true`, which is what we
  want; `opencode-user-config` already mandates not setting keys where the default
  suffices. Removing opencode from brew is what makes that default effective.
- **beads+dolt coupling stays a runbook step, not a repo requirement.** The repo already
  installs beads unpinned and doesn't pin dolt (beads pulls it transitively); the risk is
  fleet sequencing, captured here and in tasks.

## Risks / Trade-offs

- **Loss of version reproducibility for opencode/CodeRabbit (now self-updating).** →
  Accepted: matches the user's intent (always-current). A specific version can still be
  pinned ad hoc (`opencode upgrade <ver>`, `CODERABBIT_VERSION=...`) if a regression hits.
- **`curl | bash` / `curl | sh` in the install script.** → Consistent with existing
  installers in the same script (oh-my-zsh, nvm, plannotator, SuperWhisper); pinned to the
  official vendor URLs over https.
- **PATH shadowing during migration (two binaries).** → Uninstall the brew copy first and
  `hash -r` so the shell drops the cached brew path; verify with `command -v`.
- **beads 1.0.5 irreversible migrations + schema-skew guard (aligned to Dolt 2.0.6).** →
  Upgrade beads+dolt together, all machines in one window, beads unpinned everywhere;
  `--ignore-schema-skew` is a temporary override, not a fix.
- **dolt 2.x-written DBs may not read on 1.x clients.** → Don't mix dolt 1.x/2.x against
  one shared `.beads` remote; sequence the rollout (no file to edit).
- **worktrunk 0.54.0 wrapper split.** → Low: a new shell auto-adopts it via the zshrc
  re-eval; worst case is a one-shot deprecation warning.
- **Removing the markdown flag is medium-high-confidence research.** → Negligible: the flag
  is a no-op in 1.15.12 and markdown is default-on, so removal cannot regress rendering.

## Migration Plan

1. Apply repo edits: remove `opencode` from `BREW_PACKAGES` and `coderabbit` from
   `ALL_CASKS`; add the official-installer group (with brew-migration + idempotency);
   add `~/.opencode/bin` to PATH and remove the MARKDOWN export in `dot_zshrc.tmpl`;
   update the manual-instructions block.
2. `chezmoi apply` — the `run_onchange` script re-runs: it migrates opencode/CodeRabbit
   off brew and installs them via the official scripts.
3. `brew upgrade` for the remaining tools.
4. Upgrade beads + dolt together on every machine sharing a `.beads` DB/remote, in one
   window; keep beads unpinned.
5. Start a new shell (worktrunk wrapper auto-adopted; `~/.opencode/bin` on PATH).
   Rollback: git revert + `chezmoi apply` re-adds the brew entries; re-running migrates
   back to brew (note: not recommended for beads once migrations have run).

## Open Questions

- None blocking. The `EXA_API_KEY` follow-up is tracked separately.
