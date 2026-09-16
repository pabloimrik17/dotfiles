# Exploración: actualización de deps brew (septiembre 2026)

**Auditoría completa** (8-sep-2026). **No es una proposal** — es el material verificado para una
sesión de `/grill-me` posterior.

> **Cómo leer esto.** Cada hallazgo lleva su veredicto adversarial: `confirmado n/m` sobrevivió,
> `REFUTADO n/m` no (descártalo, se conserva para que la próxima auditoría no lo reabra),
> `sin verificar` es que ningún verificador llegó a mirarlo. Las correcciones sustituyen a la
> afirmación original, no la matizan.
>
> **Aviso sobre el propio tagging:** `confirmado` mide acuerdo sobre *la afirmación*, no sobre
> *la severidad*. Cinco de los ocho HIGH llevan una rebaja de severidad dentro de un veredicto
> etiquetado como confirmado. Están corregidos abajo; menciónalo si alguien lee la tabla de arriba
> abajo.

## Procedencia

| Fuente | Qué produjo |
| --- | --- |
| Workflow `wf_d04f597e-a1b` (3 tandas, 3 cortes de cuota) | 24 changelogs, 21 pases de impacto, 39 veredictos adversariales |
| Workflow `wf_0d36d351-07c` | 4 barridos estructurales + 3 asesores independientes |
| Workflow `wf_e4e28811-9e9` | 3 impactos transitivos (aom/harfbuzz/pcre2) + crítico de completitud |
| Inline | tabla de versiones, bottles Intel, bug de `status-right`, changelog de ticker |

95 artefactos de agente en total. Coste ≈ 17,2 M tokens de subagente (incluye lo re-ejecutado tras
los cortes de cuota).

---

## 1. Los seis hechos que dominan el plan

Ninguno es un changelog. Todos verificados hoy en esta máquina.

1. **Esta máquina es Intel.** `/usr/local`, x86_64, macOS 15.7.9. De los 24 formulae
   desactualizados solo **8** tienen bottle x86_64 (`beads fd fzf gdk-pixbuf harfbuzz imath
   libdeflate openexr`). Los otros **16 compilan desde fuente**, arrastrando `go`, `node 26.8.1`,
   `python@3.14`, `protobuf`, `cmake`, `nasm`, `jemalloc` — 24 formulae de dependencia nuevos que
   hoy no existen aquí.

2. **La ironía del set:** el único paquete que **no** debes actualizar (`beads`) es de los pocos que
   tiene bottle. `brew upgrade --dry-run` lo tasa en `beads 1.2.1 -> 1.2.2 (48.5MB)`: un pour, no
   una compilación. En un `brew upgrade` a secas sería lo primero en aterrizar, por delante de
   cualquier compilado.

3. **beads 1.2.2 es un *rollback***, no un upgrade: código de v1.1.2 republicado con número mayor
   (`v1.2.1...v1.2.2` = ahead_by 11, behind_by 1227). Rompe en seco las dos DB Dolt vivas de esta
   máquina: esquema v65 contra binario que conoce v53.

4. **El script de instalación nunca actualiza.** El bucle en
   `run_onchange_install-packages.sh.tmpl:150` instala solo si el binario falta del PATH. `grep`
   de `brew upgrade` en todo el árbol: cero ocurrencias ejecutables. Group 1 no es gestión de
   paquetes, es aprovisionamiento inicial.

5. **Disco al 94%**: 15 GiB libres de 233 GiB. Homebrew compila en `/private/tmp`, mismo volumen.

6. **`brew outdated` miente por omisión.** Homebrew 6 exige *trust* del tap; `tarkah/tickrs` y
   `achannarasappa/tap` no lo tienen, así que sus dos formulae desaparecen del barrido. `ticker`
   lleva desde el 21-jun **5.2.1 → 5.3.0** sin que nada lo reporte. Son 25 desactualizados, no 24.

---

## 2. Inventario

`brew update` 8-sep-2026. Columna *bottle* = ¿hay binario x86_64 o toca compilar?

### Gestionados por este repo (`BREW_PACKAGES`)

| Paquete | Instalado | Target | Salto | Bottle Intel |
| --- | --- | --- | --- | --- |
| terminal-notifier | 2.0.0 | **3.1.0** | major | ❌ fuente |
| worktrunk | 0.72.0 | 0.76.0 | 4 minors | ❌ fuente |
| gh | 2.97.0 | 2.100.0 | 3 minors | ❌ fuente |
| mole | 1.50.0 | 1.53.0 | 3 minors | ❌ fuente |
| aoe | 1.14.0 | 1.15.3 | 3 minors | ❌ fuente |
| atuin | 18.19.0 | 18.21.0 | 2 minors | ❌ fuente |
| uv | 0.12.3 | 0.12.10 | 7 patches | ❌ fuente |
| lazygit | 0.64.0 | 0.65.0 | 1 minor | ❌ fuente |
| fd | 10.4.2 | 10.5.0 | 1 minor | ✅ |
| **ticker** | **5.2.1** | **5.3.0** | 1 minor | tap (invisible) |
| age | 1.3.1 | 1.3.2 | patch | ❌ fuente |
| tmux | 3.7b | 3.7c | patch | ❌ fuente |
| fzf | 0.74.2 | 0.74.3 | patch | ✅ |
| **beads** | **1.2.1** | **1.2.2** | **rollback** | ✅ (¡y no lo quieres!) |

