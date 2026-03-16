## Context

Two machines currently diverge on Ghostty font configuration:

- **Repo/Machine A (Mac 2019)**: Hack Nerd Font @ 14, font-thicken ON
- **Machine B (Mac 2024)**: JetBrainsMono Nerd Font @ 15, font-thicken ON

Hands-on evaluation of all 8 combinations (2 fonts x 2 sizes x thicken on/off) on the lower-density display (2019 Mac) determined the winner. The 2019 Mac is the harder test — if it looks good there, it looks equal or better on the 2024.

## Goals / Non-Goals

**Goals:**

- Single font configuration in the repo that works across both machines
- Commented alternative for quick switching between the two best options
- Both fonts available on any machine running the dotfiles setup

**Non-Goals:**

- Per-machine conditional font config (would add complexity for minimal gain)
- Supporting fonts beyond Hack and JetBrainsMono Nerd Font
- Changing any non-font visual settings

## Decisions

### Primary font: Hack Nerd Font @ 14, thicken ON

Evaluated winner across both display densities. Rounder, wider characters provide better readability at 14pt, especially on the lower-density 2019 Retina display. `font-thicken = true` is essential — without it, strokes look too thin on macOS.

**Alternatives considered:**

- JetBrainsMono @ 14 thicken ON — close second, slightly less readable on lower-density display
- Any font @ 15 — too large on both machines, reduces visible terminal content
- Any font with thicken OFF — universally worse on macOS Retina

### Commented alternative in config

The runner-up (JetBrainsMono @ 14, thicken ON) will be present as commented lines directly below the active font config. This allows switching with a two-line edit rather than remembering the alternative values.

### Font installation via Homebrew cask

Nerd Font variants are available as Homebrew casks (`font-hack-nerd-font`, `font-jetbrains-mono-nerd-font`). This is the standard installation method — JetBrains IDEs bundle JetBrains Mono but NOT the Nerd Font variant, so Homebrew is needed regardless.

The setup script (Brewfile or equivalent) should ensure both fonts are installed so switching is always possible.

## Risks / Trade-offs

- **[Risk] Font size 14 may feel small on the 2024 Mac's larger display** → The commented alternative makes it trivial to switch. If this becomes a pattern, per-machine config could be revisited later.
- **[Risk] Homebrew cask names could change** → Nerd Font casks have been stable for years; low probability.
