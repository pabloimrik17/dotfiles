## Why

The alias `bd="bun dev"` in `.zshrc` shadows `/opt/homebrew/bin/bd` (the beads CLI installed via Homebrew), making it impossible to use `bd create`, `bd list`, etc. without typing the full path. Since beads is the local issue tracker used across all WebstormProjects, this collision causes daily friction.

## What Changes

- Rename the `bd` alias from `bun dev` to `bdv` in `dot_zshrc.tmpl`
- Rename the `pd` alias from `pnpm dev` to `pdv` in `dot_zshrc.tmpl` for symmetry
- Update the `zsh-aliases` spec to reflect both new alias names

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `zsh-aliases`: The bun and pnpm aliases requirements change — `bd` is renamed to `bdv` (to avoid colliding with the beads CLI binary) and `pd` is renamed to `pdv` (for symmetry)

## Impact

- **File**: `dot_zshrc.tmpl` — two alias lines change (`bd` -> `bdv`, `pd` -> `pdv`)
- **Spec**: `openspec/specs/zsh-aliases/spec.md` — bun and pnpm aliases requirements updated
- **User muscle-memory**: Anyone used to typing `bd`/`pd` for dev must switch to `bdv`/`pdv`
- **beads CLI**: Unblocked — `bd` will resolve to `/opt/homebrew/bin/bd` as expected