Al día: `git 2.55.0`, `git-delta 0.19.2`, `starship 1.26.0`, `eza 0.23.5`, `bat 0.26.1`,
`zoxide 0.10.0`, `ripgrep 15.2.0`, `direnv 2.37.1`, `mas 7.0.0`, `wget 1.25.0`,
`television 0.15.9`, `glow 3.0.0`, `mdfried 0.22.5`, `tickrs`, los 3 plugins zsh. Comprobado contra
upstream, no contra la fórmula: 16 de 18 están genuinamente al día.

### Adyacentes (no en `BREW_PACKAGES`)

| Paquete | Instalado | Target | Qué es |
| --- | --- | --- | --- |
| chezmoi | 2.72.0 | 2.72.1 | el motor de todo el repo, sin ruta de versión gestionada |
| dolt | 2.2.3 | 2.3.2 | dependencia de beads; **no** es el motor que sirve `bd` (ver §4) |
| llmfit | 1.1.11 | 1.1.14 | leaf instalado a mano, cero referencias en el repo |

### Transitivas

`aom 3.14.1→3.15.0`, `gdk-pixbuf 2.44.7→2.44.8`, `harfbuzz 14.3.0→14.4.0`, `imath 3.2.2→3.2.3`,
`libdeflate 1.25→1.26`, `little-cms2 2.19→2.19.1`, `openexr 3.4.14→3.4.15`, `pcre2 10.47→10.48`.

### Casks

Solo `font-hack-nerd-font` y `font-jetbrains-mono-nerd-font`, 3.5.0 → 3.5.1. Por un motivo
incómodo: son los dos únicos casks instalados vía brew (§6).

---

## 3. Los tres que pueden romper algo

### beads 1.2.2 — no lo instales

`1.2.2` no es posterior a `1.2.1` en contenido. Es v1.1.2 recompilado. Consecuencia inmediata:
ambas DB de esta máquina están migradas a esquema **v65**; el binario 1.2.2 conoce hasta **v53**.
Toda orden `bd` falla.

El agravante: **`bd prime` falla en silencio.** El hook de SessionStart no rompe visiblemente —
las memorias simplemente desaparecen del contexto inyectado. "Las sesiones siguen arrancando bien"
no es evidencia de que el upgrade fue limpio.

Acción: `brew pin beads`. Hoy `brew list --pinned` está vacío.

Recuperación si entra por accidente: `BD_IGNORE_SCHEMA_SKEW=1 bd <cmd>` como parche, y el rollback
del cursor de esquema documentado en `docs/RECOVERY-1.2.1.md` de v1.2.2 (12 migraciones, 0054-0065).

> **Corrección al corpus.** El hallazgo `[high] no aterrices dolt 2.3.2 y beads 1.2.2 en el mismo
> brew upgrade` está mal titulado y sobrevalorado. `brew upgrade --dry-run dolt` (ejecutado, no
> deducido) da: `Would install 1 dependency: go 1.27.1` / `Would upgrade 1 requested outdated
> package: dolt 2.2.3 -> 2.3.2`. **beads no se toca.** La premisa solo vale para un `brew upgrade`
> a secas. Severidad real: medium.

> **Contra-argumento honesto:** un pin te ancla indefinidamente a un binario que upstream ha
> repudiado — el `go.mod` de 1.2.2 hace *retract* de 1.2.1, 1.2.0 y 1.1.1 — mientras el plugin de
> beads en Claude Code sigue auto-actualizándose por la línea 1.3.

### terminal-notifier 2.0.0 → 3.1.0 — el único major

Nueve años entre versiones (2017 → agosto 2026). Reescritura completa de `NSUserNotification` a
`UNUserNotificationCenter`.

Rupturas que tocan este repo:

- **Permiso de notificación nuevo.** 3.x llama a `requestAuthorizationWithOptions` cuando el
  estado es `NotDetermined` — un diálogo GUI. Si nadie lo contesta, `exit 3`. Los tres
  `[status_hooks]` de AoE (`modify_private_config.toml:82/84/86`) disparan desde tmux/background,
  y **AoE descarta el stderr del hook**: se quedarían mudos sin ningún error visible.
  El bundle ID no cambia (`fr.julienxx.oss.terminal-notifier`), pero la firma sí: de *sin firmar*
  a *ad-hoc*. TCC casa por designated requirement, así que el permiso puede invalidarse.
- **`-sender` eliminado** (avisa por stderr y lo ignora). El plugin `bgnotify` de omz **está
  activo** (`dot_zshrc.tmpl:49`) y lo pasa. Mitigante verificado: solo lo pasa cuando
  `TERM_PROGRAM` es `iTerm.app` o `Apple_Terminal`. Bajo Ghostty/tmux la rama no se toma.
- **Sin `-group` las notificaciones ya no se reemplazan, se acumulan.** Los tres hooks de AoE no
  pasan `-group`.
- `-appIcon` eliminado, `-ignoreDnD` inerte, `-contentImage` solo acepta ficheros locales,
  códigos de salida 2-6 nuevos, macOS mínimo 10.14.

**El coste operativo real, que no es un changelog:** sin bottle Intel, y el active developer dir
apunta a las Command Line Tools, no a Xcode. `brew upgrade terminal-notifier` falla hasta que
corras `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` — un cambio **global y
persistente** que heredarán las otras 15 compilaciones del ciclo.

