## Why

The oh-my-zsh nvm plugin with `lazy yes` creates shell **functions** for `node`/`npm`/`npx`, but does not add the node binary directory to `$PATH`. This means subprocesses (Gradle for Android builds, Xcode for iOS builds, any non-shell child process) cannot find `node` because they inherit `PATH` but not shell functions. Running `/usr/bin/env node` fails even when `node --version` works in the interactive shell.

## What Changes

- Add a PATH pre-seeding block in `dot_zshrc.tmpl` (after `source $ZSH/oh-my-zsh.sh`) that discovers the most recent nvm-managed node version and prepends its `bin/` directory to `$PATH`
- This preserves lazy loading for shell startup speed while ensuring subprocesses can resolve `node` via PATH
- The block is a no-op if nvm has no installed node versions

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `omz-plugins`: Add a new requirement that the nvm lazy-loading configuration must also pre-seed PATH with the default node binary directory so subprocesses can find `node`

## Impact

- **File**: `dot_zshrc.tmpl` — ~5 lines added after the oh-my-zsh source line
- **Behavior**: `$PATH` will include the nvm default node's `bin/` directory in every shell session, making `node` discoverable by subprocesses (Gradle, Xcode, scripts using `/usr/bin/env node`)
- **No breaking changes**: Lazy loading still defers full nvm initialization; the PATH addition is lightweight and independent
