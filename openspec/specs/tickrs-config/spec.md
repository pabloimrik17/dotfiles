# Capability: tickrs-config

## Purpose

tickrs TUI configuration -- chart defaults and the curated US-equity ticker watchlist managed by chezmoi.

## Requirements

### Requirement: tickrs config.yml is managed by chezmoi at the macOS path

A chezmoi-managed `Library/Application Support/tickrs/config.yml` SHALL be deployed byte-for-byte to `~/Library/Application Support/tickrs/config.yml`, the macOS path read by tickrs. It SHALL be static YAML without host-specific values or a `.tmpl` suffix. Linux deployment SHALL remain manual.

#### Scenario: Config deployed on chezmoi apply

- **WHEN** `chezmoi apply` runs on a macOS host
- **THEN** `~/Library/Application Support/tickrs/config.yml` exists with the managed YAML content

#### Scenario: Config is identical across macOS hosts

- **WHEN** the same dotfiles repo is applied on two different macOS machines
- **THEN** both hosts produce the same `~/Library/Application Support/tickrs/config.yml` byte-for-byte

#### Scenario: Linux setup is manual

- **WHEN** a Linux user wants the curated dashboard
- **THEN** the printed instructions direct them to place the configuration at `~/.config/tickrs/config.yml` manually; `chezmoi apply` does not deploy it there

### Requirement: Chart defaults match the curated dashboard preferences

The deployed `config.yml` SHALL set the following top-level chart options exactly:

| Key               | Value    |
| ----------------- | -------- |
| `chart_type`      | `candle` |
| `time_frame`      | `1M`     |
| `update_interval` | `30`     |
| `enable_pre_post` | `true`   |
| `show_volumes`    | `true`   |

These values control how `tickrs` renders charts at launch (one-month candle view, 30-second refresh, pre/post market hours included, volume bars visible).

#### Scenario: tickrs launches with the curated defaults

- **WHEN** the user runs `tickrs` after `chezmoi apply`
- **THEN** the dashboard opens in candle mode, on the 1M time frame, refreshing every 30 seconds, with pre/post hours and volume bars enabled

#### Scenario: All five keys are present and use the documented values

- **WHEN** the contents of `~/Library/Application Support/tickrs/config.yml` are read
- **THEN** the five top-level keys (`chart_type`, `time_frame`, `update_interval`, `enable_pre_post`, `show_volumes`) appear with the values from the table above

### Requirement: Symbol watchlist is owner-managed configuration

The `config.yml` SHALL define a non-empty `symbols:` YAML sequence of unique, non-empty strings. This owner-managed sequence SHALL determine the watchlist and its order at launch. Specific symbols, their count, and their order are NOT enumerated in this spec; valid changes to them SHALL NOT require a specification update.

#### Scenario: tickrs loads the curated watchlist on launch

- **WHEN** the user runs `tickrs` after `chezmoi apply`
- **THEN** the dashboard uses exactly the symbols in the deployed `symbols:` sequence as its watchlist

#### Scenario: Symbol order is preserved

- **WHEN** the user runs `tickrs` after `chezmoi apply`
- **THEN** the watchlist follows the order of the deployed `symbols:` sequence

#### Scenario: Watchlist content changes without a specification update

- **WHEN** the owner adds, removes, or reorders symbols and deploys the updated configuration with `chezmoi apply`
- **THEN** the next launch uses the updated watchlist and order without requiring this specification to enumerate its contents or count

#### Scenario: Symbol sequence is structurally valid

- **WHEN** the YAML `symbols:` sequence is parsed
- **THEN** it contains at least one entry, every entry is a non-empty string, and no entries are duplicated
