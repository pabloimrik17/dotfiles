## Context

El install script (`run_onchange_install-packages.sh.tmpl`) ya registra 10 MCP servers globales en el Group 8.5, usando dos arrays bash: `MCP_STDIO_SERVERS` (7 entries) y `MCP_HTTP_SERVERS` (3 entries). Los servers HTTP se registran con `claude mcp add --scope user --transport http`. El script tiene pre-scan, idempotencia, y manejo de versiones outdated. Al final del script hay una sección de instrucciones manuales que menciona la auth de Atlassian y Figma.

Ambos nuevos servidores (Linear y Storybook) son de tipo HTTP — encajan directamente en el array `MCP_HTTP_SERVERS` sin cambios estructurales al script.

## Goals / Non-Goals

**Goals:**

- Registrar Linear y Storybook como MCP servers HTTP globales via el install script
- Documentar auth OAuth para Linear y requisito de addon para Storybook
- Mantener idempotencia y consistencia con el patrón existente

**Non-Goals:**

- No instalar el addon `@storybook/addon-mcp` automáticamente (es per-project)
- No configurar auth de Linear automáticamente (requiere browser interactivo)
- No cambiar la estructura del script ni los helpers existentes
- No pinear versiones de servidores HTTP remotos (no aplica — son URLs fijas, no paquetes npm)

## Decisions

### Decision 1: Ambos servers van en `MCP_HTTP_SERVERS`

Linear es un servidor remoto (`https://mcp.linear.app/mcp`). Storybook es un servidor HTTP local (`http://localhost:6006/mcp`). Ambos usan transporte HTTP.

**Alternativa descartada**: Registrar Storybook como stdio con un wrapper. No tiene sentido — el MCP de Storybook es un endpoint HTTP del dev server, no un proceso standalone.

### Decision 2: Storybook a nivel de usuario (no proyecto)

Registrar a nivel de usuario significa que cuando Storybook no está corriendo, el server simplemente falla la conexión — sin impacto. Esto ya sucede con el MCP de JetBrains (`jetbrains: ✗ Failed to connect`). Evita tener que configurar `.mcp.json` en cada proyecto.

**Alternativa descartada**: Registrar per-project. Requeriría configuración repetida y no aporta nada — el endpoint siempre es `localhost:6006/mcp`.

### Decision 3: Linear con OAuth (no API key)

OAuth interactivo es el método oficial de Linear para su MCP server. El token se cachea en `~/.mcp-auth` automáticamente.

**Alternativa descartada**: API key personal via env var. Requiere gestión manual del token y es menos seguro que OAuth con refresh.

### Decision 4: Instrucciones manuales al final del script

Añadir notas para Linear (OAuth) y Storybook (addon per-project) junto a las notas existentes de Atlassian y Figma. Mismo patrón, mismo lugar.

## Risks / Trade-offs

- **[Storybook puerto no-estándar]** → Si un proyecto usa un puerto distinto a 6006, el MCP no conecta. Mitigación: documentar en las instrucciones manuales. En la práctica el puerto default rara vez se cambia.
- **[Linear OAuth expira]** → El token OAuth puede expirar. Mitigación: Linear maneja refresh automáticamente. Si falla, `rm -rf ~/.mcp-auth` y re-autenticar.
- **[Storybook sin addon]** → Aunque Storybook corra, sin `@storybook/addon-mcp` el endpoint `/mcp` no existe. Mitigación: documentar claramente en instrucciones manuales.