> **Rebaja de severidad (el verificador, contra el hallazgo original):** de high a **medium**.
> El modo de fallo es un error de compilación impreso en pantalla; Homebrew compila en un temp dir
> y deja el keg 2.0.0 enlazado y funcionando. Y la mitad de "la firma invalida el permiso" es
> especulativa: no se puede comprobar sin actualizar.

**Hueco declarado:** nadie verificó que `-sound Glass` / `-sound Basso` sigan resolviendo. La única
evidencia del corpus es "los ficheros existen en `/System/Library/Sounds`" — razonamiento de la era
NSUserNotification aplicado a `[UNNotificationSound soundNamed:]`. Si no resuelven, `on_waiting` y
`on_error` colapsan al mismo tono por defecto y **`openspec/specs/agent-manager/spec.md:220` deja de
cumplirse en silencio**.

### worktrunk 0.72.0 → 0.76.0 — rompe cuatro keybindings hoy

0.76 cambió `wt switch -x` de *cadena de shell* a *programa + argv literal*
(`Cmd::new(program).args(argv)`). Cuatro bindings de gh-dash le pasan una cadena multi-palabra:

```
dot_config/gh-dash/config.yml:74,84   -x claude -- /code-review:code-review {{.RepoName}}#{{.PrNumber}}
dot_config/gh-dash/config.yml:99      -x aoe -- add . -t "pr {{.RepoName}}#{{.PrNumber}}"
dot_config/gh-dash/config.yml:110     -x aoe -- add . -t "review {{.RepoName}}#{{.PrNumber}}" -g "reviews/..."
```

Nada en git bloquea esto: `BREW_PACKAGES` no fija versiones, así que las teclas rompen en el
momento en que alguien escriba `brew upgrade worktrunk`.

También: `commit.generation.template-file` y `squash-template-file` eliminados sin migración (este
repo usa `template` inline, no le afecta), Git 2.43 mínimo (tienes 2.55), y `wt list --format json`
ignora `[list] columns` en schema 1 — el repo fija `json-schema = 2`, a salvo.

**Verificado por el crítico, no asumido:** `dot_config/worktrunk/config.toml` se diffeó clave por
clave contra el struct de 0.76.0. Las tres claves retiradas no están puestas. El fichero pasa.

**Hueco:** `commit.generation.template-append` (nueva y estable en 0.76.0) se detectó en el
changelog y se perdió al condensar. Nadie la evaluó — y el repo escribe a mano dos plantillas de
~20 líneas que reemplazan el prompt interno, que es exactamente lo que esa clave existe para evitar.

---

## 4. El resto, en una línea cada uno

| Paquete | Veredicto |
| --- | --- |
| **aoe** 1.15.3 | La migración v026 reescribe el `config.toml` gestionado y voltea `acp.default_agent` a `claude-code` — que es el valor que quieres. Dos líneas, sin conflicto. `acp.default_agent` no está en `MANAGED` y no debe estarlo. Clave nueva `session.pre_trust_agent_folders` puede anular la política de revisión de hooks: decisión de clase, no de ítem. **Cierra el pendiente de agosto:** la superficie de temas son 28 claves (no 37) y el tema del repo las cubre exactamente — verificado contra el struct de deserialización en `themes.rs`, blob idéntico en 1.14.0 y 1.15.3. |
| **atuin** 18.21.0 | El HIGH original quedó **REFUTADO 2/3**: el socket del daemon se mueve a `$TMPDIR/atuin-$UID`, pero `daemon_matches_expected` compara versión exacta y `autostart = true` ya está puesto, así que `try_with_restart` mata el daemon viejo solo. Es una nota operativa, no un riesgo. Real: `ai.tips` nuevo (default `true`) invita a correr `atuin config set`, que **escribe el fichero gestionado por chezmoi**. `atuin ai init <shell>` eliminado. Tres deps con advisory RUSTSEC sustituidas. |
| **gh** 2.100.0 | GHSA-vfhh-p7hm-pxfh / CVE-2026-72924 (`gh codespace ports forward` escuchaba en todas las interfaces) — no alcanzable aquí. Lo que sí importa: arreglos de **corrupción de worktree** en `gh repo sync` y `gh pr merge --delete-branch`, en un repo cuyo flujo entero es worktree-por-ticket con `gh repo *` / `gh pr *` auto-aprobados. `--comments` + `--json` ahora es error duro. Los skills de Codex se mudan de `~/.codex/skills` a `~/.agents/skills` **sin migrar nada**. El comentario en `install-packages.sh.tmpl:509` (`cline, universal, warp`) pasa a ser falso: 2.99.0 añade `codex`. |
| **lazygit** 0.65.0 | El `context: files` del custom command está en la whitelist de las 28 válidas — pasa la nueva validación en carga. Nada que tocar. |
| **mole** 1.53.0 | **El más infravalorado.** En la 1.50.0 instalada, `mole uninstall` puede listar el árbol `~/.claude` gestionado por chezmoi como "restos de app". 1.52.0 elimina los candidatos derivados del nombre. 1.51.0 hace que `mo purge` por fin consulte la whitelist y que cinco patrones de seguridad no puedan desactivarse. CVE-2026-56852 en `golang.org/x/text`. |
| **uv** 0.12.10 | Siete patches, casi todos de seguridad de supply chain: fix de memory-safety leyendo metadatos de wheels no confiables, cabeceras sensibles eliminadas en redirects entre realms, secretos redactados en diagnósticos. Es el motor de merge de **tres** scripts `modify_` (settings.json de Claude, config de AoE, mcp.json de Junie), no de uno. |
| **fd** 10.5.0 | `--strip-cwd-prefix` conserva `./` cuando quitarlo dejaría una ruta empezando por `-`. Afecta a los tres invocaciones de fd del repo, en dirección favorable. Descubre de paso que `FZF_ALT_C_OPTS` (`dot_zshrc.tmpl:153`) es el único preview sin guarda `--`. |
| **fzf** 0.74.3 | Arregla el bracketed-paste que este repo dispara hoy en cada Ctrl+T y Alt+C. Un solo patch, todo ganancia. |
| **age** 1.3.2 | Auditoría de Trail of Bits: 11 endurecimientos. Ninguno alcanza este repo (un solo stanza X25519, sin recipients file). chezmoi sí usa el binario de brew, no su librería vendorizada — así que la versión de brew es load-bearing para `chezmoi apply`. |
| **tmux** 3.7c | Nueva dependencia `jemalloc` en macOS (llega transitiva, **no** la añadas a `BREW_PACKAGES`). Los arreglos **no llegan al servidor 3.7b en ejecución**: requiere `tmux kill-server` desde fuera de tmux. El workaround `fill=` de `dot_tmux.conf:24-29` sigue haciendo falta. |
| **chezmoi** 2.72.1 | Patch inocuo. La pregunta real es de gobierno: es el motor de todo esto y no tiene ruta de versión gestionada. |
| **dolt** 2.3.2 | Todo lo relevante del rango son arreglos de `sql-server`, y aquí dolt corre **embebido** a 2.2.0 vendorizado dentro del binario `bd`. El dolt de brew no es el motor que sirve tus datos. No lo actualices: cuesta una compilación de Go y no compra nada. |
| **llmfit** 1.1.14 | Deriva pura: leaf instalado a mano, 28 MB, cero referencias en el repo. Adóptalo o quítalo — el estado actual es el único indefendible. |

