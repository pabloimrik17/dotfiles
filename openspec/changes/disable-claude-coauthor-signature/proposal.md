## Why

Claude Code, por defecto, añade atribución propia a cada commit (trailer `Co-Authored-By: Claude …` + línea `🤖 Generated with Claude Code`) y al cuerpo de las PR. Queremos commits y PR limpios, sin esa firma, en todas las máquinas gestionadas por estos dotfiles.

## What Changes

- Añadir la clave de nivel superior `attribution` a `dot_claude/settings.json.tmpl` con `commit` y `pr` en cadena vacía, lo que suprime la atribución de Claude tanto en commits como en PR.
- No usar la opción legacy `includeCoAuthoredBy` (booleana): está **deprecada** en favor de `attribution`.
- Mantener el resto de la plantilla intacto; el bloque `attribution` es JSON estático (sin lógica de template).

No hay breaking changes: el cambio solo retira texto auto-generado por Claude Code; no altera el contenido escrito por el usuario.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `claude-user-preferences`: nuevo requisito — la plantilla SHALL incluir un objeto `attribution` con `commit` y `pr` vacíos para desactivar la firma de Claude en commits y PR.

## Impact

- **Archivo**: `dot_claude/settings.json.tmpl` (renderiza a `~/.claude/settings.json`).
- **Efecto**: tras `chezmoi apply`, las futuras sesiones de Claude Code dejan de añadir el trailer `Co-Authored-By` y la línea `🤖 Generated with Claude Code` en commits y PR.
- **Alcance**: solo settings de usuario; no afecta a permisos, hooks, plugins ni a settings de proyecto/local.
- **Dependencias**: requiere Claude Code con soporte de `attribution` (sustituye al deprecado `includeCoAuthoredBy`).
