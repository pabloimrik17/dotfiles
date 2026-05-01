## ADDED Requirements

### Requirement: tickrs config.yml is managed by chezmoi at the macOS path

A chezmoi-managed `Library/Application Support/tickrs/config.yml` SHALL be deployed to `~/Library/Application Support/tickrs/config.yml` — the path the macOS `tickrs` binary reads (Rust `dirs` crate convention). The file SHALL be a static (non-template) YAML file — no host-specific values, no `.tmpl` suffix — so chezmoi copies it byte-for-byte. Linux deployment is out of scope for `chezmoi apply` in this repo; Linux users follow the printed instructions and place the file at `~/.config/tickrs/config.yml` manually if they want the curated dashboard.

#### Scenario: Config deployed on chezmoi apply

- **WHEN** `chezmoi apply` runs on a macOS host
- **THEN** `~/Library/Application Support/tickrs/config.yml` exists with the managed YAML content

#### Scenario: Config is identical across macOS hosts

- **WHEN** the same dotfiles repo is applied on two different macOS machines
- **THEN** both hosts produce the same `~/Library/Application Support/tickrs/config.yml` byte-for-byte

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

- **WHEN** the contents of `~/.config/tickrs/config.yml` are read
- **THEN** the five top-level keys (`chart_type`, `time_frame`, `update_interval`, `enable_pre_post`, `show_volumes`) appear with the values from the table above

### Requirement: Symbol watchlist is the curated 42-ticker list

The `config.yml` SHALL define a `symbols:` YAML sequence containing exactly the following 42 US-equity ticker symbols, in this order:

`ACM, ADBE, ADSK, AVTR, BAH, BMI, BRBR, BSX, CMG, COO, CPNG, CPRT, CRM, CRTO, DOCS, DPZ, DT, DUOL, FISV, HLI, HLNE, HRL, IPAR, JJSF, LULU, MORN, MSFT, NKE, NOMD, ODD, PAYX, PCTY, PINS, PLNT, POOL, QLYS, RACE, RMD, SMCI, SMPL, VEEV, VITL`

#### Scenario: tickrs loads the curated watchlist on launch

- **WHEN** the user runs `tickrs` after `chezmoi apply`
- **THEN** the dashboard streams quotes for all 42 tickers above and no others

#### Scenario: Symbol order is preserved

- **WHEN** the YAML `symbols:` sequence is parsed
- **THEN** the tickers appear in the order shown above (ACM first, VITL last)
