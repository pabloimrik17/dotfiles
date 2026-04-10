## Context

The `.zshrc` template (`dot_zshrc.tmpl`) defines `alias bd="bun dev"` as part of a symmetric set of bun shortcuts (`bi`, `bd`, `bb`, `bt`, `ba`, `br`, `bx`). The beads CLI, installed via Homebrew at `/opt/homebrew/bin/bd`, is now used across all WebstormProjects for local issue tracking. The alias shadows the binary, requiring the full path as a workaround.

## Goals / Non-Goals

**Goals:**

- Free `bd` so it resolves to the beads CLI binary
- Preserve a short alias for `bun dev`
- Keep bun and pnpm alias sets symmetric

**Non-Goals:**

- Renaming other bun/pnpm aliases beyond the `dev` pair
- Creating a separate alias for beads (it already works as `bd` once the collision is removed)
- Changing the beads CLI binary name

## Decisions

### Decision 1: Rename `bd` to `bdv`

**Choice**: `bdv` (bun dev)

**Alternatives considered**:

- `bundev` — too long, defeats the purpose of aliases
- `brd` — conflicts with reading as "brun dev" and is less intuitive
- Remove the alias entirely — `bun dev` is only 7 chars but the alias set is meant to be symmetric with pnpm aliases

**Rationale**: `bdv` is only one character longer than `bd`, clearly reads as "bun dev", and doesn't collide with any known binary or alias. Renaming `pd` to `pdv` in tandem keeps the two alias sets symmetric even though `pd` has no collision.

## Risks / Trade-offs

- **Muscle memory** → Low risk. Both aliases are used interactively; the new names are intuitive and close to the old ones. No scripts depend on them.
- **Extra rename (`pd` → `pdv`)** → Acceptable cost for symmetry. `pd` doesn't collide with anything, but having `pdv`/`bdv` as a matched pair is easier to remember than `pd`/`bdv`.
