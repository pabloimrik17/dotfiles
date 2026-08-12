## MODIFIED Requirements

### Requirement: tv init is sourced in zshrc between fzf and atuin

The `.zshrc` SHALL include `eval "$(tv init zsh)"` positioned after `source <(fzf --zsh)` and before `eval "$(atuin init zsh --disable-up-arrow)"`. This ordering ensures tv's Ctrl+T overwrites fzf's, and atuin's Ctrl+R overwrites tv's.

Ctrl+T SHALL then be wrapped so that its behaviour depends on whether the command line is empty. On an empty line it SHALL fall back to fzf's file widget; with text already typed it SHALL launch tv's smart autocomplete. The fallback is deliberate: tv's own empty-line fallback routes through the same completion function that zsh's Tab key uses, so letting tv handle the empty case breaks ordinary Tab completion.

The previous wording of this requirement asserted that Ctrl+T on a fresh prompt launches tv rather than fzf. That is the opposite of what the wrapper does, and the two landed in the same commit. An implementer reconciling the code to the old spec would remove the wrapper and reintroduce the Tab-completion breakage its comment exists to prevent.

#### Scenario: Ctrl+T on an empty prompt launches the fzf file widget

- **WHEN** the user opens a new shell and presses Ctrl+T with nothing typed
- **THEN** fzf's file search launches

#### Scenario: Ctrl+T with a partial command launches tv smart autocomplete

- **WHEN** the user has typed a partial command and presses Ctrl+T
- **THEN** tv smart autocomplete launches

#### Scenario: Tab completion is unaffected

- **WHEN** the user presses Tab in an interactive shell
- **THEN** ordinary zsh completion runs, unaffected by the Ctrl+T wrapper

#### Scenario: Ctrl+R launches atuin history

- **WHEN** the user opens a new shell and presses Ctrl+R
- **THEN** atuin history search launches (not tv's shell history)

#### Scenario: Alt+C launches fzf directory jump

- **WHEN** the user opens a new shell and presses Alt+C
- **THEN** fzf directory jump launches (unchanged behavior)
