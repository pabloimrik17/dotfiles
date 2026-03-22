## 1. Update enabledPlugins

- [x] 1.1 Add `"expo@expo-plugins": true` to the `enabledPlugins` object in `dot_claude/settings.json.tmpl`
- [x] 1.2 Remove `"expo-app-design@expo-plugins": true` from `enabledPlugins`
- [x] 1.3 Remove `"upgrading-expo@expo-plugins": true` from `enabledPlugins`
- [x] 1.4 Remove `"expo-deployment@expo-plugins": true` from `enabledPlugins`

## 2. Verify

- [x] 2.1 Confirm `settings.json.tmpl` is valid JSON (no trailing commas, correct brackets)
- [x] 2.2 Confirm `expo-plugins` marketplace entry is unchanged in `extraKnownMarketplaces`
