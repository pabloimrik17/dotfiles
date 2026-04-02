## Context

No existe ningún remapping de teclado en el dotfiles actual. macOS soporta Caps Lock → modifier nativo en System Settings, pero para remaps avanzados (Ctrl+HJKL → arrows) se necesita Karabiner-Elements. Referencia: omerxx/dotfiles incluye config de Karabiner con exactamente estos remaps.

## Goals / Non-Goals

**Goals:**
- Remap Caps Lock → Left Control (para todo el sistema)
- Remap Ctrl+HJKL → Arrow keys (vim-style navigation en todas las apps)
- Configuración JSON versionada en dotfiles, gestionada por Chezmoi
- Instalación automatizada via brew cask

**Non-Goals:**
- Remaps complejos tipo Hyper key (Caps Lock como Ctrl+Shift+Cmd+Alt)
- Remaps específicos por aplicación
- Backslash → Delete (de omerxx, demasiado opinado)
- Sistema de capas tipo QMK

## Decisions

### Config structure
Karabiner usa `~/.config/karabiner/karabiner.json`. En Chezmoi será `dot_config/karabiner/karabiner.json`. No es template (no necesita variables de Chezmoi).

### Remap 1: Caps Lock → Left Control
Implementado como `simple_modification` en Karabiner (el más básico). Caps Lock pierde su función original por completo.
- **Alternativa:** macOS nativo (System Settings → Keyboard → Modifier Keys) → descartado porque no es versionable en dotfiles y no se puede combinar con Karabiner rules.
- **Alternativa:** Dual-role (Caps solo = Escape, Caps+key = Ctrl) → descartado por complejidad y latencia perceptible.

### Remap 2: Ctrl+HJKL → Arrow keys
Implementado como `complex_modification` con rules. Se mapea tanto Left Control como Right Control + HJKL. Esto permite:
- Con Caps Lock (ahora Ctrl) + HJKL → arrows (el flujo principal)
- Con Ctrl original + HJKL → arrows (por si acaso)

### Alcance: solo HJKL, no JK para scroll
Solo flechas de dirección. No añadimos Ctrl+D/U para Page Down/Up ni otros remaps vim. KISS.

## Risks / Trade-offs

- **[Caps Lock desaparece]** → Riesgo bajo: casi nadie la usa. Si se necesita, Shift+Caps Lock sigue funcionando en Karabiner
- **[Ctrl+H conflicto en apps]** → Algunos apps usan Ctrl+H (backspace en terminal, help en algunos programas). Mitigación: la mayoría de apps modernas usan Cmd+H. Si hay conflicto real, se puede excluir apps específicas por bundle ID
- **[Karabiner requiere permisos de accesibilidad]** → Esperado; se documenta en el install script como paso manual post-instalación
- **[Latencia de input]** → Karabiner opera a nivel de kernel; latencia imperceptible (<1ms)
