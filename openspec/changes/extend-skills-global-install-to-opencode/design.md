## Context

El grupo 9 del `run_onchange_install-packages.sh.tmpl` instala skills globales mediante `npx -y skills add <repo> --skill <name> -g -y`. La CLI `skills.sh` escribe en `~/.claude/skills/<name>/`, el directorio global de Claude Code. OpenCode, en cambio, lee skills desde `~/.config/opencode/skills/<name>/` y no tiene ninguna CLI equivalente — hoy solo existe un caso aislado (`superpowers`) que usa `ln -sf` manual.

La tarea DOT-3 requiere que la skill `slidev` (repo `slidevjs/slidev`) esté disponible en OpenCode. En lugar de duplicar la instalación por canal, aprovechamos la infra existente de Claude + un puente de symlinks.

## Goals / Non-Goals

**Goals:**

- `slidev` se instala como skill global via `skills.sh`, igual que el resto.
- Toda skill global instalada en `~/.claude/skills/<name>/` queda expuesta a OpenCode bajo `~/.config/opencode/skills/<name>/` sin duplicar datos.
- La operación es idempotente: ejecutar el script varias veces no rompe nada y retrofittea las skills ya existentes.
- Mantener el install script como única fuente de verdad para skills globales.

**Non-Goals:**

- Reorganizar el mecanismo de instalación actual (`skills.sh` CLI sigue siendo el método canónico).
- Unificar la drift entre el script (que instala `code-review` y `autofix`) y la spec (que aún lista 10 skills). Tema separado.
- Gestionar skills de OpenCode que NO existan en `~/.claude/skills/` — este puente es unidireccional.
- Tocar el symlink existente de `superpowers` (vive fuera de `~/.claude/skills/`).

## Decisions

### Decisión 1: Symlink `~/.claude/skills/<name>/` → `~/.config/opencode/skills/<name>/`

Tras cada `npx skills add ... -g -y` con éxito, el helper `install_skill` ejecuta:

```bash
mkdir -p "$HOME/.config/opencode/skills"
ln -sf "$HOME/.claude/skills/<name>" "$HOME/.config/opencode/skills/<name>"
```

**Por qué symlink y no copia**: cuando `skills.sh` actualice una skill, Claude Code y OpenCode verán la misma versión sin resyncs. Las skills pueden incluir `references/` con varios archivos — copiar implicaría mantener un árbol en paralelo.

**Alternativas consideradas**:

- **Copia recursiva con `cp -R`**: rechazado; duplica datos y requiere detección de cambios.
- **Escribir un shim en OpenCode que lea `~/.claude/skills/`**: rechazado; OpenCode no expone ese hook y pondría acoplamiento frágil.
- **Mover a una ubicación neutra (`~/.local/share/ai-skills/`) y symlinkar ambos**: más "limpio" pero rompe la convención de `skills.sh` CLI, que siempre escribe en `~/.claude/skills/`.

### Decisión 2: El puente se aplica a TODAS las skills globales, no solo a Slidev

`install_skill` es quien crea el symlink, así que la regla aplica uniforme para las 11+ skills. Slidev es el trigger, pero el comportamiento es genérico.

**Por qué genérico**: el coste marginal es cero (un `ln -sfn`/`-shf` por skill) y cualquier usuario del dotfiles se beneficia de tener `find-skills`, `frontend-design`, etc. en OpenCode sin trabajo extra.

**Alternativa considerada**: symlinkar solo `slidev` por una whitelist. Rechazada — añade complejidad y deja las otras skills huérfanas en OpenCode.

### Decisión 3: Manejo de colisiones — `ln -sfn`/`-shf` con detección de plataforma

`ln -sf` **por sí solo no reemplaza un symlink a directorio**: en GNU y en BSD/macOS, si `$dst` apunta a un directorio existente, `ln -sf` deref'a el symlink y crea el nuevo enlace _dentro_ del directorio objetivo. Para reemplazar el symlink como un fichero hace falta la flag de no-dereference:

- **Linux (GNU coreutils)**: `ln -sfn "$src" "$dst"` (`-n` = no dereference)
- **macOS/BSD**: `ln -shf "$src" "$dst"` (`-h` = no dereference)

El install script detecta la plataforma con `uname -s` (precedente ya en el template de chezmoi) y elige la flag correcta. Broken symlinks y ausencia previa del destino funcionan igual en ambos casos.

**Directorios reales no se sobrescriben**: si `$dst` existe como directorio real (no symlink), `ln -sfn`/`-shf` falla con "cannot overwrite directory". Aceptamos este fail-safe: el script reporta el error vía `run_claude_step`, incrementa el contador, y continúa sin tocar el directorio. El usuario debe eliminarlo manualmente si quiere que el symlink lo reemplace.

**Alternativa considerada**: detectar colisión con `[ -L "$dst" ] || [ ! -e "$dst" ]` antes de llamar a `ln`. Rechazada — el fallo de `ln` ya transmite la misma información y no merece la complejidad extra.

### Decisión 4: Sin entrada en la spec para el `superpowers` symlink existente

El symlink de `superpowers` (grupo 8) se queda como está — apunta a un clone propio (`$SUPERPOWERS_DIR/skills`), no a `~/.claude/skills/`. Es un mecanismo distinto (una carpeta completa como skill) fuera del alcance de `skills-global-install`.

## Risks / Trade-offs

- **[Riesgo] El usuario tiene una skill real en `~/.config/opencode/skills/<name>/`** → `ln -sfn`/`-shf` falla con "cannot overwrite directory" y no la sobrescribe. **Mitigación**: esto es el comportamiento deseado (fail-safe). Se reporta el error y se continúa; el usuario decide si eliminar el directorio.
- **[Riesgo] Si `~/.claude/skills/<name>/` no existe (p. ej. fallo del `skills add`)** → el symlink apuntaría a un path inexistente. **Mitigación**: el symlink se crea solo dentro del bloque de éxito de `install_skill`, nunca si `skills add` falla. Además, sigue siendo idempotente en la próxima ejecución.
- **[Riesgo] Plataforma no-macOS** → el script imprime instrucciones manuales. **Mitigación**: esa sección debe incluir tanto el comando de install como el comando de symlink correcto para Linux (`ln -sfn`).
- **[Trade-off] La spec seguirá listando N+1 skills mientras el script instala N+3** (por la drift preexistente con `code-review`/`autofix`). Aceptado como deuda fuera de alcance.
