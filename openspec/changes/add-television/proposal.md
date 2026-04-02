## Why

Actualmente usamos fzf con funciones shell custom (`frg`, `fgco`, `fglog`, `fkill`) para fuzzy finding. Television reemplaza estas funciones ad-hoc con un sistema declarativo de canales en TOML, añadiendo autocomplete contextual (Ctrl+T detecta el comando que estás escribiendo y ofrece las opciones relevantes: branches para `git checkout`, containers para `docker exec`, scripts para `bun run`). Menos código custom en .zshrc, más funcionalidad, todo configurable.

## What Changes

- Instalar television via Homebrew
- Crear configuración base en `dot_config/television/config.toml`: tema Catppuccin, shell integration (Ctrl+T contextual, Ctrl+R historial)
- Configurar channel triggers para nuestro stack: git, gh, docker, bun, brew, ssh
- Crear canal custom `bun-scripts` para fuzzy-ejecutar scripts de package.json
- Añadir inicialización `eval "$(tv init zsh)"` al .zshrc
- Evaluar y simplificar funciones de .zshrc que Television reemplaza (`frg`, `fgco`, `fglog`, `fkill`)

## Capabilities

### New Capabilities
- `television-config`: Configuración de Television (tema, shell integration, keybindings)
- `television-channels`: Channel triggers y canales custom para el stack del proyecto (git, gh, docker, bun, brew)

### Modified Capabilities
- `zsh-config`: Añadir inicialización de television y evaluar eliminación de funciones fzf custom reemplazadas
- `zsh-aliases`: Posible simplificación de aliases relacionados con fzf

## Impact

- **Archivos nuevos:** `dot_config/television/config.toml`, `dot_config/television/cable/bun-scripts.toml`
- **Archivos modificados:** `dot_zshrc.tmpl`, `run_onchange_install-packages.sh.tmpl`
- **Dependencias nuevas:** `television` (brew), requiere `fd`, `bat`, `rg` (ya instalados)
- **Riesgo:** Bajo-medio. fzf sigue funcionando en paralelo. Las funciones custom se pueden eliminar gradualmente tras validar que Television las cubre
