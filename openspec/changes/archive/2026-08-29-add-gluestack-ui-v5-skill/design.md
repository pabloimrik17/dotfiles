## Context

Este repo de dotfiles provisiona skills externas de agente vía `skills.sh` durante el setup de la máquina. Antes de este cambio, el script contenía un único grupo en `run_onchange_install-packages.sh.tmpl` (Group 9, ~líneas 1170–1220) que instalaba trece skills de `vercel-labs`, `anthropics`, `coderabbitai` y `slidevjs`, cada una mediante el helper `install_skill <repo> <name>` que expande a `npx -y skills add <repo> --skill <name> -g -y`. El helper es idempotente (consulta la caché de `npx -y skills list -g --json` al inicio del grupo), está protegido por una confirmación del usuario y tolera fallos individuales vía un contador de errores. El bloque non-macOS (~líneas 1289–1300) lista cada comando verbatim.

Verificación empírica durante la exploración de este cambio (ago 2026):

- El CLI actual de `skills.sh` soporta `-a, --agent <agents>` (variádico, p. ej. `--agent claude-code opencode junie codex`) y `--all`.
- `skills list -g --json` muestra las skills existentes vinculadas a seis agentes: Claude Code, Codex, Cursor, Gemini CLI, Junie y OpenCode.
- El layout es uniforme: payload staged en `~/.agents/skills/<name>/` y symlinks por agente — `~/.claude/skills/<name>` y `~/.junie/skills/<name>` apuntan a `../../.agents/skills/<name>`. Junie está en uso activo en esta máquina (42 symlinks en `~/.junie/skills/`). OpenCode y Codex descubren las skills de usuario desde `~/.agents/skills/`; `~/.codex/skills/` no necesita contener un symlink para que `skills list -g --agent codex --json` reporte la skill.
- La skill `gluestack-ui-v5` existe en `gluestack/agent-skills` (bajo `.agents/skills/`, junto a `gluestack-ui-v4`) y no estaba instalada en esta máquina antes de la verificación.
- Tras la instalación real, el CLI creó los symlinks pedidos para Claude Code y Junie y mantuvo el payload en el store global que OpenCode y Codex consumen. `skills list -g --json` también puede mostrarlo como visible para otros agentes universales (Cursor, Gemini CLI y GitHub Copilot): `--agent` controla los targets explícitos del comando y sus links, no hace exclusivo un payload del store compartido. El requisito es cobertura explícita de Claude Code, OpenCode, Junie y Codex, no exclusividad frente a otros consumidores universales.

Nota histórica: el diseño de slidev (abr 2026) observó que los installs con `--agent` bypasseaban el store compartido y escribían directo en `~/.claude/skills/`, y por eso revirtió el flag. La evidencia actual (slidev staged en `~/.agents/skills/slidev`, symlinks de Junie al store compartido) indica que el CLI actual enlaza todos los agentes desde el store compartido de forma uniforme. Aun así, el layout exacto se verifica empíricamente durante la implementación.

Requisito del usuario (DOT-37 + instrucciones explícitas): la skill debe cubrir **Claude Code, OpenCode, Junie y Codex**. El ticket hermano DOT-3 (OpenCode para skills anteriores) y monolab#259 (override de gluestack en npm-update) son contexto, no scope.

## Goals / Non-Goals

**Goals:**

- Hacer la skill `gluestack-ui-v5` disponible globalmente para Claude Code, OpenCode, Junie y Codex en cada `chezmoi apply` fresco.
- Cobertura determinista de los cuatro agentes, independiente de la resolución por defecto del CLI.
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

### Decision 2: Flag `--agent claude-code opencode junie codex` explícito en el comando de instalación

El usuario pidió declarar exactamente estos cuatro agentes. La resolución por defecto del CLI depende de los agentes detectados en la máquina, así que una lista explícita hace determinista qué targets solicita el comando. El payload global puede seguir siendo visible para otros agentes universales mediante el store compartido; esa visibilidad no sustituye la selección explícita requerida.

**Alternativas consideradas:**

- Resolución por defecto (sin `--agent`) — rechazada: el comando no declararía de forma determinista los cuatro targets requeridos.
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

### Decision 7: `skill_installed` reconcilia cobertura de agentes, no solo presencia por nombre

Fix de CodeRabbit posterior a la redacción inicial de este documento (review en #181). `skill_installed <name> <agents>` salta la instalación solo si `name` aparece en la caché de `skills list -g --json` Y todos los `agents` pedidos ya están en el `agents` de esa entrada. Antes matcheaba solo por nombre: una skill presente pero sin un agente target quedaba saltada para siempre y la cobertura `--agent` pedida nunca se reconciliaba en reruns.

`skill_agent_display` mapea slugs de CLI a nombres de display, porque `skills list --json` reporta agentes por display name mientras `--agent` toma slugs: `claude-code`→`Claude Code`, `opencode`→`OpenCode`, `junie`→`Junie`, `codex`→`Codex` (además de `cursor`, `gemini-cli`, `github-copilot`).

Sin `jq` en PATH el check degrada a un match por nombre (`grep`), igual que la convención ya existente en el script (guard `command -v jq` ~línea 1191): `jq` se usa cuando está disponible pero nunca se asume, no es una dependencia gestionada por este repo.

**Reconciliación con el Non-Goal "no modificar las trece skills existentes":** las trece llamadas no cambian y su comportamiento es idéntico — no pasan `agents`, así que el loop de cobertura no se ejecuta. Lo que cambió es el helper compartido `install_skill`/`skill_installed`, no las llamadas. El Non-Goal sigue cumplido.

**Alternativas consideradas:**

- Mantener el skip name-only — rechazada: deja el drift de cobertura sin reconciliar entre reruns.
- Exigir `jq` como dependencia dura — rechazada: `jq` no es un paquete gestionado en este repo.

## Risks / Trade-offs

- **[Risk] El repo `gluestack/agent-skills` cambia de layout y rompe la resolución de `--skill gluestack-ui-v5`** → _Mitigación:_ `skills.sh add` falla ruidosamente; el contador de errores deja continuar al resto del grupo. El usuario re-ejecuta tras el fix upstream.
- **[Risk] El comportamiento exacto de `--agent` multi-agente difiere de lo observado en la exploración** → _Mitigación:_ la implementación verifica empíricamente el layout resultante (staging + symlinks por agente) antes de dar por hecho el contrato; si el CLI cambió, se ajusta la invocación.
- **[Trade-off] Asimetría con las skills existentes** → gluestack-ui-v5 declara cuatro targets explícitos mientras las trece llamadas anteriores usan la resolución por defecto del CLI. _Aceptado:_ es lo pedido; retrofitar el resto es non-goal explícito.

## Migration Plan

No hay migración — es aditivo. Rollback: revertir el cambio; `npx -y skills remove gluestack-ui-v5 -g -y` limpia la instalación existente.

## Open Questions

Ninguna bloqueante. Si en el futuro se quiere alinear el resto de skills a una lista de agentes explícita (o al contrario, mover gluestack a resolución por defecto), se decide en un cambio separado.
