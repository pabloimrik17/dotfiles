## 1. Salvaguarda antes de aplicar

- [ ] 1.1 Abrir la sección Trash de AoE y restaurar cualquier sesión de más de 10 días que interese conservar — al aplicar, el siguiente barrido las purga sin vuelta atrás (design.md, Risks)

## 2. Implementación

- [x] 2.1 Añadir `(("session", "trash_retention_days"), 10, False),` a la lista `MANAGED` de `dot_config/private_agent-of-empires/modify_private_config.toml`, junto a las demás claves de `[session]` (`default_tool`, `agent_status_hooks`, `confirm_delete`)
- [x] 2.2 Comentar la entrada en una línea: la retención la fijan los dotfiles, el default del schema de AoE es 30

## 3. Verificación (pre-merge, contra el clon de desarrollo)

- [x] 3.1 `chezmoi diff --source . ~/.config/agent-of-empires/config.toml` → confirmar que el único cambio es `trash_retention_days = 30` → `10`, sin drift en las tablas de writeback de AoE (`[app_state]`, `[web]`, `[cockpit]`, `[logging]`)
- [x] 3.2 Confirmar que el fichero sigue ignorado por oxfmt: `dot_config/private_agent-of-empires/modify_private_config.toml` ya está en `.oxfmtignore` — verificar que un commit con lint-staged no lo reformatea

## 4. Aplicar y verificar en la máquina

- [ ] 4.1 Tras mergear, sincronizar la fuente real **sin aplicar**: `chezmoi update --apply=false` (o `chezmoi git pull -- --autostash --rebase`) — `chezmoi apply` lee de `~/.local/share/chezmoi`, no de este clon. `chezmoi update` a secas aplica por defecto y purgaría la papelera antes de la revisión de 1.1
- [ ] 4.2 `chezmoi apply` y comprobar que `~/.config/agent-of-empires/config.toml` conserva permisos `0600`
- [ ] 4.3 `aoe settings explain session.trash_retention_days` → debe devolver `10` con `source: user value`. Si sigue diciendo `schema default`, la conclusión de design.md D3/D4 sobre la ruta es falsa: parar y reabrir la investigación antes de cerrar el cambio
- [ ] 4.4 Re-ejecutar `chezmoi diff` → debe salir vacío (el check-then-set hace el re-apply idempotente)

## 5. Documentación

- [x] 5.1 Añadir una fila `Trash retention` a la tabla de configuración de AoE en `docs/manual.html`, junto a `Delete guard` (`confirm_delete`)
- [x] 5.2 Actualizar DOT-38 en Linear: pedía 15 días, el valor implementado es 10
