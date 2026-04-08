## Context

The oh-my-zsh nvm plugin with `lazy yes` (configured in `dot_zshrc.tmpl`) creates shell function wrappers for `node`, `npm`, `npx`, etc. These functions work in the interactive shell but are **not inherited by subprocesses**. Tools like Gradle (Android), Xcode (iOS), and scripts using `/usr/bin/env node` fail because `$PATH` never includes the nvm-managed node binary directory.

Current state in `dot_zshrc.tmpl`:

- Line 57: `export NVM_DIR="$HOME/.nvm"`
- Lines 58-60: `zstyle` lazy/autoload/silent-autoload config
- Line 73: `source $ZSH/oh-my-zsh.sh` (nvm plugin creates function wrappers here)
- No PATH entry for `$NVM_DIR/versions/node/*/bin`

## Goals / Non-Goals

**Goals:**

- Ensure `node` is discoverable via `$PATH` for subprocesses (Gradle, Xcode, `/usr/bin/env node`)
- Preserve lazy-loading behavior (no full nvm initialization at shell startup)
- Keep the fix lightweight and self-contained

**Non-Goals:**

- Replacing lazy loading with eager loading
- Supporting multiple simultaneous node versions in PATH
- Modifying the nvm plugin itself or upstream behavior

## Decisions

### Decision 1: Pre-seed PATH after oh-my-zsh source

Add a block **after** `source $ZSH/oh-my-zsh.sh` that finds the most recent nvm-installed node version and prepends its `bin/` to `$PATH`.

**Rationale**: Placing it after the oh-my-zsh source keeps all nvm-related config together. The block runs only at shell init (not per-command), so the cost is negligible.

**Alternative considered**: Placing the block in `.zshenv` — rejected because `NVM_DIR` might not be set yet and `.zshenv` runs for non-interactive shells too, adding unnecessary overhead.

### Decision 2: Use `sort -V | tail -1` to find latest version

Use `command ls -1d "$NVM_DIR/versions/node/"v* | sort -V | tail -1` to find the highest-versioned node directory.

**Rationale**: `sort -V` (version sort) correctly handles semver ordering. Using the latest version as default is the safest assumption — it aligns with `nvm alias default lts/*` from the bootstrap script. The `command ls` prefix bypasses any shell aliases.

**Alternative considered**: Reading `$NVM_DIR/alias/default` and resolving to a path — more correct in theory but adds complexity (needs to resolve `lts/*` aliases, handle missing alias file). The version-sort approach is simpler and works for the common case.

### Decision 3: Guard with directory existence check

Wrap in `if [ -d "$NVM_DIR/versions/node" ]` so the block is a no-op on machines without nvm or without any installed node versions.

**Rationale**: Keeps the shell startup clean on machines that don't use nvm.

## Risks / Trade-offs

- **[PATH vs nvm default mismatch]** → If the user has a different default alias, PATH might point to a newer version than `nvm use default` would select. Mitigation: once nvm lazy-loads, it takes over. The PATH pre-seed is only for subprocesses before nvm fully initializes.
- **[Stale PATH on node upgrade]** → After `nvm install`, the PATH pre-seed won't update until a new shell is opened. Mitigation: this matches existing nvm behavior — users already expect to open a new shell after changing node versions.
