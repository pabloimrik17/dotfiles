## Why

El tmux actual es mínimo (260 bytes: mouse, colores, focus events). No tiene plugins, persistencia de sesiones, ni gestión avanzada. Inspirado en el setup de omerxx/dotfiles, expandir tmux con un ecosistema de plugins que aporte persistencia, sesiones nombradas, paneles flotantes y selección inteligente de texto. Esto permite evaluar tmux como alternativa/complemento a las tabs y splits nativos de Ghostty.

## What Changes

- Expandir `dot_tmux.conf` con configuración completa: prefix Ctrl+A, vi mode, status bar top, historial de 1M líneas
- Añadir TPM (Tmux Plugin Manager) como gestor de plugins
- Instalar plugins: resurrect + continuum (persistencia automática de sesiones), sessionx (gestión de sesiones con fzf/zoxide), floax (paneles flotantes), thumbs (selección rápida de texto), fzf-url (abrir URLs desde tmux)
- Aplicar tema Catppuccin Mocha para consistencia visual con Ghostty y Starship
- Añadir TPM y plugins al script de instalación interactivo (`run_onchange_install-packages.sh.tmpl`)

## Capabilities

### New Capabilities
- `tmux-plugins`: Gestión de plugins via TPM, incluyendo resurrect, continuum, sessionx, floax, thumbs, fzf-url y catppuccin theme
- `tmux-keybindings`: Prefix Ctrl+A, vi copy mode, navegación entre paneles, atajos para splits y sesiones

### Modified Capabilities
- `tmux-config`: Ampliar la configuración base con status bar, historial expandido, y opciones de comportamiento avanzadas

## Impact

- **Archivos modificados:** `dot_tmux.conf`, `run_onchange_install-packages.sh.tmpl`
- **Dependencias nuevas:** TPM (git clone), plugins de tmux (gestionados por TPM)
- **Brew packages:** Ninguno adicional (tmux ya está en el install script)
- **Riesgo:** Bajo. La config existente de tmux se amplía, no se rompe. Los plugins son opcionales (TPM los instala bajo demanda)
