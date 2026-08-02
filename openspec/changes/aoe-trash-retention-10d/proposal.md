## Why

AoE no borra las sesiones descartadas: las manda a la Trash, conservando transcript y worktree hasta que expira la retención. Hoy esa retención son 30 días y viene del *schema default* de AoE — los dotfiles no la fijan, así que basura de sesiones muertas ocupa disco un mes entero y el valor puede cambiar bajo nuestros pies en cualquier release. Queremos 10 días, fijados deliberadamente.

## What Changes

- Añadir `session.trash_retention_days = 10` a la lista `MANAGED` de `dot_config/private_agent-of-empires/modify_private_config.toml`, junto al resto de claves `[session]`.
- Corregir la ruta del config en el spec `agent-manager`: sigue documentando `~/.agent-of-empires/config.toml` (legacy) cuando la realidad — y lo que chezmoi gestiona — es `~/.config/agent-of-empires/config.toml`. Verificado contra AoE 1.12.0 (ver `design.md`); la ruta legacy ya ni existe en la máquina.
- Documentar la retención en la tabla de AoE de `docs/manual.html`, al lado de `confirm_delete`.

No es un 30 → 10 sobre algo ya gestionado: el `trash_retention_days = 30` que aparece hoy en el fichero es expansión de defaults escrita por el writeback de AoE. Esto **añade** una clave a `MANAGED`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `agent-manager`: la retención de la papelera pasa a ser una knob gestionada y fijada a 10 días; y la requirement de ubicación del config se corrige de la ruta legacy a la ruta XDG que AoE lee de verdad.

## Impact

- `dot_config/private_agent-of-empires/modify_private_config.toml` — una entrada nueva en `MANAGED`.
- `docs/manual.html` — una fila en la tabla de configuración de AoE.
- `openspec/specs/agent-manager/spec.md` — vía delta.
- Efecto en runtime: las sesiones en la papelera con más de 10 días se purgan en el siguiente barrido de AoE. Irreversible para lo ya caducado, de ahí la revisión de la Trash antes de aplicar (ver `tasks.md`).
- Sin dependencias nuevas: el merge sigue corriendo sobre `uv run --with tomlkit`.
