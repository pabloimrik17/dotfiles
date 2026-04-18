## Why

OpenCode no ve ninguna de las skills globales que ya se instalan para Claude Code vía `skills.sh`, así que trabajar con Slidev (u otras skills existentes) desde OpenCode supone no tener guía contextual. La tarea DOT-3 pide añadir las skills oficiales de Slidev a OpenCode, pero el problema real es estructural: falta un puente entre `~/.claude/skills/` y `~/.config/opencode/skills/`.

## What Changes

- Añadir `slidevjs/slidev --skill slidev` a la lista de skills globales instaladas por el grupo 9 del `run_onchange_install-packages.sh.tmpl`.
- Tras cada `skills add` exitoso, crear un symlink `~/.config/opencode/skills/<name>/` → `~/.claude/skills/<name>/` para que OpenCode cargue la misma skill.
- Retrofitear las skills ya instaladas: el script debe ser idempotente y crear los symlinks también para las skills que ya existan en `~/.claude/skills/` desde ejecuciones previas.
- Actualizar las instrucciones manuales (no-macOS) del mismo script para reflejar el nuevo paso de symlink.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `skills-global-install`: se añade `slidev` a la lista instalada, y se añade un nuevo requisito que obliga a symlinkar cada skill global también bajo `~/.config/opencode/skills/`.

## Impact

- **Código afectado**: `run_onchange_install-packages.sh.tmpl` (grupo 9 "Agent skills" + sección de instrucciones manuales al final).
- **Sistemas**: `~/.config/opencode/skills/` pasa a contener symlinks gestionados por el script de install; OpenCode las descubre como skills locales del usuario.
- **Dependencias**: ninguna nueva — solo `ln -sf` (coreutils) y `npx` ya requeridos.
- **Docs**: README.md y `docs/manual.html` pueden necesitar una mención breve del nuevo comportamiento (evaluado en tasks).
- **Riesgos**: si un usuario tiene un directorio real `~/.config/opencode/skills/<name>/` con el mismo nombre, `ln -sf` lo reemplazaría. Mitigación: detectar el caso y avisar en vez de sobrescribir.
