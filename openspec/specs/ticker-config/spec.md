# Capability: ticker-config

## Purpose

ticker portfolio configuration — display preferences, watchlist, cost-basis positions, and sector groups managed by chezmoi as an age-encrypted file in the repository.

## Requirements

### Requirement: ticker config is managed by chezmoi as an age-encrypted file deployed to ~/.ticker.yaml

A chezmoi-managed encrypted file `encrypted_dot_ticker.yaml.age` SHALL live at the chezmoi source root. On `chezmoi apply`, chezmoi SHALL decrypt it using the age identity at `~/.config/chezmoi/key.txt` and write the plaintext to `~/.ticker.yaml` with mode 600. The plaintext path is the first candidate in the `ticker` binary's config-lookup precedence (verified against upstream `internal/cli/cli.go`), so the file is picked up automatically when `ticker` is launched without arguments.

The file in the repository SHALL never appear in clear text — only the encrypted `.age` artifact is committed. The repository is public, and the file's plaintext contents include cost-basis positions that must not be exposed.

#### Scenario: Encrypted file deployed on chezmoi apply

- **WHEN** `chezmoi apply` runs on a macOS host with a valid `~/.config/chezmoi/key.txt`
- **THEN** chezmoi decrypts `encrypted_dot_ticker.yaml.age` and writes the plaintext to `~/.ticker.yaml` with mode 600

#### Scenario: Apply fails loudly without the identity

- **WHEN** `chezmoi apply` runs and `~/.config/chezmoi/key.txt` is missing or unreadable
- **THEN** chezmoi reports a decryption failure pointing at the encrypted file and does not silently overwrite the existing `~/.ticker.yaml`

#### Scenario: Repository content is opaque

- **WHEN** the repository is browsed on GitHub or cloned without the identity
- **THEN** `encrypted_dot_ticker.yaml.age` is the only ticker-related artifact present, and its bytes are AEAD-ciphertext

### Requirement: Display preferences match the curated UX

The decrypted `~/.ticker.yaml` SHALL set the following top-level keys exactly:

| Key                 | Value   |
| ------------------- | ------- |
| `show-summary`      | `true`  |
| `show-positions`    | `true`  |
| `show-fundamentals` | `true`  |
| `show-tags`         | `true`  |
| `show-separator`    | `true`  |
| `sort`              | `value` |
| `interval`          | `15`    |

These values control how `ticker` renders the table at launch (summary row, positions visible, fundamentals column, tags column, row separators, rows sorted by position value, 15-second refresh).

#### Scenario: ticker launches with the curated display

- **WHEN** the user runs `ticker` after `chezmoi apply`
- **THEN** the table opens with the summary row, positions, fundamentals, tags, separators visible; rows are sorted by value; the data refreshes every 15 seconds

#### Scenario: All seven keys are present with the documented values

- **WHEN** the contents of `~/.ticker.yaml` are read after `chezmoi apply`
- **THEN** the seven top-level keys (`show-summary`, `show-positions`, `show-fundamentals`, `show-tags`, `show-separator`, `sort`, `interval`) appear with the values from the table above

### Requirement: Watchlist, lots, and sector groups are present in the decrypted config

The decrypted `~/.ticker.yaml` SHALL contain three YAML sequences at the top level: a `watchlist` sequence of ticker symbols, a `lots` sequence of position entries (each with `symbol`, `quantity`, `unit_cost`, `fixed_cost`), and a `groups` sequence partitioning the lots across named sector buckets (each group having `name` and `lots`). Specific symbols, quantities, costs, and group names are owner-managed content and are NOT enumerated in this spec because the file is sensitive and content changes as the user trades.

#### Scenario: Required sequences are structurally present

- **WHEN** the YAML at `~/.ticker.yaml` is parsed after `chezmoi apply`
- **THEN** the top-level mapping contains a non-empty `watchlist` sequence, a non-empty `lots` sequence, and a non-empty `groups` sequence

#### Scenario: Each lot entry has the required position fields

- **WHEN** any entry in the top-level `lots` sequence is inspected
- **THEN** the entry has the keys `symbol` (string), `quantity` (number), `unit_cost` (number), and `fixed_cost` (number)

#### Scenario: Each group bundles its own lots subset

- **WHEN** any entry in the top-level `groups` sequence is inspected
- **THEN** the entry has the keys `name` (string) and `lots` (a sequence whose entries follow the same shape as the top-level `lots` entries)
