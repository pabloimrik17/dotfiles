## Context

`dot_claude/settings.json.tmpl` (gestionado por chezmoi, renderiza a `~/.claude/settings.json`) define los flags de usuario de Claude Code bajo la capacidad `claude-user-preferences`. Hoy no fija ninguna opción de atribución, así que Claude Code aplica su default: añade el trailer `Co-Authored-By: Claude …` y la línea `🤖 Generated with [Claude Code]…` a los commits, y la misma línea al cuerpo de las PR.

Restricción: la opción debe vivir en el scope de usuario (esta plantilla), para que aplique a todas las sesiones y repos de la máquina, no por proyecto.

## Goals / Non-Goals

**Goals:**

- Suprimir la firma de Claude en commits y PR de forma global y versionada.
- Usar el mecanismo soportado actual, no el legacy deprecado.
- Cambio mínimo y aislado en la plantilla, sin tocar otros bloques.

**Non-Goals:**

- Reordenar las claves existentes o "arreglar" la divergencia entre el spec de orden canónico y el orden alfabético real del fichero (fuera de alcance).
- Configurar atribución por proyecto (`.claude/settings.json`) o local (`.claude/settings.local.json`).
- Cambiar la firma a un texto personalizado: el objetivo es eliminarla, no reemplazarla.

## Decisions

**Decisión 1 — Usar `attribution: {commit:"", pr:""}` en lugar de `includeCoAuthoredBy: false`.**
`includeCoAuthoredBy` está deprecado en la doc oficial en favor del objeto `attribution`. `attribution` da control independiente de commit y PR; con ambos en cadena vacía se elimina toda la atribución (incluido el trailer `Co-Authored-By`). Elegimos la opción soportada y futura.
*Alternativa descartada:* `includeCoAuthoredBy: false` — funciona hoy pero puede dejar de hacerlo y la doc desaconseja su uso.

**Decisión 2 — Bloque JSON estático, sin lógica de template.**
El valor no depende de OS/arch/datos de chezmoi, así que se añade como JSON literal dentro del `.tmpl` (sin directivas `{{ }}`).

**Decisión 3 — Colocación de la clave siguiendo el orden alfabético de nivel superior existente.**
El fichero actual ordena las claves de nivel superior alfabéticamente. `attribution` se inserta entre `alwaysThinkingEnabled` y `effortLevel` para respetar ese orden de facto. La clave queda fuera del "bloque de preferencias escalares" que regula el requisito de orden canónico, por lo que no entra en conflicto con él.

**Decisión 4 — Verificación por render, no por inspección de un commit real.**
La comprobación normativa principal es: `chezmoi execute-template` / `chezmoi cat` produce un JSON válido que contiene `"attribution": {"commit":"","pr":""}` y no contiene `includeCoAuthoredBy`. El comportamiento end-to-end (commit/PR sin firma) depende del runtime de Claude Code tras `chezmoi apply` y se valida manualmente en una sesión posterior.

## Risks / Trade-offs

- **El esquema de `attribution` cambia en una versión futura de Claude Code** → Mitigación: el delta spec ancla el contrato; un cambio en el runtime se detecta como divergencia y se trata en un nuevo change.
- **JSON mal formado tras editar la plantilla rompe todo el settings de usuario** → Mitigación: validar el render con `chezmoi execute-template`/`chezmoi cat` (o `jq`) antes de aplicar.
- **oxfmt/lint-staged corrompe o reordena el `.tmpl`** (la memoria del proyecto avisa de que oxfmt mancha scripts de chezmoi) → Mitigación: confirmar que `.tmpl` está cubierto por `.oxfmtignore` o que el formateo no altera la directiva; revisar el diff antes de commitear.
