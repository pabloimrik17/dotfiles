## MODIFIED Requirements

### Requirement: Cursor can be moved by clicking at prompts

The Ghostty config SHALL include `cursor-click-to-move = true` to enable Option+click cursor positioning at shell prompts. This requires shell integration (configured with `shell-integration = detect`).

#### Scenario: Option+click moves cursor

- **WHEN** the user is at a shell prompt and Option+clicks at a different position in the prompt line
- **THEN** the cursor moves to the clicked position (via synthetic arrow key movements)

#### Scenario: Only works at prompts

- **WHEN** the user Option+clicks while an alternate screen application (e.g., vim) is running
- **THEN** the click-to-move behavior does NOT activate (alternate screen apps handle mouse input themselves)
