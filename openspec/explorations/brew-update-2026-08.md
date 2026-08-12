# Exploración: Claude Code workflows + brew upgrade (agosto 2026)

**Auditoría COMPLETA** (5-ago-2026). **No es una proposal** — es el material verificado
que la alimentará.

> **Artefactos autoritativos:**
> - [`brew-update-2026-08-dossier.md`](./brew-update-2026-08-dossier.md) — auditoría
>   principal (47/47 agentes, 0 errores; 69 hallazgos → 10 sobrevivieron doble lente).
> - [`brew-update-2026-08-gaps.md`](./brew-update-2026-08-gaps.md) — cierre de huecos
>   1-6. **Léelo después del dossier: lo corrige en 7 puntos.**
> - [`brew-update-2026-08-claims.md`](./brew-update-2026-08-claims.md) — hueco 7,
>   apretado de claims flojos (11 adjudicados: 5 corregidos, 5 verificados, 1 dropped).
>
> **Los 7 huecos declarados están cerrados.**
>
> Este fichero es el resumen narrativo y conserva las correcciones a errores propios.

**Confirmación cruzada del fix de `settings.json`:** el addendum llega al mismo
diagnóstico por otra vía (corrección #5). aoe **mergea** correctamente, pero
`dot_claude/settings.json.tmpl` es una plantilla de fichero completo, así que
`chezmoi apply` machaca el merge de aoe en cada pasada — *ping-pong, no convergencia*.
Es el mismo problema que el baile de posiciones y la misma solución: script `modify_`.

## Procedencia

| Fuente | Qué produjo |
| --- | --- |
| Inline (WebFetch + lectura de repo) | parte 1, zoxide, worktrunk, uv |
| Workflow `wf_42aa2fe5-781` | los 12 restantes + barrido de libs + crítico |
| Workflow `wf_38ae068c-70a` | nada — 17/17 agentes muertos por cuota |

### Errores propios que la auditoría corrigió

1. **`git.pagers` para lazygit era una recomendación activamente dañina** — 0.64.0 lo
   renombra a `git.diffRenderers` y escribir la clave vieja dispara
   `migratePagersToDiffRenderers`, que reescribe el fichero gestionado. Corregido abajo.
2. **gh: dije "tres GHSAs" y eran cuatro**, y subí las severidades por encima de las
   que asignó GitHub (media/baja, no alto/medio). Corregido abajo.
3. **lazygit: "0.63.0 no trae deprecaciones de config" era falso** — sí hay una, sólo
   que inerte *por ausencia* de sección `keybinding:`, no por diseño.

## Rangos de versiones — re-verificados el 5-ago-2026

El snapshot original era del 2-ago. Al re-comprobar, **5 de 28 targets se movieron**:

| Paquete | Instalado | Target 2-ago | Target 5-ago | |
| --- | --- | --- | --- | --- |
| aoe | 1.12.0 | 1.13.2 | **1.14.0** | +1 minor |
| chezmoi | 2.70.5 | 2.71.1 | **2.72.0** | +1 minor |
| lazygit | 0.62.2 | 0.63.1 | **0.64.0** | +1 minor |
| atuin | 18.16.1 | 18.18.1 | **18.19.0** | +1 minor |
| mole | 1.44.1 | 1.49.1 | **1.49.2** | +1 patch |

(La columna *Instalado* no cambia — es la baseline real en esta máquina.)

Los otros 23 (incluidos los 13 transitivos) no se movieron. **Los hallazgos ya
verificados siguen vigentes**: zoxide 0.10.0, worktrunk 0.71.0, uv 0.12.1, fzf 0.74.2 y
ripgrep 15.2.0 tienen hoy el mismo target que cuando se auditaron.

Consecuencia: el hallazgo parcial de lazygit ("0.63.0 no trae deprecaciones de config")
**ya no cubre el target real** — 0.64.0 es un minor nuevo sin auditar, y un minor nuevo
es exactamente donde aterriza una auto-migración que reescriba `config.yml`. Igual para
aoe: 1.14.0 es minor nuevo, y el precedente de 1.10.1 (que movió la config a ruta XDG y
exigió migrar estado vivo) obliga a mirarlo.

Re-verificar `brew outdated` antes de escribir la proposal si pasan más días.

---

## Parte 1 — settings de Claude Code

### Dónde vive cada clave

`/config` escribió las dos en sitios distintos:

- `enableWorkflows: true` → `~/.claude/settings.json` (gestionado por chezmoi)
- `workflowSizeGuideline: "large"` → `~/.claude.json` (blob de estado, no gestionable)

### Resolución real (verificado en el binario 2.1.220)

```js
sIo = { small:5, medium:15, large:50 }
function Rft(e){ let t = Osn(Ek()?.settings.workflowSizeGuideline) ?? Osn(e); … }
function JNt(){ return Ek()?.settings.workflowSizeGuideline !== undefined }
```

`Ek()` es el objeto de settings mergeado desde disco (lo puebla el loader que emite
`settings_load_completed` con `source_count`). La cadena de `settings.json` se
consulta **primero**; el valor de `~/.claude.json` es solo el fallback.

→ **Las dos claves van a `dot_claude/settings.json.tmpl`.** No hace falta script `modify_`.

**Contrapartida:** `JNt()` alimenta `l = !JNt()`, que decide si la fila de `/config`
es editable. Fijar la clave en `settings.json` deja esa fila en solo-lectura; se
cambiaría editando el dotfile.

### El "baile de posiciones" de `~/.claude/settings.json`

Diagnóstico (5-ago, tras el fast-forward a `288b6db`):

```
valores en conflicto ............ 0     ← todo idéntico por contenido
claves que apply borraría ....... 3     enableWorkflows, theme, skipWorkflowUsageWarning
causa real ...................... ORDEN (top-level y anidado)
```

Comparando ambos con `json.dumps(sort_keys=True)`, plantilla renderizada y fichero vivo
son **el mismo objeto**. Ni un valor diverge. Los 4 keys que aparecían como distintos
(`extraKnownMarketplaces`, `hooks`, `permissions`, `statusLine`) sólo difieren en orden
anidado.

El ciclo: la plantilla está alfabetizada; Claude Code escribe en su propio orden
(`env, attribution, permissions, hooks, …`) y reordena también arrays anidados como
`permissions.allow`. Cada `chezmoi apply` reimpone el alfabético → Claude Code lo
reescribe → baile.

El conjunto de claves no gestionadas **cambia solo** según se usa `/config`: `model`
estaba hace unos días y ya no; han aparecido `theme` y `skipWorkflowUsageWarning`. Una
plantilla estática no puede ganar esa carrera.

**Fix propuesto — convertir `settings.json` en script `modify_`**, el patrón ya probado
en este repo con `modify_private_config.toml` (aoe):

- chezmoi pasa el fichero vivo por stdin; el script superpone sólo las claves
  gestionadas y emite el merge → preserva el orden de Claude Code y sus claves propias.
- Motor `jq` en vez de `uv`/tomlkit: ya es dependencia (hook `sync-claude` de
  worktrunk). `jq` conserva el orden de las claves de entrada y sólo añade las nuevas al
  final.
- Sigue pudiendo ser `.tmpl`, así que `{{ .chezmoi.uid }}`, `{{ .chezmoi.homeDir }}` y
  los condicionales darwin/arm64 se mantienen.
- Encaja con la parte 1: `enableWorkflows` y `workflowSizeGuideline` pasan a MANAGED;
  `theme` y `skipWorkflowUsageWarning` quedan como writeback intacto.

Nota: esto es lo que el dossier quiso decir con *"«mantener `chezmoi diff` en silencio»
no es alcanzable"* con la plantilla estática. Con `modify_` sí lo es.

### Drift a reparar

Diff a nivel de clave entre la plantilla renderizada y el fichero vivo — `chezmoi apply`
hoy borraría silenciosamente:

```
- enableWorkflows: true     ← el toggle recién activado
- model: "opus"             ← drift preexistente, nunca capturado
```

El resto de la plantilla está byte-idéntico.

---

## Parte 2 — hallazgos verificados

### zoxide 0.9.9 → 0.10.0 · workaround obsoleto ⭐

Changelog: *"Zsh: skip doctor diagnostics in non-interactive shells."*
`templates/zsh.txt` en v0.10.0 añade `[[ $- == *i* ]] || return 0` como segunda guarda
de `__zoxide_doctor`.

`dot_zshrc.tmpl:396-405` redefine a mano esa función con una guarda `CLAUDECODE`.
Los shells de snapshot de Claude Code son no-interactivos → la guarda upstream cubre
el caso, y de forma más general.

**Acción:** borrar el bloque de override. Mantener `eval "$(zoxide init zsh --cmd cd)"`.

Breaking no aplicable: `zoxide import` pasa a subcomando en vez de `--from`; el repo no lo usa.

### fzf 0.73.1 → 0.74.2 · pin obligatorio 🔴

**No aterrizar en 0.74.0 ni 0.74.1.** Regresión #4879: el hook `chpwd` se dispara dos
veces en ALT-C, así que **cada salto cuenta doble en la BD de zoxide**. Arreglado en
0.74.2. El objetivo de brew ya es 0.74.2, así que 0.73.1 → 0.74.2 la salta — pero
cualquier pin o revisión intermedia reintroduce el bug.

Cambio de comportamiento (0.74.0, #4816): ALT-C hace `cd` a la ruta lógica en vez de
la física resuelta. `FZF_ALT_C_COMMAND` usa `fd --follow` (`dot_zshrc.tmpl:137`), así
que un directorio simbólico puede aparecer como segunda entrada en zoxide. Sin edición
— el nuevo comportamiento es el correcto y coincide con el builtin `cd`.

**Verificado NO breaking:** los nombres de widget de `fzf --zsh` no cambian entre
0.73.1 y 0.74.2 (`zle -N fzf-file-widget` y sus bindkeys son byte-idénticos). El
wrapper Ctrl+T de television en `dot_zshrc.tmpl:163-170` está a salvo.

Doc-only opcional: 0.74.0 añade `alt-left`/`alt-right` (motion por palabra) como
binding por defecto; alcanzable aquí porque `dot_config/ghostty/config:85` tiene
`macos-option-as-alt = right`.

### gh 2.96.0 → 2.97.0 · parche de seguridad

2.97.0 corrige **cuatro** GHSAs (no tres, como decía la primera versión de esta nota);
2.96.0 (lo instalado) es vulnerable. Severidades **upstream**, no inventadas:

| GHSA | CVE | Severidad |
| --- | --- | --- |
| GHSA-3m3g-3wcr-px46 | CVE-2026-64654 | media |
| GHSA-4fjg-2h4q-fwg3 | CVE-2026-64653 | baja |
| GHSA-cg6r-mpgc-h9mm | CVE-2026-64652 | baja |
| GHSA-mm27-mwq9-fr5g | CVE-2026-64655 | baja |

**GHSA-3m3g-3wcr-px46 (media)** — inyección de secuencias de escape de terminal en
`gh gist view`, `gh api`, `gh pr diff`, `gh release download --output -`,
`gh codespace logs`, `gh skills preview`, `gh agent-task view`/`create`.

Exposición real aquí: `dot_claude/settings.json.tmpl:270` tiene `"Bash(gh pr *)"` en el
allowlist y `:299` fija `"defaultMode": "auto"` → `gh pr diff` corre auto-aprobado para
los agentes, sin prompt. Eso hace la ruta alcanzable sin interacción, pero la severidad
upstream es **media**: no elevar el framing por encima de lo que asignó GitHub.

**GHSA-cg6r-mpgc-h9mm (baja)** — `gh auth status` imprime parte del token para tipos
`github_pat_*` / `ghs_*` / `ghu_*`. El propio comando es la fuga.
→ Operacional: **no ejecutar `gh auth status` antes de actualizar**, ni pegar su salida
en una sesión de agente. Actualizar primero.

**GHSA-4fjg-2h4q-fwg3** — rutas de install/update de extensiones endurecidas con
safeurl. Sin ruptura de API: `gh-dash` y `gh-enhance`
(`run_onchange_install-packages.sh.tmpl:330-346`) siguen igual.

Verificado NO breaking: el registro de agentes de `gh skill` cambió (fuera windsurf,
entran devin/grok), pero `--agent claude-code` no se toca → la stanza idempotente de
`run_onchange_install-packages.sh.tmpl:350` es segura.

Menor: timeout de keyring 3s → 60s, quita un modo de fallo espurio en `chezmoi apply`.

### lazygit 0.62.2 → 0.63.1 · (target real hoy: 0.64.0, sin auditar)

**Corrección:** mi pase parcial dijo *"0.63.0 no trae deprecaciones de config"*. **Es
falso.** 0.63.0 añade una migración nueva en `computeMigratedConfig`:
`keybinding.worktrees.viewWorktreeOptions` → `keybinding.universal.newWorktree`.

No dispara aquí sólo porque `dot_config/lazygit/config.yml` no tiene sección
`keybinding:` (solo `gui:` y `customCommands:`). Safe, pero la premisa era errónea — y
refuerza que 0.64.0 hay que mirarlo.

Confirmado: el guard `output: terminal` **sigue siendo load-bearing** en 0.63.1. La
auto-migración `subprocess`/`stream` sigue activa. No relajarlo.

Adoptables:

- ⚠️ **`git.pagers` sin definir** → lazygit no usa delta, pese a que delta es el pager
  de git en todo lo demás (`dot_gitconfig.tmpl:11,44,47`).
  **CORREGIDO tras auditar 0.64.0: NO escribir `git.pagers`.** 0.64.0 lo renombra a
  `git.diffRenderers`, y escribir la clave vieja es justo lo que matchea
  `migratePagersToDiffRenderers` → lazygit reescribiría el fichero gestionado por
  chezmoi (el mismo peligro que documentan las líneas 40-42 de `config.yml` para
  `subprocess`). Igual con la forma antigua `git.paging`.
  Si se adopta delta, sólo **después** de instalar 0.64.0 y con la forma nueva:
  ```yaml
  git:
    diffRenderers:
      - command: delta --dark --paging=never
  ```
  (`stdinFilter` es el type por defecto; `colorArg: always` también;
  `validateDiffRenderers` da error duro con un `type` desconocido.)
  Nota: `[delta] navigate = true` de `dot_gitconfig.tmpl` es no-op dentro de lazygit.
- `git.autoDetectExternalChanges` (nuevo, **ON por defecto**, poll 2s): cambio de
  comportamiento sin config. Neto positivo aquí, donde varios agentes commitean en
  worktrees hermanos y lazygit mostraba refs obsoletas.
- `gui.sidePanels` y `gui.shrinkSidePanelsToContent` (nuevas claves de layout).
- direnv: lazygit ahora carga `.envrc` al cambiar de repo/worktree, sin config. Ya hay
  direnv (`dot_zshrc.tmpl:370`). El entorno de lazygit puede diferir por worktree.

### worktrunk 0.65.0 → 0.71.0 · riesgo de drift

`[list] json-schema`: introducida en 0.66.0; 0.67.0 hace que `wt config update` la fije
si falta; 0.68.0 la escribe como `= 2`. Ni el source ni `~/.config/worktrunk/config.toml`
la definen (comprobado en disco) → el próximo `wt config update` reescribe un fichero
gestionado por chezmoi.

**Acción:** fijar `json-schema = 2` en `[list]`, preservando la invariante del repo
("`wt config update` no encuentra nada que migrar").

Bugfix relevante (0.69.0): `wt merge` medía el span contra refs locales obsoletas y
*"could sweep in upstream commits, corrupting the default branch"*. El repo usa
`wt merge` vía el alias `mc`.

Candidatos menores sin decidir: `wt remove --reap` (0.67.0), `wt config approvals list`
/ `clear --stale` (0.66.0), flag de rama duplicada en `wt list` (0.70.0, solo schema 2).

### uv 0.11.26 → 0.12.1 · bug latente

Motor del merge de aoe: `uv run --quiet --with tomlkit python "$prog" <"$infile"`
(`dot_config/private_agent-of-empires/modify_private_config.toml:101`).

El breaking #10 de 0.12.0 (*"Discover projects relative to the script passed to `uv run`"*)
**no aplica**: `python` es el comando y `$prog` su argumento, no un script pasado a `uv run`.

Pero el descubrimiento de proyecto sigue siendo relativo al cwd, así que ejecutar
`chezmoi apply` desde dentro de cualquier proyecto Python hace que uv resuelva *ese*
entorno para el merge. 0.12.0 además endurece el manejo de `--project`.

**Acción:** añadir `--no-project` a la invocación (flag confirmado en el uv instalado).

### ripgrep 15.1.0 → 15.2.0 · sin acción

Arregla matching de `.gitignore` en búsquedas multi-raíz (#3320/#3376/#3419): en 15.1.0,
`rg "x" src/ tests/` podía encontrar ficheros ignorados que `rg "x" src/` sí saltaba.
Los alias `rgi`/`rgf`/`rgl` (`dot_zshrc.tmpl:272-274`) son pass-through, así que el
upgrade **es** el arreglo. Sin cambios de semántica en `--files-with-matches` ni `-i`.

`RIPGREP_CONFIG_PATH` evaluado y descartado: exportarlo aplicaría sus flags también al
canal rg-edit de television.

---

## Interacción entre paquetes

fzf y zoxide se tocan a través de `chpwd`, y ambos suben a la vez. La regresión de
ALT-C (fzf) escribe en la BD de zoxide, y el override de `__zoxide_doctor` que vamos a
borrar vive junto al hook. Verificar ALT-C + `cd` juntos tras el upgrade, no por separado.

---

## Recuperación

### Reanudar el workflow

```
Workflow({
  scriptPath: "~/.claude/projects/-Users-etherless-WebstormProjects-dotfiles-worktrees-brew-update/…/workflows/scripts/brew-changelog-audit-remaining-wf_42aa2fe5-781.js",
  resumeFromRunId: "wf_42aa2fe5-781"
})
```

Los agentes completados vuelven de caché sin coste. Cacheados hoy: `fzf`, `ripgrep`.

### Rescatar un run muerto

`python3 ~/.claude/salvage-workflow.py <transcript-dir> [--json]`

Orden de resolución: resultado en `journal.jsonl` → input de `StructuredOutput` (hallazgos
producidos pero no transportados) → último texto real del asistente + material ya
descargado. Los transcripts viven en `~/.claude/projects/…/subagents/workflows/` y
sobreviven a la muerte de la sesión.

Del run muerto `wf_38ae068c-70a` quedan ~152k tokens de changelogs ya descargados
(aoe 113k chars, chezmoi 89k, worktrunk 115k, uv 88k). Los agentes no llegaron a
sintetizar conclusiones, pero el material bruto ahorra re-descargarlo.

### Modo de fallo conocido

Los agentes mueren por límite de gasto *después* de investigar y *antes* de devolver,
así que el workflow retorna `null` con los transcripts llenos. `agents_done: 0` con
`subagent_tokens` alto es la firma. El orquestador reintenta 6 veces por agente antes
de rendirse — de ahí que un run fallido pueda tardar horas.

## Estado de OpenSpec — archivado pendiente, sin colisión

Tras el fast-forward a `288b6db` hay **cinco** changes en `openspec/changes/`. **El
código de los cinco ya está aplicado en los dotfiles** (verificado fichero a fichero);
las casillas sin marcar son bookkeeping de QA, no trabajo pendiente:

| Change | Tareas | Código verificado en el repo |
| --- | --- | --- |
| `update-brew-deps` | 27/27 | mergeado en `fc545c3` |
| `fix-aoe-tmux-mouse` | 9/20 | `[tmux].mouse = "auto"` :58 + `dot_tmux.conf:3` |
| `aoe-trash-retention-10d` | 6/11 | `trash_retention_days = 10` :48 |
| `add-gh-stack` | 14/15 | 12 referencias en el install script |
| `add-fallow` | 14/17 | grupo 6.5 + `fallow@fallow-skills` en settings |

→ **No hay colisión de edición** sobre `modify_private_config.toml`. Se puede tocar.

Lo que sí queda es deuda de archivado, y una consecuencia concreta: el delta sin
archivar de `update-brew-deps`
(`changes/update-brew-deps/specs/agent-manager/spec.md:118`) sigue listando `[cockpit]`
como tabla de writeback. `[cockpit]` se renombró a `[acp]` en aoe **1.11.0**, antes de
la baseline 1.12.0. Al archivar, ese texto se sincroniza al spec principal — que en
`specs/agent-manager/spec.md:219` ya arrastra el mismo error **y además** una ruta
obsoleta (`~/.agent-of-empires/` en vez de `~/.config/agent-of-empires/`).

El comentario del script real (`modify_private_config.toml:3-6`) repite el mismo
`[cockpit]`. Los tres sitios hay que corregirlos vía MODIFIED requirement en el change
nuevo, no editando el spec principal a mano.

## Bug de documentación preexistente (no lo causa el upgrade)

`docs/manual.html` afirma dos veces que `mole analyze` es no destructivo:

- `:2268` lo lista entre los *"non-destructive commands … only inspect or simulate"*
- `:2296` la fila dice *"Explore disk usage (read-only)"*

**Falso ya con la 1.44.1 instalada.** Verificado con `strings` sobre
`/usr/local/Cellar/mole/1.44.1/libexec/bin/analyze-go`: aparecen `Press Enter to
confirm` (×2), `Delete:` (×2) y `osascript` (×1) — borra vía AppleScript de Finder.
`/usr/bin/trash` da 0 coincidencias, coherente con que `trash(8)` entre en 1.48.0.

El `--help` de `mole analyze` sólo documenta `-json`, lo que explica cómo se coló:
la capacidad de borrado vive dentro del TUI y no se anuncia en la ayuda.

Corregir las dos líneas independientemente del upgrade. Añadir además una fila para
`mole status`, que sí es genuinamente read-only y ya existe en 1.44.1.

## Deuda de memoria

Borrar el override de `__zoxide_doctor` invalida `feedback_zoxide_cmd_cd.md`, que
instruye a sesiones futuras a volver a aplicarlo. Actualizarla en el mismo change o el
workaround se reintroduce solo.
