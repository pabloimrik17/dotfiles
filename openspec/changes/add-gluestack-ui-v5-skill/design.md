## Context

Este repo de dotfiles provisiona skills externas de agente vía `skills.sh` durante el setup de la máquina. El script actual contiene un único grupo en `run_onchange_install-packages.sh.tmpl` (Group 9, ~líneas 1170–1220) que instala trece skills de `vercel-labs`, `anthropics`, `coderabbitai` y `slidevjs`, cada una mediante el helper `install_skill <repo> <name>` que expande a `npx -y skills add <repo> --skill <name> -g -y`. El helper es idempotente (consulta la caché de `npx -y skills list -g --json` al inicio del grupo), está protegido por una confirmación del usuario y tolera fallos individuales vía un contador de errores. El bloque non-macOS (~líneas 1289–1300) lista cada comando verbatim.

Verificación empírica durante la exploración de este cambio (ago 2026):

- El CLI actual de `skills.sh` soporta `-a, --agent <agents>` (variádico, p. ej. `--agent claude-code opencode junie`) y `--all`.
- `skills list -g --json` muestra las skills existentes vinculadas a seis agentes: Claude Code, Codex, Cursor, Gemini CLI, Junie y OpenCode.
- El layout es uniforme: payload staged en `~/.agents/skills/<name>/` y symlinks por agente — `~/.claude/skills/<name>` y `~/.junie/skills/<name>` apuntan a `../../.agents/skills/<name>`. Junie está en uso activo en esta máquina (42 symlinks en `~/.junie/skills/`). OpenCode descubre las skills de usuario desde `~/.agents/skills/`.
- La skill `gluestack-ui-v5` existe en `gluestack/agent-skills` (bajo `.agents/skills/`, junto a `gluestack-ui-v4`) y no está instalada en esta máquina.
- Tras la instalación real, el CLI creó los symlinks pedidos para Claude Code y Junie y mantuvo el payload en el store global que OpenCode consume. `skills list -g --json` también lo muestra como visible para otros agentes universales (Codex, Cursor, Gemini CLI y GitHub Copilot): `--agent` controla los targets explícitos del comando y sus links, no hace exclusivo un payload del store compartido. El requisito es cobertura explícita de Claude Code, OpenCode y Junie, no exclusividad frente a otros consumidores universales.

Nota histórica: el diseño de slidev (abr 2026) observó que los installs con `--agent` bypasseaban el store compartido y escribían directo en `~/.claude/skills/`, y por eso revirtió el flag. La evidencia actual (slidev staged en `~/.agents/skills/slidev`, symlinks de Junie al store compartido) indica que el CLI actual enlaza todos los agentes desde el store compartido de forma uniforme. Aun así, el layout exacto se verifica empíricamente durante la implementación.

Requisito del usuario (DOT-37 + instrucción explícita): la skill debe cubrir **Claude Code, OpenCode y Junie**. El ticket hermano DOT-3 (OpenCode para skills anteriores) y monolab#259 (override de gluestack en npm-update) son contexto, no scope.

## Goals / Non-Goals

**Goals:**

- Hacer la skill `gluestack-ui-v5` disponible globalmente para Claude Code, OpenCode y Junie en cada `chezmoi apply` fresco.
- Cobertura determinista de los tres agentes, independiente de la resolución por defecto del CLI.
- Mantener la instalación idempotente, tolerante a fallos y no destructiva con archivos gestionados por chezmoi, a la par con el patrón existente.
- Preservar la paridad non-macOS (el bloque de instrucciones manuales incluye el comando).

**Non-Goals:**

- Modificar las trece skills existentes ni retrofitar `--agent` explícito en ellas.
- Instalar nada en proyectos concretos (el CLI `gluestack-ui` y los componentes vendored viven en los repos React Native, no aquí).
- El override de gluestack en la skill npm-update — eso es monolab#259.
- Auto-actualización de la skill (`skills.sh update` es un workflow manual separado).
- Gestionar con chezmoi los archivos de la skill (viven en directorios de `skills.sh`, fuera del scope de chezmoi).

