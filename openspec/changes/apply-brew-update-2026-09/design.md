## Context

See `proposal.md` — Why. Constraints that shape everything below, all verified on this host:

- **`amd64` macOS has no bottle future.** The EOL notice prints on every `brew upgrade --dry-run`.
  Eight of the outdated formulae still pour from bottles built before the cutoff; the other sixteen
  compile, pulling in 24 dependency formulae (`go`, `node`, `python@3.14`, `protobuf`, `cmake`,
  `nasm`, …) that persist afterwards and that `brew autoremove` will not reclaim.
- **14 GiB free, 94% used**, and Homebrew compiles in `/private/tmp` on the same volume.
- **`brew cleanup` frees 117 MB now, ~520 MB after upgrading**, because it refuses to remove kegs for
  a formula whose newest version is not installed. The 4.4× difference is what makes ordering a
  design decision rather than a preference.
  **Measured after the pours (2026-09-12): 128.4 MB, not ~520 MB.** The estimate assumed the whole
  outdated set had advanced; six small bottles moved and the nine source builds had not run, so
  almost every superseded keg was still the newest installed. The ordering decision stands — cleanup
  after the pours is still strictly better than before them — but the headroom it buys is ~128 MB,
  not half a gigabyte, which is a rounding error against a 4.65 GiB build.
- **`brew outdated` lists held packages.** Verified by holding `fd` and re-running. A report that
  does not annotate holds nags weekly about packages that are deliberately frozen.
- **A hold is invisible to the repo.** It is a symlink under `$(brew --prefix)/var/homebrew/pinned/`;
  `grep 'brew pin'` across the repo returns nothing outside the exploration document.
- **Two hosts, both in daily use**, `amd64` and `arm64`, both current. The repo already branches on
  `.chezmoi.arch` in eight places, including a cask row.

## Goals / Non-Goals

**Goals:**

- Clear the backlog without a single unbounded operation.
- Make the one version hold that matters reproducible on both hosts.
- Land the changelog-derived adoptions, including the ones adoptable on currently installed versions.
- Give each repaired silent failure a check that would have caught it.

**Non-Goals:**

- No new drift-detection mechanism and no bulk-upgrade path. See Decisions.
- No architecture branching added by this change. The only hold that ships is fleet-wide.
- No behavioral verification on `arm64`. Nothing here assumes that host's brew state.

## Decisions

**Apply per package; never `brew upgrade "${BREW_PACKAGES[@]}"`.** *Alternative considered:* a
`confirm()` gate in front of the bulk command, which is what the audit's structure adviser proposed.
Rejected because on this host the bulk command is sixteen source builds and 24 new dependency
formulae against a 14 GiB floor, and because its safety would rest entirely on the holds being
applied first — a mechanism whose correctness depends on a hold is a mechanism that breaks the day a
hold is lifted. A partial bulk run also leaves half-built kegs and a full `/private/tmp` on the same
volume, which is not recoverable by re-running.

**Order is `pours → cleanup → compiles`, one compile at a time behind a disk floor.** *Alternative:*
cleanup last, which reads more naturally. Rejected on the measured 117 MB / 520 MB asymmetry: cleanup
before the pours frees almost nothing, and cleanup after them unlocks the kegs whose newer versions
just landed — which is the headroom the compiles then consume.

**Declare holds in the repo and reconcile them, rather than running `brew pin` by hand.**
*Alternative:* pin locally and document it. Rejected because the second host would stay exposed, and
on `arm64` the package in question is a pour, so an unwanted upgrade lands there *more* easily than
here. Reconciliation matters as much as application: if the script only ever adds holds, then removing
the `beads` declaration once a suitable release ships would silently do nothing, and the host would
stay frozen with no message — the same silent-success shape this change is otherwise fixing. The
script therefore releases holds it manages that are no longer declared.

**Two hold classes are described, one ships.** The specs distinguish a *correction* hold (the version
is wrong for this repo, applies to every host) from a *cost* hold (the version is fine, building it
here is not worth it). Only `beads` ships, as a correction hold. *Alternative:* also hold `aoe`,
`terminal-notifier`, `llmfit` and `dolt` on `amd64`. Rejected because a cost hold only defends against
a bulk-upgrade path, and this change adds none — `bubu` had zero invocations across 8262 recorded
commands on both hosts when this was written. Their deferral reasons are recorded in prose instead,
where they cost nothing and cannot silently freeze a package.

**Premise correction, 2026-09-12.** `bubu` ran three times on this host during execution (17:56:22,
17:56:53, 18:04:47), each interrupted, and moved two deferred packages: `dolt` 2.2.3 → 2.3.3 and
`chezmoi` 2.72.0 → 2.72.1. Both landed versions are ones this change researched, and the `beads` hold
held against all three runs. The decision stands as an accepted risk rather than an absent one.

