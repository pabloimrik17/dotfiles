## Why

gluestack publica una skill oficial de agente (`gluestack/agent-skills` → `gluestack-ui-v5` vía skills.sh) que enseña a los agentes de código el setup de gluestack-ui v5 y el flujo del CLI oficial (`npx gluestack-ui add` para regenerar componentes vendored). Los proyectos React Native del usuario están adoptando ese CLI en lugar de mantener los componentes a mano, y sin la skill el agente no tiene ese conocimiento. Este repo ya provisiona skills globales de agente mediante `skills.sh`, así que el coste incremental es mínimo y sigue el patrón existente.

Linear: [DOT-37](https://linear.app/monolab/issue/DOT-37/anadir-skill-gluestack-ui-v5-a-dotfiles-nivel-usuario). Relacionado: [monolab#259](https://github.com/pabloimrik17/monolab/issues/259) (override de gluestack en la skill npm-update).

## What Changes

- Instalar la skill `gluestack-ui-v5` de `gluestack/agent-skills` globalmente vía `skills.sh` durante el setup de la máquina, usando el helper `install_skill` existente en el grupo de agent-skills (Group 9) de `run_onchange_install-packages.sh.tmpl`.
- A diferencia del precedente slidev (solo Claude Code), esta instalación cubre explícitamente los cuatro agentes en uso: **Claude Code, OpenCode, Junie y Codex** (`--agent claude-code opencode junie codex`). El `skills.sh` actual soporta instalación multi-agente manteniendo el layout uniforme (staging en `~/.agents/skills/` + resolución o symlinks por agente).
- Skip idempotente cuando la skill ya está presente en la caché de `skills list -g --json` del grupo.
- Extender el bloque de instrucciones manuales non-macOS con el mismo comando.
- No modificar ningún archivo gestionado por chezmoi (los symlinks de la skill viven fuera del alcance de chezmoi).

## Capabilities

### New Capabilities

- `gluestack-ui-v5-skill-install`: Provisión de la skill de agente gluestack-ui v5 vía `skills.sh` durante el setup de chezmoi, con cobertura multi-agente (Claude Code, OpenCode, Junie, Codex), idempotencia, manejo de fallos y paridad manual non-macOS.

### Modified Capabilities

Ninguna. La capability `skills-global-install` existente no se toca intencionadamente — gluestack-ui-v5 vive en su propia capability para que sus requisitos (p. ej., la cobertura multi-agente explícita) no contaminen la lista genérica de skills.

## Impact

- **Code**: `run_onchange_install-packages.sh.tmpl` — nueva invocación de instalación dentro del grupo agent-skills existente, más una línea en el bloque de instrucciones non-macOS.
- **Docs**: `README.md` (evaluado por la skill `update-readme` — adición de herramienta al setup) y `docs/manual.html` (evaluado por la skill `update-manual` — cambio de configuración CLI). Ambas son propuestas al usuario, no ediciones forzadas.
- **Dependencies**: Sin nuevos paquetes brew/bun; depende del runner `npx` ya requerido por `skills.sh`.
- **Machine state**: Un nuevo directorio staged en `~/.agents/skills/gluestack-ui-v5/` con symlinks en `~/.claude/skills/`, `~/.junie/skills/` y visibilidad desde el store global en OpenCode y Codex tras el primer apply.
