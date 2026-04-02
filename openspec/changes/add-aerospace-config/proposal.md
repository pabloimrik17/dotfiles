## Why

Usamos Rectangle para window management con layouts fijos y apps que siempre van en el mismo sitio, en un setup de 3 pantallas (laptop + 2 monitores) con 7 escritorios. AeroSpace automatiza lo que hoy se hace manualmente: tiling automático, asignación de apps a workspaces, workspaces por monitor, y navegación instantánea con alt+hjkl sin animaciones de macOS. Inspirado en el config de omerxx/dotfiles.

## What Changes

- Instalar AeroSpace via brew cask
- Crear configuración TOML con:
  - Navegación entre ventanas: alt+HJKL
  - Mover ventanas: alt+shift+HJKL
  - Workspaces 1-7 con alt+número (cambio instantáneo)
  - Reglas de auto-asignación de apps a workspaces
  - Workspace-to-monitor assignments para 3 pantallas
  - Lista de apps flotantes (Finder, calculadora, etc.)
  - Gaps configurables
- Añadir config al dotfiles gestionado por Chezmoi
- Añadir AeroSpace al install script
- Documentar que reemplaza Rectangle

## Capabilities

### New Capabilities
- `aerospace-config`: Configuración de AeroSpace tiling WM (workspaces, navegación, reglas por app, multi-monitor)

### Modified Capabilities

## Impact

- **Archivos nuevos:** `dot_config/aerospace/aerospace.toml`
- **Archivos modificados:** `run_onchange_install-packages.sh.tmpl` (añadir brew cask, opcionalmente eliminar Rectangle)
- **Dependencias nuevas:** `aerospace` (brew cask)
- **Reemplaza:** Rectangle (se puede desinstalar tras validar AeroSpace)
- **Riesgo:** Medio. Cambiar de window manager requiere periodo de adaptación (~1-2 semanas). Rectangle se puede mantener instalado mientras se evalúa AeroSpace