**No new detection mechanism.** *Alternatives considered:* a `Brewfile` plus `brew bundle check`; a
weekly LaunchAgent; a step folded into `update-extra`. All rejected. `brew bundle check` cannot express
"this package but not this version", so it would report the held package as pending forever — and that
objection applies equally to plain `brew outdated`, which was verified to list held formulae. A
LaunchAgent runs without `zshrc`, and this repo has two recorded incidents from exactly that
(`/usr/local/bin` shadowing nvm in non-interactive shells; lazygit custom commands needing PATH
executables rather than shell functions) — plus the most frequent Monday command on this host is
`sudo shutdown`. And `update-extra` has six lifetime invocations, last 53 days ago, so a step added
there inherits a cadence that does not exist. What ships instead is the doctrine fix: the classifier
skill currently instructs readers that brew-managed tools need no action because a bulk upgrade covers
it, which is the sentence that told agents not to read brew changelogs at all.

**The `wt -x` migration uses the `--` separator, and it is verifiable before upgrading.** `wt switch
--help` on the *installed* 0.72.0 already documents that arguments after `--` are appended to the
execute command, template-expanded, then POSIX shell-escaped. So the four broken bindings can be
rewritten and exercised now, which dissolves the audit's own objection that the new argv form could
not be tested against an uninstalled binary. Two of the six `-x` bindings (`i`, `I`) pass a bare
program name and need no change.

**`-group` lands on the installed 2.0.0, not with the upgrade.** `terminal-notifier -help` on 2.0.0
lists `-group ID`, so the adoption is decoupled from a deferred major that would additionally require
a global `sudo xcode-select` and a GUI permission grant.

**Cask work is data-only.** *Alternative:* also fix `is_cask_installed`, whose directory test
short-circuits before consulting brew. Rejected for this change: repairing the check does not just
correct a count, it makes the script attempt `brew install --cask` over 24 applications installed by
hand or by the App Store, which forces a per-application ownership decision. That is a migration, and
it is the surface with no adversarial review at all.

**A drifted version is closed by reading the gap, not by pinning back.** Between writing this change
and executing it, four packages moved past the versions its changelog work covered (`fzf`
0.74.3→0.74.4, `uv` 0.12.10→0.12.13, `atuin` 18.21.0→18.22.0, `worktrunk` 0.76→0.77.0), and `fzf`
additionally lost its bottle, so the pour set is six rather than seven. *Alternative:* install the
researched versions exactly. Rejected on mechanics: none of the four has a versioned formula, so
this would mean `brew extract`-ing formula revisions `homebrew/core` no longer serves into a local
tap and building them from source — four extra `amd64` compiles against the same disk floor, plus a
tap this repo would then own. What the intent actually asks for is that nothing unreviewed lands, so
the extra delta is read before each upgrade and the available version is taken. That is also what
this change's own doctrine fix demands of a brew-managed package.

**The cask-to-app mapping is the array column, read through `cask_to_app()`.** The spec described a
function holding its own hardcoded table; the implementation had moved the same data into the
`AppName` field of each `ALL_CASKS` row and dropped the function. *Alternative:* reintroduce the
function with its own table, as written. Rejected because the array is where a cask is added or
removed, so a second table drifts the moment a row changes — and the requirement that no mapping
outlives its cask would then depend on remembering to edit two places. `cask_to_app()` is restored
as a lookup over `ALL_CASKS` with a capitalize-the-token fallback, which keeps both specs that name
it true (`gui-app-install` and `fzf-cask-picker`) without duplicating a byte.

**Scenarios must be able to fail.** Three requirements this change touches previously asserted only
that configuration text rendered. Each gains a scenario that asserts the effect: `status-right`
non-empty after full config load, the two notification sounds differing from each other, keybinding
payloads verified by pressing the key. This is the cross-cutting requirement applied to its own
change rather than stated abstractly.

## Risks / Trade-offs

- **Disk exhaustion mid-compile** → cleanup runs before any compile, compiles run one at a time, and a
  written floor aborts before starting the next one.
  **Measured 2026-09-12, and the floor is too low.** The `uv` upgrade alone — it pulls a `rust`
  upgrade with it — consumed **4.65 GiB**, taking the volume from 13.00 GiB to 8.35 GiB before it had
  finished. An 8 GiB floor checked *between* packages cannot stop a single package from crossing it
  *during* a build, which is the failure it was written to prevent. **Resolved 2026-09-12:** the
  floor is now a per-package headroom estimate sized to the toolchain each build pulls, recorded in
  `tasks.md` 6.1. The compilers this group needs are unbottled on every platform, so `rust`
  compiles for `uv`/`worktrunk`/`atuin`, `protobuf` compiles for `atuin`, and `go` — not installed at
  all — compiles for `mole`/`gh`/`lazygit`/`age`/`fzf`; `cmake`, `ninja` and `python@3.14` still
  pour, and only `ticker` has no build dependency at all. Both classes
  therefore require ≥ 13 GiB free, the largest observed build plus margin. The host stands at
  8.4 GiB and `brew cleanup` reclaims 119 MB, so the estimate stops group 6 rather than sizing it:
  every compile waits on ~5 GiB freed from outside Homebrew.
