## 1. Claude Code permissions

- [ ] 1.1 Add `permissions.deny` array to `dot_claude/settings.json.tmpl` with deny rules (sudo, curl|bash, force push, npm/bun publish, chmod 777)
- [ ] 1.2 Add `permissions.allow` array to `dot_claude/settings.json.tmpl` with bash allow rules (FS read-only, git read-only, git write, build/test, versions, chezmoi, brew, openspec, worktrunk, gh, claude cli)
- [ ] 1.3 Add WebSearch and WebFetch domain allow rules to `permissions.allow` (9 universal dev domains)
- [ ] 1.4 Add MCP read-only tool allow rules to `permissions.allow` (11 tools)

## 2. OpenCode permissions

- [ ] 2.1 Add deny rules to `permission.bash` in `dot_config/opencode/opencode.jsonc` (sudo, curl|bash, force push, npm/bun publish, chmod 777)
- [ ] 2.2 Add missing allow rules to `permission.bash` (du, tree, stat, git add/fetch/push, git stash list/ls-tree/rev-parse/config --get, build/test bun+pnpm, chezmoi read, brew info, openspec, worktrunk, gh cli, claude cli, npm info)

## 3. Verification

- [ ] 3.1 Validate `dot_claude/settings.json.tmpl` is valid JSON (after chezmoi template rendering)
- [ ] 3.2 Validate `dot_config/opencode/opencode.jsonc` is valid JSONC
- [ ] 3.3 Verify deny rules take precedence over allow rules (e.g., `git push --force` denied despite `git push *` allowed) in both configs