---

## 5. Transitivas: cuatro CVE, ninguno alcanzable

Esto cierra el hueco que la auditoría de agosto dejó abierto (`harfbuzz`/`llhttp`/`openjph`
"nunca leídos"). Ahora sí se leyeron, y el resultado es más útil que una alarma:

- **pcre2 10.48 — CVE-2026-86145 (HIGH, escritura OOB en heap)**. **No alcanzable.** La función
  vulnerable es `pcre2_dfa_match()`; `nm -u` sobre cada consumidor enlazado muestra que ninguno la
  importa: git (18 símbolos pcre2), rg (19), el bundle `zsh/pcre` (9) — ninguno con
  `_pcre2_dfa_match_8`. El único objeto de todo el árbol brew que la importa es `libglib`, y ahí
  solo se alcanza desde `g_regex_match_all*`, que nadie llama. Segunda barrera: el CVE exige un
  *patrón* controlado por el atacante, no un *sujeto*. Y nada en el repo activa PCRE2 siquiera:
  cero `-P`, `--pcre2`, `grep.patternType` o `zmodload` en toda la configuración.
- **harfbuzz 14.4.0 — 7 entradas de seguridad.** Todas son bugs de parseo de *fuentes*, no de
  texto: necesitan una fuente hostil. Aquí solo hay dos casks de Nerd Fonts. Además `mdfried`
  **no enlaza harfbuzz** — 0 símbolos `_hb_`, 0 cargas bajo `DYLD_PRINT_LIBRARIES`. Esto refuta de
  paso el mapa de consumidores que arrastraban `brew-update-2026-08-sweep.md:177` y
  `brew-update-2026-08-critic.md:20`.
- **aom 3.15.0 — 4 bugs de memoria.** Los cuatro están en el **encoder**. `mdfried`/`chafa`
  decodifican para pintar en terminal; nunca codifican AV1.
- **openexr 3.4.15 — 2 GHSA high.** Exposición nula: nada aquí decodifica el atributo `idmanifest`.
- `gdk-pixbuf`, `imath`, `libdeflate`, `little-cms2`: sin contenido de seguridad relevante. Los
  bumps de compatibilidad ABI son seguros para dyld (verificado en los `LC_ID_DYLIB`).

**Consecuencia práctica:** las transitivas son higiene, no urgencia. Y siete de las ocho tienen
bottle — `pcre2` y `aom` y `little-cms2` son los que compilan.

---

## 6. La superficie estructural (lo más grave de toda la auditoría)

Nada de esto es un changelog. Todo salió de mirar el sistema en vez de los paquetes.

### 6.1 Ningún cask GUI está gestionado por brew

De los 31 casks de `ALL_CASKS`, **cero** están instalados vía brew. `/usr/local/Caskroom/` solo
contiene las dos fuentes. Pero 24 de las apps existen en `/Applications`, instaladas a mano o por
el instalador del fabricante.

La causa está en `run_onchange_install-packages.sh.tmpl:701-708`:

```sh
is_cask_installed() {
    if [ -n "$app_name" ] && [ -d "/Applications/$app_name.app" ]; then return 0; fi
    brew list --cask "$cask" &>/dev/null
}
```