- **Qualified tap names break the idempotency check** — `command -v achannarasappa/tap/ticker` can
  never succeed, so a missing `pkg_bin` mapping makes the script reinstall on every run → both
  qualified entries get explicit mappings, with scenarios covering them.
- **Trust must precede install** — a qualified name alone still fails on an untrusted tap → trust is
  granted in the same loop that taps, before the package pre-scan.
- **The `arm64` host's drift is unknown** → nothing in this change reads or asserts its state; the
  first run there reports it. The `beads` hold is written to be correct without knowing it.
- **Holds are brew-local state that outlives its declaration** → the script reconciles rather than
  only adding, so lifting a hold in the repo actually lifts it on the host.
- **Removing two cask rows does not uninstall anything** — provisioning stops offering them; existing
  applications are untouched. Accepted: one is disabled upstream and the other never pointed at the
  intended application.
- **ticker phones home with no opt-out**, and its footer refresh timer becomes a permanent update
  notice once 5.4.0 ships, because this repo installs it via brew and never auto-upgrades → accepted
  deliberately in exchange for minor-currency support.
- **The cask spec was already describing arrays the implementation stopped using** (`CASK_PACKAGES` /
  `OPTIONAL_CASK_PACKAGES` versus the single categorized `ALL_CASKS`) → corrected in the delta,
  because a `MODIFIED` block that kept the old array names would restate something false. This is a
  side effect of a requirement that had to be rewritten anyway, not an expansion of scope.

## Migration Plan

1. Apply the declared hold before anything else, so no later step can advance it.
2. Land the config adoptions and the `wt -x` rewrite. All are independent of any upgrade, and the
   keybindings are exercised on the installed worktrunk.
3. Pours, then `brew cleanup`.
4. Compiles, one at a time, checking headroom between each.
5. Verify the repaired silent failures: `status-right` non-empty, the two sounds differing, each
   rewritten key pressed against a real PR.

**Rollback.** Every upgrade in step 4 is individually revertible by re-installing the previous keg.
The config edits are chezmoi-managed and revert with the source. The hold is released by removing its
declaration, which the reconciliation step then applies.

**Correction, verified 2026-09-12.** This section previously claimed that "a failed compile leaves the
existing keg linked and working — Homebrew builds in a temporary directory". That is false for an
*interrupted* upgrade. `brew upgrade` unlinks the installed keg before the replacement lands, so a
build that is killed mid-flight leaves the formula **unlinked**: after stopping the `uv` build, both
`uv` and its `rust` dependency had no symlinks in `$(brew --prefix)/bin`, and `uv` was simply gone
from `PATH`. The keg itself survives and the binary runs from the Cellar, so the repair is
`brew link <formula>` and `brew doctor` names every formula needing it.

This matters more here than a tidy-up would suggest: `uv` is the merge engine for all three `modify_`
scripts. A silently unlinked `uv` sends every one of them down its `uv`-absent branch, which passes
the live file through and exits 0 — the exact silent-success shape this change exists to remove, and
one that the fail-loud repair in group 2 deliberately does **not** catch, because "no `uv`" is
classified as a cold-start path rather than a failure. Any interrupted group 6 build must therefore
be followed by `brew doctor` and a relink before anything else.

**Second correction, observed 2026-09-12.** An upgrade can also fail *after* its dependency builds
successfully, leaving a third state that neither the original plan nor the correction above
describes: **built but not linked.** A `brew upgrade uv` that had just finished compiling and
installing its `rust` dependency died with

    Error: uv: No such file or directory @ rb_sysopen - .../<hash>--rust.rb

naming the cached formula file that the same run had logged as `Already downloaded` when it started,
nearly two hours earlier. This host runs Homebrew's automatic post-install cleanup
(`HOMEBREW_NO_INSTALL_CLEANUP` is unset), which prunes cached downloads after an install completes —
a plausible cause for the file disappearing mid-run, though not one this change confirmed directly.

The resulting state is worth naming because it reads as healthy: `rust` 1.98.1 was in the Cellar,
`rust` 1.98.0 was still the linked version, `uv` was untouched at 0.12.3, and `brew doctor` reported
**no** unlinked kegs — because the *old* keg was still correctly linked. So the check the correction
above prescribes (`brew doctor`, then relink) finds nothing to do here, while `brew outdated` keeps
reporting `rust` as outdated and the newly built keg sits inert. The failure itself was loud — a
non-zero exit naming the error — so nothing silent happened; what is easy to miss is that the
recovery is a *link*, not a rebuild.

Two consequences for the remaining group 6 work: run each upgrade with
`HOMEBREW_NO_INSTALL_CLEANUP=1` so a long build cannot have its own cache pruned underneath it, and
after any failed upgrade check `brew list --versions` against the linked version rather than trusting
`brew doctor` alone.

## Open Questions

- Whether the `arm64` host carries drift that needs its own follow-up. Answered by its first run;
  changes nothing here.
- Whether minor-currency support alters any price already in the encrypted portfolio. Accepted as
  detect-and-fix rather than predicted, since the file is deliberately not readable from this change.
