## Why

El setup actual tiene 10 MCP servers globales pero falta integración con Linear (gestión de issues/proyectos) y Storybook (documentación y testing de componentes). Linear es un servicio remoto que funciona desde cualquier repo; Storybook es un servidor HTTP local que se activa solo cuando `storybook dev` está corriendo — ambos encajan como servidores globales a nivel de usuario.

## What Changes

- Registrar el MCP server de **Linear** (`https://mcp.linear.app/mcp`) como servidor HTTP global con autenticación OAuth interactiva
- Registrar el MCP server de **Storybook** (`http://localhost:6006/mcp`) como servidor HTTP global — disponible solo cuando un proyecto tiene Storybook corriendo (falla silenciosamente en caso contrario, igual que el MCP de JetBrains)
- Actualizar el install script para registrar 12 servers en vez de 10
- Documentar que Linear requiere OAuth post-registro y que Storybook requiere el addon `@storybook/addon-mcp` por proyecto

## Capabilities

### New Capabilities

_(ninguna — no se introduce una capacidad nueva)_

### Modified Capabilities

- `mcp-global-config`: Se añaden 2 servidores HTTP a la tabla de servidores globales (Linear y Storybook), pasando de 10 a 12 servidores registrados. Se actualizan los scenarios de conteo y las instrucciones de auth manual.

## Impact

- **Install script** (`run_onchange_install-packages.sh.tmpl`): arrays de MCP servers crecen con 2 entradas HTTP adicionales
- **Spec `mcp-global-config`**: tabla de servidores y scenarios de conteo deben actualizarse
- **Manual/README**: documentar requisitos de auth (Linear OAuth) y addon por proyecto (Storybook)
- **No hay breaking changes**: servidores existentes no se modifican
