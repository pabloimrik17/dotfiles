## Context

Actualmente usamos fzf con funciones shell custom en `.zshrc` (frg, fgco, fglog, fkill) y configuración de FZF_DEFAULT_COMMAND/OPTS. Television ofrece un sistema declarativo de canales TOML con autocomplete contextual (Ctrl+T detecta el comando que se está escribiendo).

## Goals / Non-Goals

**Goals:**
- Instalar television y configurar shell integration (Ctrl+T contextual, Ctrl+R historia)
- Configurar channel triggers para nuestro stack: git, gh, docker, bun, brew
- Crear canal custom bun-scripts para ejecutar scripts de package.json
- Aplicar tema Catppuccin
- Evaluar qué funciones fzf custom de .zshrc puede reemplazar television

**Non-Goals:**
- Eliminar fzf por completo (television lo usa internamente y fzf sigue siendo útil para pipes ad-hoc)
- Crear canales custom para kubernetes/AWS (no es nuestro stack principal)
- Reemplazar atuin para historial (atuin tiene sync y AI, television solo tiene búsqueda local)

## Decisions

### Coexistencia fzf + television
fzf sigue instalado. Television usa fzf internamente para el fuzzy matching. Lo que cambia:
- Ctrl+T: pasa de fzf (siempre archivos) a television (contextual)
- Ctrl+R: sigue con atuin (tiene sync + AI), no con television
- Las funciones custom (frg, fgco, fglog, fkill) se mantienen inicialmente y se evalúa su eliminación después de validar que television las cubre

### Keybinding strategy
| Keybinding | Actual | Propuesto |
|------------|--------|-----------|
| Ctrl+R | atuin (historial AI) | atuin (sin cambio) |
| Ctrl+T | fzf (archivos) | television (contextual) |
| Alt+C | fzf (directorios) | fzf (sin cambio, television no tiene equivalente) |

Television se inicializa DESPUÉS de fzf en .zshrc para que sobrescriba Ctrl+T pero no afecte otros bindings.

### Channel triggers para nuestro stack
```toml
[shell_integration.channel_triggers]
"git-branch" = ["git checkout", "git branch", "git merge", "git rebase"]
"git-diff" = ["git add", "git restore", "git stash"]
"git-log" = ["git show", "git revert", "git cherry-pick"]
"gh-prs" = ["gh pr checkout", "gh pr view", "gh pr merge"]
"gh-issues" = ["gh issue view", "gh issue close"]
"docker-containers" = ["docker exec", "docker stop", "docker logs"]
"bun-scripts" = ["bun run", "br"]
"brew-packages" = ["brew info", "brew upgrade", "brew uninstall"]
```

### Canal custom: bun-scripts
Archivo TOML en `cable/bun-scripts.toml` que lee `package.json` con jq y lista los scripts disponibles. Enter ejecuta el script con `bun run`.

## Risks / Trade-offs

- **[Conflicto Ctrl+T con fzf]** → Mitigación: television se inicializa después de fzf, sobrescribe el binding limpiamente
- **[television es relativamente nuevo]** → Mitigación: 10k+ stars en GitHub, release frecuente, escrito en Rust
- **[Canal bun-scripts requiere jq]** → Mitigación: jq ya debería estar instalado; añadir al install script si no lo está
- **[Funciones custom duplicadas temporalmente]** → Aceptable: se eliminan en un cambio posterior tras validación
