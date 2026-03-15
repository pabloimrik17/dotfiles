## 1. Ghostty config — font section

- [x] 1.1 Add commented alternative font block (`JetBrainsMono Nerd Font @ 14, thicken ON`) below the active font settings in `dot_config/ghostty/config`

## 2. Setup script — font installation

- [x] 2.1 Add `font-jetbrains-mono-nerd-font` cask installation to the fonts group in `run_once_install-packages.sh.tmpl`, following the same pattern as the existing Hack Nerd Font block
- [x] 2.2 Update the confirm prompt to reflect both fonts (e.g., "Install terminal fonts (Hack + JetBrainsMono Nerd Font)?")

## 3. Spec update

- [x] 3.1 Update `openspec/specs/ghostty-visual-polish/spec.md` to reflect the commented alternative pattern and font installation requirement
