## Context

Ver `proposal.md` — Why. El config de AoE lo genera un script `modify_` de chezmoi (`dot_config/private_agent-of-empires/modify_private_config.toml`) que recibe el fichero vivo por stdin y superpone **solo** las claves de la lista `MANAGED` con tomlkit, dejando intacto el writeback en runtime de AoE. Cualquier knob nueva es una entrada más en esa lista.

El ticket DOT-38 dejaba abierta una incógnita bloqueante: `aoe settings explain session.trash_retention_days` reportaba `source: schema default` **aunque** `~/.config/agent-of-empires/config.toml` ya contuviera `trash_retention_days = 30`. Si AoE estuviese leyendo la ruta legacy `~/.agent-of-empires/config.toml`, tocar los dotfiles no serviría de nada. Resuelto empíricamente contra AoE 1.12.0 — ver D3.

## Goals / Non-Goals

**Goals:**

- Fijar la retención a 10 días como knob gestionada, resistente a cambios de default y al writeback de AoE.
- Cerrar la incógnita de la ruta con evidencia, y dejar el spec `agent-manager` describiendo la ruta real.

**Non-Goals:**

- No se gestiona ninguna otra clave de `[session]` que hoy caiga en defaults (`auto_stop_idle_secs`, `snooze_duration_minutes`, …).
- No se toca `delete_to_trash`: seguir mandando a la papelera en vez de borrar es justo lo que hace útil la retención.
- No se automatiza el vaciado de la Trash desde los dotfiles; la purga la hace AoE en su propio barrido.

## Decisions

### D1. Añadir a `MANAGED`, no escribir la tabla `[session]` entera

El merge hace *check-then-set*: si el valor en disco ya coincide, no toca el nodo, así que `chezmoi diff` queda en silencio y el re-apply es idempotente. Gestionar la tabla completa obligaría a fijar ~24 claves que AoE expande por defecto y convertiría cada release suya en un conflicto de diff. Alternativa descartada: un `run_once_` que llame a `aoe settings set` — introduce un segundo escritor sobre el mismo fichero y rompe la garantía de fuente única que da el `modify_`.

### D2. 10 días, no los 15 del ticket

DOT-38 pedía 15; el usuario baja a 10 (decisión de esta iteración). No hay restricción técnica: el schema acepta cualquier entero, y el único efecto es cuándo AoE purga. Hay que actualizar el ticket para que no quede contradiciendo al spec.

### D3. La ruta XDG es la correcta — se corrige el spec, no el target de chezmoi

Verificación contra AoE 1.12.0:

- `~/.agent-of-empires/config.toml` (legacy) **no existe** en la máquina.
- `~/.config/agent-of-empires/config.toml` sí existe, en modo `0600`, gestionado por el `modify_`.
- `aoe settings explain` sobre claves que sí gestionamos (`session.default_tool`, `updates.update_check_mode`, `session.confirm_delete`, `theme.name`) reporta en todas `source: user value` con exactamente el valor de los dotfiles.

Luego AoE lee la ruta XDG y el `modify_` ya apunta al sitio correcto: no hay que relocalizar nada. Lo que está mal es el spec, que sigue documentando la ruta legacy y un `private_dot_agent-of-empires/config.toml` que ya no existe en el árbol fuente.

### D4. El `source: schema default` era una coincidencia de valores, no un problema de ruta

`trash_retention_days` valía 30 en disco y el schema default también es 30, así que AoE colapsa los candidatos y solo muestra el default — no hay candidato `user value` que enseñar. Se distingue de un fallo de lectura precisamente por D3: las claves cuyo valor difiere del default sí aparecen como `user value`. Corolario que hace de test: al pasar a 10 (≠ 30) el `explain` **debe** cambiar a `source: user value`. Si tras aplicar siguiera diciendo `schema default`, entonces sí habría un problema de ruta y esta decisión estaría equivocada.

## Risks / Trade-offs

- **La purga es irreversible: al aplicar, las sesiones en la Trash con más de 10 días se pierden en el siguiente barrido** → revisar la Trash de AoE y restaurar lo que interese *antes* de `chezmoi apply` (primera tarea de `tasks.md`).
- **10 días puede quedarse corto para recuperar una sesión abandonada** → el valor ya es una knob gestionada; cambiarlo es editar una línea y re-aplicar.
- **Una release de AoE renombra o resemantiza la clave** → el merge no falla (tomlkit escribe la clave igual), pero quedaría una clave huérfana ignorada por AoE. Lo detecta el mismo `explain` de la verificación.
- **El spec `agent-manager` acumulaba drift sin que nadie lo notara** → esta corrección lo pone al día, pero no añade ningún guardarraíl que impida que vuelva a pasar.

## Migration Plan

1. Revisar la Trash de AoE y restaurar lo que se quiera conservar.
2. Editar `MANAGED`, `chezmoi diff` y confirmar que el único cambio es la línea `trash_retention_days`.
3. `chezmoi apply` y verificar con `aoe settings explain`.

Rollback: no basta con quitar la entrada de `MANAGED`. El `modify_` solo superpone lo que declara; si se borra la entrada, el `10` ya escrito permanece en disco. Para volver atrás hay que fijar explícitamente el valor deseado en `MANAGED` y re-aplicar. Lo ya purgado no se recupera.
