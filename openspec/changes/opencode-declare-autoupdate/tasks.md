## 1. Config

- [ ] 1.1 Add top-level `"autoupdate": true` to `dot_config/opencode/opencode.jsonc` (near other root keys such as `model` / `shell`)

## 2. Verify

- [ ] 2.1 Run `chezmoi diff` and confirm the only intended change is the new `autoupdate` key in OpenCode config
- [ ] 2.2 Run `chezmoi apply` and start OpenCode; confirm it launches with no schema/config warnings
