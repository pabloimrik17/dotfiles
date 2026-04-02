## Context

Tmux actual: 3 líneas en `dot_tmux.conf` (mouse, 256 colores, focus events). Sin plugins, sin persistencia, sin gestión de sesiones. Referencia: omerxx/dotfiles tiene un setup completo con TPM y 8+ plugins.

## Goals / Non-Goals

**Goals:**
- Añadir TPM (Tmux Plugin Manager) como gestor de plugins
- Persistencia automática de sesiones con resurrect + continuum
- Gestión de sesiones con sessionx (fzf + zoxide integration)
- Paneles flotantes con floax
- Selección rápida de texto con thumbs
- Apertura de URLs con fzf-url
- Tema Catppuccin Mocha coherente con el resto del setup
- Prefix Ctrl+A (más ergonómico que Ctrl+B por defecto)
- Vi copy mode para consistencia con vim keybindings

**Non-Goals:**
- Reemplazar Ghostty tabs/splits (tmux es complementario)
- Configurar tmux para SSH remoto (puede venir después)
- Scripts de sesiones predefinidas por proyecto (puede venir después)
- Integración con SketchyBar o status bars externos

## Decisions

### TPM como plugin manager
TPM (tmux-plugin-manager) se instala via git clone en `~/.tmux/plugins/tpm`. Los plugins se declaran en `dot_tmux.conf` con `set -g @plugin`. TPM se encarga de instalar/actualizar.
- **Alternativa:** Instalar plugins manualmente → descartado por mantenimiento.
- **Alternativa:** Nix/Home Manager → descartado porque usamos Chezmoi, no Nix.

### Plugin selection (de omerxx, adaptado)
| Plugin | Propósito | De omerxx? |
|--------|-----------|------------|
| tmux-resurrect | Persistir sesiones entre reinicios | Sí |
| tmux-continuum | Auto-save cada 15 min | Sí |
| tmux-sessionx | Session picker con fzf/zoxide | Sí (plugin propio) |
| tmux-floax | Paneles flotantes | Sí (plugin propio) |
| tmux-thumbs | Selección rápida de texto | Sí |
| tmux-fzf-url | Abrir URLs visibles | Sí |
| catppuccin/tmux | Tema | Sí (fork propio, nosotros usamos el oficial) |
| tmux-sensible | Defaults razonables | Sí |
| tmux-yank | Copy to system clipboard | Sí |

### Prefix: Ctrl+A
Ctrl+A es más accesible que Ctrl+B (especialmente con Caps→Ctrl de Karabiner). Conflicto potencial con readline "inicio de línea" → mitigado con `bind C-a send-prefix` para enviar Ctrl+A literal.

### Status bar en top
Coherente con la posición de tabs de Ghostty. Información mínima: sesión a la izquierda, directorio a la derecha.

## Risks / Trade-offs

- **[Conflicto Ctrl+A con readline]** → Mitigación: `send-prefix` permite enviar Ctrl+A literal con doble pulsación
- **[TPM requiere git clone manual]** → Mitigación: añadir al install script como paso automático
- **[Plugins pueden romperse en actualizaciones de tmux]** → Mitigación: todos los plugins seleccionados están activamente mantenidos
- **[Duplicación con Ghostty tabs]** → No es un riesgo real, son complementarios. Tmux añade persistencia y detach