El test de directorio corta antes de consultar a brew. Cualquier app puesta a mano satisface la
condición, el script dice "already installed, skipping", y brew nunca entra. El grupo reporta 30/30
mientras `brew list --cask` devuelve dos.

Y el propio fichero se contradice: el grupo de fuentes (líneas 552-558) tiene un comentario de siete
líneas explicando exactamente por qué una copia manual no cuenta como instalada.

**Deriva real medida:** DBeaver 23.0.4 contra cask 26.2.0 (**tres majors**, con drivers JDBC
embebidos), VNC Viewer 6.18.907 vs 7.15.1, Raspberry Pi Imager 1.5 vs 2.0.11.1, Docker 4.69 vs 4.90,
Claude 1.46388 vs 1.49585, y cinco más.

**Entradas rotas del array:**
- `transmission-remote-gui` fue **deshabilitado el 2026-09-01** por no pasar Gatekeeper. Un
  `brew install` fresco falla en seco.
- `spark` resuelve a `spark-app`, un *gestor de atajos*, no al cliente de correo. El Spark real está
  en la Mac App Store.
- `docker` → `docker-desktop`, `ollama` → `ollama-app`: tokens renombrados.
- `whatsapp` no puede casar nunca: la app vive en `/Applications/WhatsApp.localized/WhatsApp.app`.
  Se reporta pendiente en cada ejecución.
- Cinco entradas duplican apps ya instaladas desde la MAS (ticktick, the-unarchiver, telegram,
  whatsapp, spark).

### 6.2 Los taps de terceros son invisibles

Homebrew 6 introdujo *trust* de tap. `brew tap-info tarkah/tickrs` → `Installed / Untrusted`. Efecto:

- `brew outdated` los omite del barrido. `ticker` lleva tres meses desactualizado sin reportarse.
- `brew outdated ticker` a secas: `Error: Refusing to load formula...`. Solo funciona con el nombre
  cualificado (`achannarasappa/tap/ticker`).
- **En una máquina nueva, `brew install ticker` fallaría**, porque `BREW_PACKAGES:100` los lista con
  nombre desnudo y la línea 154 los instala tal cual.

Y hay una asimetría sin principio detrás: `alexsjones/llmfit` **sí** está en
`~/.config/homebrew/trust.json` — es la única entrada — pero su tap ni siquiera aparece en
`BREW_TAPS`. Un tap no declarado con permiso permanente, junto a dos taps declarados sin permiso.

### 6.3 ticker 5.3.0 llama a casa, sin opt-out

El hueco que encontró el crítico y que cerré a mano. `internal/updater/updater.go` (nuevo en 5.3.0):

- petición HTTP a la URL de releases en cada arranque, timeout 5 s;
- cachea 3 h en `$XDG_CACHE_HOME/ticker/cache.json`;
- `cache.New(fs, cacheFilePath, true)` — el `true` está **hardcodeado**, así que `--no-cache` no lo
  desactiva;
- se salta solo si `currentVersion == "v0.0.0"` (builds de desarrollo);
- **no hay flag ni clave de config para desactivarlo**;
- el temporizador de refresco del footer se sustituye por un aviso de actualización.

Como este repo instala ticker por brew y nunca actualiza, ese aviso será permanente en cuanto salga
la 5.4.0. También: `feat: add minor currency support (#372)`, relevante para el portfolio.

### 6.4 El status line de Catppuccin nunca ha funcionado

`openspec/specs/tmux-catppuccin/spec.md:26-38` exige que la barra derecha muestre aplicación +
sesión. No lo hace, y no lo ha hecho nunca.

`dot_tmux.conf:22` usa `set -gF`, que expande el formato **una vez, al ejecutar la línea**. La línea
22 corre en la configuración; el plugin que define `@catppuccin_status_application` no se carga
hasta el `run -b` de la línea 29. Se hornea una cadena vacía.

Verificado en vivo, no deducido:

```
$ tmux show -gv status-right           # → vacío
$ tmux show -gv @catppuccin_status_application
#[fg=#eba0ac]#[fg=#11111b,bg=#eba0ac] ...   # resuelve perfectamente
```

Arreglo: borrar la `F` de la línea 22. Un carácter.

### 6.5 Renovate no cubre brew, y el atajo obvio no existe

Los cinco `customManagers` de `renovate.json` son `"datasourceTemplate": "npm"`, todos. Cero
superficie brew.

**No existe un datasource `homebrew` en Renovate.** El índice va de `hermit` a `hex`. Lo que sí
existe es un *manager* homebrew cuyo `fileMatch` por defecto es `/^Formula/\w*/?[^/]+[.]rb$/` — para
autores de taps que editan ficheros `.rb`, no para consumidores. La única forma viable sería un
`customDatasources` apuntando a `https://formulae.brew.sh/api/formula/{{packageName}}.json`, más un
regex manager, más versiones escritas dentro de `BREW_PACKAGES`.

### 6.6 Deriva de leaves y kegs viejos

`brew leaves` menos `BREW_PACKAGES` = `chezmoi`, `llmfit`, `rust`, `tuicr`, `zsh`. Ninguno tiene una
exclusión a nivel de spec (`cli-tool-expansion/spec.md:16` documenta exactamente una: opencode).

