## Context

The `mac-dev-setup` change introduced automated installation of CLI tools, GUI apps (brew casks), macOS defaults, App Store apps, and Claude Code plugins. The implementation works correctly but has DX issues: opaque prompts ("19 apps" without listing them), binary all-or-nothing choices for casks, zero confirmation for macOS defaults, and missing idempotency checks that cause unnecessary prompts on re-runs.

The install script (`run_onchange_install-packages.sh.tmpl`) re-executes whenever its content changes (chezmoi `run_onchange_` behavior), so users encounter these prompts repeatedly. The macOS defaults script (`run_once_configure-macos-defaults.sh.tmpl`) runs once per content hash.

## Goals / Non-Goals

**Goals:**

- Make every confirmation prompt show exactly what will be installed/configured before asking
- Allow granular selection of GUI casks via fzf multi-select picker
- Add grouped confirmation with descriptions for macOS defaults
- Eliminate unnecessary prompts when everything in a group is already installed
- Fix idempotency gaps in MAS apps, Claude Code marketplaces, and Claude Code plugins
- Make the "noop run" (nothing to install) fast and silent

**Non-Goals:**

- Changing what gets installed (no additions/removals to the app lists)
- Adding fzf pickers to non-cask groups (brew formulae, fonts, oh-my-zsh, NVM, plugins, skills — these already have acceptable DX)
- Persisting user selection state between runs (rejected apps are not remembered)
- Adding fzf as a required dependency (fallback behavior if fzf unavailable)

## Decisions

### D1: fzf multi-select for cask installation

**Decision**: Replace the current core-cask single confirm + optional-cask individual confirms with a single fzf `--multi` picker. All items start deselected (user opts in via Ctrl-A + deselect or individual TAB). Already-installed apps are excluded from the picker.

**Rationale**: Starting deselected (option C from exploration) costs only one extra keystroke (Ctrl-A) on first run but eliminates the problem of re-asking about rejected core apps on subsequent runs. The current core/optional distinction is encoded by removing the `[Optional]` prefix — users can still identify optional apps, but the selection mechanism is uniform.

**Alternatives considered**:

- Pre-select core apps (option A): Simpler first run, but nags on re-runs when you reject a core app
- Remember rejections in a state file (option B): Adds mutable state outside the repo
- Category-based confirm groups without fzf (option B from exploration): More prompts, less granularity

### D2: Adaptive prompt thresholds

**Decision**: Use different UX based on how many apps need installation:

- 0 pending: silent skip with summary ("GUI apps: 19/19 installed")
- 1-3 pending: direct `confirm()` prompt per app with description
- 4+ pending: fzf multi-select picker

**Rationale**: Opening fzf for 1-2 apps is overkill. A simple "Install notion (Productivity workspace)? [Y/n]" is faster. The threshold of 4 matches the point where individual prompts become tedious.

### D3: fzf item format with category prefix and description

**Decision**: Each fzf line follows the format: `[Category] cask-name  description`

Categories: Dev, Browser, Productivity, AI, Security, Media, Optional.

**Rationale**: The `[Category]` prefix enables fzf's built-in text filtering — typing "Dev" instantly filters to dev tools. The description provides context missing from bare cask names (e.g., "numi" → "Natural language calculator").

**Format example**:

```
[Dev] visual-studio-code         IDE
[Dev] docker                     Container runtime
[Browser] google-chrome          Browser
[Productivity] raycast           App launcher (Spotlight alt)
[AI] claude                      Claude desktop app
[Optional] telegram              Messaging
```

### D4: Grouped macOS defaults with descriptive preview

**Decision**: Split macOS defaults into 6 groups (Finder, Dock, Trackpad, Keyboard, Hot corners, Misc). Each group prints a bulleted preview of every setting with a human-readable description, then asks [Y/n].

**Rationale**: Individual prompts (20+) are excessive. Group-level prompts (6) match natural mental categories — if you want hidden files in Finder, you likely want path bar and status bar too. The descriptive preview solves the opacity problem without adding excessive interactivity.

### D5: Pre-scan idempotency for silent skip

**Decision**: Before prompting any group, check if all items are already installed. If so, print a summary line and skip the prompt entirely. This applies to: casks (via `/Applications/*.app` check), MAS apps (`mas list`), CC marketplaces (`claude plugin marketplace list --json`), CC plugins (`claude plugin list --json`).

**Rationale**: The biggest DX win for re-runs. A noop run currently requires confirming every group manually. With pre-scan, a fully-configured machine produces zero prompts.

**Implementation**: Cache each query result once per group (same pattern as existing `skill_installed()`). Use `grep` on cached JSON/text output for individual checks.

### D6: fzf fallback when unavailable

**Decision**: If `fzf` is not in PATH when Group 4 runs (e.g., user skipped Group 1), fall back to the current behavior: list all pending apps, single confirm for all.

**Rationale**: fzf is installed in Group 1 (brew formulae), so it's normally available by Group 4. But if Group 1 was skipped, the script should still work. The fallback is the "preview then confirm" approach (Alternativa A from exploration) — print the full list, then ask once.

### D7: MAS apps follow the same adaptive pattern

**Decision**: Apply the same 0/1-3/4+ threshold to MAS apps. Currently only 2 apps, so they'll use direct prompts with descriptions.

**Rationale**: Consistent behavior across similar groups. Future MAS additions automatically get fzf when the list grows past 3.

## Risks / Trade-offs

**[fzf not available on first run if Group 1 skipped]** User skips brew formulae → fzf not installed → Group 4 can't use picker.
→ Mitigation: D6 fallback behavior. Print list + single confirm.

**[fzf UX unfamiliarity]** Some users may not know TAB/Ctrl-A in fzf multi-select mode.
→ Mitigation: Header text in fzf shows keybindings: "TAB = toggle, Ctrl-A = select all, ENTER = confirm". fzf is already a core tool in the user's workflow.

**[20+ defaults prompts replaced by 6]** Less granularity than individual prompts — can't accept path bar but reject status bar in Finder.
→ Mitigation: Acceptable trade-off. Settings within a group are thematically coherent. If a specific setting becomes unwanted, remove it from the array in the template.

**[`claude plugin list --json` may be slow]** Querying Claude Code CLI adds latency to the pre-scan.
→ Mitigation: Query once, cache result. Only runs if `claude` command exists. ~1-2 seconds overhead.

**[Category assignment is hardcoded]** Adding a new cask requires adding it to both the cask array and the category/description mapping.
→ Mitigation: Use a single data structure (associative array or structured list) that contains cask name, category, and description together. This keeps all metadata co-located.
