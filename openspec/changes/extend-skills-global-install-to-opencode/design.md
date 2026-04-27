## Context

Group 9 of `run_onchange_install-packages.sh.tmpl` installs global skills via `npx -y skills add <repo> --skill <name> -g -y`. The `skills.sh` CLI writes to `~/.claude/skills/<name>/`, the global directory for Claude Code. OpenCode, on the other hand, reads skills from `~/.config/opencode/skills/<name>/` and has no equivalent CLI — today there is only one isolated case (`superpowers`) using a manual `ln -sf`.

Task DOT-3 requires the `slidev` skill (repo `slidevjs/slidev`) to be available in OpenCode. Instead of duplicating the install per channel, we leverage the existing Claude infrastructure plus a symlink bridge.

## Goals / Non-Goals

**Goals:**

- `slidev` is installed as a global skill via `skills.sh`, just like the rest.
- Every global skill installed in `~/.claude/skills/<name>/` is exposed to OpenCode under `~/.config/opencode/skills/<name>/` without duplicating data.
- The operation is idempotent: running the script multiple times does not break anything and retrofits already-installed skills.
- Keep the install script as the single source of truth for global skills.

**Non-Goals:**

- Reorganize the current install mechanism (`skills.sh` CLI remains the canonical method).
- Reconcile the drift between the script (which installs `code-review` and `autofix`) and the spec (which still lists 10 skills). Separate topic.
- Manage OpenCode skills that do NOT exist in `~/.claude/skills/` — this bridge is one-way.
- Touch the existing `superpowers` symlink (it lives outside `~/.claude/skills/`).

## Decisions

### Decision 1: Symlink `~/.claude/skills/<name>/` → `~/.config/opencode/skills/<name>/`

After every successful `npx skills add ... -g -y`, the `install_skill` helper runs:

```bash
mkdir -p "$HOME/.config/opencode/skills"
ln -sf "$HOME/.claude/skills/<name>" "$HOME/.config/opencode/skills/<name>"
```

**Why a symlink and not a copy**: when `skills.sh` updates a skill, Claude Code and OpenCode will see the same version with no resyncs. Skills may include `references/` with multiple files — copying would mean maintaining a parallel tree.

**Alternatives considered**:

- **Recursive copy with `cp -R`**: rejected; duplicates data and requires change detection.
- **Write a shim in OpenCode that reads `~/.claude/skills/`**: rejected; OpenCode does not expose that hook and it would introduce fragile coupling.
- **Move to a neutral location (`~/.local/share/ai-skills/`) and symlink both**: cleaner but breaks the `skills.sh` CLI convention, which always writes to `~/.claude/skills/`.

### Decision 2: The bridge applies to ALL global skills, not just Slidev

`install_skill` is what creates the symlink, so the rule applies uniformly to all 11+ skills. Slidev is the trigger, but the behavior is generic.

**Why generic**: the marginal cost is zero (one `ln -sfn`/`-shf` per skill) and any dotfiles user benefits from having `find-skills`, `frontend-design`, etc. in OpenCode without extra work.

**Alternative considered**: symlink only `slidev` via a whitelist. Rejected — adds complexity and leaves other skills orphaned in OpenCode.

### Decision 3: Collision handling — `ln -sfn`/`-shf` with platform detection

`ln -sf` **by itself does not replace a symlink to a directory**: on both GNU and BSD/macOS, if `$dst` points to an existing directory, `ln -sf` dereferences the symlink and creates the new link _inside_ the target directory. Replacing the symlink as a file requires the no-dereference flag:

- **Linux (GNU coreutils)**: `ln -sfn "$src" "$dst"` (`-n` = no dereference)
- **macOS/BSD**: `ln -shf "$src" "$dst"` (`-h` = no dereference)

The install script detects the platform with `uname -s` (already a precedent in the chezmoi template) and picks the right flag. Broken symlinks and a previously-absent target work the same way in both cases.

**Real directories are not overwritten**: if `$dst` exists as a real directory (not a symlink), `ln -sfn`/`-shf` fails with "cannot overwrite directory". We accept this fail-safe: the script reports the error via `run_claude_step`, increments the counter, and continues without touching the directory. The user must remove it manually if they want the symlink to replace it.

**Alternative considered**: detect the collision with `[ -L "$dst" ] || [ ! -e "$dst" ]` before calling `ln`. Rejected — `ln`'s failure already conveys the same information and does not warrant the extra complexity.

### Decision 4: No spec entry for the existing `superpowers` symlink

The `superpowers` symlink (group 8) is left as-is — it points to its own clone (`$SUPERPOWERS_DIR/skills`), not to `~/.claude/skills/`. It is a different mechanism (a whole folder as a skill) outside the scope of `skills-global-install`.

## Risks / Trade-offs

- **[Risk] The user has a real skill at `~/.config/opencode/skills/<name>/`** → `ln -sfn`/`-shf` fails with "cannot overwrite directory" and does not overwrite it. **Mitigation**: this is the desired behavior (fail-safe). The error is reported and we continue; the user decides whether to remove the directory.
- **[Risk] If `~/.claude/skills/<name>/` does not exist (e.g. `skills add` failed)** → the symlink would point to a non-existent path. **Mitigation**: the symlink is created only inside the `install_skill` success block, never if `skills add` fails. It also remains idempotent on the next run.
- **[Risk] Non-macOS platforms** → the script prints manual instructions. **Mitigation**: that section must include both the install command and the correct symlink command for Linux (`ln -sfn`).
- **[Trade-off] The spec will keep listing N+1 skills while the script installs N+3** (because of the preexisting drift with `code-review`/`autofix`). Accepted as out-of-scope debt.