`rust` son **435 MB**, `installed_on_request: false`, sin dependientes, y `brew autoremove --dry-run`
devuelve vacío — brew no lo va a reclamar nunca. Entró porque `tuicr` compiló desde fuente el
2026-09-05. Y `tuicr` existe dos veces en disco: keg de brew más un binario de 15 MB en
`~/.local/bin/tuicr`; brew gana solo por orden de PATH.

**Corrección numérica importante:** los kegs viejos suman 520 MB, pero `brew cleanup --dry-run`
libera **117,3 MB**, no 521 MiB. El resto está bloqueado porque cleanup se niega a tocar un formula
que está por detrás (`Warning: Skipping age: most recent version 1.3.2 not installed`). Solo se
libera *después* de actualizar. En un disco al 94% esa diferencia de 4,4× es la decisión entera.

**Y el número que nadie calculó:** cuánto *consume* el lote. `brew upgrade --dry-run` a secas
instalaría **24 formulae de dependencia nuevos** — go, node 26.8.1, python@3.14, protobuf, cmake,
nasm, abseil, libuv, simdutf... Persisten después, y `autoremove` no los va a limpiar.

---

## 7. Opinión: qué haría y en qué orden

Tres asesores independientes (riesgo, adopción, estructura) más un crítico. Donde discreparon, lo
resuelvo abajo con evidencia.

### Tramo 0 — antes de tocar nada (5 min)

```sh
brew pin beads                    # el rollback disfrazado de upgrade
df -h /System/Volumes/Data        # hoy: 15Gi libres, 94%
brew upgrade --dry-run            # lee las 24 deps nuevas antes de aceptarlas
```

Y **borra `bubu` de `README.md:197`** (y las filas de `docs/manual.html:2161-2201`). Ese alias
expande a `brew update && brew outdated && brew upgrade && brew cleanup`. En esta máquina el
`brew upgrade` desnudo aterriza beads 1.2.2 — de hecho **primero**, porque es un pour de 48 MB
mientras el resto compila. La documentación apunta hoy al comando más peligroso disponible.

### Tramo 1 — los ocho pours (minutos, riesgo casi nulo)

```sh
brew upgrade fd fzf gdk-pixbuf harfbuzz imath libdeflate openexr
brew upgrade --cask font-hack-nerd-font font-jetbrains-mono-nerd-font
```

9,9 MB de descarga, cero compilaciones, cero dependencias extra (verificado con `--dry-run`).
fzf arregla un bug que sufres hoy. Las fuentes son un no-op cosmético verificado: 105 glifos Devicon
*añadidos* en U+E8F0–E958, ninguno movido — comprobado diffeando los 16 `i_*.sh` y la tabla
`SYMBOL_FONTS` en ambos tags, y todos los glifos que este repo pinta (84 codepoints, todos en
`starship.toml`) están por debajo de U+E8F0.

> Ojo: bajo el plan de "nunca `brew upgrade` a secas", las fuentes **solo** se actualizan si las
> nombras explícitamente. Ninguna recomendación de los tres asesores incluía ese comando. Está
> arriba a propósito.

### Tramo 2 — lo que compila y merece la pena

Por orden de valor/coste:

1. `brew upgrade uv` — siete patches de seguridad de supply chain sobre el motor de tres scripts
   `modify_`.
2. `brew upgrade mole` — el fix de `mole uninstall` es lo más cercano a un peligro real que hay
   en todo el set.
3. `brew upgrade gh` — los arreglos de corrupción de worktree, en un flujo que es todo worktrees.
4. `brew upgrade worktrunk` — **después de arreglar los cuatro bindings de gh-dash**, o
   inmediatamente antes y aceptando que las teclas rompen hasta que edites.
5. `brew upgrade lazygit atuin fd age` — bajo riesgo, sin acción de config salvo `tips = false`.

Con `atuin`, después: `atuin daemon restart` (los crates parcheados no entran hasta reiniciar el
proceso de larga vida).

### Tramo 3 — aplaza, y di por qué

- **aoe**: sin bottle, y sus deps de build son `node` + `rust`. `node 26.8.1` tampoco tiene bottle
  Intel y no está instalado → `brew upgrade aoe` compila Node desde fuente, el mayor compilado
  disponible en esta máquina, sobre 15 GiB libres.
  *Contra:* aoe supervisa toda la flota, y 1.15.2 arregla justo la clase de fallo que la hace poco
  fiable (sesiones colgadas en Running, `aoe session capture` discrepando del dashboard).
- **dolt**: no es el motor que sirve `bd`. Compilación de Go a cambio de nada.
- **terminal-notifier**: exige un `sudo xcode-select` global y un permiso GUI contestado a mano,
  para tres hooks que hoy funcionan. Si lo haces, hazlo solo y verifica con
  `terminal-notifier -diagnose` y una prueba real de `-sound Glass` / `-sound Basso`.
- **tmux**: los nueve commits de 3.7b..3.7c no incluyen nada que dispare aquí (el fix de scrollbar
  necesita `pane-scrollbars`, que está apagado), y cobrarlo cuesta matar el servidor y con él la
  flota. **Y eso lo tienes que hacer tú desde fuera de tmux, no un agente desde dentro.**
- **chezmoi**, **llmfit**, **little-cms2**, **aom**, **pcre2**: sin urgencia.

### Adopciones que sí valen (independientes del upgrade)

