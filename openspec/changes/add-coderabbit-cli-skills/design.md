## Context

The dotfiles repo uses chezmoi with a single install script (`run_onchange_install-packages.sh.tmpl`) that organizes tool installation into numbered groups with interactive confirmation. CLI tools go in `BREW_PACKAGES` (Group 1), GUI apps go in `ALL_CASKS` (Group 4), and agent skills go in Group 9 via `install_skill` helper calls.

CodeRabbit CLI (`coderabbit` / `cr`) is an AI-powered code review tool distributed as a brew cask. It provides two agent skills via the `skills.sh` ecosystem: `code-review` (review uncommitted changes) and `autofix` (fix unresolved PR review comments). Authentication is interactive (browser-based OAuth) and cannot be automated.

## Goals / Non-Goals

**Goals:**

- Install CodeRabbit CLI idempotently as part of the dotfiles bootstrap
- Install both agent skills (`code-review`, `autofix`) globally via `skills.sh`
- Inform the user about the manual auth step post-install
- Follow existing installation patterns exactly (cask array format, skill helper, manual instruction block)

**Non-Goals:**

- Automating `coderabbit auth login` (requires browser interaction)
- Adding a global `.coderabbit.yaml` config (CodeRabbit has no filesystem-level global config — config is per-project or per-org via web UI)
- Adding shell aliases (`cr` is already provided by the CLI)
- Modifying the non-macOS instruction block (out of scope for this dotfiles setup)

## Decisions

### 1. Install as brew cask, not via curl | sh

CodeRabbit offers two installation methods: brew cask (`brew install --cask coderabbit`) and curl script (`curl -fsSL https://cli.coderabbit.ai/install.sh | sh`).

| Option      | Pros                                                                                             | Cons                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Brew cask   | Consistent with ALL_CASKS pattern, managed by brew upgrade, idempotent via `/Applications` check | Slightly larger download (includes app bundle)                         |
| curl script | Lighter, works without brew                                                                      | Different pattern from rest of install script, no brew upgrade support |

**Decision:** Brew cask. It follows the existing `ALL_CASKS` pattern and gets automatic updates via `brew upgrade`.

**Fallback:** If the brew cask is unavailable or broken on a future macOS version, the curl script can be used as a manual install alternative.

### 2. Category: AI (not Dev)

The `ALL_CASKS` array uses a category field for grouping in the fzf picker. CodeRabbit is an AI-powered review tool, placing it alongside Claude, ChatGPT, Ollama, and superwhisper.

**Decision:** Use `AI` category. Format: `"coderabbit|CodeRabbit|AI|AI code review CLI"`.

### 3. Both skills installed globally

The proposal lists two skills: `code-review` and `autofix`. Both are useful independently — `code-review` works on uncommitted changes (no PR needed), while `autofix` works on PR review comments.

**Decision:** Install both via the existing `install_skill` helper in Group 9:

```bash
install_skill "coderabbitai/skills" "code-review"
install_skill "coderabbitai/skills" "autofix"
```

### 4. Auth as manual instruction only

`coderabbit auth login` opens a browser for OAuth. This cannot be scripted or run headlessly.

**Decision:** Add a line to the manual instructions block (alongside 1Password, Adobe, etc.):

```
info "  - CodeRabbit: coderabbit auth login (opens browser for authentication)"
```

## Risks / Trade-offs

- **[Free tier rate limit]** — CodeRabbit free tier allows 3 reviews/hour. Heavy usage during development may hit this limit. Mitigation: upgrade to Pro if this becomes a bottleneck; not a dotfiles concern.
- **[Cask availability]** — The coderabbit brew cask is relatively new (667 installs in 30 days). If it's removed or broken, fallback to curl install. Mitigation: the manual instructions block can include the curl alternative.
- **[Skills repo stability]** — `coderabbitai/skills` is a third-party skills.sh repo. If it's renamed or removed, `install_skill` will fail gracefully (the `run_claude_step` wrapper catches errors). Mitigation: same error handling as all other Group 9 skills.
