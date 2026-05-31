## 1. Edit settings template

- [x] 1.1 Añadir `"commander@monolab": true` a `enabledPlugins` en `dot_claude/settings.json.tmpl`, contiguo a las otras entradas `@monolab` (`expo-developer@monolab`, `experiments@monolab`)
- [x] 1.2 Verificar que la coma JSON queda bien colocada (entrada nueva no es la última; la última sigue siendo el bloque condicional `superwhisper`)

## 2. Validación

- [x] 2.1 `chezmoi execute-template < dot_claude/settings.json.tmpl | jq .enabledPlugins` y comprobar que `commander@monolab: true` aparece
- [x] 2.2 `chezmoi diff dot_claude/settings.json.tmpl` muestra solo la línea añadida
- [x] 2.3 `openspec validate add-commander-plugin --strict` pasa
