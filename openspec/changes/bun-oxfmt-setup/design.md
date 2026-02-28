## Context

This is a dotfiles repo managed by chezmoi. It currently has zero JavaScript tooling — no `package.json`, no formatter, no git hooks. The sibling repo monolab uses pnpm + Node with Prettier, Husky 9, commitlint, and lint-staged. We want equivalent guardrails here but using Bun as the runtime and oxfmt (Prettier-compatible, Rust-based) as the formatter.

Bun v1.3.5 is already installed globally. oxfmt v0.35.0 is the latest available on npm. The repo contains mostly config files: JSON, TOML, YAML, Markdown, shell scripts. oxfmt handles all of these except shell scripts.

## Goals / Non-Goals

**Goals:**

- Bun-initialized repo with tracked `bun.lock`
- oxfmt as the universal formatter for all supported file types
- Pre-commit hook formatting staged files via lint-staged
- Commit message validation enforcing conventional commits
- Config files in TypeScript (Bun executes TS natively)
- Formatting conventions aligned with monolab (tabWidth 4, spaces)

**Non-Goals:**

- ESLint or any JS linter (no JS/TS application code in this repo)
- knip or dead code detection (not applicable)
- stylelint (no CSS in dotfiles)
- Branch name validation (not enforcing a branch workflow here)
- CI pipeline (can be added later, out of scope)
- markdownlint (oxfmt handles Markdown formatting; structural linting is unnecessary for dotfiles)

## Decisions

### D1: Bun over pnpm/Node

**Choice**: Bun as package manager and runtime.
**Rationale**: Bun executes TypeScript natively — no `NODE_OPTIONS="--experimental-strip-types"` hack needed for config files. Faster installs. Already available on the machine. For a lightweight dotfiles repo, Bun's simplicity wins over pnpm's monorepo features (which aren't needed here).
**Alternatives**: pnpm + Node (like monolab) — rejected because it adds complexity for no benefit in a non-monorepo context.

### D2: oxfmt over Prettier

**Choice**: oxfmt as the formatter.
**Rationale**: 30x faster than Prettier, Prettier-compatible output, supports JSON/TOML/YAML/MD/CSS/HTML out of the box. Built-in import sorting and package.json sorting. Single binary, no plugin ecosystem to manage.
**Alternatives**: Prettier (established but slower, requires plugins for TOML), Biome (good but oxfmt has broader file format support including YAML and TOML).

### D3: lint-staged over whole-repo formatting in pre-commit

**Choice**: lint-staged to format only staged files.
**Rationale**: Even though oxfmt is fast enough to format the whole repo, lint-staged is the standard pattern. It prevents formatting unstaged files (which could cause confusion), and it matches the monolab workflow. The overhead of lint-staged as a dependency is minimal.
**Alternatives**: Running `oxfmt .` directly in pre-commit — rejected because it would touch unstaged files.

### D4: TypeScript config files

**Choice**: `commitlint.config.ts` and `lint-staged.config.ts` in TypeScript.
**Rationale**: Bun runs TS natively, so there's no runtime cost. TS configs get type checking via `satisfies` and `UserConfig` types. Matches monolab's approach.
**Alternatives**: JSON configs — simpler but lose type safety and can't use `satisfies`.

### D5: oxfmt ignore strategy

**Choice**: Use `.oxfmtignore` file for exclusions.
**Rationale**: Keeps the oxfmt config file clean. Exclude directories that contain generated/managed content: `openspec/`, `.claude/`, `.codex/`, `.opencode/`, `.husky/_/`. These are either AI agent configs or OpenSpec artifacts where auto-formatting could cause noise.
**Alternatives**: `overrides` in oxfmt config — more complex, harder to scan.

### D6: Hooks use `bunx` to invoke tools

**Choice**: Use `bunx` in hook scripts (e.g., `bunx lint-staged`, `bunx commitlint`).
**Rationale**: `bunx` resolves binaries from `node_modules/.bin`, equivalent to `pnpm exec` in monolab. Keeps hooks runtime-consistent with the rest of the setup.

## Risks / Trade-offs

- **[oxfmt is beta]** → The formatter may have edge cases. Mitigation: oxfmt passes 100% of Prettier JS/TS conformance tests, and for a dotfiles repo the risk surface is small (mostly JSON/YAML/TOML).
- **[Bun version drift]** → No `.bunversion` or equivalent pinning. Mitigation: Bun is backwards-compatible for this use case (running deps and TS configs). Can add pinning later if needed.
- **[Hook bypass]** → Developers can skip hooks with `--no-verify`. Mitigation: Acceptable for a personal dotfiles repo. CI enforcement is a non-goal for now.
- **[oxfmt formatting openspec artifacts]** → Could create noisy diffs on spec files. Mitigation: `.oxfmtignore` excludes `openspec/` entirely.
