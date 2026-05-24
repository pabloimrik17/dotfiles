## Context

`dot_claude/settings.json.tmpl` ya gestiona los plugins de Claude Code vía dos bloques:

- `enabledPlugins`: mapa `"<plugin>@<marketplace>": true` para activarlos.
- `extraKnownMarketplaces`: cada marketplace con su `source` y `autoUpdate: true`.

El marketplace `monolab` (`pabloimrik17/monolab`) ya está registrado con `autoUpdate: true` y aloja `expo-developer@monolab` y `experiments@monolab`. El usuario instaló `commander@monolab` con `/plugin` y ahora hay que persistirlo en los dotfiles.

## Goals / Non-Goals

**Goals:**

- `commander@monolab` queda habilitado por defecto en cada máquina tras `chezmoi apply`.
- Auto-update sigue el mismo mecanismo que el resto de plugins de `monolab` (sin entrada por plugin).

**Non-Goals:**

- Tocar `extraKnownMarketplaces` (ya tiene `autoUpdate: true`).
- Añadir instalación de binarios, hooks, MCPs o permisos.
- Documentar el plugin en README/manual (no es un tool de shell, son cambios alias-level dentro de Claude).

## Decisions

**Posición en `enabledPlugins`:** insertar `"commander@monolab": true` junto a las otras entradas `@monolab` (línea 14 `expo-developer@monolab` y línea 22 `experiments@monolab`) en orden agrupado por marketplace, no alfabético — coherente con el patrón actual del archivo.

**Sin entrada por plugin para auto-update:** el flag `autoUpdate` vive en el marketplace, no en el plugin. Heredarlo del marketplace `monolab` ya existente es el patrón usado por los otros tres plugins de `monolab` y los seis de `superpowers-marketplace`. Alternativa descartada: duplicar la entrada del marketplace — no aporta nada y rompe el patrón.

**Sin cambios en el script de instalación:** los plugins viven en `~/.claude/plugins/` y Claude Code los resuelve solo desde `enabledPlugins`. No hay binario que instalar via brew/curl. Alternativa descartada: añadir grupo en `run_onchange_install-packages.sh.tmpl` — no aplica, no hay paquete que instalar.

## Risks / Trade-offs

- [Plugin no se publica en el repo `pabloimrik17/monolab`] → la entrada queda inerte; Claude Code arranca sin error (mismo comportamiento que documenta el spec actual para Plannotator: "Plugin not installed → entrada inerte").
- [Conflicto con el comando `/commander` del propio shell, si existe] → no aplica: el plugin se expone como slash command de Claude (`/commander:list`, `/commander:add`, …), no toca el PATH.
