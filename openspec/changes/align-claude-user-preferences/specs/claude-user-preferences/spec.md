## ADDED Requirements

### Requirement: Effort level is set to xhigh

The chezmoi template SHALL include `"effortLevel": "xhigh"` as a top-level key in `dot_claude/settings.json.tmpl`. The value MUST be the lowercase string `"xhigh"`; other casings (e.g., `"xHigh"`, `"XHIGH"`) are not accepted by the Claude Code settings schema and are normalized to `"high"`.

#### Scenario: Template includes lowercase xhigh effortLevel

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"effortLevel": "xhigh"`

#### Scenario: Mixed-case value is not used

- **WHEN** the chezmoi template is read
- **THEN** the `effortLevel` value SHALL match the literal lowercase string `"xhigh"` and SHALL NOT be `"xHigh"` or any other casing

### Requirement: Auto permission prompt is skipped

The chezmoi template SHALL include `"skipAutoPermissionPrompt": true` as a top-level key in `dot_claude/settings.json.tmpl`.

#### Scenario: Template includes skipAutoPermissionPrompt

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"skipAutoPermissionPrompt": true`

### Requirement: User-preference keys appear in canonical order

The chezmoi template SHALL emit the following user-preference top-level keys in this exact order:

1. `alwaysThinkingEnabled`
2. `skipDangerousModePermissionPrompt`
3. `skipAutoPermissionPrompt`
4. `voiceEnabled`
5. `effortLevel`

This ordering applies only to the keys listed above (the user-preference block). Other top-level keys (`env`, `statusLine`, `enabledPlugins`, `extraKnownMarketplaces`, `hooks`, `permissions`, etc.) are governed by their own requirements and may appear before or after this block.

#### Scenario: User-preference block is in canonical order

- **WHEN** the rendered `dot_claude/settings.json.tmpl` is parsed and the five user-preference keys above are extracted in source order
- **THEN** they SHALL appear in the order: `alwaysThinkingEnabled`, `skipDangerousModePermissionPrompt`, `skipAutoPermissionPrompt`, `voiceEnabled`, `effortLevel`
