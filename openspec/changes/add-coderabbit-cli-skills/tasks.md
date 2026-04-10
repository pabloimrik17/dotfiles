## 1. Brew Cask

- [x] 1.1 Add `"coderabbit|CodeRabbit|AI|AI code review CLI"` to the `ALL_CASKS` array in `run_onchange_install-packages.sh.tmpl`

## 2. Agent Skills

- [x] 2.1 Add `install_skill "coderabbitai/skills" "code-review"` to Group 9 in `run_onchange_install-packages.sh.tmpl`
- [x] 2.2 Add `install_skill "coderabbitai/skills" "autofix"` to Group 9 in `run_onchange_install-packages.sh.tmpl`

## 3. Manual Instructions

- [x] 3.1 Add `coderabbit auth login` line to the manual install instructions block in `run_onchange_install-packages.sh.tmpl`
