## Context

Setup actual: Rectangle para window management con layouts fijos manuales. 3 pantallas (laptop + 2 monitores externos), 7 escritorios, ~14 ventanas, apps siempre en el mismo sitio. Se está haciendo manualmente lo que un tiling WM automatiza.

## Goals / Non-Goals

**Goals:**
- Tiling automático de ventanas (nuevas ventanas se colocan solas)
- Workspaces propios de AeroSpace (1-7) con cambio instantáneo (sin animación macOS)
- Navegación vim-style: alt+HJKL entre ventanas, alt+shift+HJKL para mover
- Asignación automática de apps a workspaces por bundle ID
- Workspace-to-monitor assignments para 3 pantallas
- Apps flotantes para Finder, calculadora, dialogs
- Configuración TOML versionada en dotfiles

**Non-Goals:**
- SketchyBar u otra status bar custom (puede venir después)
- Scripting avanzado con AeroSpace commands
- Gaps estéticos grandes (estilo omerxx con 350px outer)
- Multi-monitor dynamic reassignment

## Decisions

### AeroSpace sobre otras alternativas
| Option | Pros | Cons | Decisión |
|--------|------|------|----------|
| AeroSpace | Nativo macOS, TOML config, activo, workspaces propios | Relativamente nuevo | ✅ Elegido |
| yabai | Más maduro, más features | Requiere SIP deshabilitado para full features | Descartado |
| Amethyst | Simple, no requiere config | Menos configurable, sin workspaces propios | Descartado |
| Rectangle | Ya lo usamos | Manual, sin tiling auto, sin workspaces rápidos | Se reemplaza |

### Workspace layout
```
Monitor izq (externo 1)     Monitor centro (externo 2)     Laptop
┌─────────────────────┐     ┌─────────────────────────┐    ┌──────────────┐
│  WS 1: Comunicación │     │  WS 3: Código            │    │ WS 6: Música │
│  WS 2: Browser      │     │  WS 4: Terminal          │    │ WS 7: Otros  │
│                     │     │  WS 5: Tools/DB          │    │              │
└─────────────────────┘     └─────────────────────────┘    └──────────────┘
```

Nota: este layout es orientativo. El usuario deberá ajustar las asignaciones workspace→monitor según su setup físico real y los identificadores de sus monitores.

### App assignments (orientativo)
```toml
# Comunicación → WS 1
Slack, Teams, Telegram, WhatsApp → workspace 1

# Browser → WS 2
Chrome, Firefox → workspace 2

# Código → WS 3
WebStorm, VS Code → workspace 3

# Terminal → WS 4
Ghostty → workspace 4

# Tools → WS 5
Docker, DBeaver → workspace 5
```

El usuario deberá personalizar esto según sus apps y preferencias reales.

### Keybindings
- `alt+h/j/k/l` → navegar entre ventanas (focus)
- `alt+shift+h/j/k/l` → mover ventana en dirección
- `alt+1-7` → cambiar a workspace
- `alt+shift+1-7` → mover ventana a workspace
- `alt+f` → toggle floating
- `alt+m` → toggle fullscreen

Sin conflicto con Karabiner (Karabiner usa Ctrl+HJKL, AeroSpace usa Alt+HJKL).

### Gaps conservadores
Inner gaps: 8px. Outer gaps: 8px. Funcional sin ser excesivo. Omerxx usa 40px inner y 350px outer — demasiado para productividad.

### Floating apps
Finder, Calculator, System Preferences, 1Password, Archive Utility, cualquier dialog nativo de macOS.

## Risks / Trade-offs

- **[Curva de aprendizaje ~1-2 semanas]** → Mitigación: Rectangle se puede mantener instalado durante la transición. AeroSpace se puede desactivar temporalmente
- **[alt+key conflictos con apps]** → Mitigación: alt es el modifier menos usado en macOS (Cmd es el principal). La mayoría de apps no usan alt+hjkl
- **[Monitor IDs pueden cambiar]** → Mitigación: AeroSpace permite patrones parciales de nombre de monitor. Se documentará cómo identificar monitores
- **[Tiling agresivo en apps que no lo esperan]** → Mitigación: lista de apps flotantes configurable. Se empieza conservador y se ajusta
