# Design

## Context

`run_onchange_install-packages.sh.tmpl` installs brew packages in three groups: `BREW_PACKAGES`
(Group 1, formulae), `FONT_CASKS` (Group 2), and a literal zsh plugin list (Group 3, written out
twice). `ALL_CASKS` holds the GUI apps (Group 4). `apply_brew_holds` runs before any install. It
pins `BREW_HOLDS` entries, currently only `beads`, and reconciles them through
`~/.local/state/dotfiles/brew-holds`. chezmoi re-runs the script only when its rendered content
changes. Any error makes the script exit 1, and chezmoi then re-runs it on every apply.

Homebrew behaviour checked against the local source (Homebrew 7.0.6, `Library/Homebrew`):

- `brew list --pinned` prints the rack basename: `tickrs`, not `tarkah/tickrs/tickrs`
  (`cmd/list.rb`, `pinned_formula_entry`). With `--versions` it also prints the pinned keg.
- `brew pin` pins the highest installed keg, which is not necessarily the linked one
  (`formula_pin.rb`, `installed_kegs.max_by`). It accepts `--cask`, but warns that a cask with
  `auto_updates` can still update itself.
- `brew uninstall` refuses a pinned formula ("is pinned. You must unpin it to uninstall.").
- A bulk `brew upgrade` still upgrades unpinned dependencies. It does not reinstall a pinned
  dependent whose linkage broke as a result ("Not reinstalling N broken and outdated, but pinned
  dependents").

### Host snapshot: Intel `x86_64`, 2026-09-28

Brew on this host: 104 formulae (36 installed on request, 68 as dependencies), 3 casks and 4 taps.
The repo's brew set on this host: 33 formulae, 2 font casks, 29 GUI casks (the arm64 host adds
`conductor`) and 3 taps.

These versions become the version table (the highest installed keg, which is what `brew pin`
pins):

| Group | Package | Version |
| --- | --- | --- |
| 1 | git · git-delta · starship · eza · bat | 2.55.0 · 0.19.2 · 1.26.0 · 0.23.5 · 0.26.1 |
| 1 | zoxide · atuin · fzf · ripgrep · lazygit | 0.10.0 · 18.22.0 · 0.74.4 · 15.2.0 · 0.65.0 |
| 1 | worktrunk · terminal-notifier · fd · direnv · beads | 0.77.0 · 2.0.0 · 10.5.0 · 2.37.1 · 1.3.0 |
| 1 | gh · tmux · uv · mas · wget | 2.100.0 · 3.7b · 0.12.13 · 7.0.0 · 1.25.0 |
| 1 | television · tarkah/tickrs/tickrs · achannarasappa/tap/ticker | 0.15.9 · 0.15.0 · 5.3.0 |
| 1 | age · mole · aoe · glow · mdfried | 1.3.2 · 1.53.0 · 1.14.0 · 3.0.0 · 0.22.5 |
| 1 | AlexsJones/llmfit/llmfit · tuicr | 1.1.16 · 0.25.0 |
| 3 | zsh-autosuggestions · zsh-syntax-highlighting · zsh-completions | 0.7.1 · 0.8.0 · 0.36.0 |
| 2 | font-hack-nerd-font · font-jetbrains-mono-nerd-font | 3.5.1 · 3.5.1 |

Brew has installed these on this host, but the install script does not declare them:

| Item | Kind | Version | Note |
| --- | --- | --- | --- |
| `chezmoi` | formula | 2.72.1 | README bootstrap step 1 (`brew install chezmoi`), outside the script |
| `zsh` | formula | 5.9.2 | The login shell is `/bin/zsh`, so this keg is not the login shell |
| `schpet/tap/linear` | formula | 2.6.0 | Linear CLI, built from source |
| `schpet/tap` | tap | — | Used only by `linear` |
| `obsidian` | cask | 1.13.7 | `auto_updates true` |
| `go` · `rust` · `llvm@22` · `cmake` · `protobuf` · `abseil` · `pkgconf` | build deps | — | About 2.3 GB, llvm@22 alone 1.5 GB. No runtime dependents. Kept because 23 kegs here were built from source |
| Older kegs of `aoe` (1.12.0), `ca-certificates`, `dolt`, `libssh2`, `readline`, `xz` | kegs | — | `brew cleanup` candidates |

