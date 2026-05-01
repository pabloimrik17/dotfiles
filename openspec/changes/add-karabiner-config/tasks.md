## 1. Install script updates

- [ ] 1.1 Add `karabiner-elements` to the brew casks group in `run_onchange_install-packages.sh.tmpl`

## 2. Create Karabiner config

- [ ] 2.1 Create `dot_config/karabiner/karabiner.json` with valid Karabiner-Elements schema
- [ ] 2.2 Add simple_modification: caps_lock → left_control (all devices)
- [ ] 2.3 Add complex_modification rule: left_control+h → left_arrow
- [ ] 2.4 Add complex_modification rule: left_control+j → down_arrow
- [ ] 2.5 Add complex_modification rule: left_control+k → up_arrow
- [ ] 2.6 Add complex_modification rule: left_control+l → right_arrow
- [ ] 2.7 Ensure all complex_modification rules pass through additional modifiers (shift, alt, cmd) for text selection and word navigation

## 3. Chezmoi integration

- [ ] 3.1 Verify Chezmoi manages `dot_config/karabiner/karabiner.json` correctly (no template needed, plain JSON)
- [ ] 3.2 Add karabiner directory to `.chezmoiignore.tmpl` for Linux (Karabiner is macOS-only)

## 4. Verify

- [ ] 4.1 Validate JSON syntax of karabiner.json
- [ ] 4.2 Verify Karabiner loads the config without errors after chezmoi apply