| Cambio | Fichero | Por qué |
| --- | --- | --- |
| Quitar la `F` de `set -gF status-right` | `dot_tmux.conf:22` | Un carácter arregla una spec que lleva rota desde abril |
| `tips = false` bajo `[ai]` | `dot_config/atuin/config.toml` | Los tips invitan a `atuin config set`, que escribe el fichero gestionado |
| `-- {}` en el preview | `dot_zshrc.tmpl:153` | Único de los tres previews sin la guarda; los otros dos ya la tienen |
| `brew trust` a los dos taps | comando + bucle en `:116-120` | Sin esto `ticker` seguirá invisible para siempre |
| Nombres cualificados de tap | `BREW_PACKAGES:100` + casos `pkg_bin` | Sin esto una máquina nueva no arranca |
| Borrar `transmission-remote-gui` y `spark`; renombrar `docker`→`docker-desktop`, `ollama`→`ollama-app` | `ALL_CASKS` | Cuatro filas de 33 están objetivamente mal |
| `cline, codex, universal, warp` | `install-packages.sh.tmpl:509` | gh 2.99.0 añadió codex |

### Lo que explícitamente NO adoptaría

Registrado para que la próxima auditoría no lo reabra:

- **`-in` / `-at` / `-list PENDING` de terminal-notifier 3.1.0**: no hay consumidor.
- **`session.show_diagnostics_pane` de aoe**: el hallazgo original inventó una tecla F9 que no
  existe — `bindings.rs` tiene un test (`system_health_actions_are_palette_only`) que afirma lo
  contrario. **REFUTADO 2/2.** Si lo quieres, se activa desde la paleta y aoe lo persiste solo.
- **`acp.default_agent` en `MANAGED`**: la migración v026 ya lo pone en el valor que quieres.
- **`jemalloc` en `BREW_PACKAGES`**: llega transitivo.
- **`GH_SPINNER_DISABLED`**: 2.99.0 lo hace redundante bajo Claude Code, y un valor falsy
  *reactivaría* el spinner.
- **`BD_IGNORE_SCHEMA_SKEW` en `dot_zshrc.tmpl`**: el hook `bd prime` no hereda el entorno
  interactivo, así que el export no cubriría la ruta que importa.
- **Un datasource Renovate para brew**: no existe.

### Sobre el mecanismo (donde discrepan los asesores)

El asesor de estructura propone un `Brewfile.tmpl` + `brew bundle check` como paso de reporte en
`update-extra`. Verificó que funciona: 21 filas de deriva en un solo comando.

**Yo no lo haría, y la objeción es del propio asesor de riesgo:** un Brewfile no puede codificar
"beads sí pero no", que es exactamente la situación de hoy. `brew "beads"` es un nombre, no una
restricción, y `check` reportaría beads como pendiente para siempre, señalando justo el upgrade que
no debes hacer. Además duplica cuatro arrays que ya existen, y ya tienes un skill
(`classify-tool-updates`) cuyo trabajo es mantener listas sincronizadas — y no detectó que `llmfit`
ni `tuicr` se hubieran convertido en leaves.

Lo que sí cambiaría, porque es una línea: la doctrina en
`.agents/skills/classify-tool-updates/SKILL.md:25` dice *"brew-managed → no action. `brew upgrade`
(omz `bubu`) covers it."* Esa frase produjo los 24 formulae de retraso y apunta al comando que rompe
beads. Sustitúyela por detección automática + aplicación manual por paquete.

---

## 8. Huecos declarados

Lo que esta auditoría **no** cubrió, en sus propios términos:

- **Verificación adversarial de las 8 transitivas: cero.** 38 ficheros `verify_*.json` cubren 16 de
  24 paquetes, y los 8 omitidos son exactamente la clase que agosto también dejó caer. Los tres que
  cargan el único CVE HIGH (pcre2), los cuatro bugs de encoder (aom) y las siete entradas de
  seguridad (harfbuzz) tienen cero revisión adversarial entre ellos.
