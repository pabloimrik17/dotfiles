# Spec Delta

## REMOVED Requirements

### Requirement: SuperWhisper plugin is enabled by default on Apple Silicon

**Reason**: The SuperWhisper agent plugins are retired. The dictation app stays installed.

**Migration**: `agent-plugin-retirement` uninstalls `superwhisper@superwhisper` once per machine. Settings no longer carry the entry on any host.

### Requirement: SuperWhisper marketplace is registered on Apple Silicon

**Reason**: Its only plugin is retired.

**Migration**: `agent-plugin-retirement` removes the `superwhisper` marketplace once per machine. `claude plugin marketplace remove` also deletes `extraKnownMarketplaces.superwhisper` from `~/.claude/settings.json`.

### Requirement: SuperWhisper plugin is installed via the upstream installer on Apple Silicon

**Reason**: The plugin is no longer provisioned, so the upstream installer step goes.

**Migration**: None needed. The install script stops calling `superwhisper.com/install-claude-code.sh`. To reinstall later, run that installer by hand or use the SuperWhisper app.
