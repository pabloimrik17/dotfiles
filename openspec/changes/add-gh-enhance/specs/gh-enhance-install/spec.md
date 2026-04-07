## gh-enhance-install

### Installation

- gh-enhance is installed as a gh CLI extension via `gh extension install dlvhdr/gh-enhance`
- Installation is idempotent: skipped if `gh extension list` already contains `dlvhdr/gh-enhance`
- Installation lives in the existing "gh CLI extensions" confirmable group in the install script
- Requires `gh` CLI to be installed and authenticated (already guaranteed by brew packages group)

### Shell alias

- `ghe` alias defined in `dot_zshrc.tmpl` in the GitHub aliases section
- Alias sets `ENHANCE_THEME=catppuccin_mocha` and invokes `gh enhance`
- Alias accepts all gh-enhance flags and arguments (PR number, URL, `--flat`, `-R`)
