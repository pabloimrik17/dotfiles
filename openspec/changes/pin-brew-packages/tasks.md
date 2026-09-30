# Tasks

## 1. Frozen set and version table

- [x] 1.1 Move the zsh plugin literal (`zsh-autosuggestions zsh-syntax-highlighting zsh-completions`)
      into a `ZSH_PLUGIN_FORMULAE` array and use it in both Group 3 loops. Verify: the literal
      appears only in the array, and
      `chezmoi execute-template < run_onchange_install-packages.sh.tmpl | bash -n` exits 0.
- [x] 1.2 Re-read this host's versions right before writing: the highest keg per formula, and
      `brew list --cask --versions` for the fonts. Add `BREW_VERSIONS` (D1) with one `name|version`
      row per frozen package, 35 rows. If a value differs from the design table, use the host's
      value and update the table. Verify: 35 rows, and each one matches
      `brew list --formula --versions` / `brew list --cask --versions`.
- [x] 1.3 Add a static coverage test to `tests/brew-freeze.test.ts`. It parses the template and
      checks that every `BREW_PACKAGES` entry, `ZSH_PLUGIN_FORMULAE` entry and `FONT_CASKS` token
      has exactly one row, that no row is orphaned, and that rows are alphabetized. The scratch
      deletion test matches the package name without hardcoding its current version. Verify:
      `bun test tests/brew-freeze.test.ts` passes, and fails when a row is deleted from a scratch
      copy.

## 2. Freeze pass

- [x] 2.1 Implement `apply_brew_freeze` between `# BEGIN BREW_FREEZE_HELPERS` and
      `# END BREW_FREEZE_HELPERS`, and call it right after Group 3 (D2). It must cover the coverage
      errors, pinning with the correct name and kind (D4), the `brew-freezes` record with its kind
      column (D3), releases, and exact-string drift warnings read from
      `brew list --pinned --versions` (D5). Skip `BREW_HOLDS` names when pinning and recording,
      but still check their drift. Verify: the rendered script passes `bash -n`.
- [x] 2.2 Keep a one-time source-mismatch switch command in the freeze warning, starting with
      `brew unpin`, and remove the always-present llmfit migration hint after migrating the
      reference host. Verify: the freeze warning has the unpin step and the end-of-script hint is
      absent.
- [x] 2.3 In `tests/brew-freeze.test.ts`, add harness tests. They extract the helper block, stub
      `brew`, and run it under `/bin/bash` (3.2), both with and without `set -u`. Write one test
      per scenario of the three ADDED requirements in `specs/brew-version-pins/spec.md`, and assert
      the logged `brew` calls, the output and the record file. Verify: `bun test` passes.

## 3. Docs and skill

- [x] 3.1 Update `.agents/skills/classify-tool-updates/SKILL.md`. The brew-managed class proposes a
      version row for a new formula or font cask, and the upgrade path uses
      `brew-upgrade-pinned` before the row bump. Verify: the skill text covers each scenario of the MODIFIED requirement in
      `specs/classify-tool-updates-skill/spec.md`.
- [x] 3.2 Update the `README.md` maintenance section. Replace `brew upgrade <pkg>` with the
      repinning helper plus the row bump, and add the freeze next to the holds paragraph. Verify:
      the README has no bare `brew upgrade <pkg>` instruction left.
- [x] 3.3 Run the `update-manual` skill for `docs/manual.html`. Update the `brewsp` row (it now
      lists frozen and held packages), the maintenance flow line, and the `bubu` row. Add the
      repinning helper. Verify: the manual has no bare `brew upgrade <pkg>` instruction left, and
      `brewsp` mentions the freeze.
- [x] 3.4 Add `brew-upgrade-pinned` in `dot_zshrc.tmpl`. Verify with a stubbed `brew` that it
      repins after successful, failed and interrupted upgrades, returns a non-zero status on
      failure, and refuses a recorded hold without calling `brew`.

## 4. Integration

- [x] 4.1 With the user's go-ahead, run the extracted freeze pass on this host against the real
      `brew`. Verify: `brew list --pinned --versions` lists 35 packages (34 new plus `beads`), there
      are no drift warnings and exactly one llmfit source warning, and `brew-freezes` has 34 lines.
- [x] 4.2 Run the same pass a second time. Verify: no `brew pin` calls, no warnings, and the
      record is unchanged.
- [x] 4.3 Run the repo gates. Verify: `openspec validate pin-brew-packages --strict`,
      `bunx @fission-ai/openspec@1.2.0 validate --changes --no-interactive`, `bun run lint:oxfmt`,
      `bunx fallow dead-code --fail-on-issues` and `bun test` all exit 0.
- [x] 4.4 Switch the Intel host's installed llmfit from `homebrew/core` 1.1.15 to the declared
      `AlexsJones/llmfit` tap at 1.1.16, then pin it. Verify: the tap owns the installed formula,
      `llmfit --version` prints 1.1.16 and `brew list --pinned --versions llmfit` lists 1.1.16.
- [x] 4.5 Re-run relevant gates after the review changes and verify the rendered shell functions,
      the freeze pass, OpenSpec validation, formatting and tests.

## 5. Verification follow-up

- [x] 5.1 Transfer ownership when a freeze-owned formula becomes a hold, without claiming a hand
      pin. Verify that removing both declarations releases the transferred pin.
- [x] 5.2 Add direct tests for the four hold scenarios in the modified requirement, plus the
      transfer and hand-pin regressions.
- [x] 5.3 Re-run OpenSpec validation, shell syntax, formatting, dead-code analysis and tests.
