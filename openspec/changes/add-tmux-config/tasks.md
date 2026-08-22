## 1. Install script updates

- [ ] 1.1 Add TPM git clone to install script (`run_onchange_install-packages.sh.tmpl`): clone `https://github.com/tmux-plugins/tpm` to `~/.tmux/plugins/tpm` if not already present
- [ ] 1.2 Add a new interactive install group "Tmux Plugins" that runs `~/.tmux/plugins/tpm/bin/install_plugins` after TPM is installed

## 2. Expand dot_tmux.conf with base settings

- [ ] 2.1 Set prefix to `C-a`, unbind `C-b`, bind `C-a send-prefix` for passthrough
- [ ] 2.2 Set `mode-keys vi`, `status-position top`, `history-limit 1000000`
- [ ] 2.3 Preserve existing settings: mouse on, default-terminal xterm-256color, focus-events on

## 3. Add TPM plugin declarations

- [ ] 3.1 Declare plugins in `dot_tmux.conf`: tmux-sensible, tmux-yank, tmux-resurrect, tmux-continuum, tmux-sessionx, tmux-floax, tmux-thumbs, tmux-fzf-url, catppuccin/tmux
- [ ] 3.2 Configure continuum: `@continuum-restore on`
- [ ] 3.3 Configure sessionx: enable zoxide integration (`@sessionx-zoxide-mode on`)
- [ ] 3.4 Configure floax: 80% width and height
- [ ] 3.5 Configure catppuccin: mocha flavor, session left module, directory right module
- [ ] 3.6 Add TPM bootstrap as last line: `run '~/.tmux/plugins/tpm/tpm'`

## 4. Verify and document

- [ ] 4.1 Ensure all settings have descriptive comments matching existing style
- [ ] 4.2 Verify config loads without errors: `tmux source-file dot_tmux.conf` (or equivalent test)