- **El pase de pcre2 dispone de 2 de sus 7 entradas de seguridad.** Las otras cinco se listaron y no
  se leyeron contra las tablas de símbolos que el propio pase imprimió. Dos tienen forma alcanzable
  (GHSA-2p8c-ff85-vh9x en rg, #937 en git), ambas solo con un `-P` tecleado a mano.
- **atuin: tres betas de 18.20.0 sin leer.** Prereleases; aceptable, pero dicho.
- **`terminal-notifier -sound`**: nunca verificado (§3).
- **`commit.generation.template-append` de worktrunk**: detectado y perdido al condensar.
- **Fleet vs máquina.** Todo aquí está calibrado para *un* Mac Intel con macOS 15.7.9. Este es un
  repo chezmoi para más de un host. En Apple Silicon las 16 compilaciones son pours y casi todos los
  aplazamientos del §7 son incorrectos. Nada en el corpus marca qué conclusiones pueden escribirse
  en prosa del repo y cuáles son operativas de esta máquina — y varias recomendaciones proponen
  editar `README.md`, `SKILL.md` y `docs/manual.html`.
- **Nada se midió después de actualizar**, porque no se actualizó nada. Todas las conclusiones de
  ABI y comportamiento son análisis estático. `brew linkage --test` tras los pours convertiría esa
  pila en evidencia; no está en ningún runbook.
- **La superficie de casks y MAS tuvo tres barridos y cero agentes de changelog o impacto** — y es
  donde vive la obsolescencia genuinamente relevante para seguridad (§6.1).

---

## 9. Preguntas para el grill

Las que más duelen, de los tres asesores y del crítico.

**Sobre la decisión de fondo**

1. El script es install-only por diseño y llevas 24 formulae de retraso, el README apunta a `bubu`,
   y un `brew upgrade` a secas rompe beads. ¿Qué quieres de verdad: bootstrap install-only más un
   runbook manual que vas a seguir, o una puerta `confirm` que corra
   `brew upgrade "${BREW_PACKAGES[@]}"`? No elegir es cómo se llegó a 24.
2. Este plan gasta una tarde en formulae de CLI cuyo peor desenlace realista es un binario viejo,
   mientras brew gestiona 2 de tus 30 casks, DBeaver está tres majors atrás con drivers JDBC
   embebidos y `transmission-remote-gui` lleva desde el 1 de septiembre deshabilitado por fallar
   Gatekeeper. ¿Es el ciclo de formulae donde va el presupuesto de riesgo, o es solo la superficie
   que produjo una lista ordenada?
3. `update-extra` solo corre cuando lo tecleas, y no lo has tecleado: seis auditorías brew a mano
   (04-03, 05-02, 05-31, 08-12, 08-20, y esta). No hay crontab ni LaunchAgent de brew. Nombra el
   disparador —hook de login, línea en Ghostty, bead con fecha, agente programado— o admite que
   cualquier mecanismo nuevo es un informe mejor sobre la misma cadencia rota.

**Sobre coherencia de las propias decisiones**

4. `llmfit` está en `trust.json` a mano y su tap ni figura en `BREW_TAPS`; `tarkah/tickrs` y
   `achannarasappa/tap` sí figuran y no tienen trust. Tu propia nota de endurecimiento proporcionado
   dice que no gates un ítem cuando su clase corre con una línea base más débil. Elige la línea base
   de la clase: confía en los tres, o revócale el permiso a llmfit y enruta los tres por
   `brew outdated <nombre-completo>`.
5. El script `modify_` de AoE fija `session.confirm_delete` y `tmux.mouse` "para que un valor suelto
   no pueda derivar", pero deja `session.yolo_mode_default`, `sandbox.enabled_by_default` y ahora
   `session.pre_trust_agent_folders` sin gestionar — el último permite que los hooks del
   `.claude/settings.json` de un repo corran sin preguntar, en worktrees que la tecla `F` de gh-dash
   crea desde ramas de PR arbitrarias. ¿Ese script es una frontera de seguridad o un pin de estética?
6. Justificaste un tap de terceros para `llmfit` explícitamente para evitar compilar `rust` en Intel.
   `rust` está instalado igualmente — 435 MB, sin dependientes, que brew nunca reclamará — porque
   `tuicr` compiló desde fuente el 5 de septiembre. Y `tuicr` no aparece en el repo mientras existe
   dos veces en disco. Si evitar rust justificaba un tap, justifica conservarlo para tuicr.
7. Catppuccin está fijado en v2.3.0 desde el 12 de abril. Si sus dos módulos estrella de status han
   renderizado como cadena vacía todo ese tiempo y nadie lo notó, ¿qué está protegiendo el pin?
   Nombra una cosa que perderías al desfijarlo y una cosa de ese plugin que hayas verificado que
   renderiza.
8. Gestionas la config de AoE con un script `modify_` precisamente para que el writeback de upstream
   no salga en `chezmoi diff`. La migración v026 va a reescribir ese fichero al primer arranque de
   1.15.3. ¿El modelo de merge protege algo aquí, o sobre todo garantiza que te enteres de las
   reescrituras más tarde que con un fichero gestionado normal?

**Sobre lo que este documento no puede sostener**

9. Los tres scripts `modify_` fallan en silencio: cualquier error de uv deja pasar el fichero vivo y
   chezmoi sale 0. Uno de ellos escribe `~/.claude/settings.json`, el fichero con tus permisos de
   agente. Ya has enviado ese patrón tres veces. ¿Ante qué fallo concreto lo cambiarías? Y si la
   respuesta es "ninguno", ¿por qué merecen la pena las seis ediciones del endurecimiento de
   `VIRTUAL_ENV`?
10. Te digo que arregles los cuatro bindings de gh-dash *antes* de actualizar worktrunk, pero no
    puedo probar la forma argv nueva contra un binario que no está instalado, y el comentario en
    `config.yml:94-96` dice que el token entrecomillado existe porque gh-dash renderiza su plantilla
    antes de que corra el shell. ¿Cuál es tu prueba real para esas cuatro teclas? Si es "pulso `b` y
    veo", entonces actualizar-probar-arreglar es el orden que produce evidencia y el mío es
    preferencia disfrazada de seguridad.
11. La seguridad de tmux 3.7c aquí depende de que `message-style` resuelva a `bg=default`, y tres
    verificadores dieron tres explicaciones distintas de qué línea de `catppuccin_tmux.conf` produce
    ese `default`. Descansas en un valor que nadie supo atribuir. Si catppuccin se mueve del pin,
    ¿qué lo detecta, o te enteras entrecerrando los ojos ante una barra de estado?
12. Este documento aplaza aoe, tmux, dolt y terminal-notifier con razones que son todas de *esta*
    máquina Intel. Varias de sus recomendaciones editan `README.md`, `SKILL.md` y `docs/manual.html`,
    que son de *todas*. ¿Cuál de las dos cosas es este documento?
