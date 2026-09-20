## Purpose

Provide a stable, machine-local classification that lets chezmoi render personal and work policies without inferring identity from mutable host details.

## ADDED Requirements

### Requirement: Initialization requires an explicit machine type

The chezmoi configuration template SHALL require the user to choose exactly one machine type, `personal` or `work`, during first initialization. The choice SHALL have no default and SHALL be persisted in the machine-local chezmoi data alongside the existing name and email values.

#### Scenario: Fresh initialization selects personal

- **WHEN** a user initializes the dotfiles on a new machine and chooses `personal`
- **THEN** the generated local chezmoi configuration contains `machineType = "personal"`
- **AND** templates can consume that value during the same apply

#### Scenario: Fresh initialization selects work

- **WHEN** a user initializes the dotfiles on a new machine and chooses `work`
- **THEN** the generated local chezmoi configuration contains `machineType = "work"`

#### Scenario: No implicit classification

- **WHEN** a new-machine initialization reaches the machine-type question
- **THEN** the user must select `personal` or `work`
- **AND** accepting an empty/default response cannot silently classify the machine

#### Scenario: Existing config predates the machine type

- **WHEN** an existing machine pulls this change and its local chezmoi data has no machine type
- **THEN** role-dependent setup does not assume a value or enroll an account
- **AND** apply fails visibly with instructions to run `chezmoi init`, choose the machine type, and apply again

### Requirement: Machine type remains local and stable

The persisted machine type SHALL be reused without prompting on later initialization or apply runs. Dotfiles SHALL NOT infer it from hostname or email, change it automatically, or export it as a global environment variable.

#### Scenario: Later apply reuses the stored value

- **WHEN** `chezmoi apply` runs after the machine has been classified
- **THEN** role-dependent templates receive the stored value without another prompt

#### Scenario: Reinitialization preserves purpose

- **WHEN** `chezmoi init` runs again with an existing valid machine type
- **THEN** the existing value is retained without asking the user to reclassify the machine

#### Scenario: Shell environment stays unchanged

- **WHEN** a new shell starts after applying the dotfiles
- **THEN** no new global environment variable exposes the machine type
