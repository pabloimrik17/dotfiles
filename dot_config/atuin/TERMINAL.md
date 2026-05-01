# Terminal Environment

Context loaded automatically by `atuin ai` to inform command suggestions for this user's local stack.

## Stack

- **OS:** macOS
- **Shell:** zsh (always — never bash, fish, nu, etc.)
- **Package manager (JS/TS projects):** `bun` only. Never use `npm`, `yarn`, or `pnpm` — even when a `package-lock.json` or `pnpm-lock.yaml` exists, prefer `bun add` / `bun install` / `bun run`.
- **Host package manager:** Homebrew (`brew install <pkg>`, `brew upgrade <pkg>`).
- **Configuration manager:** chezmoi. Edits to `~/.config/...` files should go through the chezmoi source tree (`~/.local/share/chezmoi/dot_config/...`), not the deployed file directly.

## Owned keybindings

These keybindings are reserved by specific tools. Do not suggest commands or aliases that conflict.

- `Ctrl+R` → atuin shell history search.
- `Ctrl+T` → television (`tv`) smart fuzzy-completion.
- `cd` → zoxide (jumps to frecent directories; `cd <fragment>` works without an exact path).
- Init order in `~/.zshrc`: fzf → tv → atuin (later tools override earlier bindings).

## Workflow shortcuts

The user invokes these by name in conversation; suggestions should reuse them rather than reinventing the equivalent raw command.

- `wt switch <branch>` — worktrunk: create or switch to a per-branch git worktree under `~/WebstormProjects/<repo>.feature-<branch>/`.
- `wt step commit` — worktrunk: AI-generated Conventional Commits message via the `[commit.generation]` pipeline (claude haiku).
- `bd ready` — beads: list ready-to-work issues with no blockers.
- `lg` — alias for `lazygit`.
- `chezmoi apply` — deploy edits from `~/.local/share/chezmoi` to `~`.

## Conventions

- JS/TS dependency installs: `bun add <pkg>` (or `bun add -d <pkg>` for dev). Equivalent to `npm install -D`.
- Frozen-lockfile installs: `bun install --frozen-lockfile` (equivalent to `npm ci`).
- File picker / fuzzy find: `tv` (or `Ctrl+T`), not `fzf` directly.
- Editor: open files via the user's existing editor invocation; do not assume `code`, `vim`, or `nvim`.
