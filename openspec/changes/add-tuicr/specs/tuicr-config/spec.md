# Capability: tuicr-config

## Purpose

Managed tuicr configuration — theme, update policy, PR review defaults, reviewer identity, and the LLM-oriented comment types and export shape.

## ADDED Requirements

### Requirement: tuicr config.toml is managed by chezmoi

A chezmoi-managed `dot_config/tuicr/config.toml` SHALL deploy to `~/.config/tuicr/config.toml` (the XDG path tuicr reads). The file SHALL be static TOML — no host-specific values, no `.tmpl` suffix.

#### Scenario: Config deployed on chezmoi apply

- **WHEN** `chezmoi apply` runs
- **THEN** `~/.config/tuicr/config.toml` exists with the managed content

### Requirement: Catppuccin Mocha theme

The config SHALL set `theme = "catppuccin-mocha"` (bundled theme), matching the stack-wide Catppuccin Mocha theming.

#### Scenario: tuicr launches themed

- **WHEN** the user runs `tuicr` after `chezmoi apply`
- **THEN** the UI renders with the catppuccin-mocha theme

### Requirement: Update check disabled

The config SHALL set `no_update_check = true`. Homebrew owns the binary; tuicr's startup update check and self-update path must stay out of the way.

#### Scenario: No update prompt at startup

- **WHEN** the user runs `tuicr` while a newer release exists
- **THEN** tuicr does not perform its startup update check

### Requirement: PR review defaults

The config SHALL set `show_pr_checks = true` (CI check rollups visible in PR mode) and `username` to the user's GitHub handle (`pabloimrik17`) so local comments carry the right identity.

#### Scenario: PR opens with checks visible

- **WHEN** the user opens a PR via `tuicr pr <n>`
- **THEN** the CI check rollup is fetched and displayed

### Requirement: LLM-oriented comment types

The config SHALL define `comment_types` with ids `issue`, `suggestion`, `question`, `nit`, and `praise`, each with a `definition` that guides the human reviewer, and a color drawn from the Catppuccin Mocha palette. The ids SHALL be self-describing in plain English: `tuicr review comments` emits only the `comment_type` string to an agent, never the `definition`, so the id alone must carry the intent. The set is a superset of the four buckets the tuicr agent skill documents (`issue`, `suggestion`, `note`, `praise`), with `question` mapping to `note` and `nit` extending `suggestion`.

#### Scenario: Comment type cycling offers the curated set

- **WHEN** the user creates a comment and cycles types with Tab
- **THEN** the five curated types are offered in order

### Requirement: Export intro tuned for agent handoff

The `[export]` section SHALL set an `intro` that addresses the review to an implementing agent (concise imperative, e.g. asking it to address the comments), so `--stdout` / clipboard exports remain usable without editing. This is the fallback path: the primary agent handoff is `tuicr review comments`, which the installed agent skill drives (see the `tuicr-skill-install` capability). The export intro SHALL therefore state the action semantics of the comment types, since the export is the only route by which those definitions reach a consumer.

#### Scenario: Export carries the tuned intro

- **WHEN** the user exports a review via `y` or `--stdout`
- **THEN** the markdown opens with the configured intro line

#### Scenario: CLI is preferred over export for agent handoff

- **WHEN** an agent needs the review feedback and a tuicr session is available
- **THEN** it reads structured comments via `tuicr review comments` rather than parsing an export block