The declared `llmfit` was installed from `homebrew/core` at 1.1.15 in the initial snapshot. On
2026-09-28 it was switched to `AlexsJones/llmfit/llmfit` 1.1.16 and pinned.

The script declares these GUI apps, but brew does not manage them here:

- Of the 29 GUI casks, 23 are `.app` installs outside brew and 6 are absent (`firefox`, `chatgpt`,
  `ollama-app`, `tailscale-app`, `adobe-acrobat-reader`, `microsoft-teams`). None is brew-managed,
  so none can be pinned here.

To take the same snapshot on another host, run `brew list --formula --installed-on-request`,
`brew list --cask`, `brew tap` and `brew list --formula --versions --multiple`, then diff the output
against the lists in the install script. For build deps, use
`brew uses --installed --include-build <f>`.

## Goals / Non-Goals

**Goals:**

- Each frozen package is pinned on every host where it is installed, and pins stay in sync with the
  repo in both directions.
- The declared versions are one table that can be reviewed in a diff.

**Non-Goals:**

- Enforcing versions. Brew cannot install an older formula version, so drift is reported and not
  corrected.
- Acting on the inventory: keeping, removing or adopting its items is for a later proposal.
- Refreshing the text of the `beads` hold. It still cites 1.2.2 and schema v65, while 1.3.0 ships
  v66. Worth a separate fix, not needed here.
- Fixing the hold pass's own name comparison for tap-qualified holds (D4). No qualified hold
  exists today.

## Decisions

**D1: Versions go in a separate table, `BREW_VERSIONS`, not inline in the install lists.** Each row
is `name|version`, sorted alphabetically by name. The name is spelled exactly as in its install
list, qualified for tap formulae.
Rejected alternative: `BREW_PACKAGES=("git|2.55.0" …)`. About a dozen main specs
(`cli-tool-expansion`, `agent-manager`, `mole-install`, `llmfit-install`, `git-config`,
`zsh-aliases`, `television-install`, …) assert "`BREW_PACKAGES` contains `<name>`", and `pkg_bin`
takes entries as they are. Changing the entry format would mean MODIFIED deltas across all of
them. A second table can drift from the lists, and the coverage errors in the spec plus a static
test (see tasks) close that gap.

**D2: One freeze pass, `apply_brew_freeze`, runs once, right after Group 3.** Group 3 is the last
group that installs a frozen package. The pass builds the frozen set: `BREW_PACKAGES` and
`ZSH_PLUGIN_FORMULAE` as formulae, and the `FONT_CASKS` tokens as casks. It skips names that are
in `BREW_HOLDS`. It reads `brew list --pinned --versions` once before pinning and once after, for
the drift check. The zsh plugin literal moves into `ZSH_PLUGIN_FORMULAE` so that the pass and both
Group 3 loops read one list. Rejected alternative: pinning inside each group loop. That spreads
the reconcile logic over three places and skips packages installed before this change.

**D3: A separate record, `~/.local/state/dotfiles/brew-freezes`, with lines `formula <name>` or
`cask <token>`.** The hold pass runs before the installs and the freeze pass after them, so sharing
one file would need merge logic between the two writers. Existing hosts already have
`brew-holds` in bare-name format, and it stays untouched. The kind is recorded so that a release
calls `brew unpin --formula` or `--cask` explicitly and cannot resolve to the wrong kind when a
cask token matches a formula name. When a freeze-owned formula becomes a hold, the hold pass reads
the freeze record and adopts the existing pin. The freeze pass drops its entry only once the hold
record lists it. A hand pin with no freeze record remains unowned by either pass. Each pass writes
every pin it may own before it changes one, then the final set. A failed write therefore never
leaves a pin that later runs take for a hand pin. The freeze pass changes no pin when the first
write fails; the hold pass still pins, because the hold guards correctness.