## Decisions

### Decision 1: Capability nueva `gluestack-ui-v5-skill-install`, no un delta sobre `skills-global-install`

Mismo patrón que slidev: una capability dedicada permite que los requisitos específicos de esta skill (cobertura multi-agente explícita) vivan en su propio bloque sin tocar la lista genérica. `skills-global-install` queda intacta.

**Alternativa considerada:** Delta sobre `skills-global-install` (cambio de una línea en la lista). Rechazada para mantener la separación que ya marcó el precedente slidev.

### Decision 2: Flag `--agent claude-code opencode junie` explícito en el comando de instalación

El usuario pidió declarar exactamente estos tres agentes. La resolución por defecto del CLI depende de los agentes detectados en la máquina, así que una lista explícita hace determinista qué targets solicita el comando. El payload global puede seguir siendo visible para otros agentes universales mediante el store compartido; esa visibilidad no sustituye la selección explícita requerida.

**Alternativas consideradas:**

- Resolución por defecto (sin `--agent`) — rechazada: el comando no declararía de forma determinista los tres targets requeridos.
- `--all` — rechazada: más amplio de lo pedido.

**Nota:** esto revierte la conclusión del diseño slidev contra flags `--agent`, pero la premisa cambió: el CLI actual mantiene el layout uniforme (store compartido + symlinks) también para installs con agentes explícitos, y aquí la cobertura multi-agente es un requisito, no una preferencia estética.

### Decision 3: Extender el helper `install_skill` con un tercer argumento opcional de agentes

`install_skill <repo> <name> [agents]` donde `agents` es una lista separada por espacios pasada a `--agent` cuando no está vacía. Las trece llamadas existentes no cambian. Detalle de implementación: el word-splitting del argumento es intencional (lista de agentes para el flag variádico).

**Alternativa considerada:** invocación directa de `run_claude_step` con el comando completo, sin tocar el helper. Rechazada — duplica la lógica de skip idempotente (`skill_installed`) fuera del helper.

### Decision 4: Dentro del Group 9 existente

La instalación reutiliza la confirmación, la caché de `skills list -g --json` y el contador de errores del grupo. Un grupo aparte añadiría un segundo prompt para una sola skill.

### Decision 5: El bloque non-macOS lleva el comando literal (con su selección de agentes)

Paridad copy-paste: la línea manual incluye el mismo `-g` y la misma lista `--agent` que el path de macOS.

### Decision 6: Documentación propuesta, no forzada

La spec no exige cambios en README ni manual. Las tareas instruyen ejecutar las skills `update-readme` y `update-manual` tras la implementación, que evalúan si procede actualización y lo proponen al usuario.

## Risks / Trade-offs

- **[Risk] El repo `gluestack/agent-skills` cambia de layout y rompe la resolución de `--skill gluestack-ui-v5`** → _Mitigación:_ `skills.sh add` falla ruidosamente; el contador de errores deja continuar al resto del grupo. El usuario re-ejecuta tras el fix upstream.
- **[Risk] El comportamiento exacto de `--agent` multi-agente difiere de lo observado en la exploración** → _Mitigación:_ la implementación verifica empíricamente el layout resultante (staging + symlinks por agente) antes de dar por hecho el contrato; si el CLI cambió, se ajusta la invocación.
- **[Trade-off] Asimetría con las skills existentes** → gluestack-ui-v5 queda enlazada a tres agentes mientras las demás están enlazadas a seis. _Aceptado:_ es lo pedido; retrofitar el resto es non-goal explícito.

## Migration Plan

No hay migración — es aditivo. Rollback: revertir el cambio; `npx -y skills remove gluestack-ui-v5 -g -y` limpia la instalación existente.

## Open Questions

Ninguna bloqueante. Si en el futuro se quiere alinear el resto de skills a una lista de agentes explícita (o al contrario, mover gluestack a resolución por defecto), se decide en un cambio separado.
