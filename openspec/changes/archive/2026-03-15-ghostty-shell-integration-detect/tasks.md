## 1. Config change

- [x] 1.1 Change `shell-integration = zsh` to `shell-integration = detect` in `dot_config/ghostty/config`

## 2. Spec update

- [x] 2.1 Update `openspec/specs/ghostty-ux-enhancements/spec.md` — change the `shell-integration = zsh` reference to `shell-integration = detect` in the "Cursor can be moved by clicking at prompts" requirement

## 3. Verification

- [x] 3.1 Confirm zsh behavior is unchanged with `shell-integration = detect`
- [x] 3.2 Launch a bash sub-shell in Ghostty and confirm shell-integration features activate (bash sub-shells don't get injection — expected limitation; only the directly-spawned shell receives it)
