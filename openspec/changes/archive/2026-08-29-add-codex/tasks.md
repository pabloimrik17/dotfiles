## 1. Codex Installation

- [x] 1.1 Extend the official-installer group in `run_onchange_install-packages.sh.tmpl` with standalone Codex detection, confirmation gating, the non-interactive OpenAI installer, direct `~/.local/bin/codex` verification, and existing error accounting; verify the rendered script passes `zsh -n` and isolated command stubs cover clean-install, decline, and already-installed paths.
- [x] 1.2 Add guarded migration from the Homebrew `codex` cask and global npm `@openai/codex`, removing either only after direct standalone verification; verify with isolated Homebrew/npm/installer stubs that success cleans up the legacy distribution, failure leaves it installed, and pre-existing `~/.codex` state is not deleted or reset.
- [x] 1.3 Add Codex install, authentication, and update commands to the non-macOS/manual fallback output, then apply the `classify-tool-updates` workflow and verify Codex is documented as self-updating with no `update-extra` step or new PATH stanza.

## 2. Agent Skill Parity

- [x] 2.1 Update `.agents/skills/sync-agent-config/SKILL.md` and `parity.md` for Claude Code, Codex, OpenCode, and Junie, including future `dot_codex/**` activation, project `.codex/**` exclusion, other-three proposals, and explicit gaps; verify the parity table has the six-column header and zero mapping rows.
- [x] 2.2 Expand `.agents/skills/sync-agent-config/evals/evals.json` with Codex-origin, Codex-gap, four-tool completeness, and project `.codex` exclusion cases; verify the JSON parses and every in-scope eval requires all four tools or an explicit gap without permitting an unconfirmed write.
- [x] 2.3 Verify repo-owned and global skills resolve directly from `.agents/skills` for Codex, including Slidev, while Claude compatibility symlinks remain relative; verify no Codex-specific repo/user skill copy is added and `git diff` shows no modification under generator-owned `.codex/skills`.
- [x] 2.4 Update the canonical `update-manual` skill and its Claude/Junie command surfaces with Codex triggers and the Section 13 mapping; verify the copies remain functionally equivalent and each maps the installer plus future `dot_codex/**` sources to Codex.

## 3. User Documentation

- [x] 3.1 Apply the `update-readme` workflow to add Codex to the README introduction, AI Tooling table, and self-updating-tool guidance; verify all claims match the standalone installer and do not claim managed Codex MCP servers or preferences.
- [x] 3.2 Apply the `update-manual` workflow to add Codex as Section 13 and renumber Agent Sessions to Section 14, covering install, first-run authentication, updates, completion generation, `AGENTS.md`, `.agents/skills`, and basic commands; verify sidebar links, headings, search content, and all section-count references agree on 14.
- [x] 3.3 Open `docs/manual.html` at desktop and mobile widths and exercise navigation and search for Codex, then print with the reference Chrome settings; verify the page has no console errors and the print result includes all 14 sections in approximately 2-4 A4 pages.

## 4. Final Verification

- [x] 4.1 Verify scope exclusions with `git diff`: no Codex MCP registration, no managed `dot_codex` source, no automatic zsh completion eval, no Codex `update-extra` entry, and no edits to generator-owned `.codex/skills`.
- [x] 4.2 Run `bun run lint:oxfmt`, `bun run lint:fallow`, rendered-template shell syntax validation, and `openspec validate add-codex --strict`; resolve every failure and confirm `openspec status --change add-codex` reports all implementation prerequisites ready.