**D4: Names are matched by their short form, and sources are checked by the qualified form.**
Comparisons against `brew list --pinned` use `${pkg##*/}`. To check whether a package is
installed, the pass runs `brew list --formula <qualified>` first. If only the short name resolves
(as llmfit from core did before migration), the pass pins the short name and warns with a one-time
switch command that starts with `brew unpin`. There is no always-present llmfit hint after the
reference host migration. The hold pass has a latent bug here: it greps the qualified name. That
works for `beads` and would fail for a qualified hold; see Non-Goals.

**D5: Drift is read from the pin, not from the linked keg.** `brew pin` takes the highest keg,
so `brew list --pinned --versions` shows what is actually frozen. On this host `aoe` has 1.12.0
and 1.14.0 installed. Linked and highest agree on 1.14.0, which is why the table says 1.14.0. The
comparison is an exact string match, including any `_N` revision suffix.

**D6: A frozen package with no version row is still pinned, and the error only marks the
bookkeeping gap.** The freeze exists to stop packages from moving. A missing row is a repo mistake,
and its error makes chezmoi re-run the script until someone fixes it.

**D7: The upgrade path is `brew-upgrade-pinned <pkg>`, then a bump of the row.** The zsh helper
unpins, upgrades, and attempts to repin whether the upgrade succeeds, fails or is interrupted (a
zsh `always` block). It returns the upgrade failure status when repinning succeeds, or a non-zero
status if repinning fails. It refuses a package in the `brew-holds` record: repinning after the
upgrade would keep the version the hold blocks. The bump
changes the script, so chezmoi re-runs it on every host. If the bump is forgotten, the next run
reports drift.

## Risks / Trade-offs

- [A bulk `brew upgrade` or `bubu` upgrades an unpinned dependency and breaks a pinned dependent's
  linkage] → Brew names the dependent it did not reinstall. The doctrine already forbids bulk
  upgrades, and the per-package path unpins only the target.
- [A bare `brew upgrade <pkg>` now fails for every frozen package] → Brew prints "Not upgrading 1
  pinned package: <pkg>". The README, the manual and the skill document
  `brew-upgrade-pinned`.
- [A frozen package depends on an outdated frozen package, such as `aoe` on `tmux`] → Brew refuses
  the upgrade with "You must `brew unpin tmux`". Upgrade the dependency first with
  `brew-upgrade-pinned`. A bare `brew unpin` leaves it unfrozen until the script next runs.
- [The arm64 host, or any fresh host, gets drift warnings on its first run] → This is expected: the
  versions come from one host by decision. Settle each warning by upgrading the host that is
  behind or by bumping the row. Per-host versions are deferred.
- [A pin removed by hand stays removed until the script content next changes] → The same holds
  for `BREW_HOLDS` today. The next version bump re-runs the script.
- [Cask pinning needs a Homebrew that supports it (7.0.6 does)] → A failed `brew pin --cask`
  becomes an error that names the package, and the other pins still apply.

## Migration Plan

1. Merge, then run `chezmoi update` on each host. The chezmoi source at `~/.local/share/chezmoi`
   must be synced; `chezmoi apply` alone uses whatever that source holds.
2. On the Intel reference host, the first freeze run pinned 34 packages and warned once about the
   llmfit source. Its llmfit was then migrated to the tap at 1.1.16 and repinned, so that warning
   no longer applies on this host.
3. On the arm64 host, read the drift and source warnings and settle each one.

Rollback: revert the change. Then release the recorded pins by hand:
`while read -r kind name; do brew unpin "--$kind" "$name"; done < ~/.local/state/dotfiles/brew-freezes`.

## Open Questions

- Which inventory items to keep, remove or adopt. That decision goes to a later proposal.
