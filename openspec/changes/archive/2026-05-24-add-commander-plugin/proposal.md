## Why

El usuario acaba de instalar el plugin `commander` desde el marketplace `monolab` (`pabloimrik17/monolab`) y quiere que quede declarado en los dotfiles para reaparecer en cada máquina tras `chezmoi apply`, igual que `expo-developer@monolab` y `experiments@monolab`. El marketplace `monolab` ya está registrado en `extraKnownMarketplaces` con `autoUpdate: true`, así que el plugin hereda auto-update sin tocar nada más.

## What Changes

- Añadir `"commander@monolab": true` a `enabledPlugins` en `dot_claude/settings.json.tmpl`.
- No se toca `extraKnownMarketplaces.monolab` (ya existe con `autoUpdate: true` y la `repo` correcta).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `claude-code-plugins`: añadir un requisito para que `commander@monolab` esté habilitado por defecto en `enabledPlugins`, paralelo a los requisitos ya existentes de Plannotator y Expo.

## Impact

- Archivo: `dot_claude/settings.json.tmpl` (una sola línea añadida dentro de `enabledPlugins`).
- Efecto en máquinas nuevas: tras `chezmoi apply`, el plugin queda habilitado y se auto-actualiza vía la entrada `monolab` existente.
- Sin cambios en scripts de instalación, MCP, hooks ni permisos.
