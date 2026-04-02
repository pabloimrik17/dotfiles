## Why

No tenemos ningún remapping de teclado. Dos cambios ergonómicos de alto impacto: Caps Lock → Control (la tecla más usada en un sitio accesible en vez de la esquina) y Ctrl+HJKL → flechas de dirección (navegación vim-style en todas las apps de macOS sin mover las manos del home row). Inspirado en el config de Karabiner de omerxx/dotfiles.

## What Changes

- Instalar Karabiner-Elements via brew cask
- Crear configuración JSON con los remaps:
  - Caps Lock → Left Control (para todo el sistema)
  - Right Cmd + HJKL → Arrow keys (navegación vim)
  - Left Ctrl + HJKL → Arrow keys (navegación vim, complementario con Caps→Ctrl)
- Añadir config de Karabiner al dotfiles gestionado por Chezmoi
- Añadir Karabiner-Elements al install script

## Capabilities

### New Capabilities
- `karabiner-config`: Configuración de Karabiner-Elements con remaps de teclado (Caps→Ctrl, vim arrows)

### Modified Capabilities

## Impact

- **Archivos nuevos:** `dot_config/karabiner/karabiner.json` (o estructura equivalente de Chezmoi)
- **Archivos modificados:** `run_onchange_install-packages.sh.tmpl` (añadir brew cask)
- **Dependencias nuevas:** `karabiner-elements` (brew cask)
- **Riesgo:** Bajo. Karabiner solo actúa cuando está corriendo. Si se desactiva, el teclado vuelve a su comportamiento normal. No afecta a ningún otro archivo del dotfiles
