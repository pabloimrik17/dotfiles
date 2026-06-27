## 1. Implementación

- [x] 1.1 Añadir la clave de nivel superior `"attribution": { "commit": "", "pr": "" }` a `dot_claude/settings.json.tmpl`, colocada entre `alwaysThinkingEnabled` y `effortLevel` para respetar el orden alfabético de claves del fichero.
- [x] 1.2 Confirmar que la plantilla NO contiene la clave deprecada `includeCoAuthoredBy`.

## 2. Verificación del render

- [x] 2.1 Renderizar la plantilla (`chezmoi cat dot_claude/settings.json.tmpl` o `chezmoi execute-template`) y comprobar con `jq` que el resultado es JSON válido y que `.attribution` es exactamente `{"commit":"","pr":""}`.
- [x] 2.2 Comprobar que el render no contiene `includeCoAuthoredBy` (`jq 'has("includeCoAuthoredBy")'` → `false`).
- [x] 2.3 Revisar `git diff dot_claude/settings.json.tmpl` para confirmar que solo se añadió el bloque `attribution` y que ningún otro bloque ni el formato se alteró (sanity oxfmt/lint-staged).

## 3. Aplicación y verificación end-to-end

- [ ] 3.1 Sincronizar la fuente y aplicar (`chezmoi update` / `chezmoi apply`); confirmar que `~/.claude/settings.json` contiene el bloque `attribution` con `commit` y `pr` vacíos.
- [ ] 3.2 En una sesión nueva de Claude Code, crear un commit de prueba y verificar que el mensaje NO incluye el trailer `Co-Authored-By: Claude` ni la línea `🤖 Generated with [Claude Code]`.
- [ ] 3.3 Verificar que el cuerpo de una PR creada por Claude Code NO incluye la línea `🤖 Generated with [Claude Code]`.
